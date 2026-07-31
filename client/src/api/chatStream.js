import { useAuthStore } from "../store/authStore";

/**
 * POST a message to the streaming chat endpoint and consume the SSE response.
 *
 * We can't use the native EventSource here: it's GET-only and can't send an
 * auth header or JSON body. Instead we POST with fetch and read the response
 * body as a stream, parsing SSE frames ("data: {...}\n\n") ourselves.
 *
 * Backend event shapes: { type: "sources" | "token" | "done" | "error", ... }
 *
 * @returns {Promise<void>} resolves when the stream completes ("done").
 */
async function streamRequest({
  url,
  body,
  signal,
  onSources,
  onToken,
  onDone,
}) {
  const token = useAuthStore.getState().token;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include", // include the httpOnly auth cookie
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });

  // Errors that happen before streaming starts come back as a JSON body.
  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    let message = `Request failed (${response.status}).`;
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // non-JSON body — keep the generic message
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Streaming is not supported in this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? ""; // keep any trailing partial frame

    for (const frame of frames) {
      const dataLine = frame
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!dataLine) continue;

      const raw = dataLine.slice(5).trim();
      if (!raw) continue;

      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        continue; // ignore malformed frame
      }

      switch (payload.type) {
        case "sources":
          onSources?.(payload.sources);
          break;
        case "token":
          onToken?.(payload.text);
          break;
        case "done":
          onDone?.(payload);
          return;
        case "error":
          throw new Error(payload.message || "Generation failed.");
        default:
          break;
      }
    }
  }
}

/** Start a streamed assistant response for a newly sent user message. */
export function streamMessage({ conversationId, content, ...callbacks }) {
  return streamRequest({
    url: `/api/conversations/${conversationId}/messages`,
    body: { content },
    ...callbacks,
  });
}

/** Re-run the assistant response for an existing user message. */
export function streamRegenerate({ conversationId, messageId, ...callbacks }) {
  return streamRequest({
    url: `/api/conversations/${conversationId}/messages/${messageId}/regenerate`,
    ...callbacks,
  });
}

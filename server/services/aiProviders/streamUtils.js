const textContent = (value) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n");
  }
  return String(value ?? "");
};

export const toTextMessages = (messages = []) =>
  messages
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .map((message) => ({ role: message.role, content: textContent(message.content) }));

export const providerError = (providerLabel, response, keyName) => {
  if (response.status === 401 || response.status === 403) {
    return new Error(`${providerLabel} authentication failed. Check ${keyName} on the server.`);
  }
  return new Error(`${providerLabel} request failed (${response.status}). Please try again.`);
};

/** Yield decoded Server-Sent Event payloads from a fetch Response. */
export async function* readSse(response, signal) {
  if (!response.body) throw new Error("The AI provider did not return a streaming response.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) return;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const data = frame
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (data) yield data;
      }
    }
  } finally {
    if (signal?.aborted) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

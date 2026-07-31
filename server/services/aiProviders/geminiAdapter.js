import { providerError, readSse, toTextMessages } from "./streamUtils.js";

/** Stream Google Gemini SSE chunks as plain text. */
export async function* streamChat({ messages, context, signal }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(context ? { systemInstruction: { parts: [{ text: context }] } } : {}),
      contents: toTextMessages(messages).map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
    }),
    signal,
  });
  if (!response.ok) throw providerError("Gemini", response, "GEMINI_API_KEY");

  for await (const payload of readSse(response, signal)) {
    try {
      const text = JSON.parse(payload).candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("");
      if (text) yield text;
    } catch {
      // Ignore non-JSON SSE keepalive frames.
    }
  }
}

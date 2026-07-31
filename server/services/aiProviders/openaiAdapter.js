import { providerError, readSse, toTextMessages } from "./streamUtils.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** Stream OpenAI Chat Completions as plain text chunks. Keys remain server-side. */
export async function* streamChat({ messages, context, signal }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured on the server.");

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      stream: true,
      messages: [
        ...(context ? [{ role: "system", content: context }] : []),
        ...toTextMessages(messages),
      ],
    }),
    signal,
  });
  if (!response.ok) throw providerError("GPT", response, "OPENAI_API_KEY");

  for await (const payload of readSse(response, signal)) {
    if (payload === "[DONE]") return;
    try {
      const text = JSON.parse(payload).choices?.[0]?.delta?.content;
      if (text) yield text;
    } catch {
      // Ignore non-JSON SSE keepalive frames.
    }
  }
}

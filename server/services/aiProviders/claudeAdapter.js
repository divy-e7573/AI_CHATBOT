import { providerError, readSse, toTextMessages } from "./streamUtils.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/** Stream Anthropic Messages API events as plain text chunks. */
export async function* streamChat({ messages, context, signal }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured on the server.");

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 2048,
      stream: true,
      ...(context ? { system: context } : {}),
      messages: toTextMessages(messages),
    }),
    signal,
  });
  if (!response.ok) throw providerError("Claude", response, "ANTHROPIC_API_KEY");

  for await (const payload of readSse(response, signal)) {
    try {
      const event = JSON.parse(payload);
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        if (event.delta.text) yield event.delta.text;
      }
    } catch {
      // Ignore non-JSON SSE keepalive frames.
    }
  }
}

import { getCohereClient } from "../config/cohere.js";

// command-r-plus was removed by Cohere on 2025-09-15; use the current flagship.
// Note: current models require the v2 chat API (client.v2.chatStream).
const CHAT_MODEL = "command-a-plus-05-2026";

/**
 * Convert stored Message docs (chronological order) into v2 chat messages.
 * Our roles ("user"/"assistant") match the v2 API's roles directly.
 */
export const toCohereChatHistory = (messages = []) =>
  messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

/**
 * Build the system message: base instructions + retrieved RAG context.
 * @param {Array<{ text: string }>} chunks
 */
export const buildPreamble = (chunks = []) => {
  const base =
    "You are a helpful AI assistant for a document-aware chat application. " +
    "Use the retrieved context below to answer the user's question when it is relevant. " +
    "If the context does not contain the answer, say so briefly, then answer from general knowledge. " +
    "Cite the context by its bracket number (e.g. [1]) when you use it.";

  if (!chunks.length) return base;

  const context = chunks.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n");
  return `${base}\n\nRetrieved context:\n${context}`;
};

/**
 * Start a streaming Cohere v2 chat. Yields plain text deltas so callers don't
 * depend on Cohere's event shapes.
 */
export async function* streamChat({ message, preamble, chatHistory = [] }) {
  const cohere = getCohereClient();

  const stream = await cohere.v2.chatStream(
    {
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: preamble },
        ...chatHistory,
        { role: "user", content: message },
      ],
    },
    // Fail fast instead of hanging if the AI API stalls.
    { timeoutInSeconds: 90, maxRetries: 1 }
  );

  for await (const event of stream) {
    if (event.type === "content-delta") {
      const text = event.delta?.message?.content?.text;
      if (text) yield text;
    }
  }
}

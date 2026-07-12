import { getCohereClient } from "../config/cohere.js";

const CHAT_MODEL = "command-r-plus";

// Map our stored roles to Cohere chat roles.
const ROLE_MAP = { user: "USER", assistant: "CHATBOT" };

/**
 * Convert stored Message docs (chronological order) into Cohere chatHistory.
 */
export const toCohereChatHistory = (messages = []) =>
  messages
    .filter((m) => ROLE_MAP[m.role])
    .map((m) => ({ role: ROLE_MAP[m.role], message: m.content }));

/**
 * Build the system preamble: base instructions + retrieved RAG context.
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
 * Start a streaming Cohere chat. Returns an async-iterable stream of events;
 * text deltas arrive as events with eventType === "text-generation".
 */
export const streamChat = async ({ message, preamble, chatHistory }) => {
  const cohere = getCohereClient();
  return cohere.chatStream({
    model: CHAT_MODEL,
    message,
    preamble,
    chatHistory,
  });
};

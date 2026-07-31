import { getCohereClient } from "../config/cohere.js";

// command-r-plus was removed by Cohere on 2025-09-15; use the current flagship.
// Note: current models require the v2 chat API (client.v2.chatStream).
const CHAT_MODEL = "command-a-plus-05-2026";
const MAX_TITLE_LENGTH = 80;

/**
 * Convert stored Message docs (chronological order) into v2 chat messages.
 * Our roles ("user"/"assistant") match the v2 API's roles directly.
 *
 * The Cohere v2 API requires `content` to be a plain string for text-only
 * models.  Force-stringify every value so arrays or objects never slip
 * through (which would trigger "does not support image input" errors).
 */
const safeContent = (val) => {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    // Extract only text parts from content-block arrays
    return val
      .filter((b) => b && b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("\n");
  }
  return String(val ?? "");
};

export const toCohereChatHistory = (messages = []) =>
  messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: safeContent(m.content) }));

/**
 * Build the system message: base instructions + retrieved RAG context.
 * @param {Array<{ text: string }>} chunks
 */
export const buildPreamble = (chunks = []) => {
  const base =
    "You are a helpful AI assistant for a document-aware chat application. " +
    "Use the retrieved context below to answer the user's question when it is relevant. " +
    "Answer directly and naturally; never preface an answer by saying whether the retrieved context contains the answer. " +
    "Cite the context by its bracket number (e.g. [1]) when you use it.";

  if (!chunks.length) return base;

  const context = chunks.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n");
  return `${base}\n\nRetrieved context:\n${context}`;
};

/**
 * Start a streaming Cohere v2 chat. Yields plain text deltas so callers don't
 * depend on Cohere's event shapes.
 */
export async function* streamChat({
  message,
  preamble,
  chatHistory = [],
  signal,
}) {
  const cohere = getCohereClient();

  const stream = await cohere.v2.chatStream(
    {
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: safeContent(preamble) },
        ...chatHistory,
        { role: "user", content: safeContent(message) },
      ],
    },
    // Fail fast instead of hanging if the AI API stalls.
    { timeoutInSeconds: 90, maxRetries: 1, abortSignal: signal }
  );

  for await (const event of stream) {
    if (event.type === "content-delta") {
      const text = event.delta?.message?.content?.text;
      if (text) yield text;
    }
  }
}

const cleanTitle = (value) => {
  const title = String(value ?? "")
    .replace(/^(title|conversation title)\s*:\s*/i, "")
    .replace(/^[\s"'`*_#-]+|[\s"'`*_#.!-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (title.length <= MAX_TITLE_LENGTH) return title;
  const shortened = title.slice(0, MAX_TITLE_LENGTH + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return shortened.slice(0, lastSpace > 30 ? lastSpace : MAX_TITLE_LENGTH).trim();
};

/** Create a concise ChatGPT-style label after the first exchange. */
export const generateConversationTitle = async ({
  userMessage,
  assistantMessage,
}) => {
  const cohere = getCohereClient();
  const response = await cohere.v2.chat(
    {
      model: CHAT_MODEL,
      temperature: 0.2,
      maxTokens: 24,
      messages: [
        {
          role: "system",
          content:
            "Create a concise conversation title of 3 to 7 words. Return only the title, with no quotes, markdown, label, or ending punctuation.",
        },
        {
          role: "user",
          content: `User message: ${safeContent(userMessage).slice(0, 800)}\n\nAssistant response: ${safeContent(assistantMessage).slice(0, 800)}`,
        },
      ],
    },
    { timeoutInSeconds: 15, maxRetries: 0 }
  );

  const content = response.message?.content;
  const rawTitle = Array.isArray(content)
    ? content.find((part) => part?.type === "text")?.text
    : content;
  return cleanTitle(rawTitle);
};

/** Local fallback used if the title-generation request is unavailable. */
export const deriveConversationTitle = (message) => {
  const normalized = String(message ?? "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "New conversation";
  return cleanTitle(normalized.split(" ").slice(0, 7).join(" "));
};

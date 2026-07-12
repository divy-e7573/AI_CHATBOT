import { getCohereClient } from "../config/cohere.js";

const EMBED_MODEL = "embed-english-v3.0";
// Cohere accepts up to 96 texts per embed call.
const MAX_BATCH = 96;

// Cohere may return embeddings as a plain array or as { float: [...] }.
const unwrap = (embeddings) =>
  Array.isArray(embeddings) ? embeddings : embeddings.float;

/**
 * Embed a batch of document chunks (inputType "search_document").
 * Returns an array of embedding vectors aligned with the input order.
 */
export const embedDocuments = async (texts) => {
  const client = getCohereClient();
  const vectors = [];

  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    const res = await client.embed({
      texts: batch,
      model: EMBED_MODEL,
      inputType: "search_document",
    });
    vectors.push(...unwrap(res.embeddings));
  }

  return vectors;
};

/**
 * Embed a single search query (inputType "search_query").
 * Used later at retrieval time by the chat/RAG flow.
 */
export const embedQuery = async (text) => {
  const client = getCohereClient();
  const res = await client.embed({
    texts: [text],
    model: EMBED_MODEL,
    inputType: "search_query",
  });
  return unwrap(res.embeddings)[0];
};

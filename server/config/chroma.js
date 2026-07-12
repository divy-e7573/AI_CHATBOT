import { ChromaClient } from "chromadb";

// Single shared collection; chunks are isolated per conversation via metadata.
export const DOCUMENTS_COLLECTION = "documents";

let client;

export const getChromaClient = () => {
  if (!client) {
    client = new ChromaClient({
      path: process.env.CHROMA_URL || "http://localhost:8000",
    });
  }
  return client;
};

/**
 * Get (or lazily create) the shared documents collection.
 * We always supply embeddings/query embeddings ourselves (via Cohere), so no
 * Chroma-side embedding function is configured here.
 */
export const getDocumentsCollection = async () => {
  const chroma = getChromaClient();
  return chroma.getOrCreateCollection({ name: DOCUMENTS_COLLECTION });
};

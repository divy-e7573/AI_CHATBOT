import Document from "../models/Document.js";
import { getDocumentsCollection } from "../config/chroma.js";
import { extractText } from "./textExtractor.js";
import { chunkText } from "./chunker.js";
import { embedDocuments, embedQuery } from "./embeddingService.js";

const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

/**
 * Full ingest pipeline for one uploaded file:
 *   extract text -> chunk -> embed (Cohere) -> store in Chroma + MongoDB.
 *
 * Embeddings are the source of truth in Chroma; the MongoDB Document keeps the
 * chunk text + index (embedding vectors are intentionally not duplicated there).
 *
 * @returns {Promise<{ documentId: string, chunkCount: number }>}
 */
export const ingestDocument = async ({
  filePath,
  filename,
  mimetype,
  userId,
  conversationId,
}) => {
  const text = await extractText(filePath, mimetype);
  if (!text || !text.trim()) {
    throw badRequest("No extractable text found in the uploaded file.");
  }

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    throw badRequest("File produced no text chunks.");
  }

  const embeddings = await embedDocuments(chunks);

  // Persist the Document record (links file to user + conversation).
  const doc = await Document.create({
    userId,
    conversationId,
    filename,
    chunks: chunks.map((chunkTextValue, chunkIndex) => ({
      text: chunkTextValue,
      chunkIndex,
    })),
  });

  const documentId = doc._id.toString();

  // Store vectors in the shared Chroma collection, tagged for filtering.
  const collection = await getDocumentsCollection();
  await collection.add({
    ids: chunks.map((_, i) => `${documentId}-${i}`),
    embeddings,
    documents: chunks,
    metadatas: chunks.map((_, i) => ({
      documentId,
      conversationId: conversationId.toString(),
      userId: userId.toString(),
      chunkIndex: i,
    })),
  });

  return { documentId, chunkCount: chunks.length };
};

/**
 * Retrieve the most relevant chunks for a query within one conversation.
 * (Not wired to a route yet — used later by the chat/RAG flow.)
 *
 * @returns {Promise<Array<{ text: string, metadata: object, distance: number }>>}
 */
export const retrieveRelevantChunks = async ({
  query,
  conversationId,
  topK = 5,
}) => {
  const queryEmbedding = await embedQuery(query);
  const collection = await getDocumentsCollection();

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: { conversationId: conversationId.toString() },
  });

  const docs = results.documents?.[0] ?? [];
  const metas = results.metadatas?.[0] ?? [];
  const dists = results.distances?.[0] ?? [];

  return docs.map((text, i) => ({
    text,
    metadata: metas[i],
    distance: dists[i],
  }));
};

import Document from "../models/Document.js";
import { getDocumentsCollection, isChromaAvailable } from "../config/chroma.js";
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

  // MongoDB is the durable source of truth. Vector indexing is an optional
  // enhancement, so an unavailable Chroma server must not make uploads fail.
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
  let vectorIndexed = false;

  try {
    if (await isChromaAvailable()) {
      const embeddings = await embedDocuments(chunks);
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
      await Document.updateOne({ _id: doc._id }, { $set: { vectorIndexed: true } });
      vectorIndexed = true;
    } else {
      console.warn(
        `[RAG] Saved ${filename} without vectors because ChromaDB is unavailable.`
      );
    }
  } catch (err) {
    // Keep the successfully extracted Mongo document. Retrieval below falls
    // back to lexical matching when vector services are unavailable.
    console.warn(`[RAG] Vector indexing failed for ${filename}:`, err.message);
  }

  return { documentId, chunkCount: chunks.length, vectorIndexed };
};

const queryTerms = (query) => [
  ...new Set(
    (query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
      (term) => term.length > 1
    )
  ),
];

/**
 * Dependency-free fallback used when Chroma or the embedding provider is
 * unavailable. It also makes newly uploaded documents useful immediately.
 */
const retrieveLexically = async ({ query, conversationId, topK }) => {
  const documents = await Document.find({ conversationId })
    .select("filename chunks")
    .lean();
  const terms = queryTerms(query);
  const normalizedQuery = query.trim().toLowerCase();
  const candidates = [];

  for (const document of documents) {
    for (const chunk of document.chunks ?? []) {
      const haystack = chunk.text.toLowerCase();
      let score = normalizedQuery && haystack.includes(normalizedQuery) ? 10 : 0;
      for (const term of terms) {
        const matches = haystack.split(term).length - 1;
        score += Math.min(matches, 5);
      }
      candidates.push({
        text: chunk.text,
        metadata: {
          documentId: document._id.toString(),
          filename: document.filename,
          chunkIndex: chunk.chunkIndex,
          retrieval: "lexical",
        },
        score,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, topK).map(({ score, ...candidate }) => ({
    ...candidate,
    // Preserve the response shape used by vector retrieval (lower is better).
    distance: score > 0 ? 1 / (score + 1) : 1,
  }));
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
  // If even one document was saved while vector services were offline, use a
  // single retrieval strategy so those chunks cannot be hidden by results
  // from older, vector-indexed documents.
  const needsLexicalFallback = await Document.exists({
    conversationId,
    vectorIndexed: { $ne: true },
  });
  if (needsLexicalFallback) {
    return retrieveLexically({ query, conversationId, topK });
  }

  try {
    if (await isChromaAvailable()) {
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
      if (docs.length) {
        return docs.map((text, i) => ({
          text,
          metadata: metas[i],
          distance: dists[i],
        }));
      }
    }
  } catch (err) {
    console.warn(
      "[RAG] Vector retrieval failed; using MongoDB fallback:",
      err.message
    );
  }

  return retrieveLexically({ query, conversationId, topK });
};

/**
 * Remove all Chroma vectors belonging to a conversation (used on delete).
 */
export const deleteConversationVectors = async (conversationId) => {
  if (!(await isChromaAvailable())) return;
  const collection = await getDocumentsCollection();
  await collection.delete({ where: { conversationId: conversationId.toString() } });
};

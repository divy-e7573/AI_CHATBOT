import { CohereClient } from "cohere-ai";

// Shared Cohere client, used for both embeddings (RAG) and chat generation.
let client;

export const getCohereClient = () => {
  if (!client) {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      throw new Error("COHERE_API_KEY is not defined in environment variables");
    }
    client = new CohereClient({ token: apiKey });
  }
  return client;
};

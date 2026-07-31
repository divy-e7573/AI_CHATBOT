import * as claude from "./claudeAdapter.js";
import * as cohere from "./cohereAdapter.js";
import * as openai from "./openaiAdapter.js";
import * as gemini from "./geminiAdapter.js";

export const PROVIDERS = Object.freeze({
  cohere: { label: "Cohere", keyName: "COHERE_API_KEY", adapter: cohere },
  claude: { label: "Claude", keyName: "ANTHROPIC_API_KEY", adapter: claude },
  openai: { label: "GPT", keyName: "OPENAI_API_KEY", adapter: openai },
  gemini: { label: "Gemini", keyName: "GEMINI_API_KEY", adapter: gemini },
});

export class UnsupportedProviderError extends Error {
  constructor(providerName) {
    super(`Unsupported AI provider \"${providerName}\". Choose Claude, GPT, Gemini, or Cohere.`);
    this.name = "UnsupportedProviderError";
    this.status = 400;
  }
}

export const getProvider = (providerName = "cohere") => {
  const requested = String(providerName).trim().toLowerCase() || "cohere";
  const aliases = { gpt: "openai", anthropic: "claude", google: "gemini" };
  const normalized = aliases[requested] || requested;
  const provider = PROVIDERS[normalized];
  if (!provider) throw new UnsupportedProviderError(providerName);
  return { name: normalized, ...provider };
};

/** Check missing server configuration before a stream can mutate a chat. */
export const ensureProviderConfigured = (provider) => {
  if (process.env[provider.keyName]) return;
  const error = new Error(`${provider.label} is not configured. Add ${provider.keyName} to the server environment.`);
  error.status = 400;
  throw error;
};

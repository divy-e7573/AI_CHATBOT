// Word-based chunking with overlap.
//
// Tokens are approximated by words: ~1 token ≈ 0.75 words for English, so a
// ~500-token target is roughly 375 words. Overlap keeps context continuous
// across chunk boundaries so retrieval doesn't lose sentences split in two.
const DEFAULT_CHUNK_WORDS = 375; // ~500 tokens
const DEFAULT_OVERLAP_WORDS = 50; // ~65 tokens

/**
 * Split text into overlapping chunks.
 * @param {string} text
 * @param {{ chunkWords?: number, overlapWords?: number }} [opts]
 * @returns {string[]} non-empty chunk strings
 */
export const chunkText = (text, opts = {}) => {
  const chunkWords = opts.chunkWords ?? DEFAULT_CHUNK_WORDS;
  const overlapWords = opts.overlapWords ?? DEFAULT_OVERLAP_WORDS;
  const step = Math.max(1, chunkWords - overlapWords);

  const words = (text || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = [];
  for (let start = 0; start < words.length; start += step) {
    const chunk = words.slice(start, start + chunkWords).join(" ");
    if (chunk) chunks.push(chunk);
    if (start + chunkWords >= words.length) break;
  }

  return chunks;
};

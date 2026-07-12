import fs from "fs/promises";
import path from "path";

// Import the parser implementation directly to avoid pdf-parse's index.js,
// which runs debug code that reads a bundled sample file on load.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Extract plain text from an uploaded file (PDF or TXT).
 * @param {string} filePath absolute path to the saved file
 * @param {string} [mimetype] the file's reported mimetype
 * @returns {Promise<string>} extracted text
 */
export const extractText = async (filePath, mimetype) => {
  const ext = path.extname(filePath).toLowerCase();
  const isPdf = mimetype === "application/pdf" || ext === ".pdf";

  if (isPdf) {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  // Treat everything else (txt) as UTF-8 plain text.
  return fs.readFile(filePath, "utf-8");
};

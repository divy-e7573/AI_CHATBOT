import fs from "fs/promises";
import path from "path";
import { createWorker } from "tesseract.js";
import englishLanguageData from "@tesseract.js-data/eng";

// Import the parser implementation directly to avoid pdf-parse's index.js,
// which runs debug code that reads a bundled sample file on load.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Extract plain text from an uploaded document or image. Images are converted
 * to searchable text with a locally bundled English OCR model.
 * @param {string} filePath absolute path to the saved file
 * @param {string} [mimetype] the file's reported mimetype
 * @returns {Promise<string>} extracted text
 */
export const extractText = async (filePath, mimetype) => {
  const ext = path.extname(filePath).toLowerCase();
  const isPdf = mimetype === "application/pdf" || ext === ".pdf";
  const isImage =
    mimetype?.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp", ".bmp"].includes(ext);

  if (isPdf) {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (isImage) {
    let worker;
    try {
      worker = await createWorker("eng", undefined, {
        langPath: englishLanguageData.langPath,
        gzip: englishLanguageData.gzip,
        // Language data is already installed in node_modules; do not create a
        // second ~23 MB cache file in the application working directory.
        cacheMethod: "none",
      });
      const result = await worker.recognize(filePath);
      return result.data.text;
    } catch (cause) {
      const err = new Error(
        "Could not read text from this image. Try a clearer or higher-resolution image."
      );
      err.status = 422;
      err.cause = cause;
      throw err;
    } finally {
      await worker?.terminate().catch(() => {});
    }
  }

  // The upload middleware restricts everything else to UTF-8 plain text.
  return fs.readFile(filePath, "utf-8");
};

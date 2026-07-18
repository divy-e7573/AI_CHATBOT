import { useRef } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — matches the server's multer limit
const ALLOWED_EXTENSIONS = [".pdf", ".txt"];

/**
 * Attach button for PDF/TXT files.
 * Validates type + size client-side before handing the file up.
 *
 * @param {(file: File) => void} onSelect called with a valid file
 * @param {(message: string) => void} onError called with a validation message
 * @param {boolean} disabled disables the button (e.g. while uploading)
 * @param {boolean} busy shows a spinner instead of the clip icon
 */
export default function FileUploadButton({ onSelect, onError, disabled, busy }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      onError?.("Only PDF and TXT files are supported.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      onError?.("File is too large — the limit is 10 MB.");
      return;
    }
    onSelect?.(file);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        title="Attach a PDF or TXT file (max 10 MB)"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Attach file"
      >
        {busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        ) : (
          "📎"
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
}

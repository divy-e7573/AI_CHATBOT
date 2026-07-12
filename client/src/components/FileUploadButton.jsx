import { useRef } from "react";

/**
 * Attach button for PDF/TXT files. Calls onSelect(file) with the chosen File.
 */
export default function FileUploadButton({ onSelect, accept = ".pdf,.txt" }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onSelect?.(file);
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title="Attach a PDF or TXT file"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
        aria-label="Attach file"
      >
        📎
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
}

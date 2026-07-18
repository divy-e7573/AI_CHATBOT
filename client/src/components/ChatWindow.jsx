import { useEffect, useRef, useState } from "react";

import api from "../api/axios";
import { useChatStore } from "../store/chatStore";
import { streamMessage } from "../api/chatStream";
import MessageBubble from "./MessageBubble";
import FileUploadButton from "./FileUploadButton";
import { MessagesSkeleton } from "./Skeleton";

// Abort generation if the first token hasn't arrived within this window.
const FIRST_TOKEN_TIMEOUT_MS = 45_000;

export default function ChatWindow({ onOpenSidebar }) {
  const messages = useChatStore((s) => s.messages);
  const loadingMessages = useChatStore((s) => s.loadingMessages);
  const conversations = useChatStore((s) => s.conversations);
  const currentId = useChatStore((s) => s.currentConversationId);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendToMessage = useChatStore((s) => s.appendToMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);

  const current = conversations.find((c) => c._id === currentId);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [upload, setUpload] = useState(null); // { kind: "uploading"|"success"|"error", text }

  const endRef = useRef(null);
  const abortRef = useRef(null);

  // Keep the newest message in view as tokens stream in.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Abort any in-flight stream if the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Auto-dismiss upload success banners.
  useEffect(() => {
    if (upload?.kind !== "success") return;
    const t = setTimeout(() => setUpload(null), 4000);
    return () => clearTimeout(t);
  }, [upload]);

  const handleFileSelected = async (file) => {
    if (!currentId) return;
    setUpload({ kind: "uploading", text: `Uploading ${file.name}…` });
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("conversationId", currentId);
      const { data } = await api.post("/upload", form);
      setUpload({
        kind: "success",
        text: `${data.filename} processed (${data.chunkCount} chunk${
          data.chunkCount === 1 ? "" : "s"
        }). You can ask about it now.`,
      });
    } catch (err) {
      setUpload({
        kind: "error",
        text:
          err.response?.data?.message ||
          "Upload failed. Check your connection and try again.",
      });
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isStreaming || !currentId) return;

    setInput("");
    setIsStreaming(true);

    addMessage({ role: "user", content: text });
    // Placeholder assistant bubble; `pending` drives the loading indicator.
    const assistantId = addMessage({
      role: "assistant",
      content: "",
      pending: true,
    });

    const controller = new AbortController();
    abortRef.current = controller;

    // Watchdog: abort if the AI never starts answering.
    let timedOut = false;
    let watchdog = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, FIRST_TOKEN_TIMEOUT_MS);

    try {
      await streamMessage({
        conversationId: currentId,
        content: text,
        signal: controller.signal,
        onToken: (chunk) => {
          if (watchdog) {
            clearTimeout(watchdog);
            watchdog = null;
          }
          appendToMessage(assistantId, chunk);
        },
        onDone: () => updateMessage(assistantId, { pending: false }),
      });
    } catch (err) {
      if (err.name === "AbortError" && timedOut) {
        updateMessage(assistantId, {
          pending: false,
          error: true,
          content: "⚠️ The AI took too long to respond. Please try again.",
        });
      } else if (err.name === "AbortError") {
        // User navigated away / cancelled — just stop the indicator.
        updateMessage(assistantId, { pending: false });
      } else {
        updateMessage(assistantId, {
          pending: false,
          error: true,
          content: `⚠️ ${err.message || "Failed to get a response."}`,
        });
      }
    } finally {
      if (watchdog) clearTimeout(watchdog);
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <button
          onClick={onOpenSidebar}
          className="text-xl text-gray-600 md:hidden"
          aria-label="Open sidebar"
        >
          ☰
        </button>
        <h1 className="truncate text-base font-semibold text-gray-800">
          {current?.title ?? "Chat"}
        </h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {loadingMessages ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="mt-16 text-center text-sm text-gray-400">
            <p className="mb-1 text-base">👋</p>
            <p>No messages yet.</p>
            <p>Ask a question, or attach a PDF/TXT to chat about it.</p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m._id} message={m} />)
        )}
        <div ref={endRef} />
      </div>

      {upload && (
        <div
          className={`mx-3 mb-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
            upload.kind === "error"
              ? "bg-red-50 text-red-700"
              : upload.kind === "success"
              ? "bg-green-50 text-green-700"
              : "bg-blue-50 text-blue-700"
          }`}
          role="status"
        >
          <span className="truncate">{upload.text}</span>
          <button
            onClick={() => setUpload(null)}
            className="ml-3 shrink-0 font-medium hover:underline"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 bg-white p-3"
      >
        <div className="flex items-end gap-2">
          <FileUploadButton
            onSelect={handleFileSelected}
            onError={(message) => setUpload({ kind: "error", text: message })}
            disabled={upload?.kind === "uploading"}
            busy={upload?.kind === "uploading"}
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message…"
            className="max-h-40 flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="h-10 shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStreaming ? "…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

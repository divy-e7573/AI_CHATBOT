import { useEffect, useRef, useState } from "react";

import { useChatStore } from "../store/chatStore";
import { streamMessage } from "../api/chatStream";
import MessageBubble from "./MessageBubble";
import FileUploadButton from "./FileUploadButton";

export default function ChatWindow({ onOpenSidebar }) {
  const messages = useChatStore((s) => s.messages);
  const conversations = useChatStore((s) => s.conversations);
  const currentId = useChatStore((s) => s.currentConversationId);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendToMessage = useChatStore((s) => s.appendToMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);

  const current = conversations.find((c) => c._id === currentId);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const endRef = useRef(null);
  const abortRef = useRef(null);

  // Keep the newest message in view as tokens stream in.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Abort any in-flight stream if the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

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

    try {
      await streamMessage({
        conversationId: currentId,
        content: text,
        signal: controller.signal,
        onToken: (chunk) => appendToMessage(assistantId, chunk),
        onDone: () => updateMessage(assistantId, { pending: false }),
      });
    } catch (err) {
      if (err.name === "AbortError") {
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
        {messages.length === 0 ? (
          <div className="mt-16 text-center text-sm text-gray-400">
            No messages yet. Say hi 👋
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m._id} message={m} />)
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 bg-white p-3"
      >
        <div className="flex items-end gap-2">
          <FileUploadButton
            onSelect={(file) => {
              // Upload wiring comes later.
              console.log("Selected file:", file?.name);
            }}
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

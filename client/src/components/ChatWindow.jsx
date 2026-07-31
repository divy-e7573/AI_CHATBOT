import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

import api from "../api/axios";
import { streamMessage, streamRegenerate } from "../api/chatStream";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { useChatStore } from "../store/chatStore";
import FileUploadButton from "./FileUploadButton";
import MessageBubble from "./MessageBubble";
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
  const editUserMessage = useChatStore((s) => s.editUserMessage);
  const replaceMessageId = useChatStore((s) => s.replaceMessageId);
  const updateConversationTitle = useChatStore(
    (s) => s.updateConversationTitle
  );

  const current = conversations.find((c) => c._id === currentId);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStopRequested, setIsStopRequested] = useState(false);
  const [upload, setUpload] = useState(null); // { kind: "uploading"|"success"|"error", text }
  const [voiceError, setVoiceError] = useState(null);

  const endRef = useRef(null);
  const abortRef = useRef(null);
  const streamingAssistantIdRef = useRef(null);
  const stopRequestedRef = useRef(false);

  const handleTranscriptUpdate = useCallback((text) => {
    setInput(text);
  }, []);

  const handleVoiceError = useCallback((message) => {
    setVoiceError(message);
  }, []);

  const {
    isListening,
    isSupported: isSpeechSupported,
    toggle: toggleSpeech,
    stop: stopSpeech,
    clearError: clearVoiceError,
  } = useSpeechToText({
    onTranscriptUpdate: handleTranscriptUpdate,
    onError: handleVoiceError,
  });

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

  // Auto-dismiss voice error toasts.
  useEffect(() => {
    if (!voiceError) return;
    const t = setTimeout(() => {
      setVoiceError(null);
      clearVoiceError();
    }, 6000);
    return () => clearTimeout(t);
  }, [voiceError, clearVoiceError]);

  // Stop listening when switching conversations or while the AI is responding.
  const stopSpeechRef = useRef(stopSpeech);
  stopSpeechRef.current = stopSpeech;

  useEffect(() => {
    stopSpeechRef.current();
  }, [currentId, isStreaming]);

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
        }). You can ask about it now.${
          data.vectorIndexed === false
            ? " Using built-in text search while the vector service is offline."
            : ""
        }`,
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

  const startStreaming = async ({ request, assistantId, userId }) => {
    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    streamingAssistantIdRef.current = assistantId;
    stopRequestedRef.current = false;
    setIsStopRequested(false);

    let timedOut = false;
    let watchdog = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, FIRST_TOKEN_TIMEOUT_MS);

    try {
      await request({
        signal: controller.signal,
        onToken: (chunk) => {
          if (watchdog) {
            clearTimeout(watchdog);
            watchdog = null;
          }
          appendToMessage(assistantId, chunk);
        },
        onDone: (payload) => {
          updateMessage(assistantId, {
            pending: false,
            regenerating: false,
            ...(payload.stopped ? { stopped: true } : {}),
          });
          if (userId) replaceMessageId(userId, payload.userMessageId);
          replaceMessageId(assistantId, payload.assistantMessageId);
          if (payload.conversationTitle) {
            updateConversationTitle(currentId, payload.conversationTitle);
          }
        },
      });
    } catch (err) {
      if (err.name === "AbortError" && timedOut && !stopRequestedRef.current) {
        updateMessage(assistantId, {
          pending: false,
          regenerating: false,
          error: true,
          content: "⚠️ The AI took too long to respond. Please try again.",
        });
      } else if (err.name === "AbortError") {
        updateMessage(assistantId, {
          pending: false,
          regenerating: false,
          ...(stopRequestedRef.current ? { stopped: true } : {}),
        });
      } else {
        updateMessage(assistantId, {
          pending: false,
          regenerating: false,
          error: true,
          content: `⚠️ ${err.message || "Failed to get a response."}`,
        });
      }
    } finally {
      if (watchdog) clearTimeout(watchdog);
      setIsStreaming(false);
      abortRef.current = null;
      streamingAssistantIdRef.current = null;
      stopRequestedRef.current = false;
      setIsStopRequested(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isStreaming || !currentId) return;

    if (isListening) stopSpeech();
    setInput("");
    const userId = addMessage({ role: "user", content: text });
    const assistantId = addMessage({
      role: "assistant",
      content: "",
      pending: true,
    });
    startStreaming({
      assistantId,
      userId,
      request: (callbacks) =>
        streamMessage({ conversationId: currentId, content: text, ...callbacks }),
    });
  };

  const handleRegenerate = (messageId, existingAssistantId = null) => {
    if (!messageId || isStreaming || !currentId) return;
    const assistantId = existingAssistantId || addMessage({
      role: "assistant",
      content: "",
      pending: true,
      regenerating: true,
    });
    if (existingAssistantId) {
      updateMessage(existingAssistantId, {
        content: "",
        pending: true,
        regenerating: true,
        stopped: false,
        error: false,
      });
    }
    startStreaming({
      assistantId,
      request: (callbacks) =>
        streamRegenerate({
          conversationId: currentId,
          messageId,
          ...callbacks,
        }),
    });
  };

  const handleEditUserMessage = async (messageId, content) => {
    if (isStreaming || !currentId) return;
    await editUserMessage(currentId, messageId, content);
    handleRegenerate(messageId);
  };

  const handleStopGenerating = () => {
    const controller = abortRef.current;
    if (!controller || stopRequestedRef.current) return;

    stopRequestedRef.current = true;
    setIsStopRequested(true);
    if (streamingAssistantIdRef.current) {
      updateMessage(streamingAssistantIdRef.current, {
        pending: false,
        stopped: true,
      });
    }
    controller.abort();
  };

  const handleKeyDown = (e) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (!currentId || isStreaming) return;
    setVoiceError(null);
    clearVoiceError();
    toggleSpeech(input);
  };

  const lastAssistantIndex = messages.reduce(
    (lastIndex, message, index) =>
      message.role === "assistant" ? index : lastIndex,
    -1
  );

  const previousUserId = (assistantIndex) => {
    for (let index = assistantIndex - 1; index >= 0; index -= 1) {
      if (messages[index].role === "user") return messages[index]._id;
    }
    return null;
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
        {!currentId ? (
          <div className="mt-16 text-center text-sm text-gray-400">
            <p className="mb-1 text-base">💬</p>
            <p>No conversation selected.</p>
            <p>Click “+ New chat” in the sidebar to start one.</p>
          </div>
        ) : loadingMessages ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="mt-16 text-center text-sm text-gray-400">
            <p className="mb-1 text-base">👋</p>
            <p>No messages yet.</p>
            <p>Ask a question, or attach a document/image to chat about it.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message._id}
              message={message}
              actionsDisabled={isStreaming || loadingMessages}
              onEdit={
                message.role === "user" && !isStreaming
                  ? handleEditUserMessage
                  : undefined
              }
              onRegenerate={
                message.role === "assistant" && index === lastAssistantIndex
                  ? () => handleRegenerate(previousUserId(index), message._id)
                  : undefined
              }
            />
          ))
        )}
        <div ref={endRef} />
      </div>

      {(upload || voiceError) && (
        <div
          className={`mx-3 mb-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
            upload?.kind === "error" || voiceError
              ? "bg-red-50 text-red-700"
              : upload?.kind === "success"
              ? "bg-green-50 text-green-700"
              : "bg-blue-50 text-blue-700"
          }`}
          role="status"
        >
          <span className="truncate">{voiceError || upload?.text}</span>
          <button
            onClick={() => {
              setUpload(null);
              setVoiceError(null);
              clearVoiceError();
            }}
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
            disabled={!currentId || upload?.kind === "uploading"}
            busy={upload?.kind === "uploading"}
          />
          <div className="relative min-w-0 flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={!currentId}
              placeholder={
                isListening
                  ? "Listening…"
                  : currentId
                  ? "Type a message…"
                  : "Start a new chat first"
              }
              className={`max-h-40 w-full resize-none rounded-lg border px-3 py-2 pr-11 text-sm focus:outline-none disabled:bg-gray-50 ${
                isListening
                  ? "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : "border-gray-300 focus:border-blue-500"
              }`}
            />

            {isSpeechSupported ? (
              <button
                type="button"
                onClick={handleMicClick}
                disabled={!currentId || isStreaming}
                title={isListening ? "Stop listening" : "Voice input"}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                className={`absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isListening
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
              >
                <Mic
                  className={`h-[18px] w-[18px] ${isListening ? "animate-pulse" : ""}`}
                  strokeWidth={1.75}
                />
                {isListening && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                )}
              </button>
            ) : (
              <span
                title="Voice input not supported in this browser"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-not-allowed items-center justify-center rounded-lg text-gray-300"
                aria-label="Voice input not supported in this browser"
              >
                <Mic className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
            )}
          </div>
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopGenerating}
              disabled={isStopRequested}
              className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
            >
              <Square className="h-3 w-3 fill-current" />
              {isStopRequested ? "Stopping…" : "Stop generating"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!currentId || !input.trim()}
              className="h-10 shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

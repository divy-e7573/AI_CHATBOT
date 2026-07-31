import MarkdownRenderer from "./MarkdownRenderer";

// Three bouncing dots shown while waiting for the first token.
function TypingIndicator() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
    </span>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  // Loading state: assistant bubble that's pending and hasn't received text yet.
  const showTyping = !isUser && message.pending && !message.content;

  const tone = isUser
    ? "rounded-br-sm bg-blue-600 text-white"
    : message.error
    ? "rounded-bl-sm border border-red-200 bg-red-50 text-red-700"
    : "rounded-bl-sm border border-gray-200 bg-white text-gray-800";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm md:max-w-[75%] ${tone}`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : showTyping ? (
          <TypingIndicator />
        ) : (
          <>
            {message.content ? (
              <MarkdownRenderer content={message.content} />
            ) : message.stopped ? (
              <p className="text-sm text-gray-500">Generation stopped.</p>
            ) : null}
            {message.stopped && message.content && (
              <p className="mt-2 text-xs font-medium text-gray-400">
                Generation stopped
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

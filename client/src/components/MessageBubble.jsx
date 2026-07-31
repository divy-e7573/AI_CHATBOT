import { useState } from "react";
import { Check, Loader2, Pencil, RotateCcw, X } from "lucide-react";

import MarkdownRenderer from "./MarkdownRenderer";

function TypingIndicator({ regenerating = false }) {
  return (
    <span
      className="flex items-center gap-1 py-1"
      aria-label={regenerating ? "Regenerating response" : "Assistant is typing"}
    >
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
      {regenerating && <span className="ml-2 text-xs text-gray-400">Regenerating…</span>}
    </span>
  );
}

export default function MessageBubble({
  message,
  onEdit,
  onRegenerate,
  actionsDisabled = false,
}) {
  const isUser = message.role === "user";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const showTyping = !isUser && message.pending && !message.content;

  const tone = isUser
    ? "rounded-br-sm bg-blue-600 text-white"
    : message.error
    ? "rounded-bl-sm border border-red-200 bg-red-50 text-red-700"
    : "rounded-bl-sm border border-gray-200 bg-white text-gray-800";

  const startEdit = () => {
    setDraft(message.content);
    setEditError("");
    setEditing(true);
  };

  const saveEdit = async () => {
    const content = draft.trim();
    if (!content || content === message.content || !onEdit) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      await onEdit(message._id, content);
      setEditing(false);
    } catch (error) {
      setEditError(error.message || "Couldn't update this message.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] md:max-w-[75%]">
        <div className={`rounded-2xl px-4 py-2 text-sm ${tone}`}>
          {isUser ? (
            editing ? (
              <div className="min-w-[230px]">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  autoFocus
                  disabled={saving}
                  className="w-full resize-y rounded-lg border border-blue-300 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none ring-2 ring-blue-200"
                  aria-label="Edit message"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setEditing(false);
                    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault();
                      saveEdit();
                    }
                  }}
                />
                {editError && <p className="mt-1.5 text-xs text-red-100">{editError}</p>}
                <div className="mt-2 flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="rounded-md bg-blue-700/70 p-1.5 text-white hover:bg-blue-700 disabled:opacity-50"
                    aria-label="Cancel edit"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={saving || !draft.trim()}
                    className="flex items-center gap-1 rounded-md bg-white px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                {onEdit && !actionsDisabled && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="-mr-1 -mt-0.5 rounded p-1 text-blue-100 opacity-0 transition hover:bg-blue-700 hover:text-white group-hover:opacity-100 focus:opacity-100"
                    title="Edit message"
                    aria-label="Edit message"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          ) : showTyping ? (
            <TypingIndicator regenerating={message.regenerating} />
          ) : (
            <>
              {message.content ? (
                <MarkdownRenderer content={message.content} />
              ) : message.stopped ? (
                <p className="text-sm text-gray-500">Generation stopped.</p>
              ) : null}
              {message.stopped && message.content && (
                <p className="mt-2 text-xs font-medium text-gray-400">Generation stopped</p>
              )}
            </>
          )}
        </div>

        {!isUser && onRegenerate && !message.pending && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={actionsDisabled}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { SidebarSkeleton } from "./Skeleton";

export default function Sidebar({ onClose }) {
  const navigate = useNavigate();
  const editInputRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameError, setRenameError] = useState(null);

  const loadingConversations = useChatStore((s) => s.loadingConversations);
  const conversations = useChatStore((s) => s.conversations);
  const currentId = useChatStore((s) => s.currentConversationId);
  const listError = useChatStore((s) => s.listError);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  const renameConversation = useChatStore((s) => s.renameConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const resetChat = useChatStore((s) => s.reset);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!editingId) return;
    editInputRef.current?.focus();
    editInputRef.current?.select();
  }, [editingId]);

  const handleSelect = (id) => {
    if (id !== currentId) selectConversation(id);
    onClose?.();
  };

  const handleNew = () => {
    createConversation();
    onClose?.();
  };

  const handleDelete = async (event, conversation) => {
    event.stopPropagation();
    const confirmed = window.confirm(
      `Delete "${conversation.title}"? Its messages and uploaded documents will be removed.`
    );
    if (!confirmed) return;
    try {
      await deleteConversation(conversation._id);
    } catch {
      window.alert("Couldn't delete the conversation. Please try again.");
    }
  };

  const beginRename = (event, conversation) => {
    event.stopPropagation();
    setEditingId(conversation._id);
    setDraftTitle(conversation.title);
    setRenameError(null);
  };

  const cancelRename = (event) => {
    event?.stopPropagation();
    setEditingId(null);
    setDraftTitle("");
    setRenameError(null);
  };

  const submitRename = async (event, conversation) => {
    event?.stopPropagation();
    const title = draftTitle.trim();
    if (!title || title === conversation.title) {
      cancelRename(event);
      return;
    }

    setRenamingId(conversation._id);
    setRenameError(null);
    try {
      await renameConversation(conversation._id, title);
      setEditingId(null);
      setDraftTitle("");
    } catch (error) {
      setRenameError(
        error.response?.data?.message || "Couldn't rename this conversation."
      );
      requestAnimationFrame(() => editInputRef.current?.focus());
    } finally {
      setRenamingId(null);
    }
  };

  const handleRenameKeyDown = (event, conversation) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      submitRename(event, conversation);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelRename(event);
    }
  };

  const handleLogout = () => {
    api.post("/auth/logout").catch(() => {});
    resetChat();
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <button
          onClick={handleNew}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New chat
        </button>
      </div>

      {listError && (
        <div className="mx-2 mb-2 rounded-lg bg-red-900/40 px-3 py-2 text-xs text-red-300">
          {listError}
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {loadingConversations ? (
          <SidebarSkeleton />
        ) : conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-gray-500">
            No conversations yet.
            <br />
            Start a new chat to get going.
          </div>
        ) : (
          conversations.map((conversation) => {
            const editing = editingId === conversation._id;
            return (
              <div key={conversation._id} className="mb-1">
                <div
                  onClick={() => !editing && handleSelect(conversation._id)}
                  className={`group flex w-full items-center rounded-lg px-3 py-2 text-sm ${
                    editing ? "cursor-text" : "cursor-pointer"
                  } ${
                    conversation._id === currentId
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {editing ? (
                    <input
                      ref={editInputRef}
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) =>
                        handleRenameKeyDown(event, conversation)
                      }
                      onBlur={(event) => submitRename(event, conversation)}
                      maxLength={80}
                      disabled={renamingId === conversation._id}
                      className="min-w-0 flex-1 rounded border border-blue-400 bg-gray-900 px-2 py-1 text-sm text-white outline-none ring-2 ring-blue-500/20"
                      aria-label="Conversation title"
                    />
                  ) : (
                    <span
                      className="min-w-0 flex-1 truncate"
                      onDoubleClick={(event) => beginRename(event, conversation)}
                      title={`${conversation.title} — double-click to rename`}
                    >
                      {conversation.title}
                    </span>
                  )}

                  {editing ? (
                    <div className="ml-1 flex shrink-0 items-center">
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => submitRename(event, conversation)}
                        disabled={renamingId === conversation._id}
                        className="rounded p-1 text-green-400 hover:bg-gray-600 hover:text-green-300 disabled:opacity-40"
                        aria-label="Save conversation title"
                        title="Save"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={cancelRename}
                        className="rounded p-1 text-gray-400 hover:bg-gray-600 hover:text-white"
                        aria-label="Cancel renaming"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="ml-1 flex shrink-0 items-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={(event) => beginRename(event, conversation)}
                        title="Rename conversation"
                        aria-label={`Rename ${conversation.title}`}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-600 hover:text-blue-300"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleDelete(event, conversation)}
                        title="Delete conversation"
                        aria-label={`Delete ${conversation.title}`}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-600 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {editing && renameError && (
                  <p className="px-3 pt-1 text-[11px] text-red-400" role="alert">
                    {renameError}
                  </p>
                )}
              </div>
            );
          })
        )}
      </nav>

      <div className="border-t border-gray-700 p-3">
        <div className="mb-2 px-1">
          <div className="truncate text-sm font-medium text-white">
            {user?.name ?? "Guest"}
          </div>
          {user?.email && (
            <div className="truncate text-xs text-gray-400">{user.email}</div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

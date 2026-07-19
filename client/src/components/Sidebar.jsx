import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { SidebarSkeleton } from "./Skeleton";

export default function Sidebar({ onClose }) {
  const navigate = useNavigate();

  const loadingConversations = useChatStore((s) => s.loadingConversations);
  const conversations = useChatStore((s) => s.conversations);
  const currentId = useChatStore((s) => s.currentConversationId);
  const listError = useChatStore((s) => s.listError);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const resetChat = useChatStore((s) => s.reset);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleSelect = (id) => {
    if (id !== currentId) selectConversation(id);
    onClose?.();
  };

  const handleNew = () => {
    createConversation();
    onClose?.();
  };

  const handleDelete = async (e, c) => {
    e.stopPropagation(); // don't also select the row
    const ok = window.confirm(
      `Delete "${c.title}"? Its messages and uploaded documents will be removed.`
    );
    if (!ok) return;
    try {
      await deleteConversation(c._id);
    } catch {
      window.alert("Couldn't delete the conversation. Please try again.");
    }
  };

  const handleLogout = () => {
    // Clear the httpOnly cookie server-side; ignore failures (we're leaving anyway).
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
          conversations.map((c) => (
            <div
              key={c._id}
              onClick={() => handleSelect(c._id)}
              className={`group flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-sm ${
                c._id === currentId
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              <button
                onClick={(e) => handleDelete(e, c)}
                title="Delete conversation"
                aria-label={`Delete ${c.title}`}
                className="ml-2 hidden shrink-0 text-gray-500 hover:text-red-400 group-hover:block"
              >
                🗑
              </button>
            </div>
          ))
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

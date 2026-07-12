import { useNavigate } from "react-router-dom";

import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";

export default function Sidebar({ onClose }) {
  const navigate = useNavigate();

  const conversations = useChatStore((s) => s.conversations);
  const currentId = useChatStore((s) => s.currentConversationId);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const createConversation = useChatStore((s) => s.createConversation);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleSelect = (id) => {
    selectConversation(id);
    onClose?.();
  };

  const handleNew = () => {
    createConversation();
    onClose?.();
  };

  const handleLogout = () => {
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

      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {conversations.map((c) => (
          <button
            key={c._id}
            onClick={() => handleSelect(c._id)}
            className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
              c._id === currentId
                ? "bg-gray-700 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            {c.title}
          </button>
        ))}
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

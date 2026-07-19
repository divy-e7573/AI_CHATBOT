import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { useChatStore } from "../store/chatStore";

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  // Load the user's real conversations when the chat page mounts.
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: static on desktop, slide-over drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-gray-900 text-gray-100 transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main chat area */}
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatWindow onOpenSidebar={() => setSidebarOpen(true)} />
      </main>
    </div>
  );
}

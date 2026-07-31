import { create } from "zustand";
import { persist } from "zustand/middleware";

import api from "../api/axios";

// Local id generator for optimistic messages created while streaming.
let idCounter = 0;
const nextId = () => `local-${++idCounter}`;

export const useChatStore = create(persist((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  // Provider selection belongs to a conversation, so switching chats does
  // not unexpectedly change the model selected for another conversation.
  providersByConversation: {},
  loadingConversations: false,
  loadingMessages: false,
  listError: null, // sidebar-level error (load/create failures)

  /** Load the user's conversations; auto-select the most recent one. */
  fetchConversations: async () => {
    set({ loadingConversations: true, listError: null });
    try {
      const { data } = await api.get("/conversations");
      set({ conversations: data.conversations, loadingConversations: false });
      if (!get().currentConversationId && data.conversations.length > 0) {
        get().selectConversation(data.conversations[0]._id);
      }
    } catch {
      set({
        loadingConversations: false,
        listError: "Couldn't load conversations.",
      });
    }
  },

  /** Switch to a conversation and load its messages. */
  selectConversation: async (id) => {
    set({ currentConversationId: id, messages: [], loadingMessages: true });
    try {
      const { data } = await api.get(`/conversations/${id}/messages`);
      // Ignore the response if the user already switched elsewhere.
      if (get().currentConversationId === id) {
        set({ messages: data.messages, loadingMessages: false });
      }
    } catch {
      if (get().currentConversationId === id) {
        set({
          messages: [
            {
              _id: nextId(),
              role: "assistant",
              error: true,
              content: "⚠️ Couldn't load this conversation's messages.",
            },
          ],
          loadingMessages: false,
        });
      }
    }
  },

  /** Create a conversation on the server and select it. */
  createConversation: async () => {
    set({ listError: null });
    try {
      const { data } = await api.post("/conversations", {});
      set((state) => ({
        conversations: [data.conversation, ...state.conversations],
        currentConversationId: data.conversation._id,
        messages: [],
        loadingMessages: false,
      }));
    } catch {
      set({ listError: "Couldn't create a conversation." });
    }
  },

  /** Rename a conversation and immediately reflect the server result. */
  renameConversation: async (id, title) => {
    const { data } = await api.patch(`/conversations/${id}`, { title });
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation._id === id ? data.conversation : conversation
      ),
    }));
    return data.conversation;
  },

  /** Apply a title returned with the completed first-message stream. */
  updateConversationTitle: (id, title) => {
    if (!title) return;
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation._id === id ? { ...conversation, title } : conversation
      ),
    }));
  },

  setConversationProvider: (conversationId, provider) => {
    if (!conversationId) return;
    set((state) => ({
      providersByConversation: {
        ...state.providersByConversation,
        [conversationId]: provider,
      },
    }));
  },

  /** Edit one user message and remove the now-invalid downstream branch. */
  editUserMessage: async (conversationId, messageId, content) => {
    const { data } = await api.patch(
      `/conversations/${conversationId}/messages/${messageId}`,
      { content }
    );
    const deletedIds = new Set(data.deletedMessageIds ?? []);
    set((state) => ({
      messages: state.messages
        .filter((message) => !deletedIds.has(message._id))
        .map((message) =>
          message._id === messageId ? { ...message, ...data.message } : message
        ),
    }));
    return data.message;
  },

  /** Delete a conversation (server cascades messages/documents/vectors). */
  deleteConversation: async (id) => {
    await api.delete(`/conversations/${id}`);
    set((state) => {
      const conversations = state.conversations.filter((c) => c._id !== id);
      const wasCurrent = state.currentConversationId === id;
      return {
        conversations,
        currentConversationId: wasCurrent
          ? conversations[0]?._id ?? null
          : state.currentConversationId,
      messages: wasCurrent ? [] : state.messages,
      providersByConversation: Object.fromEntries(
        Object.entries(state.providersByConversation).filter(([key]) => key !== id)
      ),
      };
    });
    // Load messages for the newly selected conversation, if any.
    const nextCurrent = get().currentConversationId;
    if (nextCurrent) get().selectConversation(nextCurrent);
  },

  /** Clear all chat state (on logout). */
  reset: () =>
    set({
      conversations: [],
      currentConversationId: null,
      messages: [],
      providersByConversation: {},
      loadingConversations: false,
      loadingMessages: false,
      listError: null,
    }),

  // --- Optimistic message helpers used by the streaming UI ---

  // Append a message; returns the (generated) id so callers can update it later.
  addMessage: (message) => {
    const _id = message._id ?? nextId();
    set((state) => ({ messages: [...state.messages, { ...message, _id }] }));
    return _id;
  },

  // Append streamed text to an existing message (typing effect).
  appendToMessage: (id, text) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === id ? { ...m, content: m.content + text } : m
      ),
    })),

  // Patch fields on a message (e.g. clear `pending`, set `error`).
  updateMessage: (id, patch) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === id ? { ...m, ...patch } : m
      ),
    })),

  /** Swap an optimistic local id for the MongoDB id returned by SSE done. */
  replaceMessageId: (id, persistedId) => {
    if (!persistedId) return;
    set((state) => ({
      messages: state.messages.map((message) =>
        message._id === id ? { ...message, _id: persistedId } : message
      ),
    }));
  },
}), {
  name: "ai-chatbot-provider-preferences",
  // Keep only model choices across refreshes; chat data is always fetched
  // fresh from the API and is cleared on logout.
  partialize: (state) => ({ providersByConversation: state.providersByConversation }),
}));

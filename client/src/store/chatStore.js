import { create } from "zustand";

// --- Dummy data (placeholder until the API is wired up) ---

const DUMMY_CONVERSATIONS = [
  { _id: "c1", title: "Project kickoff notes", updatedAt: "2026-07-10T09:00:00Z" },
  { _id: "c2", title: "RAG design questions", updatedAt: "2026-07-09T14:30:00Z" },
  { _id: "c3", title: "Untitled conversation", updatedAt: "2026-07-08T18:15:00Z" },
];

const DUMMY_MESSAGES = {
  c1: [
    { _id: "m1", role: "user", content: "Summarize the PDF I uploaded." },
    {
      _id: "m2",
      role: "assistant",
      content:
        "Here's a quick **summary** of the document:\n\n" +
        "- Introduces the project goals\n" +
        "- Lists the core milestones\n" +
        "- Notes open questions for the team\n\n" +
        "Let me know if you'd like more detail on any section.",
    },
  ],
  c2: [
    {
      _id: "m3",
      role: "user",
      content: "What chunk size should I use for embeddings?",
    },
    {
      _id: "m4",
      role: "assistant",
      content:
        "A common starting point is **~500 tokens per chunk** with a small overlap " +
        "(50–100 tokens) so context isn't lost at boundaries. Tune based on your docs.",
    },
  ],
  c3: [],
};

// Simple incrementing id generator for placeholder messages/conversations.
let idCounter = 1000;
const nextId = () => `local-${++idCounter}`;

export const useChatStore = create((set, get) => ({
  conversations: DUMMY_CONVERSATIONS,
  currentConversationId: "c1",
  messages: DUMMY_MESSAGES.c1,

  selectConversation: (id) =>
    set({
      currentConversationId: id,
      messages: DUMMY_MESSAGES[id] ?? [],
    }),

  createConversation: () => {
    const id = nextId();
    const conversation = {
      _id: id,
      title: "New conversation",
      updatedAt: new Date().toISOString(),
    };
    DUMMY_MESSAGES[id] = [];
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      currentConversationId: id,
      messages: [],
    }));
  },

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
}));

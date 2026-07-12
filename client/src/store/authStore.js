import { create } from "zustand";
import { persist } from "zustand/middleware";

// Auth state persisted to localStorage so a refresh keeps the user signed in.
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: ({ user, token }) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "ai-chatbot-auth" }
  )
);

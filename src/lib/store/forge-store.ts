// ════════════════════════════════════════════
// The Forge — Client State
// ════════════════════════════════════════════

import { create } from "zustand";
import { DEFAULT_QUICK_PROMPTS, type QuickPrompt } from "@/lib/config/forge";

export type ForgeMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: Record<string, unknown>[];
  createdAt?: string;
};

type ForgeStore = {
  // Panel state
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Conversation state
  conversationId: string | null;
  messages: ForgeMessage[];
  isStreaming: boolean;
  error: string | null;

  // Actions
  setConversationId: (id: string | null) => void;
  setMessages: (messages: ForgeMessage[]) => void;
  addMessage: (message: ForgeMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  clearConversation: () => void;

  // Quick prompts — configurable contextual suggestions
  quickPrompts: QuickPrompt[];
  setQuickPrompts: (prompts: QuickPrompt[]) => void;
};

export const useForgeStore = create<ForgeStore>((set) => ({
  // Panel
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  // Conversation
  conversationId: null,
  messages: [],
  isStreaming: false,
  error: null,

  // Actions
  setConversationId: (id) => set({ conversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  updateLastAssistantMessage: (content) =>
    set((s) => {
      const messages = [...s.messages];
      const lastIdx = messages.findLastIndex((m) => m.role === "assistant");
      if (lastIdx >= 0) {
        messages[lastIdx] = { ...messages[lastIdx], content };
      }
      return { messages };
    }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setError: (error) => set({ error }),
  clearConversation: () =>
    set({ conversationId: null, messages: [], error: null }),

  // Quick prompts — now using configurable defaults
  quickPrompts: DEFAULT_QUICK_PROMPTS,
  setQuickPrompts: (prompts) => set({ quickPrompts: prompts }),
}));

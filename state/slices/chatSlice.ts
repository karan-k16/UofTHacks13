/**
 * Chat state management slice
 * Manages conversation history, model selection, and command tracking
 */

import { StateCreator } from 'zustand';
import type { ChatMessage } from '@/lib/ai/types';

export interface ChatSlice {
  // State
  messages: ChatMessage[];
  isPending: boolean;
  selectedModel: 'gemini' | 'fallback';
  lastAICommandId: string | null;

  // Actions
  addMessage: (from: 'user' | 'agent', text: string, status?: ChatMessage['status']) => void;
  updateMessageStatus: (messageId: string, status: ChatMessage['status']) => void;
  setModel: (model: 'gemini' | 'fallback') => void;
  setPending: (isPending: boolean) => void;
  setLastCommand: (commandId: string | null) => void;
  clearHistory: () => void;
  loadChatHistory: (messages: ChatMessage[]) => void;
}

export const createChatSlice: StateCreator<
  ChatSlice,
  [],
  [],
  ChatSlice
> = (set) => ({
  // Initial state
  messages: [],
  isPending: false,
  selectedModel: 'gemini',
  lastAICommandId: null,

  // Add a new message to the chat
  addMessage: (from, text, status = 'sent') => 
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          from,
          text,
          timestamp: Date.now(),
          status,
        },
      ],
    })),

  // Update the status of an existing message
  updateMessageStatus: (messageId, status) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, status } : msg
      ),
    })),

  // Set the selected AI model
  setModel: (model) =>
    set({ selectedModel: model }),

  // Set pending state (true while waiting for AI response)
  setPending: (isPending) =>
    set({ isPending }),

  // Track the last AI command for undo functionality
  setLastCommand: (commandId) =>
    set({ lastAICommandId: commandId }),

  // Clear all chat history
  clearHistory: () =>
    set({
      messages: [],
      lastAICommandId: null,
    }),

  // Load chat history (e.g., when opening a saved project)
  loadChatHistory: (messages) =>
    set({ messages }),
});

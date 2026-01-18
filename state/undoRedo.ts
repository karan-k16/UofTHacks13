// ============================================
// Pulse Studio - Undo/Redo System
// ============================================

// This module provides utilities for the undo/redo system
// The main implementation is in store.ts using Immer patches

import { useStore } from './store';

/**
 * Hook to access undo/redo functionality
 */
export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo, history, historyIndex } = useStore();

  return {
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    historyLength: history.length,
    currentIndex: historyIndex,
  };
}

/**
 * Get the description of the next undo action
 */
export function getUndoDescription(): string | null {
  const { history, historyIndex } = useStore.getState();
  if (historyIndex >= 0 && history[historyIndex]) {
    return history[historyIndex].description;
  }
  return null;
}

/**
 * Get the description of the next redo action
 */
export function getRedoDescription(): string | null {
  const { history, historyIndex } = useStore.getState();
  if (historyIndex < history.length - 1 && history[historyIndex + 1]) {
    return history[historyIndex + 1]!.description;
  }
  return null;
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  useStore.setState({
    history: [],
    historyIndex: -1,
  });
}

/**
 * Get full history for debugging
 */
export function getHistory() {
  const { history, historyIndex } = useStore.getState();
  return {
    entries: history.map((entry, index) => ({
      index,
      description: entry.description,
      timestamp: new Date(entry.timestamp).toISOString(),
      isCurrent: index === historyIndex,
    })),
    currentIndex: historyIndex,
    totalCount: history.length,
  };
}


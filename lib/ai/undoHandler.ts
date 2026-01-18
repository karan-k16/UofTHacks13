/**
 * AI Command Undo Handler
 * Tracks AI command executions and provides undo functionality
 */

import { useStore } from '@/state/store';
import { getUndoDescription } from '@/state/undoRedo';

/**
 * Tracks an AI command execution for undo purposes
 * Call this after a successful AI command execution
 * @param commandId - Unique identifier for the command (typically the message ID)
 */
export function trackAICommand(commandId: string): void {
    useStore.getState().chat.setLastCommand(commandId);
}

/**
 * Undoes the last AI action
 * Calls the store's undo() function and updates the chat with a confirmation message
 * @returns true if undo was successful, false if there was nothing to undo
 */
export function undoLastAIAction(): boolean {
    const store = useStore.getState();

    // Check if there's a last AI command to undo
    if (!store.chat.lastAICommandId) {
        return false;
    }

    // Check if we can undo
    if (!store.canUndo()) {
        // Clear the last command ID since there's nothing to undo
        store.chat.setLastCommand(null);
        return false;
    }

    // Get the description of what we're undoing
    const undoDesc = getUndoDescription();

    // Perform the undo
    store.undo();

    // Add confirmation message to chat
    const undoMessage = undoDesc
        ? `Undone: ${undoDesc}`
        : 'Undone: Last AI action';

    store.chat.addMessage('agent', undoMessage, 'sent');

    // Clear the last AI command ID
    store.chat.setLastCommand(null);

    return true;
}

/**
 * Clears the tracked AI command without undoing
 * Useful when the user performs other actions that invalidate the undo tracking
 */
export function clearAICommandTracking(): void {
    useStore.getState().chat.setLastCommand(null);
}

/**
 * Checks if there's an AI action that can be undone
 * @returns true if an AI action can be undone
 */
export function canUndoAIAction(): boolean {
    const store = useStore.getState();
    return store.chat.lastAICommandId !== null && store.canUndo();
}

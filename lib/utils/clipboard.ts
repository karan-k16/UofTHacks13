// ============================================
// Pulse Studio - Clipboard Utilities
// ============================================

import type { Note, Clip, Pattern, Channel } from '@/domain/types';

// ============================================
// Clipboard Types
// ============================================

export type ClipboardContent =
  | { type: 'notes'; data: Note[] }
  | { type: 'clips'; data: Clip[] }
  | { type: 'pattern'; data: Pattern }
  | { type: 'channel'; data: Channel };

// ============================================
// Clipboard Store
// ============================================

class ClipboardStore {
  private content: ClipboardContent | null = null;

  copy(content: ClipboardContent): void {
    // Deep clone the content
    this.content = JSON.parse(JSON.stringify(content));
  }

  paste(): ClipboardContent | null {
    if (!this.content) return null;
    // Return a deep clone
    return JSON.parse(JSON.stringify(this.content));
  }

  hasContent(): boolean {
    return this.content !== null;
  }

  getContentType(): ClipboardContent['type'] | null {
    return this.content?.type ?? null;
  }

  clear(): void {
    this.content = null;
  }
}

// Export singleton
export const clipboard = new ClipboardStore();

// ============================================
// Copy/Paste Operations
// ============================================

export function copyNotes(notes: Note[]): void {
  clipboard.copy({ type: 'notes', data: notes });
}

export function pasteNotes(offsetTick: number = 0): Note[] | null {
  const content = clipboard.paste();
  if (!content || content.type !== 'notes') return null;

  // Find the minimum start tick
  const minTick = Math.min(...content.data.map((n) => n.startTick));

  // Offset notes and generate new IDs
  return content.data.map((note) => ({
    ...note,
    id: crypto.randomUUID(),
    startTick: note.startTick - minTick + offsetTick,
  }));
}

export function copyClips(clips: Clip[]): void {
  clipboard.copy({ type: 'clips', data: clips });
}

export function pasteClips(offsetTick: number = 0): Clip[] | null {
  const content = clipboard.paste();
  if (!content || content.type !== 'clips') return null;

  // Find the minimum start tick
  const minTick = Math.min(...content.data.map((c) => c.startTick));

  // Offset clips and generate new IDs
  return content.data.map((clip) => ({
    ...clip,
    id: crypto.randomUUID(),
    startTick: clip.startTick - minTick + offsetTick,
  }));
}

export function copyPattern(pattern: Pattern): void {
  clipboard.copy({ type: 'pattern', data: pattern });
}

export function pastePattern(): Pattern | null {
  const content = clipboard.paste();
  if (!content || content.type !== 'pattern') return null;

  return {
    ...content.data,
    id: crypto.randomUUID(),
    name: `${content.data.name} (copy)`,
    notes: content.data.notes.map((n) => ({ ...n, id: crypto.randomUUID() })),
  };
}

export function copyChannel(channel: Channel): void {
  clipboard.copy({ type: 'channel', data: channel });
}

export function pasteChannel(): Channel | null {
  const content = clipboard.paste();
  if (!content || content.type !== 'channel') return null;

  return {
    ...content.data,
    id: crypto.randomUUID(),
    name: `${content.data.name} (copy)`,
    mixerTrackId: crypto.randomUUID(), // Will need to create new mixer track
  };
}

// ============================================
// System Clipboard Integration
// ============================================

export async function copyToSystemClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function readFromSystemClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}


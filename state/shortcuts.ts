// ============================================
// Pulse Studio - Keyboard Shortcuts
// ============================================

import { useEffect, useCallback } from 'react';
import { useStore } from './store';

// ============================================
// Shortcut Types
// ============================================

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category: 'transport' | 'edit' | 'selection' | 'view' | 'file';
}

// ============================================
// Default Shortcuts Configuration
// ============================================

export function useKeyboardShortcuts() {
  const {
    play,
    stop,
    pause,
    undo,
    redo,
    canUndo,
    canRedo,
    transportState,
    toggleSnapToGrid,
    toggleMetronome,
    deleteClip,
    deleteNote,
    selection,
    clearSelection,
    setSelection,
    selectedPatternId,
    setPlaylistZoom,
    setPianoRollZoom,
    playlistZoom,
    pianoRollZoom,
    project,
    copySelection,
    cutSelection,
    paste,
  } = useStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      
      // Don't trigger shortcuts when typing in inputs
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Space: Play/Stop
      if (e.code === 'Space' && !isCtrlOrCmd) {
        e.preventDefault();
        if (transportState === 'playing') {
          pause();
        } else {
          play();
        }
        return;
      }

      // Enter: Stop and return to start
      if (e.code === 'Enter' && !isCtrlOrCmd) {
        e.preventDefault();
        stop();
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if (isCtrlOrCmd && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if (
        (isCtrlOrCmd && e.code === 'KeyZ' && e.shiftKey) ||
        (isCtrlOrCmd && e.code === 'KeyY')
      ) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
        return;
      }

      // Ctrl/Cmd + S: Save (handled by parent component)
      if (isCtrlOrCmd && e.code === 'KeyS') {
        e.preventDefault();
        // Trigger save - will be handled by subscription
        window.dispatchEvent(new CustomEvent('pulse-studio-save'));
        return;
      }

      // Delete: Delete selection
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selection && selection.ids.length > 0) {
          e.preventDefault();
          if (selection.type === 'clips') {
            selection.ids.forEach((id) => deleteClip(id));
          } else if (selection.type === 'notes' && selectedPatternId) {
            selection.ids.forEach((id) => deleteNote(selectedPatternId, id));
          }
          clearSelection();
        }
        return;
      }

      // Escape: Clear selection
      if (e.code === 'Escape') {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Ctrl/Cmd + C: Copy
      if (isCtrlOrCmd && e.code === 'KeyC') {
        e.preventDefault();
        copySelection();
        return;
      }

      // Ctrl/Cmd + X: Cut
      if (isCtrlOrCmd && e.code === 'KeyX') {
        e.preventDefault();
        cutSelection();
        return;
      }

      // Ctrl/Cmd + V: Paste
      if (isCtrlOrCmd && e.code === 'KeyV') {
        e.preventDefault();
        paste();
        return;
      }

      // Ctrl/Cmd + A: Select All
      if (isCtrlOrCmd && e.code === 'KeyA') {
        e.preventDefault();
        
        // Determine context based on focused element
        const target = e.target as HTMLElement;
        const playlistElement = target.closest('[data-panel="playlist"]');
        const pianoRollElement = target.closest('[data-panel="pianoRoll"]');
        
        if (pianoRollElement && selectedPatternId && project) {
          // Select all notes in current pattern
          const pattern = project.patterns.find((p) => p.id === selectedPatternId);
          if (pattern && pattern.notes.length > 0) {
            setSelection({ type: 'notes', ids: pattern.notes.map((n) => n.id) });
          }
        } else if (playlistElement && project) {
          // Select all clips in playlist
          if (project.playlist.clips.length > 0) {
            setSelection({ type: 'clips', ids: project.playlist.clips.map((c) => c.id) });
          }
        }
        return;
      }

      // G: Toggle snap to grid
      if (e.code === 'KeyG' && !isCtrlOrCmd) {
        e.preventDefault();
        toggleSnapToGrid();
        return;
      }

      // M: Toggle metronome
      if (e.code === 'KeyM' && !isCtrlOrCmd) {
        e.preventDefault();
        toggleMetronome();
        return;
      }

      // Ctrl/Cmd + Plus: Zoom in
      if (isCtrlOrCmd && (e.code === 'Equal' || e.code === 'NumpadAdd')) {
        e.preventDefault();
        // Will zoom whatever panel is focused
        window.dispatchEvent(new CustomEvent('pulse-studio-zoom-in'));
        return;
      }

      // Ctrl/Cmd + Minus: Zoom out
      if (isCtrlOrCmd && (e.code === 'Minus' || e.code === 'NumpadSubtract')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('pulse-studio-zoom-out'));
        return;
      }

      // Ctrl/Cmd + 0: Reset zoom
      if (isCtrlOrCmd && (e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('pulse-studio-zoom-reset'));
        return;
      }

      // ?: Show keyboard shortcuts
      if (e.code === 'Slash' && e.shiftKey && !isCtrlOrCmd) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('pulse-studio-show-shortcuts'));
        return;
      }

      // Ctrl/Cmd + N: New project
      if (isCtrlOrCmd && e.code === 'KeyN') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('pulse-studio-new-project'));
        return;
      }
    },
    [
      transportState,
      play,
      stop,
      pause,
      undo,
      redo,
      canUndo,
      canRedo,
      toggleSnapToGrid,
      toggleMetronome,
      selection,
      selectedPatternId,
      deleteClip,
      deleteNote,
      clearSelection,
      setSelection,
      project,
      copySelection,
      cutSelection,
      paste,
    ]
  );

  // Handle mouse wheel zoom (Ctrl/Cmd + wheel)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;

        // Determine which panel to zoom based on focus or target
        const target = e.target as HTMLElement;
        const playlistElement = target.closest('[data-panel="playlist"]');
        const pianoRollElement = target.closest('[data-panel="pianoRoll"]');

        if (playlistElement) {
          setPlaylistZoom(playlistZoom + delta);
        } else if (pianoRollElement) {
          setPianoRollZoom(pianoRollZoom + delta);
        }
      }
    },
    [playlistZoom, pianoRollZoom, setPlaylistZoom, setPianoRollZoom]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [handleKeyDown, handleWheel]);
}

// ============================================
// Shortcut Display Helper
// ============================================

export function formatShortcut(shortcut: Partial<Shortcut>): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  if (shortcut.alt) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }
  if (shortcut.key) {
    parts.push(shortcut.key.toUpperCase());
  }

  return parts.join('+');
}

// ============================================
// Default Shortcuts List (for display)
// ============================================

export const DEFAULT_SHORTCUTS: Array<Omit<Shortcut, 'action'>> = [
  {
    key: 'Space',
    description: 'Play/Pause',
    category: 'transport',
  },
  {
    key: 'Enter',
    description: 'Stop and return to start',
    category: 'transport',
  },
  {
    key: 'Z',
    ctrl: true,
    description: 'Undo',
    category: 'edit',
  },
  {
    key: 'Z',
    ctrl: true,
    shift: true,
    description: 'Redo',
    category: 'edit',
  },
  {
    key: 'Y',
    ctrl: true,
    description: 'Redo',
    category: 'edit',
  },
  {
    key: 'S',
    ctrl: true,
    description: 'Save project',
    category: 'file',
  },
  {
    key: 'E',
    ctrl: true,
    description: 'Export audio',
    category: 'file',
  },
  {
    key: 'C',
    ctrl: true,
    description: 'Copy selection',
    category: 'edit',
  },
  {
    key: 'X',
    ctrl: true,
    description: 'Cut selection',
    category: 'edit',
  },
  {
    key: 'V',
    ctrl: true,
    description: 'Paste',
    category: 'edit',
  },
  {
    key: 'Delete',
    description: 'Delete selection',
    category: 'edit',
  },
  {
    key: 'A',
    ctrl: true,
    description: 'Select all',
    category: 'selection',
  },
  {
    key: 'Escape',
    description: 'Clear selection',
    category: 'selection',
  },
  {
    key: 'G',
    description: 'Toggle snap to grid',
    category: 'view',
  },
  {
    key: 'M',
    description: 'Toggle metronome',
    category: 'transport',
  },
  {
    key: 'Scroll',
    ctrl: true,
    description: 'Zoom timeline',
    category: 'view',
  },
];


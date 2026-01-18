// ============================================
// Pulse Studio - UI Slice Types
// ============================================

import type { PanelId, UUID } from '@/domain/types';

export interface UISlice {
  focusedPanel: PanelId | null;
  playlistZoom: number;
  pianoRollZoom: number;
  snapToGrid: boolean;
  gridSize: number;
  selectedPatternId: UUID | null;
  selectedChannelId: UUID | null;

  // Actions
  setFocusedPanel: (panel: PanelId | null) => void;
  setPlaylistZoom: (zoom: number) => void;
  setPianoRollZoom: (zoom: number) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
}


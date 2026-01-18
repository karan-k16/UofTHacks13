// ============================================
// Pulse Studio - Transport Slice Types
// ============================================

import type { TransportState } from '@/domain/types';

export interface TransportSlice {
  transportState: TransportState;
  position: number;
  isRecording: boolean;
  metronomeEnabled: boolean;

  // Actions
  play: () => void;
  stop: () => void;
  pause: () => void;
  setPosition: (position: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleMetronome: () => void;
}


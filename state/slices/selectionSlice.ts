// ============================================
// Pulse Studio - Selection Slice Types
// ============================================

import type { Selection } from '@/domain/types';

export interface SelectionSlice {
  selection: Selection | null;

  // Actions
  setSelection: (selection: Selection | null) => void;
  clearSelection: () => void;
}


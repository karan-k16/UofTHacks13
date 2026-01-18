// ============================================
// Pulse Studio - Project Slice Types
// ============================================

// This file defines the types for the project slice
// The actual implementation is in store.ts (using a unified store approach)

import type { Project, UUID } from '@/domain/types';

export interface ProjectSlice {
  project: Project | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;

  // Actions
  loadProject: (project: Project) => void;
  createNewProject: (name: string, ownerId: UUID) => void;
  loadDemoProject: (ownerId: UUID) => void;
  updateProjectName: (name: string) => void;
  setBpm: (bpm: number) => void;
  markSaved: () => void;
}


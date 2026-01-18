// ============================================
// Pulse Studio - Global State Store
// ============================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enablePatches, produceWithPatches, applyPatches, type Patch } from 'immer';
import type {
  Project,
  Pattern,
  Channel,
  Clip,
  AudioClip,
  Note,
  StepEvent,
  MixerTrack,
  InsertEffect,
  Send,
  PlaylistTrack,
  TransportState,
  Selection,
  PanelId,
  UUID,
  EffectType,
  ChannelType,
} from '@/domain/types';
import {
  createProject,
  createPattern,
  createChannel,
  createNote,
  createStepEvent,
  createPatternClip,
  createPlaylistTrack,
  createMixerTrack,
  createInsertEffect,
  createSend,
  duplicatePattern,
  duplicateClip,
  duplicateNote,
  moveClip,
  resizeClip,
  splitClip,
  moveNote,
  resizeNote,
  quantizeNotes,
  createDemoProject,
  getSampleColor,
} from '@/domain/operations';
import { createChatSlice, type ChatSlice } from './slices/chatSlice';
import type { ChatMessage } from '@/lib/ai/types';

// Enable Immer patches for undo/redo
enablePatches();

// ============================================
// Helper Functions
// ============================================

// Helper function to get synth preset settings
function getSynthPresetSettingsFromStore(preset: string): Partial<import('@/domain/types').SynthSettings> {
  const PRESETS: Record<string, Partial<import('@/domain/types').SynthSettings>> = {
    piano: { oscillatorType: 'sine', attack: 0.005, decay: 0.1, sustain: 0.3, release: 1.0, filterCutoff: 3000, filterResonance: 1 },
    electricPiano: { oscillatorType: 'triangle', attack: 0.002, decay: 0.3, sustain: 0.2, release: 0.5, filterCutoff: 2500, filterResonance: 1.5 },
    organ: { oscillatorType: 'sine', attack: 0.001, decay: 0.01, sustain: 0.9, release: 0.05, filterCutoff: 4000, filterResonance: 0.5 },
    harpsichord: { oscillatorType: 'sawtooth', attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.2, filterCutoff: 3500, filterResonance: 2 },
    lead: { oscillatorType: 'square', attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2, filterCutoff: 3000, filterResonance: 2 },
    brightLead: { oscillatorType: 'sawtooth', attack: 0.005, decay: 0.05, sustain: 0.8, release: 0.1, filterCutoff: 5000, filterResonance: 3 },
    bass: { oscillatorType: 'sawtooth', attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2, filterCutoff: 800, filterResonance: 3 },
    subBass: { oscillatorType: 'sine', attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3, filterCutoff: 400, filterResonance: 1 },
    acidBass: { oscillatorType: 'square', attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.1, filterCutoff: 1200, filterResonance: 8 },
    pad: { oscillatorType: 'sine', attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.0, filterCutoff: 1500, filterResonance: 0.5 },
    warmPad: { oscillatorType: 'triangle', attack: 0.8, decay: 0.3, sustain: 0.9, release: 1.5, filterCutoff: 1200, filterResonance: 0.3 },
    stringPad: { oscillatorType: 'sawtooth', attack: 0.3, decay: 0.4, sustain: 0.85, release: 0.8, filterCutoff: 2000, filterResonance: 1 },
    strings: { oscillatorType: 'sawtooth', attack: 0.2, decay: 0.3, sustain: 0.8, release: 0.6, filterCutoff: 2500, filterResonance: 1.2 },
    violin: { oscillatorType: 'sawtooth', attack: 0.15, decay: 0.2, sustain: 0.7, release: 0.4, filterCutoff: 3000, filterResonance: 1.5 },
    cello: { oscillatorType: 'sawtooth', attack: 0.12, decay: 0.25, sustain: 0.75, release: 0.5, filterCutoff: 1800, filterResonance: 1.3 },
    brass: { oscillatorType: 'sawtooth', attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.3, filterCutoff: 2200, filterResonance: 2 },
    trumpet: { oscillatorType: 'square', attack: 0.03, decay: 0.15, sustain: 0.8, release: 0.2, filterCutoff: 2800, filterResonance: 2.5 },
    trombone: { oscillatorType: 'sawtooth', attack: 0.08, decay: 0.2, sustain: 0.75, release: 0.35, filterCutoff: 1500, filterResonance: 1.8 },
    bell: { oscillatorType: 'sine', attack: 0.001, decay: 1.0, sustain: 0.3, release: 1.5, filterCutoff: 4500, filterResonance: 2 },
    glockenspiel: { oscillatorType: 'triangle', attack: 0.001, decay: 0.5, sustain: 0.1, release: 0.8, filterCutoff: 6000, filterResonance: 1.5 },
    marimba: { oscillatorType: 'sine', attack: 0.001, decay: 0.4, sustain: 0.2, release: 0.6, filterCutoff: 2500, filterResonance: 1 },
    pluck: { oscillatorType: 'triangle', attack: 0.001, decay: 0.4, sustain: 0, release: 0.1, filterCutoff: 4000, filterResonance: 1 },
    guitar: { oscillatorType: 'triangle', attack: 0.001, decay: 0.5, sustain: 0.3, release: 0.4, filterCutoff: 3000, filterResonance: 1.2 },
    harp: { oscillatorType: 'sine', attack: 0.001, decay: 0.8, sustain: 0.2, release: 1.0, filterCutoff: 4000, filterResonance: 0.8 },
    atmosphericPad: { oscillatorType: 'sine', attack: 1.0, decay: 0.5, sustain: 0.9, release: 2.0, filterCutoff: 1000, filterResonance: 0.3 },
    metallic: { oscillatorType: 'square', attack: 0.001, decay: 0.6, sustain: 0.2, release: 0.8, filterCutoff: 5000, filterResonance: 5 },
  };
  
  const selectedPreset = PRESETS[preset];
  return selectedPreset !== undefined ? selectedPreset : PRESETS.default!;
}

// ============================================
// History State for Undo/Redo
// ============================================

interface HistoryEntry {
  patches: Patch[];
  inversePatches: Patch[];
  description: string;
  timestamp: number;
}

// ============================================
// Store State Interface
// ============================================

interface RecordingState {
  isRecording: boolean;
  isPreparing: boolean;
  inputDeviceId: string | null;
  inputLevel: number;
  countInBars: number;
  countInRemaining: number;
  recordingStartPosition: number;
}

interface StoreState {
  // Project State
  project: Project | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // in milliseconds

  // Transport State
  transportState: TransportState;
  position: number;
  isRecording: boolean;
  metronomeEnabled: boolean;

  // Recording State
  recording: RecordingState;

  // UI State
  focusedPanel: PanelId | null;
  playlistZoom: number;
  pianoRollZoom: number;
  snapToGrid: boolean;
  gridSize: number;
  selectedPatternId: UUID | null;
  selectedChannelId: UUID | null;

  // Piano Roll Modal State
  pianoRollModal: {
    isOpen: boolean;
    patternId: UUID | null;
  };

  // Selection State
  selection: Selection | null;

  // Clipboard State
  clipboard: {
    type: 'clips' | 'notes' | null;
    data: (Clip | Note)[];
  };

  // History (Undo/Redo)
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;

  // Chat State (AI Agent)
  chat: ChatSlice;

  // Actions
  // Project Actions
  loadProject: (project: Project) => void;
  createNewProject: (name: string, ownerId: UUID) => void;
  loadDemoProject: (ownerId: UUID) => void;
  updateProjectName: (name: string) => void;
  setBpm: (bpm: number) => void;
  markSaved: () => void;

  // Pattern Actions
  addPattern: (name?: string) => void;
  deletePattern: (id: UUID) => void;
  duplicatePatternAction: (id: UUID) => void;
  updatePattern: (id: UUID, updates: Partial<Pattern>) => void;
  selectPattern: (id: UUID | null) => void;
  setPatternLength: (id: UUID, lengthInSteps: number) => void;

  // Step Sequencer Actions
  toggleStep: (patternId: UUID, channelId: UUID, step: number, velocity?: number) => void;
  clearPatternSteps: (patternId: UUID) => void;

  // Note Actions (Piano Roll)
  addNote: (patternId: UUID, note: Omit<Note, 'id'>) => string | undefined;
  deleteNote: (patternId: UUID, noteId: UUID) => void;
  updateNote: (patternId: UUID, noteId: UUID, updates: Partial<Note>) => void;
  moveNotes: (patternId: UUID, noteIds: UUID[], deltaPitch: number, deltaTick: number) => void;
  resizeNotes: (patternId: UUID, noteIds: UUID[], newDuration: number) => void;
  quantizeSelectedNotes: (patternId: UUID, noteIds: UUID[], gridSize: number) => void;

  // Channel Actions
  addChannel: (name: string, type: ChannelType, preset?: string) => void;
  deleteChannel: (id: UUID) => void;
  updateChannel: (id: UUID, updates: Partial<Channel>) => void;
  selectChannel: (id: UUID | null) => void;
  setChannelVolume: (id: UUID, volume: number) => void;
  setChannelPan: (id: UUID, pan: number) => void;
  toggleChannelMute: (id: UUID) => void;
  toggleChannelSolo: (id: UUID) => void;

  // Playlist Actions
  addPlaylistTrack: (name?: string) => number | null;
  deletePlaylistTrack: (id: UUID) => void;
  updatePlaylistTrack: (id: UUID, updates: Partial<PlaylistTrack>) => void;
  togglePlaylistTrackMute: (id: UUID) => void;
  togglePlaylistTrackSolo: (id: UUID) => void;
  addClip: (clip: Omit<Clip, 'id'>) => void;
  deleteClip: (id: UUID) => void;
  moveClipAction: (id: UUID, deltaX: number, deltaY: number) => void;
  resizeClipAction: (id: UUID, newDuration: number) => void;
  updateClipAction: (id: UUID, updates: Partial<Clip>) => void;
  duplicateClipAction: (id: UUID) => void;
  splitClipAction: (id: UUID, splitTick: number) => void;
  setClipColor: (id: UUID, color: string) => void;
  toggleClipMute: (id: UUID) => void;
  setLoopRegion: (start: number, end: number) => void;
  setLoopCount: (count: number) => void;
  toggleLoop: () => void;
  // Atomic action to prevent race conditions when dropping samples
  addAudioSampleToNewTrack: (assetId: UUID, name: string, startTick: number, durationTick: number) => Promise<void>;

  // Mixer Actions
  addMixerTrack: (name?: string) => void;
  deleteMixerTrack: (id: UUID) => void;
  updateMixerTrack: (id: UUID, updates: Partial<MixerTrack>) => void;
  setMixerTrackVolume: (id: UUID, volume: number) => void;
  setMixerTrackPan: (id: UUID, pan: number) => void;
  toggleMixerTrackMute: (id: UUID) => void;
  toggleMixerTrackSolo: (id: UUID) => void;
  addInsertEffect: (trackId: UUID, effectType: EffectType) => void;
  removeInsertEffect: (trackId: UUID, effectId: UUID) => void;
  updateInsertEffect: (trackId: UUID, effectId: UUID, updates: Partial<InsertEffect>) => void;
  reorderInsertEffect: (trackId: UUID, effectId: UUID, direction: 'up' | 'down') => void;
  addSend: (fromTrackId: UUID, toTrackId: UUID, gain?: number) => void;
  removeSend: (sendId: UUID) => void;
  updateSend: (sendId: UUID, updates: Partial<Send>) => void;
  setMasterVolume: (volume: number) => void;

  // Transport Actions
  play: () => void;
  stop: () => void;
  pause: () => void;
  setPosition: (position: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleMetronome: () => void;

  // Recording Workflow Actions
  recordAudio: (countInBars?: number, deviceId?: string) => Promise<void>;
  finishRecording: () => Promise<UUID | undefined>;
  cancelRecording: () => Promise<void>;

  // Recording Actions
  setRecordingInputDevice: (deviceId: string | null) => void;
  setRecordingInputLevel: (level: number) => void;
  setCountInBars: (bars: number) => void;
  prepareRecording: () => void;
  startCountIn: () => void;
  tickCountIn: () => void;
  finalizeRecording: (audioBlob: Blob, duration: number) => Promise<void>;

  // Autosave Actions
  enableAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (intervalMs: number) => void;
  triggerAutoSave: () => Promise<void>;

  // UI Actions
  setFocusedPanel: (panel: PanelId | null) => void;
  setPlaylistZoom: (zoom: number) => void;
  setPianoRollZoom: (zoom: number) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;

  // Piano Roll Modal Actions
  openPianoRoll: (patternId: UUID) => void;
  closePianoRoll: () => void;

  // Selection Actions
  setSelection: (selection: Selection | null) => void;
  clearSelection: () => void;

  // Clipboard Actions
  copySelection: () => void;
  cutSelection: () => void;
  paste: () => void;

  // Asset Management Actions
  addAudioAsset: (file: File) => Promise<void>;
  deleteAudioAsset: (id: UUID) => void;
  getAudioAssetData: (id: UUID) => string | null;
  addAudioAssetFromUrl: (asset: {
    name: string;
    fileName: string;
    storageUrl: string;
    duration?: number;
    format?: string;
  }) => UUID;

  // History Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// ============================================
// Create Store
// ============================================

// In-memory storage for audio asset data (base64 encoded)
const audioAssetDataStore = new Map<string, string>();

export const useStore = create<StoreState>()(
  subscribeWithSelector(
    immer((set, get) => {
      // Helper to record history
      const recordHistory = (description: string, recipe: (draft: StoreState) => void) => {
        const state = get();
        const [nextState, patches, inversePatches] = produceWithPatches(state, recipe);

        if (patches.length > 0) {
          set((draft) => {
            // Apply the changes
            Object.assign(draft, nextState);

            // Record history
            const newEntry: HistoryEntry = {
              patches,
              inversePatches,
              description,
              timestamp: Date.now(),
            };

            // Remove any redo history
            draft.history = draft.history.slice(0, draft.historyIndex + 1);
            draft.history.push(newEntry);

            // Limit history size
            if (draft.history.length > draft.maxHistorySize) {
              draft.history.shift();
            } else {
              draft.historyIndex++;
            }

            draft.hasUnsavedChanges = true;
          });
        }
      };

      const clampAudioClipPlacement = (clip: Clip, clips: Clip[], excludeId?: UUID): Clip => {
        if (clip.type !== 'audio') return clip;

        const durationTick = Math.max(1, clip.durationTick);
        const otherClips = clips
          .filter((c) => c.type === 'audio' && c.trackIndex === clip.trackIndex && c.id !== excludeId)
          .sort((a, b) => a.startTick - b.startTick);

        let startTick = Math.max(0, clip.startTick);

        for (const other of otherClips) {
          const otherStart = other.startTick;
          const otherEnd = other.startTick + other.durationTick;

          if (startTick + durationTick <= otherStart) {
            break;
          }

          if (startTick >= otherEnd) {
            continue;
          }

          startTick = otherEnd;
        }

        return {
          ...clip,
          startTick,
          durationTick,
        };
      };

      const clampAudioClipDuration = (clip: Clip, clips: Clip[], newDuration: number): Clip => {
        if (clip.type !== 'audio') {
          return resizeClip(clip, newDuration);
        }

        const otherClips = clips
          .filter((c) => c.type === 'audio' && c.trackIndex === clip.trackIndex && c.id !== clip.id)
          .sort((a, b) => a.startTick - b.startTick);

        let durationTick = Math.max(1, newDuration);
        const nextClip = otherClips.find((c) => c.startTick >= clip.startTick);

        if (nextClip && clip.startTick + durationTick > nextClip.startTick) {
          durationTick = Math.max(1, nextClip.startTick - clip.startTick);
        }

        return {
          ...clip,
          durationTick,
        };
      };

      return {
        // Initial State
        project: null,
        isLoading: false,
        hasUnsavedChanges: false,
        lastSavedAt: null,
        autoSaveEnabled: false,
        autoSaveInterval: 60000, // 60 seconds

        transportState: 'stopped',
        position: 0,
        isRecording: false,
        metronomeEnabled: false,

        // Recording State
        recording: {
          isRecording: false,
          isPreparing: false,
          inputDeviceId: null,
          inputLevel: 0,
          countInBars: 1,
          countInRemaining: 0,
          recordingStartPosition: 0,
        },

        focusedPanel: null,
        playlistZoom: 1,
        pianoRollZoom: 1,
        snapToGrid: true,
        gridSize: 24, // Quarter of a beat
        selectedPatternId: null,
        selectedChannelId: null,

        pianoRollModal: {
          isOpen: false,
          patternId: null,
        },

        selection: null,

        clipboard: {
          type: null,
          data: [],
        },

        history: [],
        historyIndex: -1,
        maxHistorySize: 100,

        // Chat State (AI Agent)
        chat: {
          messages: [],
          isPending: false,
          selectedModel: 'gemini',
          lastAICommandId: null,
          addMessage: (from, text, status = 'sent') => {
            set((state) => {
              state.chat.messages.push({
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                from,
                text,
                timestamp: Date.now(),
                status,
              });
            });
          },
          updateMessageStatus: (messageId, status) => {
            set((state) => {
              const msg = state.chat.messages.find((m) => m.id === messageId);
              if (msg) msg.status = status;
            });
          },
          setModel: (model) => {
            set((state) => {
              state.chat.selectedModel = model;
            });
          },
          setPending: (isPending) => {
            set((state) => {
              state.chat.isPending = isPending;
            });
          },
          setLastCommand: (commandId) => {
            set((state) => {
              state.chat.lastAICommandId = commandId;
            });
          },
          clearHistory: () => {
            set((state) => {
              state.chat.messages = [];
              state.chat.lastAICommandId = null;
            });
          },
          loadChatHistory: (messages: ChatMessage[]) => {
            set((state) => {
              state.chat.messages = messages;
            });
          },
        },

        // ==========================================
        // Project Actions
        // ==========================================

        loadProject: (project) => {
          set((state) => {
            state.project = project;
            state.selectedPatternId = project.selectedPatternId;
            state.hasUnsavedChanges = false;
            state.history = [];
            state.historyIndex = -1;
          });
        },

        createNewProject: (name, ownerId) => {
          const project = createProject(name, ownerId);
          set((state) => {
            state.project = project;
            state.selectedPatternId = project.selectedPatternId;
            state.hasUnsavedChanges = false;
            state.history = [];
            state.historyIndex = -1;
          });
        },

        loadDemoProject: (ownerId) => {
          const project = createDemoProject(ownerId);
          set((state) => {
            state.project = project;
            state.selectedPatternId = project.selectedPatternId;
            state.hasUnsavedChanges = false;
            state.history = [];
            state.historyIndex = -1;
          });
        },

        updateProjectName: (name) => {
          recordHistory('Update project name', (draft) => {
            if (draft.project) {
              draft.project.name = name;
              draft.project.updatedAt = new Date().toISOString();
            }
          });
        },

        setBpm: (bpm) => {
          recordHistory('Change BPM', (draft) => {
            if (draft.project) {
              draft.project.bpm = Math.max(20, Math.min(999, bpm));
              draft.project.updatedAt = new Date().toISOString();
            }
          });
        },

        markSaved: () => {
          set((state) => {
            state.hasUnsavedChanges = false;
            state.lastSavedAt = new Date().toISOString();
          });
        },

        // ==========================================
        // Pattern Actions
        // ==========================================

        addPattern: (name) => {
          recordHistory('Add pattern', (draft) => {
            if (draft.project) {
              const pattern = createPattern(name || `Pattern ${draft.project.patterns.length + 1}`);
              draft.project.patterns.push(pattern);
              draft.selectedPatternId = pattern.id;
              draft.project.updatedAt = new Date().toISOString();
            }
          });
        },

        deletePattern: (id) => {
          recordHistory('Delete pattern', (draft) => {
            if (draft.project) {
              const index = draft.project.patterns.findIndex((p) => p.id === id);
              if (index !== -1) {
                draft.project.patterns.splice(index, 1);
                // Remove clips referencing this pattern
                draft.project.playlist.clips = draft.project.playlist.clips.filter(
                  (c) => c.type !== 'pattern' || c.patternId !== id
                );
                // Update selection
                if (draft.selectedPatternId === id) {
                  draft.selectedPatternId = draft.project.patterns[0]?.id ?? null;
                }
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        duplicatePatternAction: (id) => {
          recordHistory('Duplicate pattern', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === id);
              if (pattern) {
                const newPattern = duplicatePattern(pattern);
                draft.project.patterns.push(newPattern);
                draft.selectedPatternId = newPattern.id;
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        updatePattern: (id, updates) => {
          recordHistory('Update pattern', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === id);
              if (pattern) {
                Object.assign(pattern, updates);
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        selectPattern: (id) => {
          set((state) => {
            state.selectedPatternId = id;
          });
        },

        setPatternLength: (id, lengthInSteps) => {
          recordHistory('Change pattern length', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === id);
              if (pattern) {
                pattern.lengthInSteps = Math.max(1, lengthInSteps);
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        // ==========================================
        // Step Sequencer Actions
        // ==========================================

        toggleStep: (patternId, channelId, step, velocity = 100) => {
          recordHistory('Toggle step', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === patternId);
              if (pattern) {
                const existingIndex = pattern.stepEvents.findIndex(
                  (e) => e.channelId === channelId && e.step === step
                );
                if (existingIndex !== -1) {
                  pattern.stepEvents.splice(existingIndex, 1);
                } else {
                  pattern.stepEvents.push(createStepEvent(channelId, step, velocity));
                }
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        clearPatternSteps: (patternId) => {
          recordHistory('Clear pattern steps', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === patternId);
              if (pattern) {
                pattern.stepEvents = [];
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        // ==========================================
        // Note Actions (Piano Roll)
        // ==========================================

        addNote: (patternId, note) => {
          let newNoteId: string | undefined;
          recordHistory('Add note', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === patternId);
              if (pattern) {
                const newNote = createNote(note.pitch, note.startTick, note.durationTick, note.velocity);
                pattern.notes.push(newNote);
                newNoteId = newNote.id;
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
          return newNoteId;
        },

        deleteNote: (patternId, noteId) => {
          recordHistory('Delete note', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === patternId);
              if (pattern) {
                const index = pattern.notes.findIndex((n) => n.id === noteId);
                if (index !== -1) {
                  pattern.notes.splice(index, 1);
                  draft.project.updatedAt = new Date().toISOString();
                }
              }
            }
          });
        },

        updateNote: (patternId, noteId, updates) => {
          recordHistory('Update note', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === patternId);
              if (pattern) {
                const note = pattern.notes.find((n) => n.id === noteId);
                if (note) {
                  Object.assign(note, updates);
                  draft.project.updatedAt = new Date().toISOString();
                }
              }
            }
          });
        },

        moveNotes: (patternId, noteIds, deltaPitch, deltaTick) => {
          recordHistory('Move notes', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === patternId);
              if (pattern) {
                pattern.notes = pattern.notes.map((note) =>
                  noteIds.includes(note.id) ? moveNote(note, deltaPitch, deltaTick) : note
                );
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        resizeNotes: (patternId, noteIds, newDuration) => {
          recordHistory('Resize notes', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === patternId);
              if (pattern) {
                pattern.notes = pattern.notes.map((note) =>
                  noteIds.includes(note.id) ? resizeNote(note, newDuration) : note
                );
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        quantizeSelectedNotes: (patternId, noteIds, gridSize) => {
          recordHistory('Quantize notes', (draft) => {
            if (draft.project) {
              const pattern = draft.project.patterns.find((p) => p.id === patternId);
              if (pattern) {
                const notesToQuantize = pattern.notes.filter((n) => noteIds.includes(n.id));
                const quantized = quantizeNotes(notesToQuantize, gridSize);
                pattern.notes = pattern.notes.map((note) => {
                  const q = quantized.find((qn) => qn.id === note.id);
                  return q || note;
                });
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        // ==========================================
        // Channel Actions
        // ==========================================

        addChannel: (name, type, preset) => {
          recordHistory('Add channel', (draft) => {
            if (draft.project) {
              // Create a new mixer track for this channel
              const mixerTrack = createMixerTrack(
                name,
                draft.project.mixer.tracks.length
              );
              draft.project.mixer.tracks.push(mixerTrack);

              const channel = createChannel(name, type, undefined, mixerTrack.id, preset);
              draft.project.channels.push(channel);
              draft.selectedChannelId = channel.id;
              draft.project.updatedAt = new Date().toISOString();
            }
          });
        },

        deleteChannel: (id) => {
          recordHistory('Delete channel', (draft) => {
            if (draft.project) {
              const index = draft.project.channels.findIndex((c) => c.id === id);
              if (index !== -1) {
                draft.project.channels.splice(index, 1);
                // Remove step events for this channel
                draft.project.patterns.forEach((pattern) => {
                  pattern.stepEvents = pattern.stepEvents.filter((e) => e.channelId !== id);
                });
                if (draft.selectedChannelId === id) {
                  draft.selectedChannelId = draft.project.channels[0]?.id ?? null;
                }
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        updateChannel: (id, updates) => {
          recordHistory('Update channel', (draft) => {
            if (draft.project) {
              const channel = draft.project.channels.find((c) => c.id === id);
              if (channel) {
                // If preset is being updated, update the synthSettings
                if (updates.preset && channel.type === 'synth') {
                  // Import preset settings
                  const presetSettings = getSynthPresetSettingsFromStore(updates.preset);
                  channel.synthSettings = {
                    oscillatorType: presetSettings.oscillatorType || 'sawtooth',
                    attack: presetSettings.attack ?? 0.01,
                    decay: presetSettings.decay ?? 0.2,
                    sustain: presetSettings.sustain ?? 0.5,
                    release: presetSettings.release ?? 0.3,
                    filterCutoff: presetSettings.filterCutoff ?? 2000,
                    filterResonance: presetSettings.filterResonance ?? 1,
                  };
                }

                Object.assign(channel, updates);
                draft.project.updatedAt = new Date().toISOString();

                // Notify audio engine to reload the instrument
                if (typeof window !== 'undefined') {
                  // Capture the project data before the async operation
                  const projectSnapshot = JSON.parse(JSON.stringify(draft.project));
                  import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
                    const engine = getAudioEngine();
                    // Reload project to update instrument
                    engine.loadProject(projectSnapshot);
                  });
                }
              }
            }
          });
        },

        selectChannel: (id) => {
          set((state) => {
            state.selectedChannelId = id;
          });
        },

        setChannelVolume: (id, volume) => {
          set((state) => {
            if (state.project) {
              const channel = state.project.channels.find((c) => c.id === id);
              if (channel) {
                const newVolume = Math.max(0, Math.min(1, volume));
                channel.volume = newVolume;

                // Update audio engine
                if (typeof window !== 'undefined') {
                  import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
                    const engine = getAudioEngine();
                    engine.setChannelVolume(id, newVolume);
                  });
                }
              }
            }
          });
        },

        setChannelPan: (id, pan) => {
          set((state) => {
            if (state.project) {
              const channel = state.project.channels.find((c) => c.id === id);
              if (channel) {
                const newPan = Math.max(-1, Math.min(1, pan));
                channel.pan = newPan;

                // Update audio engine
                if (typeof window !== 'undefined') {
                  import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
                    const engine = getAudioEngine();
                    engine.setChannelPan(id, newPan);
                  });
                }
              }
            }
          });
        },

        toggleChannelMute: (id) => {
          recordHistory('Toggle channel mute', (draft) => {
            if (draft.project) {
              const channel = draft.project.channels.find((c) => c.id === id);
              if (channel) {
                channel.mute = !channel.mute;
                const newMuteState = channel.mute;

                // Update audio engine
                if (typeof window !== 'undefined') {
                  import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
                    const engine = getAudioEngine();
                    engine.setChannelMute(id, newMuteState);
                  });
                }
              }
            }
          });
        },

        toggleChannelSolo: (id) => {
          recordHistory('Toggle channel solo', (draft) => {
            if (draft.project) {
              const channel = draft.project.channels.find((c) => c.id === id);
              if (channel) {
                channel.solo = !channel.solo;
              }
            }
          });
        },

        // ==========================================
        // Playlist Actions
        // ==========================================

        addPlaylistTrack: (name) => {
          let newIndex: number | null = null;

          recordHistory('Add playlist track', (draft) => {
            if (draft.project) {
              const trackIndex = draft.project.playlist.tracks.length;
              const track = createPlaylistTrack(
                name || `Track ${trackIndex + 1}`,
                trackIndex
              );
              draft.project.playlist.tracks.push(track);
              draft.project.updatedAt = new Date().toISOString();
              newIndex = trackIndex;
            }
          });

          return newIndex;
        },

        deletePlaylistTrack: (id) => {
          recordHistory('Delete playlist track', (draft) => {
            if (draft.project) {
              const index = draft.project.playlist.tracks.findIndex((t) => t.id === id);
              if (index !== -1) {
                draft.project.playlist.tracks.splice(index, 1);
                // Remove clips on this track and shift others
                draft.project.playlist.clips = draft.project.playlist.clips.filter(
                  (c) => c.trackIndex !== index
                );
                draft.project.playlist.clips.forEach((clip) => {
                  if (clip.trackIndex > index) {
                    clip.trackIndex--;
                  }
                });
                // Re-index tracks
                draft.project.playlist.tracks.forEach((track, i) => {
                  track.index = i;
                });
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        updatePlaylistTrack: (id, updates) => {
          recordHistory('Update playlist track', (draft) => {
            if (draft.project) {
              const track = draft.project.playlist.tracks.find((t) => t.id === id);
              if (track) {
                Object.assign(track, updates);
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        togglePlaylistTrackMute: (id) => {
          recordHistory('Toggle playlist track mute', (draft) => {
            if (draft.project) {
              const track = draft.project.playlist.tracks.find((t) => t.id === id);
              if (track) {
                track.mute = !track.mute;
              }
            }
          });
          // Refresh playback to apply mute state
          import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
            const engine = getAudioEngine();
            if (engine) engine.refreshPlayback();
          });
        },

        togglePlaylistTrackSolo: (id) => {
          recordHistory('Toggle playlist track solo', (draft) => {
            if (draft.project) {
              const track = draft.project.playlist.tracks.find((t) => t.id === id);
              if (track) {
                track.solo = !track.solo;
              }
            }
          });
          // Refresh playback to apply solo state
          import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
            const engine = getAudioEngine();
            if (engine) engine.refreshPlayback();
          });
        },

        addClip: (clipData) => {
          recordHistory('Add clip', (draft) => {
            if (draft.project) {
              // Clamp trackIndex to valid range
              const maxTrackIndex = Math.max(0, draft.project.playlist.tracks.length - 1);
              const clampedTrackIndex = Math.max(0, Math.min(clipData.trackIndex, maxTrackIndex));

              console.log('[Store] addClip called:', {
                inputTrackIndex: clipData.trackIndex,
                maxTrackIndex,
                clampedTrackIndex,
                tracksLength: draft.project.playlist.tracks.length
              });

              const clip = clipData.type === 'pattern'
                ? createPatternClip(
                  (clipData as Omit<Clip, 'id'> & { patternId: string }).patternId,
                  clampedTrackIndex,
                  clipData.startTick,
                  clipData.durationTick,
                  clipData.color
                )
                : {
                  ...clipData,
                  id: crypto.randomUUID(),
                  trackIndex: clampedTrackIndex,
                } as Clip;

              const resolvedClip = clampAudioClipPlacement(
                clip,
                draft.project.playlist.clips
              );

              console.log('[Store] Created clip:', {
                id: resolvedClip.id,
                finalTrackIndex: resolvedClip.trackIndex,
                startTick: resolvedClip.startTick
              });

              draft.project.playlist.clips.push(resolvedClip);
              draft.project.updatedAt = new Date().toISOString();
            }
          });
        },

        deleteClip: (id) => {
          recordHistory('Delete clip', (draft) => {
            if (draft.project) {
              const index = draft.project.playlist.clips.findIndex((c) => c.id === id);
              if (index !== -1) {
                draft.project.playlist.clips.splice(index, 1);
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        moveClipAction: (id, deltaX, deltaY) => {
          recordHistory('Move clip', (draft) => {
            if (draft.project) {
              const index = draft.project.playlist.clips.findIndex((c) => c.id === id);
              if (index !== -1) {
                const clip = draft.project.playlist.clips[index];
                if (clip) {
                  // Clamp trackIndex to valid range (0 to tracks.length - 1)
                  const maxTrackIndex = Math.max(0, draft.project.playlist.tracks.length - 1);
                  const moved = moveClip(clip, deltaX, deltaY, maxTrackIndex);
                  const resolved = clampAudioClipPlacement(
                    moved,
                    draft.project.playlist.clips,
                    clip.id
                  );
                  draft.project.playlist.clips[index] = resolved;
                  draft.project.updatedAt = new Date().toISOString();
                }
              }
            }
          });
        },

        resizeClipAction: (id, newDuration) => {
          recordHistory('Resize clip', (draft) => {
            if (draft.project) {
              const index = draft.project.playlist.clips.findIndex((c) => c.id === id);
              if (index !== -1) {
                const clip = draft.project.playlist.clips[index];
                if (clip) {
                  draft.project.playlist.clips[index] = clampAudioClipDuration(
                    clip,
                    draft.project.playlist.clips,
                    newDuration
                  );
                  draft.project.updatedAt = new Date().toISOString();
                }
              }
            }
          });
        },

        updateClipAction: (id, updates) => {
          recordHistory('Update clip', (draft) => {
            if (draft.project) {
              const clip = draft.project.playlist.clips.find((c) => c.id === id);
              if (clip) {
                Object.assign(clip, updates);
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        duplicateClipAction: (id) => {
          recordHistory('Duplicate clip', (draft) => {
            if (draft.project) {
              const clip = draft.project.playlist.clips.find((c) => c.id === id);
              if (clip) {
                draft.project.playlist.clips.push(duplicateClip(clip));
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        splitClipAction: (id, splitTick) => {
          recordHistory('Split clip', (draft) => {
            if (draft.project) {
              const clipIndex = draft.project.playlist.clips.findIndex((c) => c.id === id);
              if (clipIndex !== -1) {
                const clip = draft.project.playlist.clips[clipIndex];
                if (clip) {
                  const result = splitClip(clip, splitTick);
                  if (result) {
                    const [firstClip, secondClip] = result;
                    // Replace original with first clip, add second clip
                    draft.project.playlist.clips[clipIndex] = firstClip;
                    draft.project.playlist.clips.push(secondClip);
                    draft.project.updatedAt = new Date().toISOString();
                  }
                }
              }
            }
          });
        },

        setClipColor: (id, color) => {
          recordHistory('Change clip color', (draft) => {
            if (draft.project) {
              const clip = draft.project.playlist.clips.find((c) => c.id === id);
              if (clip) {
                clip.color = color;
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        toggleClipMute: (id) => {
          recordHistory('Toggle clip mute', (draft) => {
            if (draft.project) {
              const clip = draft.project.playlist.clips.find((c) => c.id === id);
              if (clip) {
                clip.mute = !clip.mute;
              }
            }
          });
        },

        setLoopRegion: (start, end) => {
          set((state) => {
            if (state.project) {
              state.project.playlist.loopStart = start;
              state.project.playlist.loopEnd = end;
            }
          });
        },

        setLoopCount: (count: number) => {
          set((state) => {
            if (state.project) {
              state.project.playlist.loopCount = Math.max(0, count);
            }
          });
        },

        toggleLoop: () => {
          set((state) => {
            if (state.project) {
              state.project.playlist.loopEnabled = !state.project.playlist.loopEnabled;
            }
          });
        },

        addAudioSampleToNewTrack: async (assetId, name, startTick, durationTick) => {
          console.log('[Store] addAudioSampleToNewTrack called', { assetId, name });
          recordHistory('Add audio sample to new track', (draft) => {
            if (draft.project) {
              // Vital: Ensure tracks array is clean and indices are correct before we append
              // This fixes any potential sparsity or index mismatch issues
              draft.project.playlist.tracks = draft.project.playlist.tracks.filter(t => t); // Remove nulls
              draft.project.playlist.tracks.forEach((track, i) => {
                track.index = i;
              });

              // 1. Add the new track
              const trackIndex = draft.project.playlist.tracks.length;
              const track = createPlaylistTrack(
                name || `Audio ${trackIndex + 1}`,
                trackIndex
              );
              draft.project.playlist.tracks.push(track);

              // 2. Add the clip to that specific track index
              const clip: Clip = {
                id: crypto.randomUUID(),
                type: 'audio',
                assetId,
                trackIndex: trackIndex, // Guaranteed correct index
                startTick: Math.max(0, startTick),
                durationTick: Math.max(1, durationTick),
                offset: 0,
                color: getSampleColor(name || assetId),
                mute: false,
                gain: 1,
                pitch: 0,
              };

              // 3. Clamp (though unlikely to overlap on a new track, good practice)
              // We skip filtering for this specific clip to avoid self-reference or confusion,
              // but standard clamp is fine.
              const resolvedClip = clampAudioClipPlacement(
                clip,
                draft.project.playlist.clips
              );

              draft.project.playlist.clips.push(resolvedClip);
              draft.project.updatedAt = new Date().toISOString();
            }
          });
        },

        // ==========================================
        // Mixer Actions
        // ==========================================

        addMixerTrack: (name) => {
          recordHistory('Add mixer track', (draft) => {
            if (draft.project) {
              const track = createMixerTrack(
                name || `Track ${draft.project.mixer.tracks.length}`,
                draft.project.mixer.tracks.length
              );
              draft.project.mixer.tracks.push(track);
              draft.project.updatedAt = new Date().toISOString();
            }
          });
        },

        deleteMixerTrack: (id) => {
          recordHistory('Delete mixer track', (draft) => {
            if (draft.project) {
              // Don't delete master track (index 0)
              const track = draft.project.mixer.tracks.find((t) => t.id === id);
              if (track && track.index !== 0) {
                const index = draft.project.mixer.tracks.findIndex((t) => t.id === id);
                draft.project.mixer.tracks.splice(index, 1);
                // Remove related sends
                draft.project.mixer.sends = draft.project.mixer.sends.filter(
                  (s) => s.fromTrackId !== id && s.toTrackId !== id
                );
                // Re-index tracks
                draft.project.mixer.tracks.forEach((t, i) => {
                  t.index = i;
                });
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        updateMixerTrack: (id, updates) => {
          recordHistory('Update mixer track', (draft) => {
            if (draft.project) {
              const track = draft.project.mixer.tracks.find((t) => t.id === id);
              if (track) {
                Object.assign(track, updates);
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        setMixerTrackVolume: (id, volume) => {
          set((state) => {
            if (state.project) {
              const track = state.project.mixer.tracks.find((t) => t.id === id);
              if (track) {
                track.volume = Math.max(0, Math.min(1.5, volume));
                state.project.updatedAt = new Date().toISOString();

                // Update audio engine
                if (typeof window !== 'undefined') {
                  const newVolume = track.volume; // Capture value before async operation
                  import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
                    const engine = getAudioEngine();
                    engine.setMixerTrackVolume(id, newVolume);
                  });
                }
              }
            }
          });
        },

        setMixerTrackPan: (id, pan) => {
          set((state) => {
            if (state.project) {
              const track = state.project.mixer.tracks.find((t) => t.id === id);
              if (track) {
                track.pan = Math.max(-1, Math.min(1, pan));
                state.project.updatedAt = new Date().toISOString();

                // Update audio engine
                if (typeof window !== 'undefined') {
                  const newPan = track.pan; // Capture value before async operation
                  import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
                    const engine = getAudioEngine();
                    engine.setMixerTrackPan(id, newPan);
                  });
                }
              }
            }
          });
        },

        toggleMixerTrackMute: (id) => {
          recordHistory('Toggle mixer track mute', (draft) => {
            if (draft.project) {
              const track = draft.project.mixer.tracks.find((t) => t.id === id);
              if (track) {
                track.mute = !track.mute;

                // Update audio engine
                if (typeof window !== 'undefined') {
                  const newMuteState = track.mute; // Capture value before async operation
                  import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
                    const engine = getAudioEngine();
                    engine.setMixerTrackMute(id, newMuteState);
                  });
                }
              }
            }
          });
        },

        toggleMixerTrackSolo: (id) => {
          recordHistory('Toggle mixer track solo', (draft) => {
            if (draft.project) {
              const track = draft.project.mixer.tracks.find((t) => t.id === id);
              if (track) {
                track.solo = !track.solo;
              }
            }
          });
        },

        addInsertEffect: (trackId, effectType) => {
          recordHistory('Add insert effect', (draft) => {
            if (draft.project) {
              const track = draft.project.mixer.tracks.find((t) => t.id === trackId);
              if (track) {
                const effect = createInsertEffect(effectType);
                track.inserts.push(effect);
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        removeInsertEffect: (trackId, effectId) => {
          recordHistory('Remove insert effect', (draft) => {
            if (draft.project) {
              const track = draft.project.mixer.tracks.find((t) => t.id === trackId);
              if (track) {
                const index = track.inserts.findIndex((e) => e.id === effectId);
                if (index !== -1) {
                  track.inserts.splice(index, 1);
                  draft.project.updatedAt = new Date().toISOString();
                }
              }
            }
          });
        },

        updateInsertEffect: (trackId, effectId, updates) => {
          recordHistory('Update insert effect', (draft) => {
            if (draft.project) {
              const track = draft.project.mixer.tracks.find((t) => t.id === trackId);
              if (track) {
                const effect = track.inserts.find((e) => e.id === effectId);
                if (effect) {
                  Object.assign(effect, updates);
                  draft.project.updatedAt = new Date().toISOString();
                }
              }
            }
          });
        },

        reorderInsertEffect: (trackId, effectId, direction) => {
          recordHistory('Reorder insert effect', (draft) => {
            if (draft.project) {
              const track = draft.project.mixer.tracks.find((t) => t.id === trackId);
              if (track) {
                const currentIndex = track.inserts.findIndex((e) => e.id === effectId);
                if (currentIndex === -1) return;

                const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

                // Check bounds
                if (newIndex < 0 || newIndex >= track.inserts.length) return;

                // Swap the effects
                const currentEffect = track.inserts[currentIndex];
                const swapEffect = track.inserts[newIndex];
                if (currentEffect && swapEffect) {
                  track.inserts[currentIndex] = swapEffect;
                  track.inserts[newIndex] = currentEffect;
                }

                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        addSend: (fromTrackId, toTrackId, gain = 0.5) => {
          recordHistory('Add send', (draft) => {
            if (draft.project) {
              const send = createSend(fromTrackId, toTrackId, gain);
              draft.project.mixer.sends.push(send);
              draft.project.updatedAt = new Date().toISOString();
            }
          });
        },

        removeSend: (sendId) => {
          recordHistory('Remove send', (draft) => {
            if (draft.project) {
              const index = draft.project.mixer.sends.findIndex((s) => s.id === sendId);
              if (index !== -1) {
                draft.project.mixer.sends.splice(index, 1);
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        updateSend: (sendId, updates) => {
          recordHistory('Update send', (draft) => {
            if (draft.project) {
              const send = draft.project.mixer.sends.find((s) => s.id === sendId);
              if (send) {
                Object.assign(send, updates);
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        setMasterVolume: (volume) => {
          set((state) => {
            if (state.project) {
              const newMasterVolume = Math.max(0, Math.min(1.5, volume));
              state.project.mixer.masterVolume = newMasterVolume;
              state.project.updatedAt = new Date().toISOString();

              // Sync with audio engine
              if (typeof window !== 'undefined') {
                import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
                  const engine = getAudioEngine();
                  engine.setMasterVolume?.(newMasterVolume);
                });
              }
            }
          });
        },

        // ==========================================
        // Transport Actions
        // ==========================================

        play: () => {
          set((state) => {
            state.transportState = 'playing';
          });
        },

        stop: () => {
          set((state) => {
            state.transportState = 'stopped';
            state.position = 0;
            state.isRecording = false;
          });
        },

        pause: () => {
          set((state) => {
            state.transportState = 'paused';
          });
        },

        setPosition: (position) => {
          set((state) => {
            state.position = Math.max(0, position);
          });
        },

        startRecording: () => {
          set((state) => {
            state.transportState = 'recording';
            state.isRecording = true;
          });
        },

        stopRecording: () => {
          set((state) => {
            state.transportState = 'stopped';
            state.isRecording = false;
          });
        },

        toggleMetronome: () => {
          set((state) => {
            state.metronomeEnabled = !state.metronomeEnabled;
          });

          // Sync with audio engine
          import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
            const engine = getAudioEngine();
            engine.setMetronomeEnabled(get().metronomeEnabled);
          });
        },

        // ==========================================
        // Recording Actions
        // ==========================================

        setRecordingInputDevice: (deviceId) => {
          set((state) => {
            state.recording.inputDeviceId = deviceId;
          });
        },

        setRecordingInputLevel: (level) => {
          set((state) => {
            state.recording.inputLevel = level;
          });
        },

        setCountInBars: (bars) => {
          set((state) => {
            state.recording.countInBars = Math.max(0, Math.min(4, bars));
          });
        },

        prepareRecording: () => {
          set((state) => {
            state.recording.isPreparing = true;
            state.recording.recordingStartPosition = state.position;
          });
        },

        startCountIn: () => {
          const state = get();
          set((draft) => {
            draft.recording.countInRemaining = draft.recording.countInBars;
            draft.transportState = 'playing';
          });
        },

        tickCountIn: () => {
          set((state) => {
            if (state.recording.countInRemaining > 0) {
              state.recording.countInRemaining--;
              if (state.recording.countInRemaining === 0) {
                state.recording.isRecording = true;
                state.recording.isPreparing = false;
                state.transportState = 'recording';
                state.isRecording = true;
              }
            }
          });
        },

        finalizeRecording: async (audioBlob: Blob, duration: number) => {
          const state = get();
          if (!state.project) return;

          try {
            // Upload the recorded audio
            const { apiClient } = await import('@/lib/api/client');
            const fileName = `recording_${Date.now()}.wav`;

            const asset = await apiClient.uploadAsset(
              state.project.id,
              audioBlob,
              fileName
            );

            // Calculate duration in ticks
            const bpm = state.project.bpm;
            const ppq = state.project.ppq;
            const beatsPerSecond = bpm / 60;
            const ticksPerSecond = beatsPerSecond * ppq;
            const durationTick = Math.round(duration * ticksPerSecond);

            // Add asset to project and create audio clip
            set((draft) => {
              if (!draft.project) return;

              // Add asset
              draft.project.assets.push(asset);

              // Find or create a track for the recording
              const tracks = draft.project.playlist.tracks;
              let targetTrackIndex = 0;

              if (tracks.length === 0) {
                const newTrack = createPlaylistTrack('Recording', 0);
                draft.project.playlist.tracks.push(newTrack);
              } else {
                // Find the first available track
                targetTrackIndex = (tracks && tracks.length > 0 && tracks[0]) ? tracks[0].index : 0;
              }

              // Create audio clip
              const audioClip: AudioClip = {
                id: crypto.randomUUID(),
                type: 'audio',
                assetId: asset.id,
                trackIndex: targetTrackIndex,
                startTick: state.recording.recordingStartPosition,
                durationTick,
                offset: 0,
                color: '#ff6b6b',
                mute: false,
                gain: 1.0,
                pitch: 0,
              };

              draft.project.playlist.clips.push(audioClip);
              draft.project.updatedAt = new Date().toISOString();
              draft.hasUnsavedChanges = true;

              // Reset recording state
              draft.recording.isRecording = false;
              draft.recording.isPreparing = false;
              draft.transportState = 'stopped';
              draft.isRecording = false;
            });
          } catch (error) {
            console.error('Failed to finalize recording:', error);
            // Reset recording state on error
            set((state) => {
              state.recording.isRecording = false;
              state.recording.isPreparing = false;
              state.transportState = 'stopped';
              state.isRecording = false;
            });
          }
        },

        cancelRecording: async () => {
          set((state) => {
            state.recording.isRecording = false;
            state.recording.isPreparing = false;
            state.recording.countInRemaining = 0;
            state.transportState = 'stopped';
            state.isRecording = false;
          });
        },

        // ==========================================
        // Autosave Actions
        // ==========================================

        enableAutoSave: (enabled) => {
          set((state) => {
            state.autoSaveEnabled = enabled;
          });
        },

        setAutoSaveInterval: (intervalMs) => {
          set((state) => {
            state.autoSaveInterval = Math.max(10000, intervalMs); // Min 10 seconds
          });
        },

        triggerAutoSave: async () => {
          const state = get();

          if (!state.project || !state.hasUnsavedChanges) {
            return;
          }

          try {
            const { apiClient } = await import('@/lib/api/client');
            await apiClient.saveProject(state.project);

            set((draft) => {
              draft.hasUnsavedChanges = false;
              draft.lastSavedAt = new Date().toISOString();
            });
          } catch (error) {
            console.error('Autosave failed:', error);
          }
        },

        // ==========================================
        // UI Actions
        // ==========================================

        setFocusedPanel: (panel) => {
          set((state) => {
            state.focusedPanel = panel;
          });
        },

        setPlaylistZoom: (zoom) => {
          set((state) => {
            state.playlistZoom = Math.max(0.1, Math.min(4, zoom));
          });
        },

        setPianoRollZoom: (zoom) => {
          set((state) => {
            state.pianoRollZoom = Math.max(0.1, Math.min(4, zoom));
          });
        },

        toggleSnapToGrid: () => {
          set((state) => {
            state.snapToGrid = !state.snapToGrid;
          });
        },

        setGridSize: (size) => {
          set((state) => {
            state.gridSize = size;
          });
        },

        // ==========================================
        // Piano Roll Modal Actions
        // ==========================================

        openPianoRoll: (patternId) => {
          set((state) => {
            state.pianoRollModal.isOpen = true;
            state.pianoRollModal.patternId = patternId;
            state.selectedPatternId = patternId;
          });
        },

        closePianoRoll: () => {
          set((state) => {
            state.pianoRollModal.isOpen = false;
            state.pianoRollModal.patternId = null;
          });
        },

        // ==========================================
        // Selection Actions
        // ==========================================

        setSelection: (selection) => {
          set((state) => {
            state.selection = selection;
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selection = null;
          });
        },

        // ==========================================
        // Clipboard Actions
        // ==========================================

        copySelection: () => {
          const state = get();
          if (!state.selection || !state.project) return;

          if (state.selection.type === 'clips') {
            const clipsToCopy = state.project.playlist.clips.filter(c =>
              state.selection?.ids.includes(c.id)
            );
            set((draft) => {
              draft.clipboard = {
                type: 'clips',
                data: clipsToCopy,
              };
            });
          } else if (state.selection.type === 'notes' && state.selectedPatternId) {
            const pattern = state.project.patterns.find(p => p.id === state.selectedPatternId);
            if (pattern) {
              const notesToCopy = pattern.notes.filter(n =>
                state.selection?.ids.includes(n.id)
              );
              set((draft) => {
                draft.clipboard = {
                  type: 'notes',
                  data: notesToCopy,
                };
              });
            }
          }
        },

        cutSelection: () => {
          const state = get();
          if (!state.selection || !state.project) return;

          // Copy first
          get().copySelection();

          // Then delete
          recordHistory('Cut', (draft) => {
            if (!draft.project || !draft.selection) return;

            if (draft.selection.type === 'clips') {
              draft.project.playlist.clips = draft.project.playlist.clips.filter(
                c => !draft.selection?.ids.includes(c.id)
              );
            } else if (draft.selection.type === 'notes' && draft.selectedPatternId) {
              const pattern = draft.project.patterns.find(p => p.id === draft.selectedPatternId);
              if (pattern) {
                pattern.notes = pattern.notes.filter(
                  n => !draft.selection?.ids.includes(n.id)
                );
              }
            }

            draft.selection = null;
          });
        },

        paste: () => {
          const state = get();
          if (!state.clipboard.data.length || !state.project) return;

          if (state.clipboard.type === 'clips') {
            recordHistory('Paste clips', (draft) => {
              if (!draft.project) return;

              const clips = state.clipboard.data as Clip[];
              const newClips: Clip[] = [];

              // Find the earliest start tick in the copied clips
              const minStartTick = Math.min(...clips.map(c => c.startTick));

              // Paste at current position or offset from original
              const currentPosition = draft.position || 0;
              const offsetTick = currentPosition;

              clips.forEach((clip) => {
                const relativeStart = clip.startTick - minStartTick;
                const newClip = duplicateClip(clip, 0);
                newClip.startTick = offsetTick + relativeStart;
                newClips.push(newClip);
              });

              draft.project.playlist.clips.push(...newClips);
              draft.project.updatedAt = new Date().toISOString();

              // Select the pasted clips
              draft.selection = {
                type: 'clips',
                ids: newClips.map(c => c.id),
              };
            });
          } else if (state.clipboard.type === 'notes' && state.selectedPatternId) {
            recordHistory('Paste notes', (draft) => {
              if (!draft.project || !draft.selectedPatternId) return;

              const pattern = draft.project.patterns.find(p => p.id === draft.selectedPatternId);
              if (!pattern) return;

              const notes = state.clipboard.data as Note[];
              const newNotes: Note[] = [];

              // Find the earliest start tick in the copied notes
              const minStartTick = Math.min(...notes.map(n => n.startTick));

              // Paste at current position or offset from original
              const currentPosition = draft.position || 0;
              const offsetTick = currentPosition;

              notes.forEach((note) => {
                const relativeStart = note.startTick - minStartTick;
                const newNote = duplicateNote(note, 0);
                newNote.startTick = offsetTick + relativeStart;
                newNotes.push(newNote);
              });

              pattern.notes.push(...newNotes);
              draft.project.updatedAt = new Date().toISOString();

              // Select the pasted notes
              draft.selection = {
                type: 'notes',
                ids: newNotes.map(n => n.id),
              };
            });
          }
        },

        // ==========================================
        // Asset Management Actions
        // ==========================================

        addAudioAsset: async (file: File) => {
          try {
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Decode audio to get metadata
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

            // Convert to base64 for storage
            const reader = new FileReader();
            reader.readAsDataURL(new Blob([arrayBuffer]));

            return new Promise<void>((resolve, reject) => {
              reader.onload = () => {
                const base64 = reader.result as string;
                const assetId = crypto.randomUUID();

                // Store audio data
                audioAssetDataStore.set(assetId, base64);

                // Add asset metadata to project
                recordHistory('Add audio asset', (draft) => {
                  if (draft.project) {
                    draft.project.assets.push({
                      id: assetId,
                      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                      fileName: file.name,
                      storageUrl: base64, // In production, this would be a cloud URL
                      duration: audioBuffer.duration,
                      sampleRate: audioBuffer.sampleRate,
                      channels: audioBuffer.numberOfChannels,
                      format: file.type,
                      size: file.size,
                      createdAt: new Date().toISOString(),
                    });
                    draft.project.updatedAt = new Date().toISOString();
                  }
                });

                resolve();
              };

              reader.onerror = () => reject(new Error('Failed to read file'));
            });
          } catch (error) {
            console.error('Failed to load audio asset:', error);
            throw error;
          }
        },

        deleteAudioAsset: (id: UUID) => {
          recordHistory('Delete audio asset', (draft) => {
            if (draft.project) {
              const index = draft.project.assets.findIndex((a) => a.id === id);
              if (index !== -1) {
                draft.project.assets.splice(index, 1);
                draft.project.updatedAt = new Date().toISOString();
              }
            }
          });

          // Remove from data store
          audioAssetDataStore.delete(id);
        },

        getAudioAssetData: (id: UUID) => {
          return audioAssetDataStore.get(id) || null;
        },

        addAudioAssetFromUrl: ({ name, fileName, storageUrl, duration, format }) => {
          // Check if asset already exists with this URL
          const state = get();
          const existingAsset = state.project?.assets.find(
            (a) => a.storageUrl === storageUrl
          );
          if (existingAsset) {
            return existingAsset.id;
          }

          const assetId = crypto.randomUUID();
          recordHistory('Add audio asset (url)', (draft) => {
            if (draft.project) {
              draft.project.assets.push({
                id: assetId,
                name,
                fileName,
                storageUrl,
                duration: duration ?? 0,
                sampleRate: 44100,
                channels: 1,
                format: format ?? 'audio/mpeg',
                size: 0,
                createdAt: new Date().toISOString(),
              });
              draft.project.updatedAt = new Date().toISOString();
            }
          });
          return assetId;
        },

        // ==========================================
        // Recording Workflow
        // ==========================================

        /**
         * Complete recording workflow: record audio, create asset, and add clip to playlist
         * @param countInBars - Number of bars to count in before recording
         * @param deviceId - Optional audio input device ID
         */
        recordAudio: async (countInBars: number = 1, deviceId?: string) => {
          const state = get();
          if (!state.project) {
            throw new Error('No project loaded');
          }

          try {
            // Import audio engine dynamically
            const { getAudioEngine } = await import('@/lib/audio/AudioEngine');
            const engine = getAudioEngine();

            // Start recording (includes count-in)
            await engine.startRecording(countInBars, deviceId);

            // Update state
            state.startRecording();

            console.log('[Store] Recording started');
          } catch (error) {
            console.error('[Store] Failed to start recording:', error);
            throw error;
          }
        },

        /**
         * Stop recording and create audio clip at current position
         */
        finishRecording: async () => {
          const state = get();
          if (!state.project || !state.isRecording) {
            return;
          }

          try {
            // Import audio engine dynamically
            const { getAudioEngine } = await import('@/lib/audio/AudioEngine');
            const engine = getAudioEngine();

            // Stop recording and get result
            const result = await engine.stopRecording();

            // Update state
            state.stopRecording();

            // Convert blob to base64 for storage
            const reader = new FileReader();
            reader.readAsDataURL(result.blob);

            return new Promise<UUID>((resolve, reject) => {
              reader.onload = () => {
                const base64 = reader.result as string;
                const assetId = crypto.randomUUID();
                const clipId = crypto.randomUUID();

                // Store audio data
                audioAssetDataStore.set(assetId, base64);

                // Calculate position for the clip (where recording started)
                const recordingStartPosition = state.position;
                const durationTicks = Math.round(
                  (result.duration / 60) * state.project!.bpm * state.project!.ppq
                );

                recordHistory('Add recorded audio', (draft) => {
                  if (draft.project) {
                    // Add asset
                    draft.project.assets.push({
                      id: assetId,
                      name: `Recording ${new Date().toLocaleTimeString()}`,
                      fileName: `recording_${Date.now()}.wav`,
                      storageUrl: base64,
                      duration: result.duration,
                      sampleRate: result.sampleRate,
                      channels: 1,
                      format: 'audio/wav',
                      size: result.blob.size,
                      createdAt: new Date().toISOString(),
                    });

                    // Create audio clip on first playlist track
                    if (draft.project.playlist.tracks.length === 0) {
                      draft.project.playlist.tracks.push(
                        createPlaylistTrack('Recording', 0)
                      );
                    }

                    draft.project.playlist.clips.push({
                      id: clipId,
                      type: 'audio',
                      trackIndex: 0,
                      startTick: recordingStartPosition,
                      durationTick: durationTicks,
                      assetId,
                      mute: false,
                      gain: 1.0,
                      offset: 0,
                      color: '#3b82f6',
                      pitch: 0,
                    });

                    draft.project.updatedAt = new Date().toISOString();
                  }
                });

                console.log('[Store] Recorded audio added as clip:', assetId);
                resolve(clipId);
              };

              reader.onerror = () => reject(new Error('Failed to process recording'));
            });
          } catch (error) {
            console.error('[Store] Failed to finish recording:', error);
            get().stopRecording();
            throw error;
          }
        },

        // ==========================================
        // History Actions (Undo/Redo)
        // ==========================================

        undo: () => {
          const state = get();
          if (state.historyIndex >= 0) {
            const entry = state.history[state.historyIndex];
            if (entry) {
              set((draft) => {
                applyPatches(draft, entry.inversePatches);
                draft.historyIndex--;
                draft.hasUnsavedChanges = true;
              });
            }
          }
        },

        redo: () => {
          const state = get();
          if (state.historyIndex < state.history.length - 1) {
            const entry = state.history[state.historyIndex + 1];
            if (entry) {
              set((draft) => {
                applyPatches(draft, entry.patches);
                draft.historyIndex++;
                draft.hasUnsavedChanges = true;
              });
            }
          }
        },

        canUndo: () => {
          return get().historyIndex >= 0;
        },

        canRedo: () => {
          const state = get();
          return state.historyIndex < state.history.length - 1;
        },
      };
    })
  )
);

// Export selectors for common data
export const selectProject = (state: StoreState) => state.project;
export const selectPatterns = (state: StoreState) => state.project?.patterns ?? [];
export const selectChannels = (state: StoreState) => state.project?.channels ?? [];
export const selectSelectedPattern = (state: StoreState) => {
  if (!state.project || !state.selectedPatternId) return null;
  return state.project.patterns.find((p) => p.id === state.selectedPatternId) ?? null;
};
export const selectMixer = (state: StoreState) => state.project?.mixer ?? null;
export const selectPlaylist = (state: StoreState) => state.project?.playlist ?? null;
export const selectTransportState = (state: StoreState) => state.transportState;
export const selectPosition = (state: StoreState) => state.position;
export const selectBpm = (state: StoreState) => state.project?.bpm ?? 120;


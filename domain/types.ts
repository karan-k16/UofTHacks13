// ============================================
// Pulse Studio - Domain Types
// ============================================

export type UUID = string;

// ============================================
// Time & Music Units
// ============================================

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface MusicalTime {
  bar: number;
  beat: number;
  tick: number;
}

// PPQ = Pulses Per Quarter note (ticks per beat)
export const DEFAULT_PPQ = 96;
export const DEFAULT_BPM = 120;
export const DEFAULT_STEPS_PER_BEAT = 4;

// ============================================
// Notes & MIDI
// ============================================

export interface Note {
  id: UUID;
  pitch: number; // MIDI note number 0-127
  startTick: number;
  durationTick: number;
  velocity: number; // 0-127
  pan?: number; // -1 to 1 (optional)
  finePitch?: number; // cents deviation (optional)
}

export interface StepEvent {
  channelId: UUID;
  step: number;
  velocity: number; // 0-127, 0 = off
  pitch?: number; // Override for sampler note
}

// ============================================
// Patterns
// ============================================

export interface Pattern {
  id: UUID;
  name: string;
  color: string;
  lengthInSteps: number;
  stepsPerBeat: number;
  // Step sequencer events (for channel rack)
  stepEvents: StepEvent[];
  // Piano roll notes (for melodic editing)
  notes: Note[];
}

// ============================================
// Channels (Instruments)
// ============================================

export type ChannelType = 'sampler' | 'synth';

export interface SamplerSettings {
  sampleUrl: string;
  rootNote: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface SynthSettings {
  oscillatorType: 'sine' | 'square' | 'sawtooth' | 'triangle';
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterCutoff: number;
  filterResonance: number;
}

export interface Channel {
  id: UUID;
  name: string;
  type: ChannelType;
  color: string;
  volume: number; // 0-1
  pan: number; // -1 to 1
  mute: boolean;
  solo: boolean;
  mixerTrackId: UUID;
  preset?: string; // Synth preset name (e.g., 'piano', 'bass', 'strings')
  samplerSettings?: SamplerSettings;
  synthSettings?: SynthSettings;
}

// ============================================
// Playlist
// ============================================

export type ClipType = 'pattern' | 'audio';

export interface PatternClip {
  id: UUID;
  type: 'pattern';
  patternId: UUID;
  trackIndex: number;
  startTick: number;
  durationTick: number;
  offset: number; // Start offset within pattern
  color: string;
  mute: boolean;
}

export interface AudioClip {
  id: UUID;
  type: 'audio';
  assetId: UUID;
  trackIndex: number;
  startTick: number;
  durationTick: number;
  offset: number; // Start offset in samples
  color: string;
  mute: boolean;
  gain: number; // Clip gain 0-2
  pitch: number; // Semitone shift
}

export type Clip = PatternClip | AudioClip;

export interface PlaylistTrack {
  id: UUID;
  name: string;
  index: number;
  height: number;
  color: string;
  mute: boolean;
  solo: boolean;
  locked: boolean;
}

export interface Playlist {
  tracks: PlaylistTrack[];
  clips: Clip[];
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
  loopCount: number; // 0 = infinite, >0 = loop that many times
}

// ============================================
// Mixer
// ============================================

export type EffectType = 'eq' | 'compressor' | 'reverb' | 'delay';

export interface EQParams {
  lowGain: number;
  midGain: number;
  highGain: number;
  lowFreq: number;
  highFreq: number;
}

export interface CompressorParams {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  makeupGain: number;
}

export interface ReverbParams {
  decay: number;
  preDelay: number;
  wet: number;
}

export interface DelayParams {
  time: number;
  feedback: number;
  wet: number;
}

export type EffectParams = EQParams | CompressorParams | ReverbParams | DelayParams;

export interface InsertEffect {
  id: UUID;
  type: EffectType;
  enabled: boolean;
  params: EffectParams;
}

export interface Send {
  id: UUID;
  fromTrackId: UUID;
  toTrackId: UUID;
  gain: number;
  preFader: boolean;
}

export interface MixerTrack {
  id: UUID;
  name: string;
  index: number;
  volume: number; // 0-1.5 (allow boost)
  pan: number;
  mute: boolean;
  solo: boolean;
  inserts: InsertEffect[];
  color: string;
}

export interface Mixer {
  tracks: MixerTrack[];
  sends: Send[];
  masterVolume: number;
}

// ============================================
// Assets
// ============================================

export interface AudioAsset {
  id: UUID;
  name: string;
  fileName: string;
  storageUrl: string;
  duration: number; // in seconds
  sampleRate: number;
  channels: number;
  format: string;
  size: number; // bytes
  createdAt: string;
}

// ============================================
// Project
// ============================================

export interface Project {
  id: UUID;
  ownerId: UUID;
  name: string;
  bpm: number;
  ppq: number;
  timeSignature: TimeSignature;
  patterns: Pattern[];
  channels: Channel[];
  playlist: Playlist;
  mixer: Mixer;
  assets: AudioAsset[];
  selectedPatternId: UUID | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Transport State
// ============================================

export type TransportState = 'stopped' | 'playing' | 'recording' | 'paused';

export interface Transport {
  state: TransportState;
  position: number; // Current position in ticks
  bpm: number;
  metronomeEnabled: boolean;
  countInEnabled: boolean;
}

// ============================================
// Selection
// ============================================

export interface Selection {
  type: 'notes' | 'clips' | 'channels' | 'mixerTracks';
  ids: UUID[];
}

// ============================================
// Automation
// ============================================

export interface AutomationPoint {
  tick: number;
  value: number;
  curve: 'linear' | 'smooth' | 'step';
}

export interface AutomationLane {
  id: UUID;
  targetType: 'channel' | 'mixerTrack' | 'effect';
  targetId: UUID;
  parameter: string;
  points: AutomationPoint[];
}

// ============================================
// API Types
// ============================================

export interface ProjectSummary {
  id: UUID;
  name: string;
  bpm: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface RenderResult {
  wavUrl: string;
  mp3Url: string;
  duration: number;
}

// ============================================
// UI State Types
// ============================================

export type PanelId = 'browser' | 'channelRack' | 'playlist' | 'pianoRoll' | 'mixer';

export interface PanelState {
  isOpen: boolean;
  isDetached: boolean;
}

export interface UIState {
  focusedPanel: PanelId | null;
  panels: Record<PanelId, PanelState>;
  playlistZoom: number;
  pianoRollZoom: number;
  snapToGrid: boolean;
  gridSize: number; // in steps
  theme: 'dark';
}

// ============================================
// Undo/Redo
// ============================================

export interface HistoryEntry {
  id: UUID;
  timestamp: number;
  description: string;
  patch: unknown; // Immer patch
  inversePatch: unknown;
}


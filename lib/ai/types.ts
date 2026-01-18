/**
 * Type definitions for AI chat agent commands and responses
 */

// Base command interface
export interface BaseCommand {
  action: string;
}

// Pattern commands
export interface AddPatternCommand extends BaseCommand {
  action: 'addPattern';
  name?: string;
  lengthInSteps?: number;
}

export interface SetPatternLengthCommand extends BaseCommand {
  action: 'setPatternLength';
  patternId: string;
  lengthInSteps: number;
}

export interface DeletePatternCommand extends BaseCommand {
  action: 'deletePattern';
  patternId: string;
}

export interface SelectPatternCommand extends BaseCommand {
  action: 'selectPattern';
  patternId: string;
}

export interface OpenPianoRollCommand extends BaseCommand {
  action: 'openPianoRoll';
  patternId: string;
}

// Note commands
export interface AddNoteCommand extends BaseCommand {
  action: 'addNote';
  patternId: string;
  pitch: number;
  startTick: number;
  durationTick: number;
  velocity?: number;
}

export interface UpdateNoteCommand extends BaseCommand {
  action: 'updateNote';
  noteId: string;
  pitch?: number;
  startTick?: number;
  durationTick?: number;
  velocity?: number;
}

export interface DeleteNoteCommand extends BaseCommand {
  action: 'deleteNote';
  noteId: string;
}

export interface AddNoteSequenceCommand extends BaseCommand {
  action: 'addNoteSequence';
  patternId: string;
  notes: Array<{
    pitch: number;
    startTick: number;
    durationTick: number;
    velocity?: number;
  }>;
}

export interface ClearPatternNotesCommand extends BaseCommand {
  action: 'clearPatternNotes';
  patternId: string;
}

export interface FocusPanelCommand extends BaseCommand {
  action: 'focusPanel';
  panel: 'browser' | 'channelRack' | 'mixer' | 'playlist' | 'pianoRoll' | 'chat';
}

// Transport commands
export interface PlayCommand extends BaseCommand {
  action: 'play';
}

export interface StopCommand extends BaseCommand {
  action: 'stop';
}

export interface PauseCommand extends BaseCommand {
  action: 'pause';
}

export interface SetBPMCommand extends BaseCommand {
  action: 'setBpm';
  bpm: number;
}

export interface SetPositionCommand extends BaseCommand {
  action: 'setPosition';
  tick: number;
}

export interface ToggleMetronomeCommand extends BaseCommand {
  action: 'toggleMetronome';
}

// Channel commands
export interface AddChannelCommand extends BaseCommand {
  action: 'addChannel';
  name?: string;
  type: 'synth' | 'sampler';
  preset?: string;
}

export interface UpdateChannelCommand extends BaseCommand {
  action: 'updateChannel';
  channelId: string;
  name?: string;
  preset?: string;
}

export interface DeleteChannelCommand extends BaseCommand {
  action: 'deleteChannel';
  channelId: string;
}

export interface SelectChannelCommand extends BaseCommand {
  action: 'selectChannel';
  channelId: string;
}

export interface SetChannelVolumeCommand extends BaseCommand {
  action: 'setChannelVolume';
  channelId: string;
  volume: number;
}

export interface SetChannelPanCommand extends BaseCommand {
  action: 'setChannelPan';
  channelId: string;
  pan: number;
}

export interface ToggleChannelMuteCommand extends BaseCommand {
  action: 'toggleChannelMute';
  channelId: string;
}

export interface ToggleChannelSoloCommand extends BaseCommand {
  action: 'toggleChannelSolo';
  channelId: string;
}

// Mixer commands
export interface SetVolumeCommand extends BaseCommand {
  action: 'setVolume';
  trackIndex: number;
  volume: number;
}

export interface SetPanCommand extends BaseCommand {
  action: 'setPan';
  trackIndex: number;
  pan: number;
}

export interface ToggleMuteCommand extends BaseCommand {
  action: 'toggleMute';
  trackIndex: number;
}

export interface ToggleSoloCommand extends BaseCommand {
  action: 'toggleSolo';
  trackIndex: number;
}

// Playlist track commands
export interface AddPlaylistTrackCommand extends BaseCommand {
  action: 'addPlaylistTrack';
  name?: string;
}

export interface TogglePlaylistTrackMuteCommand extends BaseCommand {
  action: 'togglePlaylistTrackMute';
  trackId: string;
}

export interface TogglePlaylistTrackSoloCommand extends BaseCommand {
  action: 'togglePlaylistTrackSolo';
  trackId: string;
}

// Playlist/Clip commands
export interface AddClipCommand extends BaseCommand {
  action: 'addClip';
  patternId: string;
  trackIndex: number;
  startTick: number;
  durationTick?: number;
}

export interface MoveClipCommand extends BaseCommand {
  action: 'moveClip';
  clipId: string;
  trackIndex: number;
  startTick: number;
}

export interface ResizeClipCommand extends BaseCommand {
  action: 'resizeClip';
  clipId: string;
  durationTick: number;
}

export interface DeleteClipCommand extends BaseCommand {
  action: 'deleteClip';
  clipId: string;
}

export interface SetLoopRegionCommand extends BaseCommand {
  action: 'setLoopRegion';
  startTick: number;
  endTick: number;
}

// TrackEffects commands (simple inline mixer)
export interface SetTrackEffectCommand extends BaseCommand {
  action: 'setTrackEffect';
  trackId: string;
  key: string; // e.g., 'volume', 'pan', 'reverb', etc.
  value: number;
}

export interface ResetTrackEffectsCommand extends BaseCommand {
  action: 'resetTrackEffects';
  trackId: string;
}

export interface ApplyTrackEffectsCommand extends BaseCommand {
  action: 'applyTrackEffects';
  trackId: string;
}

export interface SetMasterVolumeCommand extends BaseCommand {
  action: 'setMasterVolume';
  volume: number;
}

// Legacy effect commands (kept for compatibility)
export interface AddEffectCommand extends BaseCommand {
  action: 'addEffect';
  trackIndex: number;
  effectType: 'reverb' | 'delay' | 'eq' | 'compressor' | 'distortion';
}

export interface UpdateEffectCommand extends BaseCommand {
  action: 'updateEffect';
  effectId: string;
  parameters: Record<string, number>;
}

export interface DeleteEffectCommand extends BaseCommand {
  action: 'deleteEffect';
  effectId: string;
}

// Union type of all possible commands
export type AICommand =
  | AddPatternCommand
  | SetPatternLengthCommand
  | DeletePatternCommand
  | SelectPatternCommand
  | OpenPianoRollCommand
  | AddNoteCommand
  | AddNoteSequenceCommand
  | ClearPatternNotesCommand
  | UpdateNoteCommand
  | DeleteNoteCommand
  | FocusPanelCommand
  | PlayCommand
  | StopCommand
  | PauseCommand
  | SetBPMCommand
  | SetPositionCommand
  | ToggleMetronomeCommand
  | AddChannelCommand
  | UpdateChannelCommand
  | DeleteChannelCommand
  | SelectChannelCommand
  | SetChannelVolumeCommand
  | SetChannelPanCommand
  | ToggleChannelMuteCommand
  | ToggleChannelSoloCommand
  | SetVolumeCommand
  | SetPanCommand
  | ToggleMuteCommand
  | ToggleSoloCommand
  | AddClipCommand
  | AddPlaylistTrackCommand
  | TogglePlaylistTrackMuteCommand
  | TogglePlaylistTrackSoloCommand
  | MoveClipCommand
  | ResizeClipCommand
  | DeleteClipCommand
  | SetLoopRegionCommand
  | SetTrackEffectCommand
  | ResetTrackEffectsCommand
  | ApplyTrackEffectsCommand
  | SetMasterVolumeCommand
  | AddEffectCommand
  | UpdateEffectCommand
  | DeleteEffectCommand
  | AddAudioSampleCommand
  | AddAudioSampleToNewTrackCommand
  | ClarificationNeededCommand
  | UnknownCommand;

// Sample commands
export interface AddAudioSampleCommand extends BaseCommand {
  action: 'addAudioSample';
  sampleId?: string;
  category?: string;
  subcategory?: string;
  sampleName?: string;
  trackIndex?: number;
}

export interface AddAudioSampleToNewTrackCommand extends BaseCommand {
  action: 'addAudioSampleToNewTrack';
  assetId: string;
  name: string;
  startTick: number;
  durationTick: number;
}

export interface UpdateEffectCommand extends BaseCommand {
  action: 'updateEffect';
  effectId: string;
  parameters: Record<string, number>;
}

export interface DeleteEffectCommand extends BaseCommand {
  action: 'deleteEffect';
  effectId: string;
}

// Special commands
export interface ClarificationNeededCommand extends BaseCommand {
  action: 'clarificationNeeded';
  message: string;
  suggestedOptions?: string[];
}

export interface UnknownCommand extends BaseCommand {
  action: 'unknown';
  originalText: string;
  reason?: string;
}

// Response from Backboard (single action - legacy)
export interface BackboardResponse {
  action: string;
  parameters: Record<string, any>;
  confidence?: number;
  reasoning?: string;
}

// Response from Backboard (batch actions - new)
export interface BackboardBatchResponse {
  actions: Array<{
    action: string;
    parameters: Record<string, any>;
  }>;
  // Sample choices for consistency within a batch (e.g., { "kick": "drums_kick_01" })
  sampleChoices?: Record<string, string>;
  confidence?: number;
  reasoning?: string;
  genre?: string; // For context: "trap", "boom-bap", "house", etc.
}

// Result of command execution
export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Result of batch command execution
export interface BatchCommandResult {
  success: boolean;
  message: string;
  totalActions: number;
  successCount: number;
  failCount: number;
  results: CommandResult[];
  // For grouped undo
  undoGroupId?: string;
}

// Chat message types
export interface ChatMessage {
  id: string;
  from: 'user' | 'agent';
  text: string;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error';
  commandId?: string;
}

// API request/response types
export interface ChatAPIRequest {
  text: string;
  model: 'gemini' | 'fallback';
  conversationHistory?: ChatMessage[];
  /**
   * Dynamic system prompt with project context
   * Generated on client side using contextBuilder.generateSystemPrompt()
   * Includes current project state, available samples, and DAW capabilities
   */
  systemPrompt?: string;
}

export interface ChatAPIResponse {
  success: boolean;
  data?: {
    message: string;
    commandResult?: BackboardResponse;
    batchResult?: BatchCommandResult;
  };
  error?: string;
}

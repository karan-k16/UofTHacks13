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
  name: string;
  lengthInSteps?: number;
}

export interface DeletePatternCommand extends BaseCommand {
  action: 'deletePattern';
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
  type: 'synth' | 'sampler';
  preset?: string;
  name?: string;
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

// Effect commands
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

// Union type of all commands
export type AICommand =
  | AddPatternCommand
  | DeletePatternCommand
  | AddNoteCommand
  | UpdateNoteCommand
  | DeleteNoteCommand
  | PlayCommand
  | StopCommand
  | PauseCommand
  | SetBPMCommand
  | SetPositionCommand
  | ToggleMetronomeCommand
  | AddChannelCommand
  | UpdateChannelCommand
  | DeleteChannelCommand
  | SetVolumeCommand
  | SetPanCommand
  | ToggleMuteCommand
  | ToggleSoloCommand
  | AddClipCommand
  | MoveClipCommand
  | ResizeClipCommand
  | DeleteClipCommand
  | SetLoopRegionCommand
  | AddEffectCommand
  | UpdateEffectCommand
  | DeleteEffectCommand
  | ClarificationNeededCommand
  | UnknownCommand;

// Response from Backboard
export interface BackboardResponse {
  action: string;
  parameters: Record<string, any>;
  confidence?: number;
  reasoning?: string;
}

// Result of command execution
export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
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
}

export interface ChatAPIResponse {
  success: boolean;
  data?: {
    message: string;
    commandResult?: CommandResult;
  };
  error?: string;
}

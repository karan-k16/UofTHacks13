/**
 * DAW Controller - Execute AI commands against the DAW store
 * Routes typed commands to appropriate store actions with validation
 */

import { useStore } from '@/state/store';
import type {
  AICommand,
  CommandResult,
  AddPatternCommand,
  DeletePatternCommand,
  AddNoteCommand,
  UpdateNoteCommand,
  DeleteNoteCommand,
  PlayCommand,
  StopCommand,
  PauseCommand,
  SetBPMCommand,
  SetPositionCommand,
  ToggleMetronomeCommand,
  AddChannelCommand,
  UpdateChannelCommand,
  DeleteChannelCommand,
  SetVolumeCommand,
  SetPanCommand,
  ToggleMuteCommand,
  ToggleSoloCommand,
  AddClipCommand,
  MoveClipCommand,
  ResizeClipCommand,
  DeleteClipCommand,
  SetLoopRegionCommand,
  AddEffectCommand,
  UpdateEffectCommand,
  DeleteEffectCommand,
} from './types';
import {
  validateBPM,
  validatePitch,
  validateVelocity,
  validateVolume,
  validatePan,
  validateTrackIndex,
  validateTick,
  validateDuration,
  validatePatternLength,
  validateChannelType,
  validateEffectType,
  validateNonEmptyString,
} from './validators';

// ============================================
// Pattern & Note Operations
// ============================================

/**
 * Execute pattern-related commands
 */
export function executePatternCommand(
  cmd: AddPatternCommand | DeletePatternCommand
): CommandResult {
  const store = useStore.getState();

  if (cmd.action === 'addPattern') {
    // Validate pattern name
    const nameValidation = validateNonEmptyString(cmd.name, 'Pattern name');
    if (!nameValidation.valid) {
      return { success: false, message: nameValidation.error! };
    }

    // Validate length if provided
    if (cmd.lengthInSteps !== undefined) {
      const lengthValidation = validatePatternLength(cmd.lengthInSteps);
      if (!lengthValidation.valid) {
        return { success: false, message: lengthValidation.error! };
      }
    }

    try {
      store.addPattern(cmd.name);
      
      // Set length if specified
      if (cmd.lengthInSteps && store.project) {
        const newPattern = store.project.patterns[store.project.patterns.length - 1];
        if (newPattern) {
          store.setPatternLength(newPattern.id, cmd.lengthInSteps);
        }
      }

      return {
        success: true,
        message: `Created pattern "${cmd.name}"${cmd.lengthInSteps ? ` with ${cmd.lengthInSteps} steps` : ''}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create pattern',
      };
    }
  }

  if (cmd.action === 'deletePattern') {
    const project = store.project;
    if (!project) {
      return { success: false, message: 'No project loaded' };
    }

    const pattern = project.patterns.find((p) => p.id === cmd.patternId);
    if (!pattern) {
      return { success: false, message: `Pattern not found: ${cmd.patternId}` };
    }

    try {
      const patternName = pattern.name;
      store.deletePattern(cmd.patternId);
      return {
        success: true,
        message: `Deleted pattern "${patternName}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete pattern',
      };
    }
  }

  return { success: false, message: 'Unknown pattern command' };
}

/**
 * Execute note-related commands
 */
export function executeNoteCommand(
  cmd: AddNoteCommand | UpdateNoteCommand | DeleteNoteCommand
): CommandResult {
  const store = useStore.getState();
  const project = store.project;

  if (!project) {
    return { success: false, message: 'No project loaded' };
  }

  if (cmd.action === 'addNote') {
    // Validate pattern exists
    const pattern = project.patterns.find((p) => p.id === cmd.patternId);
    if (!pattern) {
      return { success: false, message: `Pattern not found: ${cmd.patternId}` };
    }

    // Validate pitch
    const pitchValidation = validatePitch(cmd.pitch);
    if (!pitchValidation.valid) {
      return { success: false, message: pitchValidation.error! };
    }

    // Validate velocity
    if (cmd.velocity !== undefined) {
      const velocityValidation = validateVelocity(cmd.velocity);
      if (!velocityValidation.valid) {
        return { success: false, message: velocityValidation.error! };
      }
    }

    // Validate tick positions
    const startTickValidation = validateTick(cmd.startTick);
    if (!startTickValidation.valid) {
      return { success: false, message: `Start position: ${startTickValidation.error}` };
    }

    const durationValidation = validateDuration(cmd.durationTick);
    if (!durationValidation.valid) {
      return { success: false, message: `Duration: ${durationValidation.error}` };
    }

    try {
      const noteId = store.addNote(cmd.patternId, {
        pitch: cmd.pitch,
        startTick: cmd.startTick,
        durationTick: cmd.durationTick,
        velocity: cmd.velocity ?? 100,
      });

      if (!noteId) {
        return { success: false, message: 'Failed to create note' };
      }

      const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][cmd.pitch % 12];
      const octave = Math.floor(cmd.pitch / 12) - 1;

      return {
        success: true,
        message: `Added note ${noteName}${octave} to pattern "${pattern.name}"`,
        data: { noteId },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add note',
      };
    }
  }

  if (cmd.action === 'updateNote') {
    // Validate pitch if provided
    if (cmd.pitch !== undefined) {
      const pitchValidation = validatePitch(cmd.pitch);
      if (!pitchValidation.valid) {
        return { success: false, message: pitchValidation.error! };
      }
    }

    // Validate velocity if provided
    if (cmd.velocity !== undefined) {
      const velocityValidation = validateVelocity(cmd.velocity);
      if (!velocityValidation.valid) {
        return { success: false, message: velocityValidation.error! };
      }
    }

    // Validate tick positions if provided
    if (cmd.startTick !== undefined) {
      const startTickValidation = validateTick(cmd.startTick);
      if (!startTickValidation.valid) {
        return { success: false, message: `Start position: ${startTickValidation.error}` };
      }
    }

    if (cmd.durationTick !== undefined) {
      const durationValidation = validateDuration(cmd.durationTick);
      if (!durationValidation.valid) {
        return { success: false, message: `Duration: ${durationValidation.error}` };
      }
    }

    // Find pattern containing this note
    let foundPattern = null;
    for (const pattern of project.patterns) {
      if (pattern.notes.some((n) => n.id === cmd.noteId)) {
        foundPattern = pattern;
        break;
      }
    }

    if (!foundPattern) {
      return { success: false, message: `Note not found: ${cmd.noteId}` };
    }

    try {
      store.updateNote(foundPattern.id, cmd.noteId, {
        pitch: cmd.pitch,
        startTick: cmd.startTick,
        durationTick: cmd.durationTick,
        velocity: cmd.velocity,
      });

      return {
        success: true,
        message: `Updated note in pattern "${foundPattern.name}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update note',
      };
    }
  }

  if (cmd.action === 'deleteNote') {
    // Find pattern containing this note
    let foundPattern = null;
    for (const pattern of project.patterns) {
      if (pattern.notes.some((n) => n.id === cmd.noteId)) {
        foundPattern = pattern;
        break;
      }
    }

    if (!foundPattern) {
      return { success: false, message: `Note not found: ${cmd.noteId}` };
    }

    try {
      store.deleteNote(foundPattern.id, cmd.noteId);
      return {
        success: true,
        message: `Deleted note from pattern "${foundPattern.name}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete note',
      };
    }
  }

  return { success: false, message: 'Unknown note command' };
}

// ============================================
// Transport Operations
// ============================================

/**
 * Execute transport/playback commands
 */
export function executeTransportCommand(
  cmd: PlayCommand | StopCommand | PauseCommand | SetBPMCommand | SetPositionCommand | ToggleMetronomeCommand
): CommandResult {
  const store = useStore.getState();

  if (cmd.action === 'play') {
    try {
      store.play();
      return { success: true, message: 'Playback started' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start playback',
      };
    }
  }

  if (cmd.action === 'stop') {
    try {
      store.stop();
      return { success: true, message: 'Playback stopped' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to stop playback',
      };
    }
  }

  if (cmd.action === 'pause') {
    try {
      store.pause();
      return { success: true, message: 'Playback paused' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to pause playback',
      };
    }
  }

  if (cmd.action === 'setBpm') {
    // Validate BPM
    const bpmValidation = validateBPM(cmd.bpm);
    if (!bpmValidation.valid) {
      return { success: false, message: bpmValidation.error! };
    }

    try {
      store.setBpm(cmd.bpm);
      return {
        success: true,
        message: `Set tempo to ${cmd.bpm} BPM`,
        data: { bpm: cmd.bpm },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set BPM',
      };
    }
  }

  if (cmd.action === 'setPosition') {
    // Validate tick position
    const tickValidation = validateTick(cmd.tick);
    if (!tickValidation.valid) {
      return { success: false, message: tickValidation.error! };
    }

    try {
      store.setPosition(cmd.tick);
      return {
        success: true,
        message: `Set playback position to tick ${cmd.tick}`,
        data: { position: cmd.tick },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set position',
      };
    }
  }

  if (cmd.action === 'toggleMetronome') {
    try {
      store.toggleMetronome();
      const enabled = store.metronomeEnabled;
      return {
        success: true,
        message: `Metronome ${enabled ? 'enabled' : 'disabled'}`,
        data: { enabled },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to toggle metronome',
      };
    }
  }

  return { success: false, message: 'Unknown transport command' };
}

// ============================================
// Channel & Mixer Operations
// ============================================

/**
 * Execute channel-related commands
 */
export function executeChannelCommand(
  cmd: AddChannelCommand | UpdateChannelCommand | DeleteChannelCommand
): CommandResult {
  const store = useStore.getState();
  const project = store.project;

  if (!project) {
    return { success: false, message: 'No project loaded' };
  }

  if (cmd.action === 'addChannel') {
    // Validate channel type
    const typeValidation = validateChannelType(cmd.type);
    if (!typeValidation.valid) {
      return { success: false, message: typeValidation.error! };
    }

    // Validate name if provided
    if (cmd.name) {
      const nameValidation = validateNonEmptyString(cmd.name, 'Channel name');
      if (!nameValidation.valid) {
        return { success: false, message: nameValidation.error! };
      }
    }

    try {
      const channelName = cmd.name || `${cmd.type === 'synth' ? 'Synth' : 'Sampler'} ${project.channels.length + 1}`;
      store.addChannel(channelName, cmd.type, cmd.preset);

      return {
        success: true,
        message: `Added ${cmd.type} channel "${channelName}"${cmd.preset ? ` with preset "${cmd.preset}"` : ''}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add channel',
      };
    }
  }

  if (cmd.action === 'updateChannel') {
    const channel = project.channels.find((c) => c.id === cmd.channelId);
    if (!channel) {
      return { success: false, message: `Channel not found: ${cmd.channelId}` };
    }

    // Validate name if provided
    if (cmd.name) {
      const nameValidation = validateNonEmptyString(cmd.name, 'Channel name');
      if (!nameValidation.valid) {
        return { success: false, message: nameValidation.error! };
      }
    }

    try {
      store.updateChannel(cmd.channelId, {
        name: cmd.name,
        preset: cmd.preset,
      });

      return {
        success: true,
        message: `Updated channel "${channel.name}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update channel',
      };
    }
  }

  if (cmd.action === 'deleteChannel') {
    const channel = project.channels.find((c) => c.id === cmd.channelId);
    if (!channel) {
      return { success: false, message: `Channel not found: ${cmd.channelId}` };
    }

    try {
      const channelName = channel.name;
      store.deleteChannel(cmd.channelId);
      return {
        success: true,
        message: `Deleted channel "${channelName}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete channel',
      };
    }
  }

  return { success: false, message: 'Unknown channel command' };
}

/**
 * Execute mixer-related commands
 */
export function executeMixerCommand(
  cmd: SetVolumeCommand | SetPanCommand | ToggleMuteCommand | ToggleSoloCommand
): CommandResult {
  const store = useStore.getState();
  const project = store.project;

  if (!project) {
    return { success: false, message: 'No project loaded' };
  }

  // Validate track index
  const maxTracks = project.mixer.tracks.length;
  const trackValidation = validateTrackIndex(cmd.trackIndex, maxTracks);
  if (!trackValidation.valid) {
    return { success: false, message: trackValidation.error! };
  }

  const track = project.mixer.tracks[cmd.trackIndex];
  if (!track) {
    return { success: false, message: `Mixer track not found at index ${cmd.trackIndex}` };
  }

  if (cmd.action === 'setVolume') {
    // Validate volume
    const volumeValidation = validateVolume(cmd.volume);
    if (!volumeValidation.valid) {
      return { success: false, message: volumeValidation.error! };
    }

    try {
      store.setMixerTrackVolume(track.id, cmd.volume);
      const volumePercent = Math.round(cmd.volume * 100);
      return {
        success: true,
        message: `Set volume to ${volumePercent}% for track "${track.name}"`,
        data: { volume: cmd.volume },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set volume',
      };
    }
  }

  if (cmd.action === 'setPan') {
    // Validate pan
    const panValidation = validatePan(cmd.pan);
    if (!panValidation.valid) {
      return { success: false, message: panValidation.error! };
    }

    try {
      store.setMixerTrackPan(track.id, cmd.pan);
      const panDirection = cmd.pan < 0 ? 'left' : cmd.pan > 0 ? 'right' : 'center';
      return {
        success: true,
        message: `Set pan to ${panDirection} for track "${track.name}"`,
        data: { pan: cmd.pan },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set pan',
      };
    }
  }

  if (cmd.action === 'toggleMute') {
    try {
      store.toggleMixerTrackMute(track.id);
      const isMuted = project.mixer.tracks[cmd.trackIndex]?.muted ?? false;
      return {
        success: true,
        message: `${isMuted ? 'Muted' : 'Unmuted'} track "${track.name}"`,
        data: { muted: isMuted },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to toggle mute',
      };
    }
  }

  if (cmd.action === 'toggleSolo') {
    try {
      store.toggleMixerTrackSolo(track.id);
      const isSoloed = project.mixer.tracks[cmd.trackIndex]?.soloed ?? false;
      return {
        success: true,
        message: `${isSoloed ? 'Soloed' : 'Unsoloed'} track "${track.name}"`,
        data: { soloed: isSoloed },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to toggle solo',
      };
    }
  }

  return { success: false, message: 'Unknown mixer command' };
}

// ============================================
// Playlist Operations
// ============================================

/**
 * Execute playlist/clip commands
 */
export function executePlaylistCommand(
  cmd: AddClipCommand | MoveClipCommand | ResizeClipCommand | DeleteClipCommand | SetLoopRegionCommand
): CommandResult {
  const store = useStore.getState();
  const project = store.project;

  if (!project) {
    return { success: false, message: 'No project loaded' };
  }

  if (cmd.action === 'addClip') {
    // Validate pattern exists
    const pattern = project.patterns.find((p) => p.id === cmd.patternId);
    if (!pattern) {
      return { success: false, message: `Pattern not found: ${cmd.patternId}` };
    }

    // Validate track index
    const maxTracks = project.playlist.tracks.length;
    const trackValidation = validateTrackIndex(cmd.trackIndex, maxTracks);
    if (!trackValidation.valid) {
      return { success: false, message: trackValidation.error! };
    }

    // Validate start tick
    const startTickValidation = validateTick(cmd.startTick);
    if (!startTickValidation.valid) {
      return { success: false, message: `Start position: ${startTickValidation.error}` };
    }

    // Validate duration if provided
    if (cmd.durationTick !== undefined) {
      const durationValidation = validateDuration(cmd.durationTick);
      if (!durationValidation.valid) {
        return { success: false, message: `Duration: ${durationValidation.error}` };
      }
    }

    try {
      const track = project.playlist.tracks[cmd.trackIndex];
      store.addClip({
        type: 'pattern',
        patternId: cmd.patternId,
        trackIndex: cmd.trackIndex,
        startTick: cmd.startTick,
        durationTick: cmd.durationTick || pattern.lengthInTicks,
      });

      return {
        success: true,
        message: `Added clip for pattern "${pattern.name}" to track "${track.name}" at tick ${cmd.startTick}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add clip',
      };
    }
  }

  if (cmd.action === 'moveClip') {
    const clip = project.playlist.clips.find((c) => c.id === cmd.clipId);
    if (!clip) {
      return { success: false, message: `Clip not found: ${cmd.clipId}` };
    }

    // Validate track index
    const maxTracks = project.playlist.tracks.length;
    const trackValidation = validateTrackIndex(cmd.trackIndex, maxTracks);
    if (!trackValidation.valid) {
      return { success: false, message: trackValidation.error! };
    }

    // Validate start tick
    const startTickValidation = validateTick(cmd.startTick);
    if (!startTickValidation.valid) {
      return { success: false, message: `Start position: ${startTickValidation.error}` };
    }

    try {
      const deltaX = cmd.startTick - clip.startTick;
      const deltaY = cmd.trackIndex - clip.trackIndex;
      store.moveClipAction(cmd.clipId, deltaX, deltaY);

      return {
        success: true,
        message: `Moved clip to track ${cmd.trackIndex} at tick ${cmd.startTick}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to move clip',
      };
    }
  }

  if (cmd.action === 'resizeClip') {
    const clip = project.playlist.clips.find((c) => c.id === cmd.clipId);
    if (!clip) {
      return { success: false, message: `Clip not found: ${cmd.clipId}` };
    }

    // Validate duration
    const durationValidation = validateDuration(cmd.durationTick);
    if (!durationValidation.valid) {
      return { success: false, message: `Duration: ${durationValidation.error}` };
    }

    try {
      store.resizeClipAction(cmd.clipId, cmd.durationTick);
      return {
        success: true,
        message: `Resized clip to ${cmd.durationTick} ticks`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to resize clip',
      };
    }
  }

  if (cmd.action === 'deleteClip') {
    const clip = project.playlist.clips.find((c) => c.id === cmd.clipId);
    if (!clip) {
      return { success: false, message: `Clip not found: ${cmd.clipId}` };
    }

    try {
      store.deleteClip(cmd.clipId);
      return {
        success: true,
        message: 'Deleted clip',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete clip',
      };
    }
  }

  if (cmd.action === 'setLoopRegion') {
    // Validate ticks
    const startValidation = validateTick(cmd.startTick);
    if (!startValidation.valid) {
      return { success: false, message: `Loop start: ${startValidation.error}` };
    }

    const endValidation = validateTick(cmd.endTick);
    if (!endValidation.valid) {
      return { success: false, message: `Loop end: ${endValidation.error}` };
    }

    if (cmd.startTick >= cmd.endTick) {
      return { success: false, message: 'Loop start must be before loop end' };
    }

    try {
      store.setLoopRegion(cmd.startTick, cmd.endTick);
      const lengthTicks = cmd.endTick - cmd.startTick;
      return {
        success: true,
        message: `Set loop region from tick ${cmd.startTick} to ${cmd.endTick} (${lengthTicks} ticks)`,
        data: { startTick: cmd.startTick, endTick: cmd.endTick },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set loop region',
      };
    }
  }

  return { success: false, message: 'Unknown playlist command' };
}

// ============================================
// Effect Operations
// ============================================

/**
 * Execute effect-related commands
 */
export function executeEffectCommand(
  cmd: AddEffectCommand | UpdateEffectCommand | DeleteEffectCommand
): CommandResult {
  const store = useStore.getState();
  const project = store.project;

  if (!project) {
    return { success: false, message: 'No project loaded' };
  }

  if (cmd.action === 'addEffect') {
    // Validate effect type
    const typeValidation = validateEffectType(cmd.effectType);
    if (!typeValidation.valid) {
      return { success: false, message: typeValidation.error! };
    }

    // Validate track index
    const maxTracks = project.mixer.tracks.length;
    const trackValidation = validateTrackIndex(cmd.trackIndex, maxTracks);
    if (!trackValidation.valid) {
      return { success: false, message: trackValidation.error! };
    }

    const track = project.mixer.tracks[cmd.trackIndex];
    if (!track) {
      return { success: false, message: `Mixer track not found at index ${cmd.trackIndex}` };
    }

    try {
      store.addInsertEffect(track.id, cmd.effectType);
      return {
        success: true,
        message: `Added ${cmd.effectType} effect to track "${track.name}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add effect',
      };
    }
  }

  if (cmd.action === 'updateEffect') {
    // Find effect in mixer tracks
    let foundTrack = null;
    let foundEffect = null;

    for (const track of project.mixer.tracks) {
      const effect = track.inserts.find((e) => e.id === cmd.effectId);
      if (effect) {
        foundTrack = track;
        foundEffect = effect;
        break;
      }
    }

    if (!foundEffect || !foundTrack) {
      return { success: false, message: `Effect not found: ${cmd.effectId}` };
    }

    try {
      store.updateInsertEffect(foundTrack.id, cmd.effectId, {
        parameters: cmd.parameters,
      });

      return {
        success: true,
        message: `Updated ${foundEffect.type} effect parameters`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update effect',
      };
    }
  }

  if (cmd.action === 'deleteEffect') {
    // Find effect in mixer tracks
    let foundTrack = null;
    let foundEffect = null;

    for (const track of project.mixer.tracks) {
      const effect = track.inserts.find((e) => e.id === cmd.effectId);
      if (effect) {
        foundTrack = track;
        foundEffect = effect;
        break;
      }
    }

    if (!foundEffect || !foundTrack) {
      return { success: false, message: `Effect not found: ${cmd.effectId}` };
    }

    try {
      store.removeInsertEffect(foundTrack.id, cmd.effectId);
      return {
        success: true,
        message: `Removed ${foundEffect.type} effect from track "${foundTrack.name}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete effect',
      };
    }
  }

  return { success: false, message: 'Unknown effect command' };
}

// ============================================
// Main Command Executor
// ============================================

/**
 * Execute any AI command - routes to appropriate executor
 * @param command - The typed command to execute
 * @returns Result with success status and message
 */
export function executeCommand(command: AICommand): CommandResult {
  // Handle special commands
  if (command.action === 'unknown') {
    return {
      success: false,
      message: `Could not understand command: ${command.reason || 'Unknown reason'}`,
      error: command.originalText,
    };
  }

  if (command.action === 'clarificationNeeded') {
    return {
      success: false,
      message: command.message,
      data: { suggestedOptions: command.suggestedOptions },
    };
  }

  // Route to appropriate executor
  try {
    // Pattern commands
    if (command.action === 'addPattern' || command.action === 'deletePattern') {
      return executePatternCommand(command);
    }

    // Note commands
    if (command.action === 'addNote' || command.action === 'updateNote' || command.action === 'deleteNote') {
      return executeNoteCommand(command);
    }

    // Transport commands
    if (
      command.action === 'play' ||
      command.action === 'stop' ||
      command.action === 'pause' ||
      command.action === 'setBpm' ||
      command.action === 'setPosition' ||
      command.action === 'toggleMetronome'
    ) {
      return executeTransportCommand(command);
    }

    // Channel commands
    if (
      command.action === 'addChannel' ||
      command.action === 'updateChannel' ||
      command.action === 'deleteChannel'
    ) {
      return executeChannelCommand(command);
    }

    // Mixer commands
    if (
      command.action === 'setVolume' ||
      command.action === 'setPan' ||
      command.action === 'toggleMute' ||
      command.action === 'toggleSolo'
    ) {
      return executeMixerCommand(command);
    }

    // Playlist commands
    if (
      command.action === 'addClip' ||
      command.action === 'moveClip' ||
      command.action === 'resizeClip' ||
      command.action === 'deleteClip' ||
      command.action === 'setLoopRegion'
    ) {
      return executePlaylistCommand(command);
    }

    // Effect commands
    if (
      command.action === 'addEffect' ||
      command.action === 'updateEffect' ||
      command.action === 'deleteEffect'
    ) {
      return executeEffectCommand(command);
    }

    // If we get here, command type wasn't handled
    return {
      success: false,
      message: `Command type "${command.action}" is not yet implemented`,
    };
  } catch (error) {
    console.error('[DAW Controller] Error executing command:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

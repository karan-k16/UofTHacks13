/**
 * DAW Controller - Execute AI commands against the DAW store
 * Routes typed commands to appropriate store actions with validation
 */

import { useStore } from '@/state/store';
import type { PatternClip } from '@/domain/types';
import type {
  AICommand,
  CommandResult,
  AddPatternCommand,
  DeletePatternCommand,
  AddNoteCommand,
  AddNoteSequenceCommand,
  ClearPatternNotesCommand,
  UpdateNoteCommand,
  DeleteNoteCommand,
  FocusPanelCommand,
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
  SetTrackEffectCommand,
  ResetTrackEffectsCommand,
  ApplyTrackEffectsCommand,
  SetMasterVolumeCommand,
  AddAudioSampleCommand,
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
  validateTrackEffectKey,
  validateTrackEffectValue,
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
    // Validate pattern name if provided
    const patternName = cmd.name || 'New Pattern';
    if (cmd.name) {
      const nameValidation = validateNonEmptyString(cmd.name, 'Pattern name');
      if (!nameValidation.valid) {
        return { success: false, message: nameValidation.error! };
      }
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

      // Get the newly created pattern ID
      const newPattern = store.project?.patterns[store.project.patterns.length - 1];
      const newPatternId = newPattern?.id;

      // Set length if specified
      if (cmd.lengthInSteps && store.project && newPattern) {
        store.setPatternLength(newPattern.id, cmd.lengthInSteps);
      }

      return {
        success: true,
        message: `Created pattern "${cmd.name}"${cmd.lengthInSteps ? ` with ${cmd.lengthInSteps} steps` : ''}`,
        data: { patternId: newPatternId },
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
  cmd: AddNoteCommand | AddNoteSequenceCommand | ClearPatternNotesCommand | UpdateNoteCommand | DeleteNoteCommand
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

  // Handle addNoteSequence - add multiple notes at once
  if (cmd.action === 'addNoteSequence') {
    const seqCmd = cmd as AddNoteSequenceCommand;

    // Validate pattern exists
    const pattern = project.patterns.find((p) => p.id === seqCmd.patternId);
    if (!pattern) {
      return { success: false, message: `Pattern not found: ${seqCmd.patternId}` };
    }

    if (!seqCmd.notes || seqCmd.notes.length === 0) {
      return { success: false, message: 'No notes provided in sequence' };
    }

    // Validate all notes first
    for (let i = 0; i < seqCmd.notes.length; i++) {
      const note = seqCmd.notes[i];
      const pitchValidation = validatePitch(note.pitch);
      if (!pitchValidation.valid) {
        return { success: false, message: `Note ${i + 1}: ${pitchValidation.error}` };
      }
      const tickValidation = validateTick(note.startTick);
      if (!tickValidation.valid) {
        return { success: false, message: `Note ${i + 1}: ${tickValidation.error}` };
      }
      const durationValidation = validateDuration(note.durationTick);
      if (!durationValidation.valid) {
        return { success: false, message: `Note ${i + 1}: ${durationValidation.error}` };
      }
    }

    try {
      const addedNoteIds: string[] = [];
      for (const note of seqCmd.notes) {
        const noteId = store.addNote(seqCmd.patternId, {
          pitch: note.pitch,
          startTick: note.startTick,
          durationTick: note.durationTick,
          velocity: note.velocity ?? 100,
        });
        if (noteId) {
          addedNoteIds.push(noteId);
        }
      }

      return {
        success: true,
        message: `Added ${addedNoteIds.length} notes to pattern "${pattern.name}"`,
        data: { noteIds: addedNoteIds },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add note sequence',
      };
    }
  }

  // Handle clearPatternNotes
  if (cmd.action === 'clearPatternNotes') {
    const clearCmd = cmd as ClearPatternNotesCommand;

    const pattern = project.patterns.find((p) => p.id === clearCmd.patternId);
    if (!pattern) {
      return { success: false, message: `Pattern not found: ${clearCmd.patternId}` };
    }

    try {
      store.clearPatternNotes(clearCmd.patternId);
      return {
        success: true,
        message: `Cleared all notes from pattern "${pattern.name}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clear pattern notes',
      };
    }
  }

  return { success: false, message: 'Unknown note command' };
}

// ============================================
// UI/Focus Operations
// ============================================

/**
 * Execute UI focus commands
 */
export function executeFocusPanelCommand(cmd: FocusPanelCommand): CommandResult {
  const store = useStore.getState();

  const panelMap: Record<string, string> = {
    browser: 'browser',
    channelRack: 'channelRack',
    mixer: 'mixer',
    playlist: 'playlist',
    pianoRoll: 'pianoRoll',
    chat: 'chat',
  };

  const panelId = panelMap[cmd.panel];
  if (!panelId) {
    return { success: false, message: `Unknown panel: ${cmd.panel}` };
  }

  try {
    store.setFocusedPanel(panelId as any);
    return {
      success: true,
      message: `Focused ${cmd.panel} panel`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to focus panel',
    };
  }
}

// ============================================
// Sample Operations
// ============================================

/**
 * Execute sample loading commands
 * Resolves sample by ID or search, then adds to project
 */
export async function executeSampleCommand(cmd: AddAudioSampleCommand): Promise<CommandResult> {
  const store = useStore.getState();
  const project = store.project;

  if (!project) {
    return { success: false, message: 'No project loaded' };
  }

  // We need to resolve the sample - this requires the sample library
  // The sample library is loaded on the client via SampleLibrary.ts
  // Import dynamically to avoid server-side issues
  try {
    const { loadSampleLibrary, getSampleById, getSamplesByCategory } = await import('@/lib/audio/SampleLibrary');
    const { getRandomFromCategory } = await import('./sampleResolver');
    const library = await loadSampleLibrary();

    if (!library) {
      return { success: false, message: 'Sample library not available' };
    }

    let sample = null;

    // Try to find by exact ID first
    if (cmd.sampleId) {
      sample = getSampleById(library, cmd.sampleId);
    }

    // If no sample found by ID, try by category/subcategory
    if (!sample && cmd.category) {
      sample = getRandomFromCategory(library, cmd.category, cmd.subcategory);
    }

    if (!sample) {
      return {
        success: false,
        message: `Sample not found: ${cmd.sampleId || cmd.category + '/' + cmd.subcategory || cmd.sampleName || 'unknown'}. Check sample ID or category.`
      };
    }

    // Add the audio asset from the sample path
    const assetId = store.addAudioAssetFromUrl({
      name: sample.name,
      fileName: sample.filename,
      storageUrl: sample.path,
      duration: sample.duration,
      format: 'mp3',
    });

    // Calculate duration in ticks (using project BPM and PPQ)
    // Use a default of 1 beat (96 ticks) if sample duration is very short
    const durationSeconds = sample.duration || 0.5;
    const beatsPerSecond = project.bpm / 60;
    const durationBeats = durationSeconds * beatsPerSecond;
    let durationTicks = Math.round(durationBeats * project.ppq);

    // Minimum duration of 1 beat
    durationTicks = Math.max(durationTicks, 96);

    // Get startTick from command or default to 0
    const startTick = (cmd as any).startTick ?? 0;

    if (cmd.trackIndex !== undefined) {
      // Ensure track exists (auto-create if needed)
      const currentTrackCount = project.playlist.tracks.length;
      if (cmd.trackIndex >= currentTrackCount) {
        // Create tracks up to the needed index
        for (let i = currentTrackCount; i <= cmd.trackIndex; i++) {
          store.addPlaylistTrack(`Track ${i + 1}`);
        }
      }

      // Add clip to track
      store.addClip({
        type: 'audio',
        assetId: assetId,
        trackIndex: cmd.trackIndex,
        startTick,
        durationTick: durationTicks,
        color: '#4a9eff',
      });

      return {
        success: true,
        message: `Added sample "${sample.name}" to track ${cmd.trackIndex + 1} at tick ${startTick}`,
        data: { assetId, samplePath: sample.path, trackIndex: cmd.trackIndex, startTick },
      };
    } else {
      // Create new track with the sample
      await store.addAudioSampleToNewTrack(assetId, sample.name, startTick, durationTicks);

      return {
        success: true,
        message: `Added sample "${sample.name}" to new track`,
        data: { assetId, samplePath: sample.path },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add sample',
    };
  }
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

      // Get the newly created channel ID
      const newChannel = store.project?.channels[store.project.channels.length - 1];
      const newChannelId = newChannel?.id;

      return {
        success: true,
        message: `Added ${cmd.type} channel "${channelName}"${cmd.preset ? ` with preset "${cmd.preset}"` : ''}`,
        data: { channelId: newChannelId },
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
  const maxTracks = project.playlist.tracks.length;
  const trackValidation = validateTrackIndex(cmd.trackIndex, maxTracks);
  if (!trackValidation.valid) {
    return { success: false, message: trackValidation.error! };
  }

  const track = project.playlist.tracks[cmd.trackIndex];
  if (!track) {
    return { success: false, message: `Track not found at index ${cmd.trackIndex}` };
  }

  if (cmd.action === 'setVolume') {
    // Validate volume
    const volumeValidation = validateVolume(cmd.volume);
    if (!volumeValidation.valid) {
      return { success: false, message: volumeValidation.error! };
    }

    try {
      store.setTrackEffect(track.id, 'volume', cmd.volume);
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
      store.setTrackEffect(track.id, 'pan', cmd.pan);
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
      store.togglePlaylistTrackMute(track.id);
      // Get updated state
      const updatedTrack = useStore.getState().project?.playlist.tracks[cmd.trackIndex];
      const isMuted = updatedTrack?.mute ?? false;
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
      store.togglePlaylistTrackSolo(track.id);
      // Get updated state
      const updatedTrack = useStore.getState().project?.playlist.tracks[cmd.trackIndex];
      const isSoloed = updatedTrack?.solo ?? false;
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
      if (!track) {
        return { success: false, message: `Track not found at index ${cmd.trackIndex}` };
      }

      // Calculate duration from pattern length if not provided
      const ppq = project.ppq || 96;
      const patternDurationTicks = pattern.lengthInSteps * (ppq / pattern.stepsPerBeat);

      const clipData: Omit<PatternClip, 'id'> = {
        type: 'pattern',
        patternId: cmd.patternId,
        trackIndex: cmd.trackIndex,
        startTick: cmd.startTick,
        durationTick: cmd.durationTick || patternDurationTicks,
        offset: 0,
        color: pattern.color,
        mute: false,
      };

      store.addClip(clipData);

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
    const maxTracks = project.playlist.tracks.length;
    const trackValidation = validateTrackIndex(cmd.trackIndex, maxTracks);
    if (!trackValidation.valid) {
      return { success: false, message: trackValidation.error! };
    }

    const track = project.playlist.tracks[cmd.trackIndex];
    if (!track) {
      return { success: false, message: `Track not found at index ${cmd.trackIndex}` };
    }

    try {
      // Note: addInsertEffect may not exist yet - this is a placeholder
      // For now, just return success message since effects are handled via TrackEffects
      return {
        success: true,
        message: `Effect commands are now handled via TrackEffects (setTrackEffect). Use 'setTrackEffect' instead.`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add effect',
      };
    }
  }

  if (cmd.action === 'updateEffect') {
    // Note: Effect system is now handled via TrackEffects
    return {
      success: true,
      message: 'Effect commands are now handled via TrackEffects (setTrackEffect, resetTrackEffects, applyTrackEffects)',
    };
  }

  if (cmd.action === 'deleteEffect') {
    // Note: Effect system is now handled via TrackEffects
    return {
      success: true,
      message: 'Effect commands are now handled via TrackEffects (resetTrackEffects)',
    };
  }

  return { success: false, message: 'Unknown effect command' };
}

// ============================================
// TrackEffects Commands (Simple Inline Mixer)
// ============================================

/**
 * Execute TrackEffects commands - set, reset, and apply track effects
 * @param cmd - SetTrackEffectCommand, ResetTrackEffectsCommand, ApplyTrackEffectsCommand, or SetMasterVolumeCommand
 * @returns Result with success status and message
 */
export function executeTrackEffectsCommand(
  cmd: SetTrackEffectCommand | ResetTrackEffectsCommand | ApplyTrackEffectsCommand | SetMasterVolumeCommand
): CommandResult {
  const store = useStore.getState();
  const { project } = store;

  if (!project) {
    return { success: false, message: 'No project loaded' };
  }

  if (cmd.action === 'setTrackEffect') {
    // Validate effect key
    const keyValidation = validateTrackEffectKey(cmd.key);
    if (!keyValidation.valid) {
      return { success: false, message: keyValidation.error! };
    }

    // Validate effect value for this key
    const valueValidation = validateTrackEffectValue(cmd.key, cmd.value);
    if (!valueValidation.valid) {
      return { success: false, message: valueValidation.error! };
    }

    // Find the track
    const track = project.playlist.tracks.find(t => t.id === cmd.trackId);
    if (!track) {
      return { success: false, message: `Track not found: ${cmd.trackId}` };
    }

    try {
      store.setTrackEffect(cmd.trackId, cmd.key as any, cmd.value);
      return {
        success: true,
        message: `Set ${cmd.key} to ${cmd.value} for track "${track.name}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set track effect',
      };
    }
  }

  if (cmd.action === 'resetTrackEffects') {
    // Find the track
    const track = project.playlist.tracks.find(t => t.id === cmd.trackId);
    if (!track) {
      return { success: false, message: `Track not found: ${cmd.trackId}` };
    }

    try {
      store.resetTrackEffects(cmd.trackId);
      return {
        success: true,
        message: `Reset all effects for track "${track.name}" to defaults`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reset track effects',
      };
    }
  }

  if (cmd.action === 'applyTrackEffects') {
    // Find the track
    const track = project.playlist.tracks.find(t => t.id === cmd.trackId);
    if (!track) {
      return { success: false, message: `Track not found: ${cmd.trackId}` };
    }

    try {
      // This is async but we'll fire and forget for now
      store.applyTrackEffects(cmd.trackId);
      return {
        success: true,
        message: `Applying effects to track "${track.name}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to apply track effects',
      };
    }
  }

  if (cmd.action === 'setMasterVolume') {
    // Validate volume (0-2 range for 200% max)
    const volumeValidation = validateTrackEffectValue('volume', cmd.volume);
    if (!volumeValidation.valid) {
      return { success: false, message: volumeValidation.error! };
    }

    try {
      store.setMasterVolume(cmd.volume);
      return {
        success: true,
        message: `Set master volume to ${Math.round(cmd.volume * 100)}%`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set master volume',
      };
    }
  }

  return { success: false, message: 'Unknown track effects command' };
}

// ============================================
// Main Command Executor
// ============================================

/**
 * Execute any AI command - routes to appropriate executor
 * @param command - The typed command to execute
 * @returns Result with success status and message
 */
export async function executeCommand(command: AICommand): Promise<CommandResult> {
  // Log incoming command
  console.log('[DAW Controller] Executing command:', command.action, command);

  // Handle special commands
  if (command.action === 'unknown') {
    console.warn('[DAW Controller] Unknown command received:', (command as any).originalText);
    return {
      success: false,
      message: `Could not understand command: ${(command as any).reason || 'Unknown reason'}`,
      error: (command as any).originalText,
    };
  }

  if (command.action === 'clarificationNeeded') {
    console.log('[DAW Controller] Clarification needed:', (command as any).message);
    return {
      success: false,
      message: (command as any).message,
      data: { suggestedOptions: (command as any).suggestedOptions },
    };
  }

  // Route to appropriate executor
  try {
    let result: CommandResult;

    // Pattern commands
    if (command.action === 'addPattern' || command.action === 'deletePattern') {
      result = executePatternCommand(command);
    }
    // Note commands (including sequence)
    else if (
      command.action === 'addNote' ||
      command.action === 'addNoteSequence' ||
      command.action === 'clearPatternNotes' ||
      command.action === 'updateNote' ||
      command.action === 'deleteNote'
    ) {
      result = executeNoteCommand(command as AddNoteCommand | AddNoteSequenceCommand | ClearPatternNotesCommand | UpdateNoteCommand | DeleteNoteCommand);
    }
    // UI/Focus commands
    else if (command.action === 'focusPanel') {
      result = executeFocusPanelCommand(command);
    }
    // Sample commands
    else if (command.action === 'addAudioSample') {
      result = await executeSampleCommand(command);
    }
    // Transport commands
    else if (
      command.action === 'play' ||
      command.action === 'stop' ||
      command.action === 'pause' ||
      command.action === 'setBpm' ||
      command.action === 'setPosition' ||
      command.action === 'toggleMetronome'
    ) {
      result = executeTransportCommand(command);
    }
    // Channel commands
    else if (
      command.action === 'addChannel' ||
      command.action === 'updateChannel' ||
      command.action === 'deleteChannel'
    ) {
      result = executeChannelCommand(command);
    }
    // Mixer commands
    else if (
      command.action === 'setVolume' ||
      command.action === 'setPan' ||
      command.action === 'toggleMute' ||
      command.action === 'toggleSolo'
    ) {
      result = executeMixerCommand(command);
    }
    // Playlist commands
    else if (
      command.action === 'addClip' ||
      command.action === 'moveClip' ||
      command.action === 'resizeClip' ||
      command.action === 'deleteClip' ||
      command.action === 'setLoopRegion'
    ) {
      result = executePlaylistCommand(command);
    }
    // Effect commands
    else if (
      command.action === 'addEffect' ||
      command.action === 'updateEffect' ||
      command.action === 'deleteEffect'
    ) {
      result = executeEffectCommand(command);
    }
    // TrackEffects commands
    else if (
      command.action === 'setTrackEffect' ||
      command.action === 'resetTrackEffects' ||
      command.action === 'applyTrackEffects' ||
      command.action === 'setMasterVolume'
    ) {
      result = executeTrackEffectsCommand(command);
    }
    // Unhandled command type
    else {
      result = {
        success: false,
        message: `Command type "${command.action}" is not yet implemented`,
      };
    }

    // Log execution result
    if (result.success) {
      console.log('[DAW Controller] ✓ Command executed successfully:', result.message);
    } else {
      console.warn('[DAW Controller] ✗ Command failed:', result.message);
    }

    return result;
  } catch (error) {
    console.error('[DAW Controller] Error executing command:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

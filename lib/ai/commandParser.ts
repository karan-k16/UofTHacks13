/**
 * Command Parser - Converts AI responses to typed DAW commands
 * Maps Backboard response JSON to strongly-typed command objects
 */

import type { AICommand, BackboardResponse } from './types';

/**
 * Parse an AI response from Backboard into a typed command object
 * 
 * @param response - The raw response from Backboard API
 * @returns A strongly-typed AICommand that can be executed by the DAW controller
 * 
 * @example
 * const response = { action: 'addPattern', parameters: { name: 'Kick' } };
 * const command = parseAIResponse(response);
 * // Returns: { action: 'addPattern', name: 'Kick' }
 */
export function parseAIResponse(response: BackboardResponse): AICommand {
  const { action, parameters } = response;

  try {
    // Pattern commands
    if (action === 'addPattern') {
      return {
        action: 'addPattern',
        name: String(parameters.name || 'New Pattern'),
        lengthInSteps: parameters.lengthInSteps ? Number(parameters.lengthInSteps) : undefined,
      };
    }

    if (action === 'deletePattern') {
      return {
        action: 'deletePattern',
        patternId: String(parameters.patternId || parameters.id),
      };
    }

    // Note commands
    if (action === 'addNote') {
      return {
        action: 'addNote',
        patternId: String(parameters.patternId),
        pitch: Number(parameters.pitch),
        startTick: Number(parameters.startTick),
        durationTick: Number(parameters.durationTick || parameters.duration),
        velocity: parameters.velocity !== undefined ? Number(parameters.velocity) : undefined,
      };
    }

    if (action === 'updateNote') {
      return {
        action: 'updateNote',
        noteId: String(parameters.noteId || parameters.id),
        pitch: parameters.pitch !== undefined ? Number(parameters.pitch) : undefined,
        startTick: parameters.startTick !== undefined ? Number(parameters.startTick) : undefined,
        durationTick: parameters.durationTick !== undefined ? Number(parameters.durationTick) : undefined,
        velocity: parameters.velocity !== undefined ? Number(parameters.velocity) : undefined,
      };
    }

    if (action === 'deleteNote') {
      return {
        action: 'deleteNote',
        noteId: String(parameters.noteId || parameters.id),
      };
    }

    // Transport commands
    if (action === 'play') {
      return { action: 'play' };
    }

    if (action === 'stop') {
      return { action: 'stop' };
    }

    if (action === 'pause') {
      return { action: 'pause' };
    }

    if (action === 'setBpm') {
      return {
        action: 'setBpm',
        bpm: Number(parameters.bpm || parameters.tempo),
      };
    }

    if (action === 'setPosition') {
      return {
        action: 'setPosition',
        tick: Number(parameters.tick || parameters.position),
      };
    }

    if (action === 'toggleMetronome') {
      return { action: 'toggleMetronome' };
    }

    // Channel commands
    if (action === 'addChannel') {
      const type = parameters.type || parameters.channelType;
      return {
        action: 'addChannel',
        type: type === 'sampler' || type === 'synth' ? type : 'synth',
        preset: parameters.preset ? String(parameters.preset) : undefined,
        name: parameters.name ? String(parameters.name) : undefined,
      };
    }

    if (action === 'updateChannel') {
      return {
        action: 'updateChannel',
        channelId: String(parameters.channelId || parameters.id),
        name: parameters.name ? String(parameters.name) : undefined,
        preset: parameters.preset ? String(parameters.preset) : undefined,
      };
    }

    if (action === 'deleteChannel') {
      return {
        action: 'deleteChannel',
        channelId: String(parameters.channelId || parameters.id),
      };
    }

    // Mixer commands
    if (action === 'setVolume') {
      return {
        action: 'setVolume',
        trackIndex: Number(parameters.trackIndex || parameters.track),
        volume: Number(parameters.volume),
      };
    }

    if (action === 'setPan') {
      return {
        action: 'setPan',
        trackIndex: Number(parameters.trackIndex || parameters.track),
        pan: Number(parameters.pan),
      };
    }

    if (action === 'toggleMute') {
      return {
        action: 'toggleMute',
        trackIndex: Number(parameters.trackIndex || parameters.track),
      };
    }

    if (action === 'toggleSolo') {
      return {
        action: 'toggleSolo',
        trackIndex: Number(parameters.trackIndex || parameters.track),
      };
    }

    // Playlist/Clip commands
    if (action === 'addClip') {
      return {
        action: 'addClip',
        patternId: String(parameters.patternId),
        trackIndex: Number(parameters.trackIndex || parameters.track),
        startTick: Number(parameters.startTick || parameters.start),
        durationTick: parameters.durationTick ? Number(parameters.durationTick) : undefined,
      };
    }

    if (action === 'moveClip') {
      return {
        action: 'moveClip',
        clipId: String(parameters.clipId || parameters.id),
        trackIndex: Number(parameters.trackIndex || parameters.track),
        startTick: Number(parameters.startTick || parameters.start),
      };
    }

    if (action === 'resizeClip') {
      return {
        action: 'resizeClip',
        clipId: String(parameters.clipId || parameters.id),
        durationTick: Number(parameters.durationTick || parameters.duration),
      };
    }

    if (action === 'deleteClip') {
      return {
        action: 'deleteClip',
        clipId: String(parameters.clipId || parameters.id),
      };
    }

    if (action === 'setLoopRegion') {
      return {
        action: 'setLoopRegion',
        startTick: Number(parameters.startTick || parameters.start),
        endTick: Number(parameters.endTick || parameters.end),
      };
    }

    // Sample commands
    if (action === 'addAudioSample') {
      return {
        action: 'addAudioSample',
        sampleId: parameters.sampleId ? String(parameters.sampleId) : undefined,
        category: parameters.category ? String(parameters.category) : undefined,
        subcategory: parameters.subcategory ? String(parameters.subcategory) : undefined,
        sampleName: parameters.sampleName ? String(parameters.sampleName) : undefined,
        trackIndex: parameters.trackIndex !== undefined ? Number(parameters.trackIndex) : undefined,
      };
    }

    // Effect commands
    if (action === 'addEffect') {
      return {
        action: 'addEffect',
        trackIndex: Number(parameters.trackIndex || parameters.track),
        effectType: String(parameters.effectType || parameters.type) as any,
      };
    }

    if (action === 'updateEffect') {
      return {
        action: 'updateEffect',
        effectId: String(parameters.effectId || parameters.id),
        parameters: parameters.effectParameters || parameters.params || {},
      };
    }

    if (action === 'deleteEffect') {
      return {
        action: 'deleteEffect',
        effectId: String(parameters.effectId || parameters.id),
      };
    }

    // TrackEffects commands (simple inline mixer)
    if (action === 'setTrackEffect') {
      return {
        action: 'setTrackEffect',
        trackId: String(parameters.trackId || parameters.track),
        key: String(parameters.key || parameters.effectKey || parameters.param),
        value: Number(parameters.value),
      };
    }

    if (action === 'resetTrackEffects') {
      return {
        action: 'resetTrackEffects',
        trackId: String(parameters.trackId || parameters.track),
      };
    }

    if (action === 'applyTrackEffects') {
      return {
        action: 'applyTrackEffects',
        trackId: String(parameters.trackId || parameters.track),
      };
    }

    if (action === 'setMasterVolume') {
      return {
        action: 'setMasterVolume',
        volume: Number(parameters.volume),
      };
    }

    // Special commands
    if (action === 'clarificationNeeded') {
      return {
        action: 'clarificationNeeded',
        message: String(parameters.message || 'I need more information'),
        suggestedOptions: parameters.suggestedOptions || parameters.options,
      };
    }

    // Unknown action - return unknown command
    return {
      action: 'unknown',
      originalText: parameters.originalText || JSON.stringify(response),
      reason: `Unrecognized action: ${action}`,
    };

  } catch (error) {
    // Parsing error - return unknown command
    console.error('[Command Parser] Error parsing response:', error);
    return {
      action: 'unknown',
      originalText: JSON.stringify(response),
      reason: error instanceof Error ? error.message : 'Failed to parse command',
    };
  }
}

/**
 * Validate that a command has all required parameters
 * @param command - The command to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateCommandStructure(command: AICommand): { valid: boolean; error?: string } {
  // Check for unknown commands
  if (command.action === 'unknown') {
    return { valid: false, error: `Unknown command: ${command.reason}` };
  }

  // Check for clarification needed
  if (command.action === 'clarificationNeeded') {
    return { valid: true }; // Clarification is a valid state
  }

  // Validate required fields based on command type
  switch (command.action) {
    case 'addPattern':
      if (!command.name) {
        return { valid: false, error: 'Pattern name is required' };
      }
      break;

    case 'deletePattern':
    case 'deleteChannel':
    case 'deleteClip':
    case 'deleteEffect':
    case 'deleteNote':
      if (!('patternId' in command || 'channelId' in command || 'clipId' in command || 'effectId' in command || 'noteId' in command)) {
        return { valid: false, error: 'ID is required for delete commands' };
      }
      break;

    case 'addNote':
      if (!command.patternId || command.pitch === undefined || command.startTick === undefined || command.durationTick === undefined) {
        return { valid: false, error: 'addNote requires patternId, pitch, startTick, and durationTick' };
      }
      break;

    case 'setBpm':
      if (command.bpm === undefined) {
        return { valid: false, error: 'BPM value is required' };
      }
      break;

    case 'setVolume':
    case 'setPan':
    case 'toggleMute':
    case 'toggleSolo':
      if (command.trackIndex === undefined) {
        return { valid: false, error: `${command.action} requires trackIndex` };
      }
      break;

    case 'addClip':
      if (!command.patternId || command.trackIndex === undefined || command.startTick === undefined) {
        return { valid: false, error: 'addClip requires patternId, trackIndex, and startTick' };
      }
      break;

    case 'addChannel':
      if (!command.type) {
        return { valid: false, error: 'Channel type is required (synth or sampler)' };
      }
      break;

    case 'addEffect':
      if (!command.effectType || command.trackIndex === undefined) {
        return { valid: false, error: 'Effect type and track index are required' };
      }
      break;
  }

  return { valid: true };
}

// ============================================
// Pulse Studio - Domain Validators
// ============================================

import type {
  Project,
  Pattern,
  Channel,
  Clip,
  Note,
  TrackEffects,
  UUID,
} from './types';

// ============================================
// Validation Result Types
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================
// Note Validation
// ============================================

export function validateNote(note: Note): ValidationResult {
  const errors: string[] = [];

  if (note.pitch < 0 || note.pitch > 127) {
    errors.push(`Note pitch must be 0-127, got ${note.pitch}`);
  }

  if (note.velocity < 0 || note.velocity > 127) {
    errors.push(`Note velocity must be 0-127, got ${note.velocity}`);
  }

  if (note.startTick < 0) {
    errors.push(`Note start tick must be >= 0, got ${note.startTick}`);
  }

  if (note.durationTick <= 0) {
    errors.push(`Note duration must be > 0, got ${note.durationTick}`);
  }

  if (note.pan !== undefined && (note.pan < -1 || note.pan > 1)) {
    errors.push(`Note pan must be -1 to 1, got ${note.pan}`);
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// Pattern Validation
// ============================================

export function validatePattern(pattern: Pattern): ValidationResult {
  const errors: string[] = [];

  if (!pattern.name || pattern.name.trim().length === 0) {
    errors.push('Pattern name is required');
  }

  if (pattern.lengthInSteps <= 0) {
    errors.push(`Pattern length must be > 0, got ${pattern.lengthInSteps}`);
  }

  if (pattern.stepsPerBeat <= 0) {
    errors.push(`Steps per beat must be > 0, got ${pattern.stepsPerBeat}`);
  }

  // Validate all notes
  pattern.notes.forEach((note, index) => {
    const noteResult = validateNote(note);
    if (!noteResult.valid) {
      errors.push(`Note ${index}: ${noteResult.errors.join(', ')}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// ============================================
// Channel Validation
// ============================================

export function validateChannel(channel: Channel): ValidationResult {
  const errors: string[] = [];

  if (!channel.name || channel.name.trim().length === 0) {
    errors.push('Channel name is required');
  }

  if (channel.volume < 0 || channel.volume > 2) {
    errors.push(`Channel volume must be 0-2, got ${channel.volume}`);
  }

  if (channel.pan < -1 || channel.pan > 1) {
    errors.push(`Channel pan must be -1 to 1, got ${channel.pan}`);
  }

  if (channel.type === 'sampler' && channel.samplerSettings) {
    if (channel.samplerSettings.rootNote < 0 || channel.samplerSettings.rootNote > 127) {
      errors.push('Sampler root note must be 0-127');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// Track Effects Validation
// ============================================

export function validateTrackEffects(effects: TrackEffects): ValidationResult {
  const errors: string[] = [];

  if (effects.volume < 0 || effects.volume > 2) {
    errors.push(`Volume must be 0-2, got ${effects.volume}`);
  }

  if (effects.pan < -1 || effects.pan > 1) {
    errors.push(`Pan must be -1 to 1, got ${effects.pan}`);
  }

  if (effects.eqLow < -12 || effects.eqLow > 12) {
    errors.push(`EQ Low must be -12 to 12 dB, got ${effects.eqLow}`);
  }

  if (effects.eqMid < -12 || effects.eqMid > 12) {
    errors.push(`EQ Mid must be -12 to 12 dB, got ${effects.eqMid}`);
  }

  if (effects.eqHigh < -12 || effects.eqHigh > 12) {
    errors.push(`EQ High must be -12 to 12 dB, got ${effects.eqHigh}`);
  }

  if (effects.compThreshold < -60 || effects.compThreshold > 0) {
    errors.push(`Compressor threshold must be -60 to 0 dB, got ${effects.compThreshold}`);
  }

  if (effects.compRatio < 1 || effects.compRatio > 20) {
    errors.push(`Compressor ratio must be 1 to 20, got ${effects.compRatio}`);
  }

  if (effects.reverbWet < 0 || effects.reverbWet > 1) {
    errors.push(`Reverb wet must be 0 to 1, got ${effects.reverbWet}`);
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// Clip Validation
// ============================================

export function validateClip(
  clip: Clip,
  patterns: Pattern[],
  _assets: unknown[]
): ValidationResult {
  const errors: string[] = [];

  if (clip.startTick < 0) {
    errors.push(`Clip start tick must be >= 0, got ${clip.startTick}`);
  }

  if (clip.durationTick <= 0) {
    errors.push(`Clip duration must be > 0, got ${clip.durationTick}`);
  }

  if (clip.trackIndex < 0) {
    errors.push(`Clip track index must be >= 0, got ${clip.trackIndex}`);
  }

  if (clip.type === 'pattern') {
    const pattern = patterns.find((p) => p.id === clip.patternId);
    if (!pattern) {
      errors.push(`Clip references non-existent pattern: ${clip.patternId}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// Project Validation
// ============================================

export function validateProject(project: Project): ValidationResult {
  const errors: string[] = [];

  if (!project.name || project.name.trim().length === 0) {
    errors.push('Project name is required');
  }

  if (project.bpm < 20 || project.bpm > 999) {
    errors.push(`BPM must be 20-999, got ${project.bpm}`);
  }

  if (project.ppq < 24 || project.ppq > 960) {
    errors.push(`PPQ must be 24-960, got ${project.ppq}`);
  }

  // Validate patterns
  project.patterns.forEach((pattern, index) => {
    const result = validatePattern(pattern);
    if (!result.valid) {
      errors.push(`Pattern ${index} (${pattern.name}): ${result.errors.join(', ')}`);
    }
  });

  // Validate channels
  project.channels.forEach((channel, index) => {
    const result = validateChannel(channel);
    if (!result.valid) {
      errors.push(`Channel ${index} (${channel.name}): ${result.errors.join(', ')}`);
    }
  });

  // Validate playlist track effects
  project.playlist.tracks.forEach((track, index) => {
    const result = validateTrackEffects(track.effects);
    if (!result.valid) {
      errors.push(`Track ${index} (${track.name}): ${result.errors.join(', ')}`);
    }
  });

  // Validate clips
  project.playlist.clips.forEach((clip, index) => {
    const result = validateClip(clip, project.patterns, project.assets);
    if (!result.valid) {
      errors.push(`Clip ${index}: ${result.errors.join(', ')}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// ============================================
// BPM Range Check
// ============================================

export function isValidBpm(bpm: number): boolean {
  return bpm >= 20 && bpm <= 999;
}

// ============================================
// MIDI Note Range Check
// ============================================

export function isValidMidiNote(note: number): boolean {
  return Number.isInteger(note) && note >= 0 && note <= 127;
}

// ============================================
// Velocity Range Check
// ============================================

export function isValidVelocity(velocity: number): boolean {
  return Number.isInteger(velocity) && velocity >= 0 && velocity <= 127;
}


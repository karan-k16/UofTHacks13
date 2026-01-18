// ============================================
// Pulse Studio - Domain Validators
// ============================================

import type {
  Project,
  Pattern,
  Channel,
  Clip,
  MixerTrack,
  Send,
  Note,
  InsertEffect,
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
// Mixer Routing Validation
// ============================================

export function validateMixerRouting(
  sends: Send[],
  tracks: MixerTrack[]
): ValidationResult {
  const errors: string[] = [];
  const trackIds = new Set(tracks.map((t) => t.id));

  // Check all send references are valid
  for (const send of sends) {
    if (!trackIds.has(send.fromTrackId)) {
      errors.push(`Send references non-existent source track: ${send.fromTrackId}`);
    }
    if (!trackIds.has(send.toTrackId)) {
      errors.push(`Send references non-existent destination track: ${send.toTrackId}`);
    }
    if (send.fromTrackId === send.toTrackId) {
      errors.push(`Send cannot route track to itself: ${send.fromTrackId}`);
    }
  }

  // Check for feedback loops using DFS
  const feedbackLoops = detectFeedbackLoops(sends, trackIds);
  if (feedbackLoops.length > 0) {
    errors.push(`Feedback loop detected: ${feedbackLoops.join(' -> ')}`);
  }

  return { valid: errors.length === 0, errors };
}

function detectFeedbackLoops(sends: Send[], trackIds: Set<UUID>): UUID[] {
  // Build adjacency list
  const graph = new Map<UUID, UUID[]>();
  for (const trackId of Array.from(trackIds)) {
    graph.set(trackId, []);
  }
  for (const send of sends) {
    const existing = graph.get(send.fromTrackId) || [];
    existing.push(send.toTrackId);
    graph.set(send.fromTrackId, existing);
  }

  // DFS for cycle detection
  const visited = new Set<UUID>();
  const recursionStack = new Set<UUID>();
  const path: UUID[] = [];

  function dfs(node: UUID): boolean {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        path.push(neighbor);
        return true;
      }
    }

    path.pop();
    recursionStack.delete(node);
    return false;
  }

  for (const trackId of Array.from(trackIds)) {
    if (!visited.has(trackId)) {
      if (dfs(trackId)) {
        return path;
      }
    }
  }

  return [];
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
// Insert Effect Validation
// ============================================

export function validateInsertEffect(effect: InsertEffect): ValidationResult {
  const errors: string[] = [];

  const validTypes = ['eq', 'compressor', 'reverb', 'delay'];
  if (!validTypes.includes(effect.type)) {
    errors.push(`Invalid effect type: ${effect.type}`);
  }

  // Type-specific parameter validation
  switch (effect.type) {
    case 'eq': {
      const params = effect.params as { lowGain?: number; midGain?: number; highGain?: number };
      if (params.lowGain !== undefined && (params.lowGain < -24 || params.lowGain > 24)) {
        errors.push('EQ gain must be between -24 and 24 dB');
      }
      break;
    }
    case 'compressor': {
      const params = effect.params as { ratio?: number };
      if (params.ratio !== undefined && (params.ratio < 1 || params.ratio > 20)) {
        errors.push('Compressor ratio must be between 1 and 20');
      }
      break;
    }
    case 'reverb': {
      const params = effect.params as { wet?: number };
      if (params.wet !== undefined && (params.wet < 0 || params.wet > 1)) {
        errors.push('Reverb wet must be between 0 and 1');
      }
      break;
    }
    case 'delay': {
      const params = effect.params as { feedback?: number };
      if (params.feedback !== undefined && (params.feedback < 0 || params.feedback > 0.95)) {
        errors.push('Delay feedback must be between 0 and 0.95');
      }
      break;
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

  // Validate mixer routing
  const routingResult = validateMixerRouting(project.mixer.sends, project.mixer.tracks);
  if (!routingResult.valid) {
    errors.push(...routingResult.errors);
  }

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


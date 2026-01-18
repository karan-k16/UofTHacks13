/**
 * Validation utilities for AI command parameters
 * Ensures all DAW operations receive valid inputs
 */

// BPM validation (20-999 range)
export function validateBPM(bpm: number): { valid: boolean; error?: string } {
  if (typeof bpm !== 'number' || isNaN(bpm)) {
    return { valid: false, error: 'BPM must be a number' };
  }
  if (bpm < 20) {
    return { valid: false, error: 'BPM too low (minimum: 20)' };
  }
  if (bpm > 999) {
    return { valid: false, error: 'BPM too high (maximum: 999)' };
  }
  return { valid: true };
}

// MIDI pitch validation (0-127 range)
export function validatePitch(pitch: number): { valid: boolean; error?: string } {
  if (typeof pitch !== 'number' || isNaN(pitch)) {
    return { valid: false, error: 'Pitch must be a number' };
  }
  if (pitch < 0) {
    return { valid: false, error: 'Pitch below valid range (minimum: 0)' };
  }
  if (pitch > 127) {
    return { valid: false, error: 'Pitch above valid range (maximum: 127)' };
  }
  if (!Number.isInteger(pitch)) {
    return { valid: false, error: 'Pitch must be an integer' };
  }
  return { valid: true };
}

// MIDI velocity validation (0-127 range)
export function validateVelocity(velocity: number): { valid: boolean; error?: string } {
  if (typeof velocity !== 'number' || isNaN(velocity)) {
    return { valid: false, error: 'Velocity must be a number' };
  }
  if (velocity < 0) {
    return { valid: false, error: 'Velocity below valid range (minimum: 0)' };
  }
  if (velocity > 127) {
    return { valid: false, error: 'Velocity above valid range (maximum: 127)' };
  }
  if (!Number.isInteger(velocity)) {
    return { valid: false, error: 'Velocity must be an integer' };
  }
  return { valid: true };
}

// Volume validation (0-1.5 range for 150% max)
export function validateVolume(volume: number): { valid: boolean; error?: string } {
  if (typeof volume !== 'number' || isNaN(volume)) {
    return { valid: false, error: 'Volume must be a number' };
  }
  if (volume < 0) {
    return { valid: false, error: 'Volume cannot be negative' };
  }
  if (volume > 1.5) {
    return { valid: false, error: 'Volume too high (maximum: 1.5 / 150%)' };
  }
  return { valid: true };
}

// Pan validation (-1 to 1 range)
export function validatePan(pan: number): { valid: boolean; error?: string } {
  if (typeof pan !== 'number' || isNaN(pan)) {
    return { valid: false, error: 'Pan must be a number' };
  }
  if (pan < -1) {
    return { valid: false, error: 'Pan too far left (minimum: -1)' };
  }
  if (pan > 1) {
    return { valid: false, error: 'Pan too far right (maximum: 1)' };
  }
  return { valid: true };
}

// Track index validation
export function validateTrackIndex(
  index: number,
  maxTracks: number
): { valid: boolean; error?: string } {
  if (typeof index !== 'number' || isNaN(index)) {
    return { valid: false, error: 'Track index must be a number' };
  }
  if (!Number.isInteger(index)) {
    return { valid: false, error: 'Track index must be an integer' };
  }
  if (index < 0) {
    return { valid: false, error: 'Track index cannot be negative' };
  }
  if (index >= maxTracks) {
    return { valid: false, error: `Track index out of range (maximum: ${maxTracks - 1})` };
  }
  return { valid: true };
}

// Tick position validation (non-negative)
export function validateTick(tick: number): { valid: boolean; error?: string } {
  if (typeof tick !== 'number' || isNaN(tick)) {
    return { valid: false, error: 'Tick must be a number' };
  }
  if (!Number.isInteger(tick)) {
    return { valid: false, error: 'Tick must be an integer' };
  }
  if (tick < 0) {
    return { valid: false, error: 'Tick cannot be negative' };
  }
  return { valid: true };
}

// Duration validation (positive)
export function validateDuration(duration: number): { valid: boolean; error?: string } {
  if (typeof duration !== 'number' || isNaN(duration)) {
    return { valid: false, error: 'Duration must be a number' };
  }
  if (!Number.isInteger(duration)) {
    return { valid: false, error: 'Duration must be an integer' };
  }
  if (duration <= 0) {
    return { valid: false, error: 'Duration must be positive' };
  }
  return { valid: true };
}

// Pattern length validation
export function validatePatternLength(lengthInSteps: number): { valid: boolean; error?: string } {
  if (typeof lengthInSteps !== 'number' || isNaN(lengthInSteps)) {
    return { valid: false, error: 'Pattern length must be a number' };
  }
  if (!Number.isInteger(lengthInSteps)) {
    return { valid: false, error: 'Pattern length must be an integer' };
  }
  if (lengthInSteps < 1) {
    return { valid: false, error: 'Pattern length must be at least 1 step' };
  }
  if (lengthInSteps > 256) {
    return { valid: false, error: 'Pattern length too long (maximum: 256 steps)' };
  }
  return { valid: true };
}

// Channel type validation
export function validateChannelType(
  type: string
): { valid: boolean; error?: string } {
  const validTypes = ['synth', 'sampler'];
  if (!validTypes.includes(type)) {
    return { 
      valid: false, 
      error: `Invalid channel type. Must be one of: ${validTypes.join(', ')}` 
    };
  }
  return { valid: true };
}

// Effect type validation
export function validateEffectType(
  effectType: string
): { valid: boolean; error?: string } {
  const validEffects = ['reverb', 'delay', 'eq', 'compressor', 'distortion'];
  if (!validEffects.includes(effectType)) {
    return { 
      valid: false, 
      error: `Invalid effect type. Must be one of: ${validEffects.join(', ')}` 
    };
  }
  return { valid: true };
}

// Generic non-empty string validation
export function validateNonEmptyString(
  value: string,
  fieldName: string = 'Field'
): { valid: boolean; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (value.trim().length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }
  return { valid: true };
}

// TrackEffects validation (based on TrackEffects interface)
export function validateTrackEffectKey(
  key: string
): { valid: boolean; error?: string } {
  const validKeys = ['volume', 'pan', 'eqLow', 'eqMid', 'eqHigh', 'compThreshold', 'compRatio', 'reverbWet'];
  if (!validKeys.includes(key)) {
    return {
      valid: false,
      error: `Invalid effect key. Must be one of: ${validKeys.join(', ')}`
    };
  }
  return { valid: true };
}

export function validateTrackEffectValue(
  key: string,
  value: number
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `Effect value for '${key}' must be a number` };
  }

  // Validate based on effect key
  switch (key) {
    case 'volume':
      // 0-2 (1 = unity gain, 2 = 200%)
      if (value < 0 || value > 2) {
        return { valid: false, error: 'Volume must be between 0 and 2 (0% to 200%)' };
      }
      break;

    case 'pan':
      // -1 to 1 (left to right)
      if (value < -1 || value > 1) {
        return { valid: false, error: 'Pan must be between -1 (left) and 1 (right)' };
      }
      break;

    case 'eqLow':
    case 'eqMid':
    case 'eqHigh':
      // -12 to +12 dB
      if (value < -12 || value > 12) {
        return { valid: false, error: `${key} must be between -12 and +12 dB` };
      }
      break;

    case 'compThreshold':
      // -60 to 0 dB
      if (value < -60 || value > 0) {
        return { valid: false, error: 'Compression threshold must be between -60 and 0 dB' };
      }
      break;

    case 'compRatio':
      // 1 to 20
      if (value < 1 || value > 20) {
        return { valid: false, error: 'Compression ratio must be between 1 and 20' };
      }
      break;

    case 'reverbWet':
      // 0 to 1 (dry to wet)
      if (value < 0 || value > 1) {
        return { valid: false, error: 'Reverb wet must be between 0 (dry) and 1 (wet)' };
      }
      break;

    default:
      return { valid: false, error: `Unknown effect key: ${key}` };
  }

  return { valid: true };
}

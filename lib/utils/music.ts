// ============================================
// Pulse Studio - Music Utilities
// ============================================

// Note names for display
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Convert MIDI note to note name
 */
export function midiToNoteName(midi: number, useFlats: boolean = false): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const names = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES;
  return `${names[noteIndex]}${octave}`;
}

/**
 * Convert note name to MIDI number
 */
export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) return 60; // Default to C4

  const noteName = match[1]?.toUpperCase() ?? 'C';
  const accidental = match[2] ?? '';
  const octave = parseInt(match[3] ?? '4', 10);

  let noteIndex = NOTE_NAMES.indexOf(noteName);
  if (noteIndex === -1) {
    noteIndex = NOTE_NAMES_FLAT.indexOf(noteName);
  }

  if (accidental === '#') noteIndex++;
  if (accidental === 'b') noteIndex--;

  // Handle wrapping
  if (noteIndex < 0) noteIndex += 12;
  if (noteIndex > 11) noteIndex -= 12;

  return (octave + 1) * 12 + noteIndex;
}

/**
 * Check if a note is a black key
 */
export function isBlackKey(midi: number): boolean {
  const noteIndex = midi % 12;
  return [1, 3, 6, 8, 10].includes(noteIndex);
}

/**
 * Get note color for piano roll (based on pitch class)
 */
export function getNoteColor(midi: number): string {
  const colors = [
    '#e74c3c', // C - Red
    '#e67e22', // C# - Orange
    '#f1c40f', // D - Yellow
    '#2ecc71', // D# - Green
    '#1abc9c', // E - Teal
    '#3498db', // F - Blue
    '#9b59b6', // F# - Purple
    '#e91e63', // G - Pink
    '#ff5722', // G# - Deep Orange
    '#795548', // A - Brown
    '#607d8b', // A# - Blue Grey
    '#9e9e9e', // B - Grey
  ];
  return colors[midi % 12] ?? '#3498db';
}

/**
 * Quantize a tick value to grid
 */
export function quantize(tick: number, gridSize: number): number {
  return Math.round(tick / gridSize) * gridSize;
}

/**
 * Get grid size from note value
 */
export function noteValueToTicks(noteValue: string, ppq: number = 96): number {
  const values: Record<string, number> = {
    '1': ppq * 4, // Whole note
    '2': ppq * 2, // Half note
    '4': ppq, // Quarter note
    '8': ppq / 2, // Eighth note
    '16': ppq / 4, // Sixteenth note
    '32': ppq / 8, // Thirty-second note
    '1t': (ppq * 4 * 2) / 3, // Whole triplet
    '2t': (ppq * 2 * 2) / 3, // Half triplet
    '4t': (ppq * 2) / 3, // Quarter triplet
    '8t': ppq / 3, // Eighth triplet
    '16t': ppq / 6, // Sixteenth triplet
    '1d': ppq * 6, // Dotted whole
    '2d': ppq * 3, // Dotted half
    '4d': (ppq * 3) / 2, // Dotted quarter
    '8d': (ppq * 3) / 4, // Dotted eighth
  };
  return values[noteValue] ?? ppq;
}

/**
 * Calculate BPM from tap tempo intervals
 */
export function calculateTapTempo(intervals: number[]): number {
  if (intervals.length === 0) return 120;
  const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return Math.round(60000 / averageInterval);
}

/**
 * Clamp BPM to valid range
 */
export function clampBpm(bpm: number): number {
  return Math.max(20, Math.min(999, Math.round(bpm)));
}

/**
 * MIDI velocity to normalized value (0-1)
 */
export function velocityToNormalized(velocity: number): number {
  return Math.max(0, Math.min(1, velocity / 127));
}

/**
 * Normalized value to MIDI velocity (0-127)
 */
export function normalizedToVelocity(normalized: number): number {
  return Math.round(Math.max(0, Math.min(127, normalized * 127)));
}

/**
 * Generate scale degrees for a given root and scale type
 */
export function getScaleDegrees(root: number, scaleType: string): number[] {
  const scales: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
    melodicMinor: [0, 2, 3, 5, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    pentatonicMajor: [0, 2, 4, 7, 9],
    pentatonicMinor: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  };

  const intervals = scales[scaleType] ?? scales.major ?? [];
  return intervals.map((interval) => (root % 12) + interval);
}

/**
 * Check if a note is in a scale
 */
export function isNoteInScale(midi: number, root: number, scaleType: string): boolean {
  const scaleDegrees = getScaleDegrees(root, scaleType);
  return scaleDegrees.includes(midi % 12);
}


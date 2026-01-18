/**
 * Melodic Patterns Library
 * 
 * Comprehensive collection of melodic patterns, scales, chords, and progressions
 * for various genres. Works alongside beatPatterns.ts for complete beat creation.
 * 
 * Timing Reference (PPQ = 96):
 * - 1 beat = 96 ticks (quarter note)
 * - 1 bar = 384 ticks (4 beats)
 * - 8th note = 48 ticks
 * - 16th note = 24 ticks
 * 
 * MIDI Pitch Reference:
 * - C4 (Middle C) = 60
 * - Each semitone = +1
 * - Each octave = +12
 */

// ============================================
// MIDI Pitch Constants
// ============================================

export const MIDI_NOTES = {
    // Octave 2 (Bass range)
    C2: 36, Cs2: 37, D2: 38, Ds2: 39, E2: 40, F2: 41, Fs2: 42, G2: 43, Gs2: 44, A2: 45, As2: 46, B2: 47,
    // Octave 3 (Low range)
    C3: 48, Cs3: 49, D3: 50, Ds3: 51, E3: 52, F3: 53, Fs3: 54, G3: 55, Gs3: 56, A3: 57, As3: 58, B3: 59,
    // Octave 4 (Middle range - most common)
    C4: 60, Cs4: 61, D4: 62, Ds4: 63, E4: 64, F4: 65, Fs4: 66, G4: 67, Gs4: 68, A4: 69, As4: 70, B4: 71,
    // Octave 5 (High range)
    C5: 72, Cs5: 73, D5: 74, Ds5: 75, E5: 76, F5: 77, Fs5: 78, G5: 79, Gs5: 80, A5: 81, As5: 82, B5: 83,
    // Octave 6 (Very high)
    C6: 84, Cs6: 85, D6: 86, Ds6: 87, E6: 88, F6: 89, Fs6: 90, G6: 91, Gs6: 92, A6: 93, As6: 94, B6: 95,
} as const;

// Note name to semitone offset from C
const NOTE_OFFSETS: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11,
};

// ============================================
// Scale Definitions
// ============================================

export type ScaleType =
    | 'major' | 'minor' | 'harmonicMinor' | 'melodicMinor'
    | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian'
    | 'pentatonicMajor' | 'pentatonicMinor' | 'blues'
    | 'chromatic';

// Scale intervals (semitones from root)
export const SCALE_INTERVALS: Record<ScaleType, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],        // W W H W W W H
    minor: [0, 2, 3, 5, 7, 8, 10],        // W H W W H W W (natural minor)
    harmonicMinor: [0, 2, 3, 5, 7, 8, 11],        // Raised 7th
    melodicMinor: [0, 2, 3, 5, 7, 9, 11],        // Raised 6th and 7th
    dorian: [0, 2, 3, 5, 7, 9, 10],        // Minor with raised 6th
    phrygian: [0, 1, 3, 5, 7, 8, 10],        // Minor with lowered 2nd
    lydian: [0, 2, 4, 6, 7, 9, 11],        // Major with raised 4th
    mixolydian: [0, 2, 4, 5, 7, 9, 10],        // Major with lowered 7th
    locrian: [0, 1, 3, 5, 6, 8, 10],        // Diminished
    pentatonicMajor: [0, 2, 4, 7, 9],               // Major without 4th and 7th
    pentatonicMinor: [0, 3, 5, 7, 10],              // Minor pentatonic (hip-hop, blues)
    blues: [0, 3, 5, 6, 7, 10],           // Pentatonic minor + blue note
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

// ============================================
// Chord Definitions
// ============================================

export type ChordType =
    | 'major' | 'minor' | 'diminished' | 'augmented'
    | 'major7' | 'minor7' | 'dominant7' | 'diminished7' | 'halfDiminished7'
    | 'sus2' | 'sus4' | 'add9' | 'minor9' | 'major9';

// Chord intervals (semitones from root)
export const CHORD_INTERVALS: Record<ChordType, number[]> = {
    major: [0, 4, 7],              // 1-3-5
    minor: [0, 3, 7],              // 1-b3-5
    diminished: [0, 3, 6],              // 1-b3-b5
    augmented: [0, 4, 8],              // 1-3-#5
    major7: [0, 4, 7, 11],          // 1-3-5-7
    minor7: [0, 3, 7, 10],          // 1-b3-5-b7
    dominant7: [0, 4, 7, 10],          // 1-3-5-b7
    diminished7: [0, 3, 6, 9],           // 1-b3-b5-bb7
    halfDiminished7: [0, 3, 6, 10],          // 1-b3-b5-b7 (m7b5)
    sus2: [0, 2, 7],              // 1-2-5
    sus4: [0, 5, 7],              // 1-4-5
    add9: [0, 4, 7, 14],          // 1-3-5-9
    minor9: [0, 3, 7, 10, 14],      // 1-b3-5-b7-9
    major9: [0, 4, 7, 11, 14],      // 1-3-5-7-9
};

// ============================================
// Types
// ============================================

export interface MelodicNote {
    pitch: number;          // MIDI pitch (0-127)
    startTick: number;      // Start position in ticks
    durationTick: number;   // Duration in ticks
    velocity: number;       // Velocity (0-127)
}

export interface ChordVoicing {
    name: string;           // e.g., "Cmaj7", "Am"
    root: number;           // MIDI root note
    type: ChordType;
    notes: number[];        // MIDI pitches for this voicing
}

export interface ChordProgression {
    id: string;
    name: string;
    genre: string[];
    key: string;            // e.g., "C", "Am"
    scale: ScaleType;
    chords: ChordInProgression[];
    description: string;
}

export interface ChordInProgression {
    degree: string;         // Roman numeral (I, ii, IV, etc.)
    chord: string;          // Chord name (Cmaj7, Am, etc.)
    durationBars: number;   // How long this chord lasts
}

export interface MelodicPattern {
    id: string;
    name: string;
    genre: string[];
    type: 'melody' | 'bass' | 'pad' | 'arpeggio' | 'chords';
    key: string;
    scale: ScaleType;
    bpmRange: { min: number; max: number };
    bars: number;
    description: string;
    suggestedPreset: string;
    notes: MelodicNote[];
    tags: string[];
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get the MIDI pitch for a note name + octave
 * @param noteName Note name (C, C#, Db, D, etc.)
 * @param octave Octave number (4 = middle C octave)
 */
export function getMidiPitch(noteName: string, octave: number): number {
    const offset = NOTE_OFFSETS[noteName];
    if (offset === undefined) {
        throw new Error(`Invalid note name: ${noteName}`);
    }
    return 12 + (octave * 12) + offset; // MIDI octave starts at C-1 = 0
}

/**
 * Get all pitches in a scale starting from a root note
 * @param rootPitch MIDI pitch of the root note
 * @param scaleType Type of scale
 * @param octaves Number of octaves to generate
 */
export function getScalePitches(rootPitch: number, scaleType: ScaleType, octaves: number = 2): number[] {
    const intervals = SCALE_INTERVALS[scaleType];
    const pitches: number[] = [];

    for (let octave = 0; octave < octaves; octave++) {
        for (const interval of intervals) {
            const pitch = rootPitch + (octave * 12) + interval;
            if (pitch <= 127) {
                pitches.push(pitch);
            }
        }
    }

    return pitches;
}

/**
 * Get chord pitches from a root note
 * @param rootPitch MIDI pitch of the root
 * @param chordType Type of chord
 * @param inversion 0 = root position, 1 = first inversion, etc.
 */
export function getChordPitches(rootPitch: number, chordType: ChordType, inversion: number = 0): number[] {
    const intervals = CHORD_INTERVALS[chordType];
    const pitches = intervals.map(interval => rootPitch + interval);

    // Apply inversion by moving lower notes up an octave
    for (let i = 0; i < inversion && i < pitches.length; i++) {
        const currentPitch = pitches[i];
        if (currentPitch !== undefined) {
            pitches[i] = currentPitch + 12;
        }
    }

    return pitches.sort((a, b) => a - b);
}

/**
 * Transpose a pattern to a different key
 * @param pattern Original pattern
 * @param semitones Number of semitones to transpose (+/-)
 */
export function transposePattern(pattern: MelodicPattern, semitones: number): MelodicPattern {
    return {
        ...pattern,
        notes: pattern.notes.map(note => ({
            ...note,
            pitch: Math.max(0, Math.min(127, note.pitch + semitones)),
        })),
    };
}

/**
 * Create notes for a chord at a specific position
 * @param rootPitch MIDI root pitch
 * @param chordType Chord type
 * @param startTick Start position
 * @param durationTick Duration
 * @param velocity Velocity (0-127)
 * @param inversion Chord inversion (0 = root position)
 */
export function createChordNotes(
    rootPitch: number,
    chordType: ChordType,
    startTick: number,
    durationTick: number,
    velocity: number = 80,
    inversion: number = 0
): MelodicNote[] {
    const pitches = getChordPitches(rootPitch, chordType, inversion);
    return pitches.map(pitch => ({
        pitch,
        startTick,
        durationTick,
        velocity,
    }));
}

/**
 * Create an arpeggiated chord pattern
 * @param rootPitch MIDI root pitch
 * @param chordType Chord type
 * @param startTick Start position
 * @param noteInterval Ticks between each note
 * @param noteDuration Duration of each note
 * @param velocity Velocity
 * @param direction 'up' | 'down' | 'upDown'
 */
export function createArpeggioNotes(
    rootPitch: number,
    chordType: ChordType,
    startTick: number,
    noteInterval: number = 24,  // 16th notes
    noteDuration: number = 48,  // 8th notes
    velocity: number = 80,
    direction: 'up' | 'down' | 'upDown' = 'up'
): MelodicNote[] {
    let pitches = getChordPitches(rootPitch, chordType);

    if (direction === 'down') {
        pitches = pitches.reverse();
    } else if (direction === 'upDown') {
        pitches = [...pitches, ...pitches.slice(1, -1).reverse()];
    }

    return pitches.map((pitch, index) => ({
        pitch,
        startTick: startTick + (index * noteInterval),
        durationTick: noteDuration,
        velocity,
    }));
}

// ============================================
// Common Chord Progressions by Genre
// ============================================

export const CHORD_PROGRESSIONS: ChordProgression[] = [
    // Pop Progressions
    {
        id: 'pop-classic',
        name: 'Pop Classic (I-V-vi-IV)',
        genre: ['pop', 'rock', 'country'],
        key: 'C',
        scale: 'major',
        description: 'The most popular chord progression in modern pop music',
        chords: [
            { degree: 'I', chord: 'C', durationBars: 1 },
            { degree: 'V', chord: 'G', durationBars: 1 },
            { degree: 'vi', chord: 'Am', durationBars: 1 },
            { degree: 'IV', chord: 'F', durationBars: 1 },
        ],
    },
    {
        id: 'pop-emotional',
        name: 'Emotional Pop (vi-IV-I-V)',
        genre: ['pop', 'ballad'],
        key: 'C',
        scale: 'major',
        description: 'Emotional, melancholic feel starting on minor chord',
        chords: [
            { degree: 'vi', chord: 'Am', durationBars: 1 },
            { degree: 'IV', chord: 'F', durationBars: 1 },
            { degree: 'I', chord: 'C', durationBars: 1 },
            { degree: 'V', chord: 'G', durationBars: 1 },
        ],
    },

    // Hip-Hop / Trap Progressions (Minor keys)
    {
        id: 'hiphop-dark',
        name: 'Dark Hip-Hop (i-VI-III-VII)',
        genre: ['hip-hop', 'trap', 'drill'],
        key: 'Am',
        scale: 'minor',
        description: 'Dark, moody progression common in trap and drill',
        chords: [
            { degree: 'i', chord: 'Am', durationBars: 1 },
            { degree: 'VI', chord: 'F', durationBars: 1 },
            { degree: 'III', chord: 'C', durationBars: 1 },
            { degree: 'VII', chord: 'G', durationBars: 1 },
        ],
    },
    {
        id: 'trap-simple',
        name: 'Simple Trap (i-VII)',
        genre: ['trap', 'hip-hop'],
        key: 'Am',
        scale: 'minor',
        description: 'Minimal two-chord trap progression',
        chords: [
            { degree: 'i', chord: 'Am', durationBars: 2 },
            { degree: 'VII', chord: 'G', durationBars: 2 },
        ],
    },
    {
        id: 'hiphop-bounce',
        name: 'Bounce Hip-Hop (i-iv-VII-III)',
        genre: ['hip-hop', 'boom-bap'],
        key: 'Am',
        scale: 'minor',
        description: 'Classic hip-hop bounce with minor feel',
        chords: [
            { degree: 'i', chord: 'Am', durationBars: 1 },
            { degree: 'iv', chord: 'Dm', durationBars: 1 },
            { degree: 'VII', chord: 'G', durationBars: 1 },
            { degree: 'III', chord: 'C', durationBars: 1 },
        ],
    },

    // Lo-Fi / Jazz Progressions
    {
        id: 'lofi-jazzy',
        name: 'Lo-Fi Jazzy (ii7-V7-Imaj7-vi7)',
        genre: ['lo-fi', 'jazz', 'chill'],
        key: 'C',
        scale: 'major',
        description: 'Jazz-influenced lo-fi progression with 7th chords',
        chords: [
            { degree: 'ii7', chord: 'Dm7', durationBars: 1 },
            { degree: 'V7', chord: 'G7', durationBars: 1 },
            { degree: 'Imaj7', chord: 'Cmaj7', durationBars: 1 },
            { degree: 'vi7', chord: 'Am7', durationBars: 1 },
        ],
    },
    {
        id: 'lofi-chill',
        name: 'Chill Lo-Fi (Imaj7-vi7-ii7-V7)',
        genre: ['lo-fi', 'chill', 'study'],
        key: 'C',
        scale: 'major',
        description: 'Relaxed lo-fi with smooth transitions',
        chords: [
            { degree: 'Imaj7', chord: 'Cmaj7', durationBars: 1 },
            { degree: 'vi7', chord: 'Am7', durationBars: 1 },
            { degree: 'ii7', chord: 'Dm7', durationBars: 1 },
            { degree: 'V7', chord: 'G7', durationBars: 1 },
        ],
    },

    // EDM / House Progressions
    {
        id: 'house-uplifting',
        name: 'Uplifting House (I-V-vi-IV)',
        genre: ['house', 'edm', 'dance'],
        key: 'C',
        scale: 'major',
        description: 'Classic uplifting house progression',
        chords: [
            { degree: 'I', chord: 'C', durationBars: 1 },
            { degree: 'V', chord: 'G', durationBars: 1 },
            { degree: 'vi', chord: 'Am', durationBars: 1 },
            { degree: 'IV', chord: 'F', durationBars: 1 },
        ],
    },
    {
        id: 'edm-anthemic',
        name: 'Anthemic EDM (vi-IV-I-V)',
        genre: ['edm', 'progressive-house', 'trance'],
        key: 'Am',
        scale: 'minor',
        description: 'Big room anthemic feel',
        chords: [
            { degree: 'vi', chord: 'Am', durationBars: 1 },
            { degree: 'IV', chord: 'F', durationBars: 1 },
            { degree: 'I', chord: 'C', durationBars: 1 },
            { degree: 'V', chord: 'G', durationBars: 1 },
        ],
    },

    // R&B / Soul Progressions
    {
        id: 'rnb-smooth',
        name: 'Smooth R&B (Imaj7-iii7-vi7-ii7-V7)',
        genre: ['r&b', 'soul', 'neo-soul'],
        key: 'C',
        scale: 'major',
        description: 'Smooth R&B with rich harmony',
        chords: [
            { degree: 'Imaj7', chord: 'Cmaj7', durationBars: 1 },
            { degree: 'iii7', chord: 'Em7', durationBars: 0.5 },
            { degree: 'vi7', chord: 'Am7', durationBars: 0.5 },
            { degree: 'ii7', chord: 'Dm7', durationBars: 1 },
            { degree: 'V7', chord: 'G7', durationBars: 1 },
        ],
    },
];

// ============================================
// Pre-built Melodic Patterns
// ============================================

export const MELODIC_PATTERNS: MelodicPattern[] = [
    // ============================================
    // HIP-HOP / TRAP MELODIES
    // ============================================
    {
        id: 'trap-dark-melody',
        name: 'Dark Trap Melody',
        genre: ['trap', 'hip-hop', 'drill'],
        type: 'melody',
        key: 'Am',
        scale: 'pentatonicMinor',
        bpmRange: { min: 130, max: 150 },
        bars: 4,
        description: 'Dark, sparse trap melody using minor pentatonic',
        suggestedPreset: 'lead',
        tags: ['dark', 'sparse', 'minor'],
        notes: [
            // Bar 1 - Simple phrase
            { pitch: 69, startTick: 0, durationTick: 192, velocity: 90 },      // A4
            { pitch: 67, startTick: 192, durationTick: 96, velocity: 85 },     // G4
            { pitch: 64, startTick: 288, durationTick: 96, velocity: 80 },     // E4
            // Bar 2 - Repeat with variation
            { pitch: 69, startTick: 384, durationTick: 144, velocity: 90 },    // A4
            { pitch: 72, startTick: 528, durationTick: 96, velocity: 95 },     // C5
            { pitch: 69, startTick: 624, durationTick: 144, velocity: 85 },    // A4
            // Bar 3 - Descending
            { pitch: 67, startTick: 768, durationTick: 96, velocity: 85 },     // G4
            { pitch: 64, startTick: 864, durationTick: 96, velocity: 80 },     // E4
            { pitch: 60, startTick: 960, durationTick: 192, velocity: 75 },    // C4
            // Bar 4 - Resolution
            { pitch: 57, startTick: 1152, durationTick: 384, velocity: 85 },   // A3 (octave down)
        ],
    },
    {
        id: 'trap-808-bass',
        name: 'Trap 808 Bass Line',
        genre: ['trap', 'hip-hop'],
        type: 'bass',
        key: 'Am',
        scale: 'minor',
        bpmRange: { min: 130, max: 150 },
        bars: 4,
        description: 'Heavy 808 bass pattern for trap beats',
        suggestedPreset: 'subBass',
        tags: ['808', 'heavy', 'sub'],
        notes: [
            // Bar 1
            { pitch: 33, startTick: 0, durationTick: 288, velocity: 110 },     // A1 (long slide)
            { pitch: 33, startTick: 288, durationTick: 96, velocity: 100 },    // A1
            // Bar 2
            { pitch: 36, startTick: 384, durationTick: 192, velocity: 105 },   // C2
            { pitch: 31, startTick: 576, durationTick: 192, velocity: 100 },   // G1
            // Bar 3
            { pitch: 33, startTick: 768, durationTick: 288, velocity: 110 },   // A1
            { pitch: 36, startTick: 1056, durationTick: 96, velocity: 95 },    // C2
            // Bar 4
            { pitch: 31, startTick: 1152, durationTick: 192, velocity: 100 },  // G1
            { pitch: 33, startTick: 1344, durationTick: 192, velocity: 110 },  // A1
        ],
    },

    // ============================================
    // LO-FI PATTERNS
    // ============================================
    {
        id: 'lofi-piano-chords',
        name: 'Lo-Fi Piano Chords',
        genre: ['lo-fi', 'chill', 'study'],
        type: 'chords',
        key: 'C',
        scale: 'major',
        bpmRange: { min: 70, max: 90 },
        bars: 4,
        description: 'Warm, jazzy piano chords for lo-fi beats',
        suggestedPreset: 'piano',
        tags: ['jazzy', 'warm', 'chords', '7ths'],
        notes: [
            // Bar 1 - Dm7 (ii)
            { pitch: 50, startTick: 0, durationTick: 336, velocity: 70 },      // D3
            { pitch: 53, startTick: 0, durationTick: 336, velocity: 65 },      // F3
            { pitch: 57, startTick: 0, durationTick: 336, velocity: 65 },      // A3
            { pitch: 60, startTick: 0, durationTick: 336, velocity: 60 },      // C4
            // Bar 2 - G7 (V)
            { pitch: 43, startTick: 384, durationTick: 336, velocity: 70 },    // G2
            { pitch: 47, startTick: 384, durationTick: 336, velocity: 65 },    // B2
            { pitch: 50, startTick: 384, durationTick: 336, velocity: 65 },    // D3
            { pitch: 53, startTick: 384, durationTick: 336, velocity: 60 },    // F3
            // Bar 3 - Cmaj7 (I)
            { pitch: 48, startTick: 768, durationTick: 336, velocity: 70 },    // C3
            { pitch: 52, startTick: 768, durationTick: 336, velocity: 65 },    // E3
            { pitch: 55, startTick: 768, durationTick: 336, velocity: 65 },    // G3
            { pitch: 59, startTick: 768, durationTick: 336, velocity: 60 },    // B3
            // Bar 4 - Am7 (vi)
            { pitch: 45, startTick: 1152, durationTick: 336, velocity: 70 },   // A2
            { pitch: 48, startTick: 1152, durationTick: 336, velocity: 65 },   // C3
            { pitch: 52, startTick: 1152, durationTick: 336, velocity: 65 },   // E3
            { pitch: 55, startTick: 1152, durationTick: 336, velocity: 60 },   // G3
        ],
    },
    {
        id: 'lofi-melody-simple',
        name: 'Simple Lo-Fi Melody',
        genre: ['lo-fi', 'chill'],
        type: 'melody',
        key: 'C',
        scale: 'major',
        bpmRange: { min: 70, max: 90 },
        bars: 4,
        description: 'Soft, nostalgic melody for lo-fi hip-hop',
        suggestedPreset: 'electricPiano',
        tags: ['soft', 'nostalgic', 'simple'],
        notes: [
            // Bar 1
            { pitch: 64, startTick: 48, durationTick: 144, velocity: 65 },     // E4
            { pitch: 67, startTick: 192, durationTick: 96, velocity: 60 },     // G4
            { pitch: 69, startTick: 336, durationTick: 48, velocity: 55 },     // A4
            // Bar 2
            { pitch: 67, startTick: 432, durationTick: 144, velocity: 65 },    // G4
            { pitch: 64, startTick: 576, durationTick: 192, velocity: 60 },    // E4
            // Bar 3
            { pitch: 60, startTick: 816, durationTick: 144, velocity: 65 },    // C4
            { pitch: 62, startTick: 960, durationTick: 96, velocity: 60 },     // D4
            { pitch: 64, startTick: 1104, durationTick: 48, velocity: 55 },    // E4
            // Bar 4 - Rest with final note
            { pitch: 60, startTick: 1296, durationTick: 240, velocity: 55 },   // C4
        ],
    },

    // ============================================
    // HOUSE / EDM PATTERNS
    // ============================================
    {
        id: 'house-chord-stabs',
        name: 'House Chord Stabs',
        genre: ['house', 'edm', 'dance'],
        type: 'chords',
        key: 'Am',
        scale: 'minor',
        bpmRange: { min: 120, max: 130 },
        bars: 4,
        description: 'Punchy chord stabs for house music',
        suggestedPreset: 'organ',
        tags: ['stabs', 'punchy', 'offbeat'],
        notes: [
            // Bar 1 - Am stabs (offbeat)
            { pitch: 57, startTick: 48, durationTick: 36, velocity: 95 },      // A3
            { pitch: 60, startTick: 48, durationTick: 36, velocity: 90 },      // C4
            { pitch: 64, startTick: 48, durationTick: 36, velocity: 90 },      // E4
            { pitch: 57, startTick: 144, durationTick: 36, velocity: 85 },
            { pitch: 60, startTick: 144, durationTick: 36, velocity: 80 },
            { pitch: 64, startTick: 144, durationTick: 36, velocity: 80 },
            { pitch: 57, startTick: 240, durationTick: 36, velocity: 95 },
            { pitch: 60, startTick: 240, durationTick: 36, velocity: 90 },
            { pitch: 64, startTick: 240, durationTick: 36, velocity: 90 },
            { pitch: 57, startTick: 336, durationTick: 36, velocity: 85 },
            { pitch: 60, startTick: 336, durationTick: 36, velocity: 80 },
            { pitch: 64, startTick: 336, durationTick: 36, velocity: 80 },
            // Bar 2 - F stabs
            { pitch: 53, startTick: 432, durationTick: 36, velocity: 95 },     // F3
            { pitch: 57, startTick: 432, durationTick: 36, velocity: 90 },     // A3
            { pitch: 60, startTick: 432, durationTick: 36, velocity: 90 },     // C4
            { pitch: 53, startTick: 528, durationTick: 36, velocity: 85 },
            { pitch: 57, startTick: 528, durationTick: 36, velocity: 80 },
            { pitch: 60, startTick: 528, durationTick: 36, velocity: 80 },
            { pitch: 53, startTick: 624, durationTick: 36, velocity: 95 },
            { pitch: 57, startTick: 624, durationTick: 36, velocity: 90 },
            { pitch: 60, startTick: 624, durationTick: 36, velocity: 90 },
            { pitch: 53, startTick: 720, durationTick: 36, velocity: 85 },
            { pitch: 57, startTick: 720, durationTick: 36, velocity: 80 },
            { pitch: 60, startTick: 720, durationTick: 36, velocity: 80 },
            // Bars 3-4 similar pattern...
            { pitch: 48, startTick: 816, durationTick: 36, velocity: 95 },     // C3
            { pitch: 52, startTick: 816, durationTick: 36, velocity: 90 },
            { pitch: 55, startTick: 816, durationTick: 36, velocity: 90 },
            { pitch: 48, startTick: 912, durationTick: 36, velocity: 85 },
            { pitch: 52, startTick: 912, durationTick: 36, velocity: 80 },
            { pitch: 55, startTick: 912, durationTick: 36, velocity: 80 },
            { pitch: 55, startTick: 1200, durationTick: 36, velocity: 95 },    // G3
            { pitch: 59, startTick: 1200, durationTick: 36, velocity: 90 },
            { pitch: 62, startTick: 1200, durationTick: 36, velocity: 90 },
            { pitch: 55, startTick: 1296, durationTick: 36, velocity: 85 },
            { pitch: 59, startTick: 1296, durationTick: 36, velocity: 80 },
            { pitch: 62, startTick: 1296, durationTick: 36, velocity: 80 },
        ],
    },
    {
        id: 'house-bass-driving',
        name: 'Driving House Bass',
        genre: ['house', 'tech-house'],
        type: 'bass',
        key: 'Am',
        scale: 'minor',
        bpmRange: { min: 120, max: 128 },
        bars: 4,
        description: 'Driving bass line for house music',
        suggestedPreset: 'bass',
        tags: ['driving', 'groovy', 'root-notes'],
        notes: [
            // Bar 1 - A root pumping
            { pitch: 45, startTick: 0, durationTick: 72, velocity: 100 },      // A2
            { pitch: 45, startTick: 96, durationTick: 72, velocity: 95 },
            { pitch: 45, startTick: 192, durationTick: 72, velocity: 100 },
            { pitch: 45, startTick: 288, durationTick: 72, velocity: 95 },
            // Bar 2 - F root
            { pitch: 41, startTick: 384, durationTick: 72, velocity: 100 },    // F2
            { pitch: 41, startTick: 480, durationTick: 72, velocity: 95 },
            { pitch: 41, startTick: 576, durationTick: 72, velocity: 100 },
            { pitch: 41, startTick: 672, durationTick: 72, velocity: 95 },
            // Bar 3 - C root
            { pitch: 36, startTick: 768, durationTick: 72, velocity: 100 },    // C2
            { pitch: 36, startTick: 864, durationTick: 72, velocity: 95 },
            { pitch: 36, startTick: 960, durationTick: 72, velocity: 100 },
            { pitch: 36, startTick: 1056, durationTick: 72, velocity: 95 },
            // Bar 4 - G root
            { pitch: 43, startTick: 1152, durationTick: 72, velocity: 100 },   // G2
            { pitch: 43, startTick: 1248, durationTick: 72, velocity: 95 },
            { pitch: 43, startTick: 1344, durationTick: 72, velocity: 100 },
            { pitch: 43, startTick: 1440, durationTick: 72, velocity: 95 },
        ],
    },
    {
        id: 'edm-arpeggio',
        name: 'EDM Arpeggio',
        genre: ['edm', 'trance', 'progressive-house'],
        type: 'arpeggio',
        key: 'Am',
        scale: 'minor',
        bpmRange: { min: 125, max: 140 },
        bars: 4,
        description: 'Classic EDM arpeggiated pattern',
        suggestedPreset: 'pluck',
        tags: ['arpeggio', 'uplifting', 'synth'],
        notes: [
            // Bar 1 - Am arpeggio (16th notes)
            { pitch: 57, startTick: 0, durationTick: 24, velocity: 85 },       // A3
            { pitch: 60, startTick: 24, durationTick: 24, velocity: 80 },      // C4
            { pitch: 64, startTick: 48, durationTick: 24, velocity: 85 },      // E4
            { pitch: 69, startTick: 72, durationTick: 24, velocity: 90 },      // A4
            { pitch: 64, startTick: 96, durationTick: 24, velocity: 85 },
            { pitch: 60, startTick: 120, durationTick: 24, velocity: 80 },
            { pitch: 57, startTick: 144, durationTick: 24, velocity: 75 },
            { pitch: 60, startTick: 168, durationTick: 24, velocity: 80 },
            { pitch: 64, startTick: 192, durationTick: 24, velocity: 85 },
            { pitch: 69, startTick: 216, durationTick: 24, velocity: 90 },
            { pitch: 64, startTick: 240, durationTick: 24, velocity: 85 },
            { pitch: 60, startTick: 264, durationTick: 24, velocity: 80 },
            { pitch: 57, startTick: 288, durationTick: 24, velocity: 75 },
            { pitch: 60, startTick: 312, durationTick: 24, velocity: 80 },
            { pitch: 64, startTick: 336, durationTick: 24, velocity: 85 },
            { pitch: 69, startTick: 360, durationTick: 24, velocity: 90 },
            // Bar 2 - F arpeggio
            { pitch: 53, startTick: 384, durationTick: 24, velocity: 85 },     // F3
            { pitch: 57, startTick: 408, durationTick: 24, velocity: 80 },     // A3
            { pitch: 60, startTick: 432, durationTick: 24, velocity: 85 },     // C4
            { pitch: 65, startTick: 456, durationTick: 24, velocity: 90 },     // F4
            { pitch: 60, startTick: 480, durationTick: 24, velocity: 85 },
            { pitch: 57, startTick: 504, durationTick: 24, velocity: 80 },
            { pitch: 53, startTick: 528, durationTick: 24, velocity: 75 },
            { pitch: 57, startTick: 552, durationTick: 24, velocity: 80 },
            { pitch: 60, startTick: 576, durationTick: 24, velocity: 85 },
            { pitch: 65, startTick: 600, durationTick: 24, velocity: 90 },
            { pitch: 60, startTick: 624, durationTick: 24, velocity: 85 },
            { pitch: 57, startTick: 648, durationTick: 24, velocity: 80 },
            { pitch: 53, startTick: 672, durationTick: 24, velocity: 75 },
            { pitch: 57, startTick: 696, durationTick: 24, velocity: 80 },
            { pitch: 60, startTick: 720, durationTick: 24, velocity: 85 },
            { pitch: 65, startTick: 744, durationTick: 24, velocity: 90 },
            // Bars 3-4 - C and G arpeggios
            { pitch: 48, startTick: 768, durationTick: 24, velocity: 85 },
            { pitch: 52, startTick: 792, durationTick: 24, velocity: 80 },
            { pitch: 55, startTick: 816, durationTick: 24, velocity: 85 },
            { pitch: 60, startTick: 840, durationTick: 24, velocity: 90 },
            { pitch: 55, startTick: 864, durationTick: 24, velocity: 85 },
            { pitch: 52, startTick: 888, durationTick: 24, velocity: 80 },
            { pitch: 48, startTick: 912, durationTick: 24, velocity: 75 },
            { pitch: 52, startTick: 936, durationTick: 24, velocity: 80 },
            { pitch: 55, startTick: 960, durationTick: 24, velocity: 85 },
            { pitch: 60, startTick: 984, durationTick: 24, velocity: 90 },
            { pitch: 55, startTick: 1008, durationTick: 24, velocity: 85 },
            { pitch: 52, startTick: 1032, durationTick: 24, velocity: 80 },
            { pitch: 48, startTick: 1056, durationTick: 24, velocity: 75 },
            { pitch: 52, startTick: 1080, durationTick: 24, velocity: 80 },
            { pitch: 55, startTick: 1104, durationTick: 24, velocity: 85 },
            { pitch: 60, startTick: 1128, durationTick: 24, velocity: 90 },
            // G
            { pitch: 43, startTick: 1152, durationTick: 24, velocity: 85 },
            { pitch: 47, startTick: 1176, durationTick: 24, velocity: 80 },
            { pitch: 50, startTick: 1200, durationTick: 24, velocity: 85 },
            { pitch: 55, startTick: 1224, durationTick: 24, velocity: 90 },
            { pitch: 50, startTick: 1248, durationTick: 24, velocity: 85 },
            { pitch: 47, startTick: 1272, durationTick: 24, velocity: 80 },
            { pitch: 43, startTick: 1296, durationTick: 24, velocity: 75 },
            { pitch: 47, startTick: 1320, durationTick: 24, velocity: 80 },
            { pitch: 50, startTick: 1344, durationTick: 24, velocity: 85 },
            { pitch: 55, startTick: 1368, durationTick: 24, velocity: 90 },
            { pitch: 50, startTick: 1392, durationTick: 24, velocity: 85 },
            { pitch: 47, startTick: 1416, durationTick: 24, velocity: 80 },
            { pitch: 43, startTick: 1440, durationTick: 24, velocity: 75 },
            { pitch: 47, startTick: 1464, durationTick: 24, velocity: 80 },
            { pitch: 50, startTick: 1488, durationTick: 24, velocity: 85 },
            { pitch: 55, startTick: 1512, durationTick: 24, velocity: 90 },
        ],
    },

    // ============================================
    // POP PATTERNS
    // ============================================
    {
        id: 'pop-piano-ballad',
        name: 'Pop Piano Ballad',
        genre: ['pop', 'ballad'],
        type: 'chords',
        key: 'C',
        scale: 'major',
        bpmRange: { min: 65, max: 85 },
        bars: 4,
        description: 'Emotional piano chords for pop ballads',
        suggestedPreset: 'piano',
        tags: ['emotional', 'ballad', 'sustained'],
        notes: [
            // Bar 1 - C major (arpeggiated entrance)
            { pitch: 48, startTick: 0, durationTick: 288, velocity: 70 },      // C3
            { pitch: 52, startTick: 48, durationTick: 240, velocity: 65 },     // E3
            { pitch: 55, startTick: 96, durationTick: 192, velocity: 60 },     // G3
            { pitch: 60, startTick: 144, durationTick: 144, velocity: 55 },    // C4
            // Bar 2 - G major
            { pitch: 43, startTick: 384, durationTick: 288, velocity: 70 },    // G2
            { pitch: 47, startTick: 432, durationTick: 240, velocity: 65 },    // B2
            { pitch: 50, startTick: 480, durationTick: 192, velocity: 60 },    // D3
            { pitch: 55, startTick: 528, durationTick: 144, velocity: 55 },    // G3
            // Bar 3 - Am
            { pitch: 45, startTick: 768, durationTick: 288, velocity: 75 },    // A2
            { pitch: 48, startTick: 816, durationTick: 240, velocity: 70 },    // C3
            { pitch: 52, startTick: 864, durationTick: 192, velocity: 65 },    // E3
            { pitch: 57, startTick: 912, durationTick: 144, velocity: 60 },    // A3
            // Bar 4 - F major
            { pitch: 41, startTick: 1152, durationTick: 288, velocity: 70 },   // F2
            { pitch: 45, startTick: 1200, durationTick: 240, velocity: 65 },   // A2
            { pitch: 48, startTick: 1248, durationTick: 192, velocity: 60 },   // C3
            { pitch: 53, startTick: 1296, durationTick: 144, velocity: 55 },   // F3
        ],
    },

    // ============================================
    // PAD PATTERNS
    // ============================================
    {
        id: 'ambient-pad',
        name: 'Ambient Pad',
        genre: ['ambient', 'chill', 'lo-fi'],
        type: 'pad',
        key: 'C',
        scale: 'major',
        bpmRange: { min: 60, max: 100 },
        bars: 4,
        description: 'Slow-evolving ambient pad texture',
        suggestedPreset: 'warmPad',
        tags: ['ambient', 'atmospheric', 'slow'],
        notes: [
            // Long sustained chords that evolve slowly
            // Bar 1-2 - Cmaj7
            { pitch: 48, startTick: 0, durationTick: 768, velocity: 55 },      // C3
            { pitch: 52, startTick: 0, durationTick: 768, velocity: 50 },      // E3
            { pitch: 55, startTick: 0, durationTick: 768, velocity: 50 },      // G3
            { pitch: 59, startTick: 0, durationTick: 768, velocity: 45 },      // B3
            // Bar 3-4 - Am7
            { pitch: 45, startTick: 768, durationTick: 768, velocity: 55 },    // A2
            { pitch: 48, startTick: 768, durationTick: 768, velocity: 50 },    // C3
            { pitch: 52, startTick: 768, durationTick: 768, velocity: 50 },    // E3
            { pitch: 55, startTick: 768, durationTick: 768, velocity: 45 },    // G3
        ],
    },
];

// ============================================
// Pattern Retrieval Functions
// ============================================

/**
 * Get melodic patterns matching a genre
 */
export function getPatternsByGenre(genre: string): MelodicPattern[] {
    const normalizedGenre = genre.toLowerCase();
    return MELODIC_PATTERNS.filter(pattern =>
        pattern.genre.some(g => g.toLowerCase().includes(normalizedGenre) ||
            normalizedGenre.includes(g.toLowerCase()))
    );
}

/**
 * Get melodic patterns by type
 */
export function getPatternsByType(type: MelodicPattern['type']): MelodicPattern[] {
    return MELODIC_PATTERNS.filter(pattern => pattern.type === type);
}

/**
 * Get chord progressions matching a genre
 */
export function getProgressionsByGenre(genre: string): ChordProgression[] {
    const normalizedGenre = genre.toLowerCase();
    return CHORD_PROGRESSIONS.filter(prog =>
        prog.genre.some(g => g.toLowerCase().includes(normalizedGenre) ||
            normalizedGenre.includes(g.toLowerCase()))
    );
}

/**
 * Get a random pattern of a specific type for a genre
 */
export function getRandomPattern(genre: string, type?: MelodicPattern['type']): MelodicPattern | null {
    let patterns = getPatternsByGenre(genre);
    if (type) {
        patterns = patterns.filter(p => p.type === type);
    }
    if (patterns.length === 0) return null;
    return patterns[Math.floor(Math.random() * patterns.length)] || null;
}

// ============================================
// Format for AI Context
// ============================================

/**
 * Generate a summary of available melodic patterns for the AI system prompt
 */
export function getMelodicPatternSummary(): string {
    const lines: string[] = [];

    lines.push('## MELODIC PATTERN LIBRARY');
    lines.push('');
    lines.push('Available pre-built melodic patterns by genre:');
    lines.push('');

    // Group patterns by genre
    const byGenre: Record<string, MelodicPattern[]> = {};
    for (const pattern of MELODIC_PATTERNS) {
        for (const genre of pattern.genre) {
            if (!byGenre[genre]) byGenre[genre] = [];
            byGenre[genre].push(pattern);
        }
    }

    for (const [genre, patterns] of Object.entries(byGenre)) {
        lines.push(`### ${genre.toUpperCase()}`);
        for (const pattern of patterns) {
            lines.push(`- **${pattern.name}** (${pattern.type}): ${pattern.description} | Key: ${pattern.key} | Preset: ${pattern.suggestedPreset}`);
        }
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Generate chord progression reference for AI context
 */
export function getChordProgressionSummary(): string {
    const lines: string[] = [];

    lines.push('## CHORD PROGRESSIONS BY GENRE');
    lines.push('');

    for (const prog of CHORD_PROGRESSIONS) {
        const chordStr = prog.chords.map(c => c.chord).join(' - ');
        lines.push(`**${prog.name}** (${prog.genre.join(', ')})`);
        lines.push(`  ${chordStr}`);
        lines.push(`  ${prog.description}`);
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Generate pitch reference for AI context
 */
export function getPitchReference(): string {
    return `## MIDI PITCH REFERENCE

### Quick Reference (Middle C = 60)
| Note | Oct 2 | Oct 3 | Oct 4 | Oct 5 |
|------|-------|-------|-------|-------|
| C    | 36    | 48    | 60    | 72    |
| D    | 38    | 50    | 62    | 74    |
| E    | 40    | 52    | 64    | 76    |
| F    | 41    | 53    | 65    | 77    |
| G    | 43    | 55    | 67    | 79    |
| A    | 45    | 57    | 69    | 81    |
| B    | 47    | 59    | 71    | 83    |

### Common Scales (starting from C4 = 60)
- **C Major**: 60, 62, 64, 65, 67, 69, 71, 72
- **C Minor**: 60, 62, 63, 65, 67, 68, 70, 72
- **C Pentatonic Minor** (great for hip-hop): 60, 63, 65, 67, 70, 72
- **A Minor** (relative to C): 57, 59, 60, 62, 64, 65, 67, 69
- **A Pentatonic Minor**: 57, 60, 62, 64, 67, 69

### Bass Register (for bass lines)
- A1 = 33, C2 = 36, E2 = 40, G2 = 43, A2 = 45
- Use pitches 33-48 for deep bass

### Melody Register (for leads)
- Use pitches 60-84 for melodies (C4-C6)`;
}

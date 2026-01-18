/**
 * Beat Patterns Library
 * 
 * Comprehensive collection of beat patterns for various genres.
 * Each pattern defines exact tick positions for drum elements.
 * 
 * Timing Reference (PPQ = 96):
 * - 1 beat = 96 ticks (quarter note)
 * - 1 bar = 384 ticks (4 beats)
 * - 8th note = 48 ticks
 * - 16th note = 24 ticks
 * - Triplet = 32 ticks
 */

export interface DrumHit {
    tick: number;
    velocity?: number; // 0-127, defaults to 100
}

export interface PatternTrack {
    instrument: 'kick' | 'snare' | 'clap' | 'hihat' | 'hihat-open' | 'tom' | 'cymbal' | 'perc';
    subcategory: string; // Maps to sample subcategory
    hits: DrumHit[];
}

export interface BeatPattern {
    id: string;
    name: string;
    genre: string;
    subgenre?: string;
    bpmRange: { min: number; max: number };
    defaultBpm: number;
    bars: number; // Pattern length in bars
    description: string;
    tracks: PatternTrack[];
    tags: string[];
}

// Helper to generate hits at regular intervals
function regularHits(start: number, interval: number, count: number, velocity = 100): DrumHit[] {
    return Array.from({ length: count }, (_, i) => ({ tick: start + i * interval, velocity }));
}

// Helper to generate hits at specific beat positions within a bar
function beatsToTicks(bars: number, beats: number[]): number[] {
    const ticks: number[] = [];
    for (let bar = 0; bar < bars; bar++) {
        for (const beat of beats) {
            ticks.push(bar * 384 + beat * 96);
        }
    }
    return ticks;
}

// Helper to convert tick array to DrumHit array
function ticksToHits(ticks: number[], velocity = 100): DrumHit[] {
    return ticks.map(tick => ({ tick, velocity }));
}

// ============================================
// HIP-HOP & RAP PATTERNS
// ============================================

export const boomBapClassic: BeatPattern = {
    id: 'boom-bap-classic',
    name: 'Boom Bap Classic',
    genre: 'Hip-Hop',
    subgenre: 'Boom Bap',
    bpmRange: { min: 85, max: 95 },
    defaultBpm: 90,
    bars: 4,
    description: 'Classic NYC 90s hip-hop feel with punchy kicks and snappy snares',
    tags: ['90s', 'nyc', 'golden-era', 'sample-based'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 144, velocity: 90 }, // 2-and
                { tick: 384, velocity: 110 },
                { tick: 528, velocity: 90 },
                { tick: 768, velocity: 110 },
                { tick: 912, velocity: 90 },
                { tick: 1152, velocity: 110 },
                { tick: 1296, velocity: 90 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 80), // 8th notes for 4 bars
        },
    ],
};

export const boomBapLazy: BeatPattern = {
    id: 'boom-bap-lazy',
    name: 'Boom Bap Lazy',
    genre: 'Hip-Hop',
    subgenre: 'Boom Bap',
    bpmRange: { min: 80, max: 90 },
    defaultBpm: 85,
    bars: 4,
    description: 'Laid back boom bap with swing and ghost notes',
    tags: ['chill', 'swing', 'jazzy'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 100 },
                { tick: 192, velocity: 95 },
                { tick: 384, velocity: 100 },
                { tick: 576, velocity: 90 },
                { tick: 768, velocity: 100 },
                { tick: 960, velocity: 95 },
                { tick: 1152, velocity: 100 },
                { tick: 1344, velocity: 90 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: [
                ...regularHits(0, 48, 32, 70),
                // Ghost notes
                { tick: 24, velocity: 40 },
                { tick: 408, velocity: 40 },
                { tick: 792, velocity: 40 },
                { tick: 1176, velocity: 40 },
            ],
        },
    ],
};

export const trapAtlanta: BeatPattern = {
    id: 'trap-atlanta',
    name: 'Trap Atlanta',
    genre: 'Hip-Hop',
    subgenre: 'Trap',
    bpmRange: { min: 130, max: 145 },
    defaultBpm: 140,
    bars: 4,
    description: 'Atlanta trap with 808s, hi-hat rolls, and halftime snare',
    tags: ['808', 'atlanta', 'modern', 'hi-hat-rolls'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 127 },
                { tick: 288, velocity: 110 },
                { tick: 384, velocity: 127 },
                { tick: 576, velocity: 100 },
                { tick: 768, velocity: 127 },
                { tick: 1056, velocity: 110 },
                { tick: 1152, velocity: 127 },
                { tick: 1344, velocity: 100 },
            ],
        },
        {
            instrument: 'clap',
            subcategory: 'clap',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: [
                // 16th notes with velocity variations for roll effect
                ...regularHits(0, 24, 64, 90),
                // Extra 32nd notes for rolls
                { tick: 72, velocity: 60 },
                { tick: 84, velocity: 70 },
                { tick: 168, velocity: 60 },
                { tick: 180, velocity: 70 },
                { tick: 456, velocity: 60 },
                { tick: 468, velocity: 70 },
                { tick: 840, velocity: 60 },
                { tick: 852, velocity: 70 },
            ],
        },
        {
            instrument: 'hihat-open',
            subcategory: 'hihat',
            hits: [
                { tick: 144, velocity: 80 },
                { tick: 528, velocity: 80 },
                { tick: 912, velocity: 80 },
                { tick: 1296, velocity: 80 },
            ],
        },
    ],
};

export const trapDark: BeatPattern = {
    id: 'trap-dark',
    name: 'Trap Dark',
    genre: 'Hip-Hop',
    subgenre: 'Trap',
    bpmRange: { min: 140, max: 160 },
    defaultBpm: 150,
    bars: 4,
    description: 'Dark, aggressive trap with heavy 808s and snare rolls',
    tags: ['dark', 'aggressive', '808', 'hard'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 127 },
                { tick: 192, velocity: 127 },
                { tick: 336, velocity: 100 },
                { tick: 384, velocity: 127 },
                { tick: 576, velocity: 127 },
                { tick: 768, velocity: 127 },
                { tick: 912, velocity: 100 },
                { tick: 1152, velocity: 127 },
                { tick: 1344, velocity: 127 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
                // Snare roll at end
                { tick: 1464, velocity: 90 },
                { tick: 1488, velocity: 100 },
                { tick: 1512, velocity: 120 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 85),
        },
    ],
};

export const drillUK: BeatPattern = {
    id: 'drill-uk',
    name: 'UK Drill',
    genre: 'Hip-Hop',
    subgenre: 'Drill',
    bpmRange: { min: 140, max: 145 },
    defaultBpm: 142,
    bars: 4,
    description: 'UK drill with sliding 808s and complex hi-hat patterns',
    tags: ['uk', 'drill', 'dark', '808'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 127 },
                { tick: 144, velocity: 100 },
                { tick: 288, velocity: 127 },
                { tick: 384, velocity: 127 },
                { tick: 528, velocity: 100 },
                { tick: 672, velocity: 127 },
                { tick: 768, velocity: 127 },
                { tick: 912, velocity: 100 },
                { tick: 1056, velocity: 127 },
                { tick: 1152, velocity: 127 },
                { tick: 1296, velocity: 100 },
                { tick: 1440, velocity: 127 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: [
                // Triplet-based pattern
                ...regularHits(0, 32, 48, 80),
                // Extra accents
                { tick: 16, velocity: 60 },
                { tick: 400, velocity: 60 },
                { tick: 784, velocity: 60 },
                { tick: 1168, velocity: 60 },
            ],
        },
    ],
};

export const drillNY: BeatPattern = {
    id: 'drill-ny',
    name: 'NY Drill',
    genre: 'Hip-Hop',
    subgenre: 'Drill',
    bpmRange: { min: 140, max: 150 },
    defaultBpm: 145,
    bars: 4,
    description: 'New York drill with aggressive kicks and rolling hi-hats',
    tags: ['ny', 'drill', 'bronx', 'aggressive'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 127 },
                { tick: 192, velocity: 127 },
                { tick: 384, velocity: 127 },
                { tick: 576, velocity: 127 },
                { tick: 768, velocity: 127 },
                { tick: 960, velocity: 127 },
                { tick: 1152, velocity: 127 },
                { tick: 1344, velocity: 127 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 115 },
                { tick: 288, velocity: 115 },
                { tick: 480, velocity: 115 },
                { tick: 672, velocity: 115 },
                { tick: 864, velocity: 115 },
                { tick: 1056, velocity: 115 },
                { tick: 1248, velocity: 115 },
                { tick: 1440, velocity: 115 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 90),
        },
    ],
};

export const phonk: BeatPattern = {
    id: 'phonk',
    name: 'Phonk',
    genre: 'Hip-Hop',
    subgenre: 'Phonk',
    bpmRange: { min: 130, max: 145 },
    defaultBpm: 140,
    bars: 4,
    description: 'Memphis-style phonk with cowbell, distorted kicks, and aggressive percussion',
    tags: ['memphis', 'cowbell', 'distorted', 'dark'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 127 },
                { tick: 144, velocity: 110 },
                { tick: 288, velocity: 127 },
                { tick: 384, velocity: 127 },
                { tick: 528, velocity: 110 },
                { tick: 672, velocity: 127 },
                { tick: 768, velocity: 127 },
                { tick: 912, velocity: 110 },
                { tick: 1056, velocity: 127 },
                { tick: 1152, velocity: 127 },
                { tick: 1296, velocity: 110 },
                { tick: 1440, velocity: 127 },
            ],
        },
        {
            instrument: 'clap',
            subcategory: 'clap',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 100), // 8th notes, louder
        },
    ],
};

export const lofiHipHop: BeatPattern = {
    id: 'lofi-hiphop',
    name: 'Lo-Fi Hip-Hop',
    genre: 'Hip-Hop',
    subgenre: 'Lo-Fi',
    bpmRange: { min: 70, max: 90 },
    defaultBpm: 80,
    bars: 4,
    description: 'Chill lo-fi beats with dusty drums and swing',
    tags: ['chill', 'study', 'relax', 'dusty', 'jazzy'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 90 },
                { tick: 192, velocity: 85 },
                { tick: 384, velocity: 90 },
                { tick: 576, velocity: 80 },
                { tick: 768, velocity: 90 },
                { tick: 960, velocity: 85 },
                { tick: 1152, velocity: 90 },
                { tick: 1344, velocity: 80 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 85 },
                { tick: 288, velocity: 85 },
                { tick: 480, velocity: 85 },
                { tick: 672, velocity: 85 },
                { tick: 864, velocity: 85 },
                { tick: 1056, velocity: 85 },
                { tick: 1248, velocity: 85 },
                { tick: 1440, velocity: 85 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: [
                // Swung 8ths with varying velocity
                { tick: 0, velocity: 70 },
                { tick: 52, velocity: 50 }, // Slightly late for swing
                { tick: 96, velocity: 70 },
                { tick: 148, velocity: 50 },
                { tick: 192, velocity: 70 },
                { tick: 244, velocity: 50 },
                { tick: 288, velocity: 70 },
                { tick: 340, velocity: 50 },
                { tick: 384, velocity: 70 },
                { tick: 436, velocity: 50 },
                { tick: 480, velocity: 70 },
                { tick: 532, velocity: 50 },
                { tick: 576, velocity: 70 },
                { tick: 628, velocity: 50 },
                { tick: 672, velocity: 70 },
                { tick: 724, velocity: 50 },
                { tick: 768, velocity: 70 },
                { tick: 820, velocity: 50 },
                { tick: 864, velocity: 70 },
                { tick: 916, velocity: 50 },
                { tick: 960, velocity: 70 },
                { tick: 1012, velocity: 50 },
                { tick: 1056, velocity: 70 },
                { tick: 1108, velocity: 50 },
                { tick: 1152, velocity: 70 },
                { tick: 1204, velocity: 50 },
                { tick: 1248, velocity: 70 },
                { tick: 1300, velocity: 50 },
                { tick: 1344, velocity: 70 },
                { tick: 1396, velocity: 50 },
                { tick: 1440, velocity: 70 },
                { tick: 1492, velocity: 50 },
            ],
        },
    ],
};

export const oldSchoolRap: BeatPattern = {
    id: 'old-school-rap',
    name: 'Old School Rap',
    genre: 'Hip-Hop',
    subgenre: 'Old School',
    bpmRange: { min: 95, max: 105 },
    defaultBpm: 100,
    bars: 4,
    description: 'Breakbeat-inspired old school hip-hop',
    tags: ['80s', 'breakbeat', 'funky', 'classic'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 144, velocity: 90 },
                { tick: 192, velocity: 100 },
                { tick: 384, velocity: 110 },
                { tick: 528, velocity: 90 },
                { tick: 576, velocity: 100 },
                { tick: 768, velocity: 110 },
                { tick: 912, velocity: 90 },
                { tick: 960, velocity: 100 },
                { tick: 1152, velocity: 110 },
                { tick: 1296, velocity: 90 },
                { tick: 1344, velocity: 100 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 85),
        },
        {
            instrument: 'hihat-open',
            subcategory: 'hihat',
            hits: [
                { tick: 48, velocity: 70 },
                { tick: 432, velocity: 70 },
                { tick: 816, velocity: 70 },
                { tick: 1200, velocity: 70 },
            ],
        },
    ],
};

export const cloudRap: BeatPattern = {
    id: 'cloud-rap',
    name: 'Cloud Rap',
    genre: 'Hip-Hop',
    subgenre: 'Cloud Rap',
    bpmRange: { min: 60, max: 75 },
    defaultBpm: 68,
    bars: 4,
    description: 'Ethereal, sparse cloud rap with atmospheric feel',
    tags: ['ethereal', 'atmospheric', 'spacey', 'minimal'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 100 },
                { tick: 384, velocity: 100 },
                { tick: 768, velocity: 100 },
                { tick: 1152, velocity: 100 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 192, velocity: 80 },
                { tick: 576, velocity: 80 },
                { tick: 960, velocity: 80 },
                { tick: 1344, velocity: 80 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: [
                { tick: 96, velocity: 50 },
                { tick: 288, velocity: 50 },
                { tick: 480, velocity: 50 },
                { tick: 672, velocity: 50 },
                { tick: 864, velocity: 50 },
                { tick: 1056, velocity: 50 },
                { tick: 1248, velocity: 50 },
                { tick: 1440, velocity: 50 },
            ],
        },
    ],
};

// ============================================
// EDM PATTERNS
// ============================================

export const houseClassic: BeatPattern = {
    id: 'house-classic',
    name: 'House Classic',
    genre: 'Electronic',
    subgenre: 'House',
    bpmRange: { min: 120, max: 128 },
    defaultBpm: 124,
    bars: 4,
    description: 'Classic four-on-the-floor house beat',
    tags: ['four-on-the-floor', 'classic', 'dance'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 110), // Every beat for 4 bars
        },
        {
            instrument: 'clap',
            subcategory: 'clap',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(48, 96, 16, 80), // Off-beat 8ths
        },
        {
            instrument: 'hihat-open',
            subcategory: 'hihat',
            hits: [
                { tick: 48, velocity: 90 },
                { tick: 432, velocity: 90 },
                { tick: 816, velocity: 90 },
                { tick: 1200, velocity: 90 },
            ],
        },
    ],
};

export const deepHouse: BeatPattern = {
    id: 'deep-house',
    name: 'Deep House',
    genre: 'Electronic',
    subgenre: 'Deep House',
    bpmRange: { min: 118, max: 125 },
    defaultBpm: 122,
    bars: 4,
    description: 'Deep, groovy house with subtle percussion',
    tags: ['deep', 'groovy', 'smooth', 'underground'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 100),
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 70 }, // Rimshot feel
                { tick: 288, velocity: 70 },
                { tick: 480, velocity: 70 },
                { tick: 672, velocity: 70 },
                { tick: 864, velocity: 70 },
                { tick: 1056, velocity: 70 },
                { tick: 1248, velocity: 70 },
                { tick: 1440, velocity: 70 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: [
                // Shuffled hi-hats
                { tick: 0, velocity: 60 },
                { tick: 56, velocity: 40 },
                { tick: 96, velocity: 60 },
                { tick: 152, velocity: 40 },
                { tick: 192, velocity: 60 },
                { tick: 248, velocity: 40 },
                { tick: 288, velocity: 60 },
                { tick: 344, velocity: 40 },
                { tick: 384, velocity: 60 },
                { tick: 440, velocity: 40 },
                { tick: 480, velocity: 60 },
                { tick: 536, velocity: 40 },
                { tick: 576, velocity: 60 },
                { tick: 632, velocity: 40 },
                { tick: 672, velocity: 60 },
                { tick: 728, velocity: 40 },
                { tick: 768, velocity: 60 },
                { tick: 824, velocity: 40 },
                { tick: 864, velocity: 60 },
                { tick: 920, velocity: 40 },
                { tick: 960, velocity: 60 },
                { tick: 1016, velocity: 40 },
                { tick: 1056, velocity: 60 },
                { tick: 1112, velocity: 40 },
                { tick: 1152, velocity: 60 },
                { tick: 1208, velocity: 40 },
                { tick: 1248, velocity: 60 },
                { tick: 1304, velocity: 40 },
                { tick: 1344, velocity: 60 },
                { tick: 1400, velocity: 40 },
                { tick: 1440, velocity: 60 },
                { tick: 1496, velocity: 40 },
            ],
        },
    ],
};

export const techHouse: BeatPattern = {
    id: 'tech-house',
    name: 'Tech House',
    genre: 'Electronic',
    subgenre: 'Tech House',
    bpmRange: { min: 124, max: 130 },
    defaultBpm: 126,
    bars: 4,
    description: 'Driving tech house with punchy kick and shaker grooves',
    tags: ['driving', 'punchy', 'groovy', 'club'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 115),
        },
        {
            instrument: 'clap',
            subcategory: 'clap',
            hits: [
                { tick: 96, velocity: 95 },
                { tick: 288, velocity: 95 },
                { tick: 480, velocity: 95 },
                { tick: 672, velocity: 95 },
                { tick: 864, velocity: 95 },
                { tick: 1056, velocity: 95 },
                { tick: 1248, velocity: 95 },
                { tick: 1440, velocity: 95 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 70), // 16th notes
        },
    ],
};

export const technoMinimal: BeatPattern = {
    id: 'techno-minimal',
    name: 'Techno Minimal',
    genre: 'Electronic',
    subgenre: 'Techno',
    bpmRange: { min: 125, max: 135 },
    defaultBpm: 130,
    bars: 4,
    description: 'Minimal techno with sparse, hypnotic groove',
    tags: ['minimal', 'hypnotic', 'berlin', 'underground'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 110),
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(48, 96, 16, 60), // Subtle off-beats
        },
        {
            instrument: 'clap',
            subcategory: 'clap',
            hits: [
                { tick: 288, velocity: 80 },
                { tick: 672, velocity: 80 },
                { tick: 1056, velocity: 80 },
                { tick: 1440, velocity: 80 },
            ],
        },
    ],
};

export const technoIndustrial: BeatPattern = {
    id: 'techno-industrial',
    name: 'Techno Industrial',
    genre: 'Electronic',
    subgenre: 'Techno',
    bpmRange: { min: 130, max: 145 },
    defaultBpm: 138,
    bars: 4,
    description: 'Hard, industrial techno with aggressive drums',
    tags: ['hard', 'industrial', 'aggressive', 'dark'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 127),
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 95),
        },
    ],
};

export const trance: BeatPattern = {
    id: 'trance',
    name: 'Trance',
    genre: 'Electronic',
    subgenre: 'Trance',
    bpmRange: { min: 130, max: 145 },
    defaultBpm: 138,
    bars: 4,
    description: 'Euphoric trance with driving beat and rolling hi-hats',
    tags: ['euphoric', 'uplifting', 'melodic', 'energy'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 115),
        },
        {
            instrument: 'clap',
            subcategory: 'clap',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 75),
        },
        {
            instrument: 'hihat-open',
            subcategory: 'hihat',
            hits: regularHits(48, 96, 16, 85),
        },
    ],
};

export const dubstepHalftime: BeatPattern = {
    id: 'dubstep-halftime',
    name: 'Dubstep Halftime',
    genre: 'Electronic',
    subgenre: 'Dubstep',
    bpmRange: { min: 140, max: 150 },
    defaultBpm: 145,
    bars: 4,
    description: 'Heavy dubstep halftime pattern with snare on 3',
    tags: ['heavy', 'halftime', 'bass', 'wobble'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 127 },
                { tick: 384, velocity: 127 },
                { tick: 768, velocity: 127 },
                { tick: 1152, velocity: 127 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 192, velocity: 120 },
                { tick: 576, velocity: 120 },
                { tick: 960, velocity: 120 },
                { tick: 1344, velocity: 120 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 70),
        },
    ],
};

export const drumAndBass: BeatPattern = {
    id: 'drum-and-bass',
    name: 'Drum and Bass',
    genre: 'Electronic',
    subgenre: 'Drum and Bass',
    bpmRange: { min: 170, max: 180 },
    defaultBpm: 174,
    bars: 4,
    description: 'Fast-paced DnB with two-step kick pattern',
    tags: ['fast', 'jungle', 'breakbeat', 'energy'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 144, velocity: 90 },
                { tick: 288, velocity: 100 },
                { tick: 384, velocity: 110 },
                { tick: 528, velocity: 90 },
                { tick: 672, velocity: 100 },
                { tick: 768, velocity: 110 },
                { tick: 912, velocity: 90 },
                { tick: 1056, velocity: 100 },
                { tick: 1152, velocity: 110 },
                { tick: 1296, velocity: 90 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 80),
        },
    ],
};

export const jungle: BeatPattern = {
    id: 'jungle',
    name: 'Jungle',
    genre: 'Electronic',
    subgenre: 'Jungle',
    bpmRange: { min: 160, max: 180 },
    defaultBpm: 170,
    bars: 4,
    description: 'Breakbeat-chopped jungle with complex syncopation',
    tags: ['breakbeat', 'choppy', 'ragga', 'amen'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 120, velocity: 80 },
                { tick: 192, velocity: 100 },
                { tick: 336, velocity: 90 },
                { tick: 384, velocity: 110 },
                { tick: 504, velocity: 80 },
                { tick: 576, velocity: 100 },
                { tick: 720, velocity: 90 },
                { tick: 768, velocity: 110 },
                { tick: 888, velocity: 80 },
                { tick: 960, velocity: 100 },
                { tick: 1104, velocity: 90 },
                { tick: 1152, velocity: 110 },
                { tick: 1272, velocity: 80 },
                { tick: 1344, velocity: 100 },
                { tick: 1488, velocity: 90 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 240, velocity: 80 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 624, velocity: 80 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1008, velocity: 80 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1392, velocity: 80 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 75),
        },
    ],
};

export const breakbeat: BeatPattern = {
    id: 'breakbeat',
    name: 'Breakbeat',
    genre: 'Electronic',
    subgenre: 'Breakbeat',
    bpmRange: { min: 120, max: 140 },
    defaultBpm: 130,
    bars: 4,
    description: 'Funky breakbeat with syncopated groove',
    tags: ['funky', 'syncopated', 'breaks', 'groove'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 144, velocity: 90 },
                { tick: 288, velocity: 100 },
                { tick: 384, velocity: 110 },
                { tick: 528, velocity: 90 },
                { tick: 672, velocity: 100 },
                { tick: 768, velocity: 110 },
                { tick: 912, velocity: 90 },
                { tick: 1056, velocity: 100 },
                { tick: 1152, velocity: 110 },
                { tick: 1296, velocity: 90 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 80),
        },
    ],
};

export const electro: BeatPattern = {
    id: 'electro',
    name: 'Electro',
    genre: 'Electronic',
    subgenre: 'Electro',
    bpmRange: { min: 125, max: 135 },
    defaultBpm: 128,
    bars: 4,
    description: '808-influenced electro with robotic feel',
    tags: ['808', 'robotic', 'funk', 'electronic'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 115 },
                { tick: 192, velocity: 115 },
                { tick: 384, velocity: 115 },
                { tick: 576, velocity: 115 },
                { tick: 768, velocity: 115 },
                { tick: 960, velocity: 115 },
                { tick: 1152, velocity: 115 },
                { tick: 1344, velocity: 115 },
            ],
        },
        {
            instrument: 'clap',
            subcategory: 'clap',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 85),
        },
    ],
};

export const futureBass: BeatPattern = {
    id: 'future-bass',
    name: 'Future Bass',
    genre: 'Electronic',
    subgenre: 'Future Bass',
    bpmRange: { min: 140, max: 160 },
    defaultBpm: 150,
    bars: 4,
    description: 'Syncopated future bass with snappy drums',
    tags: ['syncopated', 'melodic', 'emotional', 'colorful'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 144, velocity: 90 },
                { tick: 384, velocity: 110 },
                { tick: 528, velocity: 90 },
                { tick: 768, velocity: 110 },
                { tick: 912, velocity: 90 },
                { tick: 1152, velocity: 110 },
                { tick: 1296, velocity: 90 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 70),
        },
    ],
};

export const hardstyle: BeatPattern = {
    id: 'hardstyle',
    name: 'Hardstyle',
    genre: 'Electronic',
    subgenre: 'Hardstyle',
    bpmRange: { min: 150, max: 160 },
    defaultBpm: 155,
    bars: 4,
    description: 'Heavy hardstyle with distorted kick and offbeat bass',
    tags: ['hard', 'distorted', 'festival', 'energy'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 127),
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(48, 96, 16, 90),
        },
    ],
};

export const garageUK: BeatPattern = {
    id: 'garage-uk',
    name: 'UK Garage',
    genre: 'Electronic',
    subgenre: 'UK Garage',
    bpmRange: { min: 130, max: 140 },
    defaultBpm: 135,
    bars: 4,
    description: 'Two-step UK garage with shuffled feel',
    tags: ['two-step', 'shuffled', 'skippy', 'underground'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 100 },
                { tick: 144, velocity: 90 },
                { tick: 384, velocity: 100 },
                { tick: 528, velocity: 90 },
                { tick: 768, velocity: 100 },
                { tick: 912, velocity: 90 },
                { tick: 1152, velocity: 100 },
                { tick: 1296, velocity: 90 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 95 },
                { tick: 288, velocity: 95 },
                { tick: 480, velocity: 95 },
                { tick: 672, velocity: 95 },
                { tick: 864, velocity: 95 },
                { tick: 1056, velocity: 95 },
                { tick: 1248, velocity: 95 },
                { tick: 1440, velocity: 95 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: [
                // Shuffled pattern
                { tick: 0, velocity: 70 },
                { tick: 56, velocity: 50 },
                { tick: 96, velocity: 70 },
                { tick: 152, velocity: 50 },
                { tick: 192, velocity: 70 },
                { tick: 248, velocity: 50 },
                { tick: 288, velocity: 70 },
                { tick: 344, velocity: 50 },
                { tick: 384, velocity: 70 },
                { tick: 440, velocity: 50 },
                { tick: 480, velocity: 70 },
                { tick: 536, velocity: 50 },
                { tick: 576, velocity: 70 },
                { tick: 632, velocity: 50 },
                { tick: 672, velocity: 70 },
                { tick: 728, velocity: 50 },
                { tick: 768, velocity: 70 },
                { tick: 824, velocity: 50 },
                { tick: 864, velocity: 70 },
                { tick: 920, velocity: 50 },
                { tick: 960, velocity: 70 },
                { tick: 1016, velocity: 50 },
                { tick: 1056, velocity: 70 },
                { tick: 1112, velocity: 50 },
                { tick: 1152, velocity: 70 },
                { tick: 1208, velocity: 50 },
                { tick: 1248, velocity: 70 },
                { tick: 1304, velocity: 50 },
                { tick: 1344, velocity: 70 },
                { tick: 1400, velocity: 50 },
                { tick: 1440, velocity: 70 },
                { tick: 1496, velocity: 50 },
            ],
        },
    ],
};

export const discoHouse: BeatPattern = {
    id: 'disco-house',
    name: 'Disco House',
    genre: 'Electronic',
    subgenre: 'Disco House',
    bpmRange: { min: 115, max: 125 },
    defaultBpm: 120,
    bars: 4,
    description: 'Funky disco house with open hi-hat grooves',
    tags: ['funky', 'disco', 'groovy', 'retro'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 105),
        },
        {
            instrument: 'clap',
            subcategory: 'clap',
            hits: [
                { tick: 96, velocity: 95 },
                { tick: 288, velocity: 95 },
                { tick: 480, velocity: 95 },
                { tick: 672, velocity: 95 },
                { tick: 864, velocity: 95 },
                { tick: 1056, velocity: 95 },
                { tick: 1248, velocity: 95 },
                { tick: 1440, velocity: 95 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 70),
        },
        {
            instrument: 'hihat-open',
            subcategory: 'hihat',
            hits: regularHits(48, 96, 16, 85),
        },
    ],
};

// ============================================
// R&B & SOUL PATTERNS
// ============================================

export const rnbClassic: BeatPattern = {
    id: 'rnb-classic',
    name: 'R&B Classic',
    genre: 'R&B',
    subgenre: 'Classic R&B',
    bpmRange: { min: 65, max: 85 },
    defaultBpm: 75,
    bars: 4,
    description: 'Smooth classic R&B with tight drums',
    tags: ['smooth', 'soulful', 'romantic', 'groovy'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 95 },
                { tick: 192, velocity: 90 },
                { tick: 384, velocity: 95 },
                { tick: 576, velocity: 90 },
                { tick: 768, velocity: 95 },
                { tick: 960, velocity: 90 },
                { tick: 1152, velocity: 95 },
                { tick: 1344, velocity: 90 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 90 },
                { tick: 288, velocity: 90 },
                { tick: 480, velocity: 90 },
                { tick: 672, velocity: 90 },
                { tick: 864, velocity: 90 },
                { tick: 1056, velocity: 90 },
                { tick: 1248, velocity: 90 },
                { tick: 1440, velocity: 90 },
                // Ghost notes
                { tick: 72, velocity: 40 },
                { tick: 264, velocity: 40 },
                { tick: 456, velocity: 40 },
                { tick: 648, velocity: 40 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 65),
        },
    ],
};

export const rnbModern: BeatPattern = {
    id: 'rnb-modern',
    name: 'R&B Modern',
    genre: 'R&B',
    subgenre: 'Modern R&B',
    bpmRange: { min: 70, max: 90 },
    defaultBpm: 80,
    bars: 4,
    description: 'Modern R&B with trap-influenced hi-hats',
    tags: ['modern', 'trap-influenced', 'dark', 'moody'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 100 },
                { tick: 288, velocity: 90 },
                { tick: 384, velocity: 100 },
                { tick: 576, velocity: 90 },
                { tick: 768, velocity: 100 },
                { tick: 1056, velocity: 90 },
                { tick: 1152, velocity: 100 },
                { tick: 1344, velocity: 90 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 95 },
                { tick: 288, velocity: 95 },
                { tick: 480, velocity: 95 },
                { tick: 672, velocity: 95 },
                { tick: 864, velocity: 95 },
                { tick: 1056, velocity: 95 },
                { tick: 1248, velocity: 95 },
                { tick: 1440, velocity: 95 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 75),
        },
    ],
};

export const neoSoul: BeatPattern = {
    id: 'neo-soul',
    name: 'Neo Soul',
    genre: 'R&B',
    subgenre: 'Neo Soul',
    bpmRange: { min: 80, max: 100 },
    defaultBpm: 90,
    bars: 4,
    description: 'Live drum feel with jazzy swing',
    tags: ['jazzy', 'organic', 'live', 'groove'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 90 },
                { tick: 144, velocity: 70 },
                { tick: 192, velocity: 85 },
                { tick: 384, velocity: 90 },
                { tick: 528, velocity: 70 },
                { tick: 576, velocity: 85 },
                { tick: 768, velocity: 90 },
                { tick: 912, velocity: 70 },
                { tick: 960, velocity: 85 },
                { tick: 1152, velocity: 90 },
                { tick: 1296, velocity: 70 },
                { tick: 1344, velocity: 85 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 85 },
                { tick: 288, velocity: 85 },
                { tick: 480, velocity: 85 },
                { tick: 672, velocity: 85 },
                { tick: 864, velocity: 85 },
                { tick: 1056, velocity: 85 },
                { tick: 1248, velocity: 85 },
                { tick: 1440, velocity: 85 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: [
                // Swung with ghost notes
                ...regularHits(0, 48, 32, 70),
                { tick: 24, velocity: 35 },
                { tick: 120, velocity: 35 },
                { tick: 216, velocity: 35 },
                { tick: 312, velocity: 35 },
            ],
        },
    ],
};

export const slowJam: BeatPattern = {
    id: 'slow-jam',
    name: 'Slow Jam',
    genre: 'R&B',
    subgenre: 'Slow Jam',
    bpmRange: { min: 55, max: 70 },
    defaultBpm: 62,
    bars: 4,
    description: 'Laid back slow jam with minimal percussion',
    tags: ['romantic', 'slow', 'intimate', 'smooth'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 85 },
                { tick: 192, velocity: 80 },
                { tick: 384, velocity: 85 },
                { tick: 576, velocity: 80 },
                { tick: 768, velocity: 85 },
                { tick: 960, velocity: 80 },
                { tick: 1152, velocity: 85 },
                { tick: 1344, velocity: 80 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 75 },
                { tick: 288, velocity: 75 },
                { tick: 480, velocity: 75 },
                { tick: 672, velocity: 75 },
                { tick: 864, velocity: 75 },
                { tick: 1056, velocity: 75 },
                { tick: 1248, velocity: 75 },
                { tick: 1440, velocity: 75 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 50),
        },
    ],
};

// ============================================
// POP PATTERNS
// ============================================

export const popDance: BeatPattern = {
    id: 'pop-dance',
    name: 'Pop Dance',
    genre: 'Pop',
    subgenre: 'Dance Pop',
    bpmRange: { min: 118, max: 128 },
    defaultBpm: 123,
    bars: 4,
    description: 'Energetic dance pop with driving beat',
    tags: ['energetic', 'radio', 'commercial', 'upbeat'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 110),
        },
        {
            instrument: 'clap',
            subcategory: 'clap',
            hits: [
                { tick: 96, velocity: 105 },
                { tick: 288, velocity: 105 },
                { tick: 480, velocity: 105 },
                { tick: 672, velocity: 105 },
                { tick: 864, velocity: 105 },
                { tick: 1056, velocity: 105 },
                { tick: 1248, velocity: 105 },
                { tick: 1440, velocity: 105 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 80),
        },
    ],
};

export const popTropical: BeatPattern = {
    id: 'pop-tropical',
    name: 'Pop Tropical',
    genre: 'Pop',
    subgenre: 'Tropical Pop',
    bpmRange: { min: 100, max: 115 },
    defaultBpm: 108,
    bars: 4,
    description: 'Light tropical pop with dembow influence',
    tags: ['tropical', 'summer', 'light', 'upbeat'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 100 },
                { tick: 144, velocity: 85 },
                { tick: 192, velocity: 95 },
                { tick: 288, velocity: 90 },
                { tick: 384, velocity: 100 },
                { tick: 528, velocity: 85 },
                { tick: 576, velocity: 95 },
                { tick: 672, velocity: 90 },
                { tick: 768, velocity: 100 },
                { tick: 912, velocity: 85 },
                { tick: 960, velocity: 95 },
                { tick: 1056, velocity: 90 },
                { tick: 1152, velocity: 100 },
                { tick: 1296, velocity: 85 },
                { tick: 1344, velocity: 95 },
                { tick: 1440, velocity: 90 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 144, velocity: 90 },
                { tick: 288, velocity: 100 },
                { tick: 528, velocity: 90 },
                { tick: 672, velocity: 100 },
                { tick: 912, velocity: 90 },
                { tick: 1056, velocity: 100 },
                { tick: 1296, velocity: 90 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 75),
        },
    ],
};

export const popRock: BeatPattern = {
    id: 'pop-rock',
    name: 'Pop Rock',
    genre: 'Pop',
    subgenre: 'Pop Rock',
    bpmRange: { min: 120, max: 140 },
    defaultBpm: 130,
    bars: 4,
    description: 'Straight pop rock with driving drums',
    tags: ['rock', 'driving', 'guitar', 'anthemic'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 192, velocity: 110 },
                { tick: 384, velocity: 110 },
                { tick: 576, velocity: 110 },
                { tick: 768, velocity: 110 },
                { tick: 960, velocity: 110 },
                { tick: 1152, velocity: 110 },
                { tick: 1344, velocity: 110 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 90),
        },
        {
            instrument: 'cymbal',
            subcategory: 'cymbal',
            hits: [
                { tick: 0, velocity: 100 },
                { tick: 768, velocity: 100 },
            ],
        },
    ],
};

export const indiePop: BeatPattern = {
    id: 'indie-pop',
    name: 'Indie Pop',
    genre: 'Pop',
    subgenre: 'Indie Pop',
    bpmRange: { min: 110, max: 130 },
    defaultBpm: 120,
    bars: 4,
    description: 'Humanized indie pop with vintage feel',
    tags: ['indie', 'vintage', 'organic', 'quirky'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 95 },
                { tick: 192, velocity: 90 },
                { tick: 384, velocity: 95 },
                { tick: 576, velocity: 90 },
                { tick: 768, velocity: 95 },
                { tick: 960, velocity: 90 },
                { tick: 1152, velocity: 95 },
                { tick: 1344, velocity: 90 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 95 },
                { tick: 288, velocity: 95 },
                { tick: 480, velocity: 95 },
                { tick: 672, velocity: 95 },
                { tick: 864, velocity: 95 },
                { tick: 1056, velocity: 95 },
                { tick: 1248, velocity: 95 },
                { tick: 1440, velocity: 95 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 75),
        },
    ],
};

export const synthPop: BeatPattern = {
    id: 'synth-pop',
    name: 'Synth Pop',
    genre: 'Pop',
    subgenre: 'Synth Pop',
    bpmRange: { min: 118, max: 130 },
    defaultBpm: 124,
    bars: 4,
    description: '80s-style synth pop with electronic drums',
    tags: ['80s', 'retro', 'electronic', 'new-wave'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 105),
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 80),
        },
    ],
};

// ============================================
// ROCK PATTERNS
// ============================================

export const rockBasic: BeatPattern = {
    id: 'rock-basic',
    name: 'Rock Basic',
    genre: 'Rock',
    subgenre: 'Basic Rock',
    bpmRange: { min: 110, max: 140 },
    defaultBpm: 125,
    bars: 4,
    description: 'Standard rock beat with kick on 1 and 3, snare on 2 and 4',
    tags: ['classic', 'simple', 'straightforward'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 192, velocity: 110 },
                { tick: 384, velocity: 110 },
                { tick: 576, velocity: 110 },
                { tick: 768, velocity: 110 },
                { tick: 960, velocity: 110 },
                { tick: 1152, velocity: 110 },
                { tick: 1344, velocity: 110 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 90),
        },
    ],
};

export const rockDriving: BeatPattern = {
    id: 'rock-driving',
    name: 'Rock Driving',
    genre: 'Rock',
    subgenre: 'Hard Rock',
    bpmRange: { min: 140, max: 170 },
    defaultBpm: 155,
    bars: 4,
    description: 'Fast, aggressive rock with double kick patterns',
    tags: ['fast', 'aggressive', 'hard', 'energy'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                ...regularHits(0, 48, 32, 110),
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 115 },
                { tick: 288, velocity: 115 },
                { tick: 480, velocity: 115 },
                { tick: 672, velocity: 115 },
                { tick: 864, velocity: 115 },
                { tick: 1056, velocity: 115 },
                { tick: 1248, velocity: 115 },
                { tick: 1440, velocity: 115 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 95),
        },
        {
            instrument: 'cymbal',
            subcategory: 'cymbal',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 768, velocity: 110 },
            ],
        },
    ],
};

export const punkRock: BeatPattern = {
    id: 'punk-rock',
    name: 'Punk Rock',
    genre: 'Rock',
    subgenre: 'Punk',
    bpmRange: { min: 160, max: 200 },
    defaultBpm: 180,
    bars: 4,
    description: 'Fast, simple punk with D-beat elements',
    tags: ['fast', 'simple', 'raw', 'aggressive'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 48, 32, 115),
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 115 },
                { tick: 288, velocity: 115 },
                { tick: 480, velocity: 115 },
                { tick: 672, velocity: 115 },
                { tick: 864, velocity: 115 },
                { tick: 1056, velocity: 115 },
                { tick: 1248, velocity: 115 },
                { tick: 1440, velocity: 115 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 100),
        },
        {
            instrument: 'cymbal',
            subcategory: 'cymbal',
            hits: regularHits(0, 96, 16, 105),
        },
    ],
};

export const metalBasic: BeatPattern = {
    id: 'metal-basic',
    name: 'Metal Basic',
    genre: 'Rock',
    subgenre: 'Metal',
    bpmRange: { min: 120, max: 180 },
    defaultBpm: 150,
    bars: 4,
    description: 'Heavy metal with double bass patterns',
    tags: ['heavy', 'double-bass', 'aggressive', 'powerful'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 24, 64, 120),
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 120 },
                { tick: 288, velocity: 120 },
                { tick: 480, velocity: 120 },
                { tick: 672, velocity: 120 },
                { tick: 864, velocity: 120 },
                { tick: 1056, velocity: 120 },
                { tick: 1248, velocity: 120 },
                { tick: 1440, velocity: 120 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 100),
        },
        {
            instrument: 'cymbal',
            subcategory: 'cymbal',
            hits: [
                { tick: 0, velocity: 115 },
                { tick: 384, velocity: 100 },
                { tick: 768, velocity: 115 },
                { tick: 1152, velocity: 100 },
            ],
        },
    ],
};

export const grunge: BeatPattern = {
    id: 'grunge',
    name: 'Grunge',
    genre: 'Rock',
    subgenre: 'Grunge',
    bpmRange: { min: 100, max: 130 },
    defaultBpm: 115,
    bars: 4,
    description: 'Loose, sloppy grunge feel',
    tags: ['90s', 'seattle', 'loose', 'heavy'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 105 },
                { tick: 144, velocity: 85 },
                { tick: 192, velocity: 100 },
                { tick: 384, velocity: 105 },
                { tick: 528, velocity: 85 },
                { tick: 576, velocity: 100 },
                { tick: 768, velocity: 105 },
                { tick: 912, velocity: 85 },
                { tick: 960, velocity: 100 },
                { tick: 1152, velocity: 105 },
                { tick: 1296, velocity: 85 },
                { tick: 1344, velocity: 100 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 110 },
                { tick: 288, velocity: 110 },
                { tick: 480, velocity: 110 },
                { tick: 672, velocity: 110 },
                { tick: 864, velocity: 110 },
                { tick: 1056, velocity: 110 },
                { tick: 1248, velocity: 110 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 85),
        },
    ],
};

export const indieRock: BeatPattern = {
    id: 'indie-rock',
    name: 'Indie Rock',
    genre: 'Rock',
    subgenre: 'Indie Rock',
    bpmRange: { min: 120, max: 145 },
    defaultBpm: 132,
    bars: 4,
    description: 'Post-punk influenced indie rock',
    tags: ['post-punk', 'alternative', 'angular', 'tight'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 100 },
                { tick: 144, velocity: 80 },
                { tick: 288, velocity: 95 },
                { tick: 384, velocity: 100 },
                { tick: 528, velocity: 80 },
                { tick: 672, velocity: 95 },
                { tick: 768, velocity: 100 },
                { tick: 912, velocity: 80 },
                { tick: 1056, velocity: 95 },
                { tick: 1152, velocity: 100 },
                { tick: 1296, velocity: 80 },
                { tick: 1440, velocity: 95 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 80),
        },
    ],
};

// ============================================
// LATIN & WORLD PATTERNS
// ============================================

export const reggaeton: BeatPattern = {
    id: 'reggaeton',
    name: 'Reggaeton',
    genre: 'Latin',
    subgenre: 'Reggaeton',
    bpmRange: { min: 85, max: 100 },
    defaultBpm: 92,
    bars: 4,
    description: 'Classic dembow rhythm with tresillo pattern',
    tags: ['dembow', 'latin', 'urban', 'dance'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 144, velocity: 90 },
                { tick: 192, velocity: 100 },
                { tick: 288, velocity: 95 },
                { tick: 384, velocity: 110 },
                { tick: 528, velocity: 90 },
                { tick: 576, velocity: 100 },
                { tick: 672, velocity: 95 },
                { tick: 768, velocity: 110 },
                { tick: 912, velocity: 90 },
                { tick: 960, velocity: 100 },
                { tick: 1056, velocity: 95 },
                { tick: 1152, velocity: 110 },
                { tick: 1296, velocity: 90 },
                { tick: 1344, velocity: 100 },
                { tick: 1440, velocity: 95 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 144, velocity: 100 },
                { tick: 288, velocity: 110 },
                { tick: 528, velocity: 100 },
                { tick: 672, velocity: 110 },
                { tick: 912, velocity: 100 },
                { tick: 1056, velocity: 110 },
                { tick: 1296, velocity: 100 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 85),
        },
    ],
};

export const latinTrap: BeatPattern = {
    id: 'latin-trap',
    name: 'Latin Trap',
    genre: 'Latin',
    subgenre: 'Latin Trap',
    bpmRange: { min: 70, max: 90 },
    defaultBpm: 80,
    bars: 4,
    description: 'Reggaeton meets trap with 808s and triplet hi-hats',
    tags: ['trap', 'reggaeton', 'urban', '808'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 120 },
                { tick: 144, velocity: 100 },
                { tick: 288, velocity: 110 },
                { tick: 384, velocity: 120 },
                { tick: 528, velocity: 100 },
                { tick: 672, velocity: 110 },
                { tick: 768, velocity: 120 },
                { tick: 912, velocity: 100 },
                { tick: 1056, velocity: 110 },
                { tick: 1152, velocity: 120 },
                { tick: 1296, velocity: 100 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 105 },
                { tick: 288, velocity: 105 },
                { tick: 480, velocity: 105 },
                { tick: 672, velocity: 105 },
                { tick: 864, velocity: 105 },
                { tick: 1056, velocity: 105 },
                { tick: 1248, velocity: 105 },
                { tick: 1440, velocity: 105 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 32, 48, 80), // Triplets
        },
    ],
};

export const bossaNova: BeatPattern = {
    id: 'bossa-nova',
    name: 'Bossa Nova',
    genre: 'Latin',
    subgenre: 'Bossa Nova',
    bpmRange: { min: 120, max: 145 },
    defaultBpm: 130,
    bars: 4,
    description: 'Brazilian bossa nova with syncopated bass drum',
    tags: ['brazilian', 'jazz', 'smooth', 'sophisticated'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 80 },
                { tick: 144, velocity: 70 },
                { tick: 288, velocity: 75 },
                { tick: 384, velocity: 80 },
                { tick: 528, velocity: 70 },
                { tick: 672, velocity: 75 },
                { tick: 768, velocity: 80 },
                { tick: 912, velocity: 70 },
                { tick: 1056, velocity: 75 },
                { tick: 1152, velocity: 80 },
                { tick: 1296, velocity: 70 },
                { tick: 1440, velocity: 75 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                // Rim clicks
                { tick: 48, velocity: 60 },
                { tick: 144, velocity: 60 },
                { tick: 240, velocity: 60 },
                { tick: 432, velocity: 60 },
                { tick: 528, velocity: 60 },
                { tick: 624, velocity: 60 },
                { tick: 816, velocity: 60 },
                { tick: 912, velocity: 60 },
                { tick: 1008, velocity: 60 },
                { tick: 1200, velocity: 60 },
                { tick: 1296, velocity: 60 },
                { tick: 1392, velocity: 60 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 55),
        },
    ],
};

export const afrobeats: BeatPattern = {
    id: 'afrobeats',
    name: 'Afrobeats',
    genre: 'World',
    subgenre: 'Afrobeats',
    bpmRange: { min: 100, max: 120 },
    defaultBpm: 110,
    bars: 4,
    description: 'Nigerian afrobeats with polyrhythmic percussion',
    tags: ['african', 'polyrhythm', 'groovy', 'dance'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 100 },
                { tick: 144, velocity: 85 },
                { tick: 288, velocity: 95 },
                { tick: 384, velocity: 100 },
                { tick: 528, velocity: 85 },
                { tick: 672, velocity: 95 },
                { tick: 768, velocity: 100 },
                { tick: 912, velocity: 85 },
                { tick: 1056, velocity: 95 },
                { tick: 1152, velocity: 100 },
                { tick: 1296, velocity: 85 },
                { tick: 1440, velocity: 95 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 95 },
                { tick: 288, velocity: 95 },
                { tick: 480, velocity: 95 },
                { tick: 672, velocity: 95 },
                { tick: 864, velocity: 95 },
                { tick: 1056, velocity: 95 },
                { tick: 1248, velocity: 95 },
                { tick: 1440, velocity: 95 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 75),
        },
    ],
};

export const dancehall: BeatPattern = {
    id: 'dancehall',
    name: 'Dancehall',
    genre: 'World',
    subgenre: 'Dancehall',
    bpmRange: { min: 90, max: 110 },
    defaultBpm: 100,
    bars: 4,
    description: 'Jamaican dancehall with syncopated dembow variation',
    tags: ['jamaican', 'caribbean', 'riddim', 'dance'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 105 },
                { tick: 144, velocity: 90 },
                { tick: 288, velocity: 100 },
                { tick: 384, velocity: 105 },
                { tick: 528, velocity: 90 },
                { tick: 672, velocity: 100 },
                { tick: 768, velocity: 105 },
                { tick: 912, velocity: 90 },
                { tick: 1056, velocity: 100 },
                { tick: 1152, velocity: 105 },
                { tick: 1296, velocity: 90 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 144, velocity: 100 },
                { tick: 288, velocity: 105 },
                { tick: 528, velocity: 100 },
                { tick: 672, velocity: 105 },
                { tick: 912, velocity: 100 },
                { tick: 1056, velocity: 105 },
                { tick: 1296, velocity: 100 },
                { tick: 1440, velocity: 105 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 85),
        },
    ],
};

// ============================================
// JAZZ & FUNK PATTERNS
// ============================================

export const jazzSwing: BeatPattern = {
    id: 'jazz-swing',
    name: 'Jazz Swing',
    genre: 'Jazz',
    subgenre: 'Swing',
    bpmRange: { min: 120, max: 180 },
    defaultBpm: 140,
    bars: 4,
    description: 'Classic jazz swing with ride cymbal pattern',
    tags: ['swing', 'bebop', 'classic', 'sophisticated'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 70 },
                { tick: 192, velocity: 65 },
                { tick: 384, velocity: 70 },
                { tick: 576, velocity: 65 },
                { tick: 768, velocity: 70 },
                { tick: 960, velocity: 65 },
                { tick: 1152, velocity: 70 },
                { tick: 1344, velocity: 65 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                // Comping pattern
                { tick: 144, velocity: 50 },
                { tick: 288, velocity: 60 },
                { tick: 528, velocity: 50 },
                { tick: 672, velocity: 60 },
                { tick: 912, velocity: 50 },
                { tick: 1056, velocity: 60 },
                { tick: 1296, velocity: 50 },
                { tick: 1440, velocity: 60 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: [
                // Swung ride pattern (simulated on hi-hat)
                { tick: 0, velocity: 80 },
                { tick: 64, velocity: 50 },
                { tick: 96, velocity: 80 },
                { tick: 160, velocity: 50 },
                { tick: 192, velocity: 80 },
                { tick: 256, velocity: 50 },
                { tick: 288, velocity: 80 },
                { tick: 352, velocity: 50 },
                { tick: 384, velocity: 80 },
                { tick: 448, velocity: 50 },
                { tick: 480, velocity: 80 },
                { tick: 544, velocity: 50 },
                { tick: 576, velocity: 80 },
                { tick: 640, velocity: 50 },
                { tick: 672, velocity: 80 },
                { tick: 736, velocity: 50 },
                { tick: 768, velocity: 80 },
                { tick: 832, velocity: 50 },
                { tick: 864, velocity: 80 },
                { tick: 928, velocity: 50 },
                { tick: 960, velocity: 80 },
                { tick: 1024, velocity: 50 },
                { tick: 1056, velocity: 80 },
                { tick: 1120, velocity: 50 },
                { tick: 1152, velocity: 80 },
                { tick: 1216, velocity: 50 },
                { tick: 1248, velocity: 80 },
                { tick: 1312, velocity: 50 },
                { tick: 1344, velocity: 80 },
                { tick: 1408, velocity: 50 },
                { tick: 1440, velocity: 80 },
                { tick: 1504, velocity: 50 },
            ],
        },
    ],
};

export const funkClassic: BeatPattern = {
    id: 'funk-classic',
    name: 'Funk Classic',
    genre: 'Funk',
    subgenre: 'Classic Funk',
    bpmRange: { min: 95, max: 115 },
    defaultBpm: 105,
    bars: 4,
    description: 'Classic funk with emphasis on "the one" and ghost notes',
    tags: ['groovy', 'syncopated', 'james-brown', 'tight'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 120 }, // THE ONE
                { tick: 144, velocity: 80 },
                { tick: 288, velocity: 100 },
                { tick: 384, velocity: 110 },
                { tick: 528, velocity: 80 },
                { tick: 672, velocity: 100 },
                { tick: 768, velocity: 110 },
                { tick: 912, velocity: 80 },
                { tick: 1056, velocity: 100 },
                { tick: 1152, velocity: 110 },
                { tick: 1296, velocity: 80 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
                // Ghost notes
                { tick: 72, velocity: 35 },
                { tick: 168, velocity: 35 },
                { tick: 264, velocity: 35 },
                { tick: 360, velocity: 35 },
                { tick: 456, velocity: 35 },
                { tick: 552, velocity: 35 },
                { tick: 648, velocity: 35 },
                { tick: 744, velocity: 35 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 80),
        },
    ],
};

export const funkModern: BeatPattern = {
    id: 'funk-modern',
    name: 'Funk Modern',
    genre: 'Funk',
    subgenre: 'Modern Funk',
    bpmRange: { min: 100, max: 120 },
    defaultBpm: 110,
    bars: 4,
    description: 'Modern funk with syncopated patterns',
    tags: ['modern', 'syncopated', 'groovy', 'fresh'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 72, velocity: 80 },
                { tick: 144, velocity: 95 },
                { tick: 288, velocity: 100 },
                { tick: 384, velocity: 110 },
                { tick: 456, velocity: 80 },
                { tick: 528, velocity: 95 },
                { tick: 672, velocity: 100 },
                { tick: 768, velocity: 110 },
                { tick: 840, velocity: 80 },
                { tick: 912, velocity: 95 },
                { tick: 1056, velocity: 100 },
                { tick: 1152, velocity: 110 },
                { tick: 1224, velocity: 80 },
                { tick: 1296, velocity: 95 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 105 },
                { tick: 288, velocity: 105 },
                { tick: 480, velocity: 105 },
                { tick: 672, velocity: 105 },
                { tick: 864, velocity: 105 },
                { tick: 1056, velocity: 105 },
                { tick: 1248, velocity: 105 },
                { tick: 1440, velocity: 105 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 75),
        },
        {
            instrument: 'hihat-open',
            subcategory: 'hihat',
            hits: [
                { tick: 48, velocity: 70 },
                { tick: 432, velocity: 70 },
                { tick: 816, velocity: 70 },
                { tick: 1200, velocity: 70 },
            ],
        },
    ],
};

export const disco: BeatPattern = {
    id: 'disco',
    name: 'Disco',
    genre: 'Funk',
    subgenre: 'Disco',
    bpmRange: { min: 115, max: 130 },
    defaultBpm: 120,
    bars: 4,
    description: 'Classic disco with four-on-the-floor and open hi-hat',
    tags: ['70s', 'dance', 'groovy', 'party'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: regularHits(0, 96, 16, 110),
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 80),
        },
        {
            instrument: 'hihat-open',
            subcategory: 'hihat',
            hits: regularHits(48, 96, 16, 90),
        },
    ],
};

// ============================================
// AMBIENT & EXPERIMENTAL PATTERNS
// ============================================

export const ambientMinimal: BeatPattern = {
    id: 'ambient-minimal',
    name: 'Ambient Minimal',
    genre: 'Ambient',
    subgenre: 'Minimal',
    bpmRange: { min: 60, max: 90 },
    defaultBpm: 75,
    bars: 4,
    description: 'Sparse, spacious ambient with subtle percussion',
    tags: ['spacious', 'atmospheric', 'subtle', 'ethereal'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 60 },
                { tick: 768, velocity: 55 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 384, velocity: 50 },
                { tick: 1152, velocity: 45 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: [
                { tick: 192, velocity: 35 },
                { tick: 576, velocity: 35 },
                { tick: 960, velocity: 35 },
                { tick: 1344, velocity: 35 },
            ],
        },
    ],
};

export const downtempo: BeatPattern = {
    id: 'downtempo',
    name: 'Downtempo',
    genre: 'Electronic',
    subgenre: 'Downtempo',
    bpmRange: { min: 70, max: 100 },
    defaultBpm: 85,
    bars: 4,
    description: 'Trip-hop influenced downtempo with heavy drums',
    tags: ['trip-hop', 'chill', 'heavy', 'atmospheric'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 100 },
                { tick: 288, velocity: 85 },
                { tick: 384, velocity: 100 },
                { tick: 672, velocity: 85 },
                { tick: 768, velocity: 100 },
                { tick: 1056, velocity: 85 },
                { tick: 1152, velocity: 100 },
                { tick: 1440, velocity: 85 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 192, velocity: 95 },
                { tick: 576, velocity: 95 },
                { tick: 960, velocity: 95 },
                { tick: 1344, velocity: 95 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 48, 32, 60),
        },
    ],
};

// ============================================
// REGIONAL PATTERNS
// ============================================

export const grime: BeatPattern = {
    id: 'grime',
    name: 'Grime',
    genre: 'Electronic',
    subgenre: 'Grime',
    bpmRange: { min: 138, max: 142 },
    defaultBpm: 140,
    bars: 4,
    description: 'UK grime with syncopated snare and skippy percussion',
    tags: ['uk', 'syncopated', 'dark', 'aggressive'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 115 },
                { tick: 144, velocity: 95 },
                { tick: 288, velocity: 110 },
                { tick: 384, velocity: 115 },
                { tick: 528, velocity: 95 },
                { tick: 672, velocity: 110 },
                { tick: 768, velocity: 115 },
                { tick: 912, velocity: 95 },
                { tick: 1056, velocity: 110 },
                { tick: 1152, velocity: 115 },
                { tick: 1296, velocity: 95 },
                { tick: 1440, velocity: 110 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 105 },
                { tick: 288, velocity: 105 },
                { tick: 480, velocity: 105 },
                { tick: 672, velocity: 105 },
                { tick: 864, velocity: 105 },
                { tick: 1056, velocity: 105 },
                { tick: 1248, velocity: 105 },
                { tick: 1440, velocity: 105 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 85),
        },
    ],
};

export const amapiano: BeatPattern = {
    id: 'amapiano',
    name: 'Amapiano',
    genre: 'World',
    subgenre: 'Amapiano',
    bpmRange: { min: 110, max: 120 },
    defaultBpm: 115,
    bars: 4,
    description: 'South African amapiano with log drum bass and shaker grooves',
    tags: ['south-african', 'groovy', 'log-drum', 'dance'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 95 },
                { tick: 144, velocity: 80 },
                { tick: 288, velocity: 90 },
                { tick: 384, velocity: 95 },
                { tick: 528, velocity: 80 },
                { tick: 672, velocity: 90 },
                { tick: 768, velocity: 95 },
                { tick: 912, velocity: 80 },
                { tick: 1056, velocity: 90 },
                { tick: 1152, velocity: 95 },
                { tick: 1296, velocity: 80 },
                { tick: 1440, velocity: 90 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 85 },
                { tick: 288, velocity: 85 },
                { tick: 480, velocity: 85 },
                { tick: 672, velocity: 85 },
                { tick: 864, velocity: 85 },
                { tick: 1056, velocity: 85 },
                { tick: 1248, velocity: 85 },
                { tick: 1440, velocity: 85 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 70),
        },
    ],
};

export const jerseyClub: BeatPattern = {
    id: 'jersey-club',
    name: 'Jersey Club',
    genre: 'Electronic',
    subgenre: 'Jersey Club',
    bpmRange: { min: 130, max: 145 },
    defaultBpm: 138,
    bars: 4,
    description: 'New Jersey club with fast syncopation and vocal chops',
    tags: ['jersey', 'syncopated', 'bouncy', 'dance'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 72, velocity: 90 },
                { tick: 144, velocity: 100 },
                { tick: 288, velocity: 105 },
                { tick: 384, velocity: 110 },
                { tick: 456, velocity: 90 },
                { tick: 528, velocity: 100 },
                { tick: 672, velocity: 105 },
                { tick: 768, velocity: 110 },
                { tick: 840, velocity: 90 },
                { tick: 912, velocity: 100 },
                { tick: 1056, velocity: 105 },
                { tick: 1152, velocity: 110 },
                { tick: 1224, velocity: 90 },
                { tick: 1296, velocity: 100 },
                { tick: 1440, velocity: 105 },
            ],
        },
        {
            instrument: 'clap',
            subcategory: 'clap',
            hits: [
                { tick: 96, velocity: 105 },
                { tick: 288, velocity: 105 },
                { tick: 480, velocity: 105 },
                { tick: 672, velocity: 105 },
                { tick: 864, velocity: 105 },
                { tick: 1056, velocity: 105 },
                { tick: 1248, velocity: 105 },
                { tick: 1440, velocity: 105 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 24, 64, 85),
        },
    ],
};

export const footwork: BeatPattern = {
    id: 'footwork',
    name: 'Footwork',
    genre: 'Electronic',
    subgenre: 'Footwork',
    bpmRange: { min: 155, max: 165 },
    defaultBpm: 160,
    bars: 4,
    description: 'Chicago footwork with syncopated kick and triplet patterns',
    tags: ['chicago', 'juke', 'syncopated', 'fast'],
    tracks: [
        {
            instrument: 'kick',
            subcategory: 'kick',
            hits: [
                { tick: 0, velocity: 110 },
                { tick: 64, velocity: 90 },
                { tick: 144, velocity: 100 },
                { tick: 288, velocity: 105 },
                { tick: 384, velocity: 110 },
                { tick: 448, velocity: 90 },
                { tick: 528, velocity: 100 },
                { tick: 672, velocity: 105 },
                { tick: 768, velocity: 110 },
                { tick: 832, velocity: 90 },
                { tick: 912, velocity: 100 },
                { tick: 1056, velocity: 105 },
                { tick: 1152, velocity: 110 },
                { tick: 1216, velocity: 90 },
                { tick: 1296, velocity: 100 },
                { tick: 1440, velocity: 105 },
            ],
        },
        {
            instrument: 'snare',
            subcategory: 'snare',
            hits: [
                { tick: 96, velocity: 100 },
                { tick: 288, velocity: 100 },
                { tick: 480, velocity: 100 },
                { tick: 672, velocity: 100 },
                { tick: 864, velocity: 100 },
                { tick: 1056, velocity: 100 },
                { tick: 1248, velocity: 100 },
                { tick: 1440, velocity: 100 },
            ],
        },
        {
            instrument: 'hihat',
            subcategory: 'hihat',
            hits: regularHits(0, 32, 48, 80), // Triplets
        },
    ],
};

// ============================================
// PATTERN COLLECTION
// ============================================

export const allPatterns: BeatPattern[] = [
    // Hip-Hop
    boomBapClassic,
    boomBapLazy,
    trapAtlanta,
    trapDark,
    drillUK,
    drillNY,
    phonk,
    lofiHipHop,
    oldSchoolRap,
    cloudRap,
    // EDM
    houseClassic,
    deepHouse,
    techHouse,
    technoMinimal,
    technoIndustrial,
    trance,
    dubstepHalftime,
    drumAndBass,
    jungle,
    breakbeat,
    electro,
    futureBass,
    hardstyle,
    garageUK,
    discoHouse,
    // R&B
    rnbClassic,
    rnbModern,
    neoSoul,
    slowJam,
    // Pop
    popDance,
    popTropical,
    popRock,
    indiePop,
    synthPop,
    // Rock
    rockBasic,
    rockDriving,
    punkRock,
    metalBasic,
    grunge,
    indieRock,
    // Latin & World
    reggaeton,
    latinTrap,
    bossaNova,
    afrobeats,
    dancehall,
    // Jazz & Funk
    jazzSwing,
    funkClassic,
    funkModern,
    disco,
    // Ambient
    ambientMinimal,
    downtempo,
    // Regional
    grime,
    amapiano,
    jerseyClub,
    footwork,
];

// ============================================
// PATTERN LOOKUP FUNCTIONS
// ============================================

/**
 * Get pattern by ID
 */
export function getPatternById(id: string): BeatPattern | undefined {
    return allPatterns.find(p => p.id === id);
}

/**
 * Get patterns by genre
 */
export function getPatternsByGenre(genre: string): BeatPattern[] {
    return allPatterns.filter(p =>
        p.genre.toLowerCase() === genre.toLowerCase() ||
        p.subgenre?.toLowerCase() === genre.toLowerCase()
    );
}

/**
 * Search patterns by tags
 */
export function searchPatternsByTags(tags: string[]): BeatPattern[] {
    const lowerTags = tags.map(t => t.toLowerCase());
    return allPatterns.filter(p =>
        p.tags.some(t => lowerTags.includes(t.toLowerCase()))
    );
}

/**
 * Get patterns suitable for a given BPM
 */
export function getPatternsForBpm(bpm: number): BeatPattern[] {
    return allPatterns.filter(p =>
        bpm >= p.bpmRange.min && bpm <= p.bpmRange.max
    );
}

/**
 * Convert a pattern to addAudioSample actions
 */
export function patternToActions(pattern: BeatPattern): Array<{
    action: 'addAudioSample';
    parameters: {
        category: string;
        subcategory: string;
        trackIndex: number;
        startTick: number;
    };
}> {
    const actions: Array<{
        action: 'addAudioSample';
        parameters: {
            category: string;
            subcategory: string;
            trackIndex: number;
            startTick: number;
        };
    }> = [];

    pattern.tracks.forEach((track, trackIndex) => {
        track.hits.forEach(hit => {
            actions.push({
                action: 'addAudioSample',
                parameters: {
                    category: 'drums',
                    subcategory: track.subcategory,
                    trackIndex,
                    startTick: hit.tick,
                },
            });
        });
    });

    return actions;
}

/**
 * Get a summary of available patterns for the AI prompt
 */
export function getPatternSummaryForPrompt(): string {
    const genreGroups = new Map<string, BeatPattern[]>();

    allPatterns.forEach(p => {
        const existing = genreGroups.get(p.genre) || [];
        existing.push(p);
        genreGroups.set(p.genre, existing);
    });

    let summary = '## AVAILABLE BEAT PATTERNS\n\n';

    genreGroups.forEach((patterns, genre) => {
        summary += `### ${genre}\n`;
        patterns.forEach(p => {
            summary += `- ${p.id}: ${p.name} (${p.bpmRange.min}-${p.bpmRange.max} BPM) - ${p.description}\n`;
        });
        summary += '\n';
    });

    return summary;
}

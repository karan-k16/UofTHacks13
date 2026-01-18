// ============================================
// Pulse Studio - Domain Operations
// ============================================

import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  Pattern,
  Channel,
  Clip,
  PatternClip,
  AudioClip,
  Note,
  StepEvent,
  MixerTrack,
  InsertEffect,
  Send,
  PlaylistTrack,
  UUID,
  DEFAULT_PPQ,
  DEFAULT_BPM,
  ChannelType,
  EffectType,
  SynthSettings,
  SamplerSettings,
} from './types';

// ============================================
// Factory Functions
// ============================================

export function createProject(name: string, ownerId: UUID): Project {
  const masterTrackId = uuidv4();
  const defaultMixerTrackId = uuidv4();
  const synthMixerTrackId = uuidv4();
  const defaultChannelId = uuidv4();
  const synthChannelId = uuidv4();
  const defaultPatternId = uuidv4();

  // Create a test pattern with synth notes
  const testPattern = createPattern('Pattern 1', defaultPatternId);

  // Add a melodic sequence to test oscillator waveforms
  // C4, E4, G4, C5 arpeggio pattern
  testPattern.notes = [
    createNote(60, 0, 96),      // C4 - beat 1
    createNote(64, 96, 96),     // E4 - beat 2
    createNote(67, 192, 96),    // G4 - beat 3
    createNote(72, 288, 96),    // C5 - beat 4
  ];

  return {
    id: uuidv4(),
    ownerId,
    name,
    bpm: 120,
    ppq: 96,
    timeSignature: { numerator: 4, denominator: 4 },
    patterns: [testPattern],
    channels: [
      createChannel('Kick', 'sampler', defaultChannelId, defaultMixerTrackId),
      createChannel('Synth', 'synth', synthChannelId, synthMixerTrackId),
    ],
    playlist: {
      tracks: [
        createPlaylistTrack('Track 1', 0),
      ],
      clips: [],
      loopStart: 0,
      loopEnd: 96 * 4 * 2, // 2 bars
      loopEnabled: false,
      loopCount: 0, // 0 = infinite loops
    },
    mixer: {
      tracks: [
        createMixerTrack('Master', 0, masterTrackId),
        createMixerTrack('Track 1', 1, defaultMixerTrackId),
        createMixerTrack('Synth', 2, synthMixerTrackId),
      ],
      sends: [],
      masterVolume: 1,
    },
    assets: [],
    selectedPatternId: defaultPatternId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createPattern(name: string, id?: UUID): Pattern {
  return {
    id: id || uuidv4(),
    name,
    color: getRandomColor(),
    lengthInSteps: 16,
    stepsPerBeat: 4,
    stepEvents: [],
    notes: [],
  };
}

export function createChannel(
  name: string,
  type: ChannelType,
  id?: UUID,
  mixerTrackId?: UUID,
  preset?: string
): Channel {
  const channel: Channel = {
    id: id || uuidv4(),
    name,
    type,
    color: getRandomColor(),
    volume: 0.8,
    pan: 0,
    mute: false,
    solo: false,
    mixerTrackId: mixerTrackId || uuidv4(),
    preset: preset || (type === 'synth' ? 'default' : undefined),
  };

  if (type === 'synth') {
    channel.synthSettings = createDefaultSynthSettings(preset);
  } else {
    channel.samplerSettings = createDefaultSamplerSettings();
  }

  return channel;
}

export function createDefaultSynthSettings(preset?: string): SynthSettings {
  // Import preset settings from SynthInstrument
  const presetSettings = getSynthPresetSettings(preset || 'default');

  return {
    oscillatorType: presetSettings.oscillatorType || 'sawtooth',
    attack: presetSettings.attack ?? 0.01,
    decay: presetSettings.decay ?? 0.2,
    sustain: presetSettings.sustain ?? 0.5,
    release: presetSettings.release ?? 0.3,
    filterCutoff: presetSettings.filterCutoff ?? 2000,
    filterResonance: presetSettings.filterResonance ?? 1,
  };
}

// Helper function to get synth preset settings
function getSynthPresetSettings(preset: string): Partial<SynthSettings> {
  // Define presets inline to avoid circular dependencies
  const PRESETS: Record<string, Partial<SynthSettings>> = {
    piano: { oscillatorType: 'sine', attack: 0.005, decay: 0.1, sustain: 0.3, release: 1.0, filterCutoff: 3000, filterResonance: 1 },
    electricPiano: { oscillatorType: 'triangle', attack: 0.002, decay: 0.3, sustain: 0.2, release: 0.5, filterCutoff: 2500, filterResonance: 1.5 },
    organ: { oscillatorType: 'sine', attack: 0.001, decay: 0.01, sustain: 0.9, release: 0.05, filterCutoff: 4000, filterResonance: 0.5 },
    harpsichord: { oscillatorType: 'sawtooth', attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.2, filterCutoff: 3500, filterResonance: 2 },
    lead: { oscillatorType: 'square', attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2, filterCutoff: 3000, filterResonance: 2 },
    brightLead: { oscillatorType: 'sawtooth', attack: 0.005, decay: 0.05, sustain: 0.8, release: 0.1, filterCutoff: 5000, filterResonance: 3 },
    bass: { oscillatorType: 'sawtooth', attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2, filterCutoff: 800, filterResonance: 3 },
    subBass: { oscillatorType: 'sine', attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3, filterCutoff: 400, filterResonance: 1 },
    acidBass: { oscillatorType: 'square', attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.1, filterCutoff: 1200, filterResonance: 8 },
    pad: { oscillatorType: 'sine', attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.0, filterCutoff: 1500, filterResonance: 0.5 },
    warmPad: { oscillatorType: 'triangle', attack: 0.8, decay: 0.3, sustain: 0.9, release: 1.5, filterCutoff: 1200, filterResonance: 0.3 },
    stringPad: { oscillatorType: 'sawtooth', attack: 0.3, decay: 0.4, sustain: 0.85, release: 0.8, filterCutoff: 2000, filterResonance: 1 },
    strings: { oscillatorType: 'sawtooth', attack: 0.2, decay: 0.3, sustain: 0.8, release: 0.6, filterCutoff: 2500, filterResonance: 1.2 },
    violin: { oscillatorType: 'sawtooth', attack: 0.15, decay: 0.2, sustain: 0.7, release: 0.4, filterCutoff: 3000, filterResonance: 1.5 },
    cello: { oscillatorType: 'sawtooth', attack: 0.12, decay: 0.25, sustain: 0.75, release: 0.5, filterCutoff: 1800, filterResonance: 1.3 },
    brass: { oscillatorType: 'sawtooth', attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.3, filterCutoff: 2200, filterResonance: 2 },
    trumpet: { oscillatorType: 'square', attack: 0.03, decay: 0.15, sustain: 0.8, release: 0.2, filterCutoff: 2800, filterResonance: 2.5 },
    trombone: { oscillatorType: 'sawtooth', attack: 0.08, decay: 0.2, sustain: 0.75, release: 0.35, filterCutoff: 1500, filterResonance: 1.8 },
    bell: { oscillatorType: 'sine', attack: 0.001, decay: 1.0, sustain: 0.3, release: 1.5, filterCutoff: 4500, filterResonance: 2 },
    glockenspiel: { oscillatorType: 'triangle', attack: 0.001, decay: 0.5, sustain: 0.1, release: 0.8, filterCutoff: 6000, filterResonance: 1.5 },
    marimba: { oscillatorType: 'sine', attack: 0.001, decay: 0.4, sustain: 0.2, release: 0.6, filterCutoff: 2500, filterResonance: 1 },
    pluck: { oscillatorType: 'triangle', attack: 0.001, decay: 0.4, sustain: 0, release: 0.1, filterCutoff: 4000, filterResonance: 1 },
    guitar: { oscillatorType: 'triangle', attack: 0.001, decay: 0.5, sustain: 0.3, release: 0.4, filterCutoff: 3000, filterResonance: 1.2 },
    harp: { oscillatorType: 'sine', attack: 0.001, decay: 0.8, sustain: 0.2, release: 1.0, filterCutoff: 4000, filterResonance: 0.8 },
    atmosphericPad: { oscillatorType: 'sine', attack: 1.0, decay: 0.5, sustain: 0.9, release: 2.0, filterCutoff: 1000, filterResonance: 0.3 },
    metallic: { oscillatorType: 'square', attack: 0.001, decay: 0.6, sustain: 0.2, release: 0.8, filterCutoff: 5000, filterResonance: 5 },
  };
  
  return PRESETS[preset] ?? PRESETS.default!;
}

export function createDefaultSamplerSettings(): SamplerSettings {
  return {
    sampleUrl: '',
    rootNote: 60,
    attack: 0.001,
    decay: 0.1,
    sustain: 1,
    release: 0.1,
  };
}

export function createNote(
  pitch: number,
  startTick: number,
  durationTick: number,
  velocity: number = 100
): Note {
  return {
    id: uuidv4(),
    pitch,
    startTick,
    durationTick,
    velocity,
  };
}

export function createStepEvent(
  channelId: UUID,
  step: number,
  velocity: number = 100,
  pitch?: number
): StepEvent {
  return {
    channelId,
    step,
    velocity,
    pitch,
  };
}

export function createPatternClip(
  patternId: UUID,
  trackIndex: number,
  startTick: number,
  durationTick: number,
  color?: string
): PatternClip {
  return {
    id: uuidv4(),
    type: 'pattern',
    patternId,
    trackIndex,
    startTick,
    durationTick,
    offset: 0,
    color: color || getRandomColor(),
    mute: false,
  };
}

export function createAudioClip(
  assetId: UUID,
  trackIndex: number,
  startTick: number,
  durationTick: number,
  color?: string
): AudioClip {
  return {
    id: uuidv4(),
    type: 'audio',
    assetId,
    trackIndex,
    startTick,
    durationTick,
    offset: 0,
    color: color || '#4ecdc4',
    mute: false,
    gain: 1,
    pitch: 0,
  };
}

export function createPlaylistTrack(name: string, index: number): PlaylistTrack {
  return {
    id: uuidv4(),
    name,
    index,
    height: 60,
    color: '#3a3a3a',
    mute: false,
    solo: false,
    locked: false,
  };
}

export function createMixerTrack(name: string, index: number, id?: UUID): MixerTrack {
  return {
    id: id || uuidv4(),
    name,
    index,
    volume: index === 0 ? 1 : 0.8, // Master at 100%
    pan: 0,
    mute: false,
    solo: false,
    inserts: [],
    color: index === 0 ? '#ff6b35' : '#4a4a4a',
  };
}

export function createInsertEffect(type: EffectType): InsertEffect {
  const baseEffect = {
    id: uuidv4(),
    type,
    enabled: true,
  };

  switch (type) {
    case 'eq':
      return {
        ...baseEffect,
        params: {
          lowGain: 0,
          midGain: 0,
          highGain: 0,
          lowFreq: 200,
          highFreq: 3000,
        },
      };
    case 'compressor':
      return {
        ...baseEffect,
        params: {
          threshold: -24,
          ratio: 4,
          attack: 0.003,
          release: 0.25,
          makeupGain: 0,
        },
      };
    case 'reverb':
      return {
        ...baseEffect,
        params: {
          decay: 2,
          preDelay: 0.01,
          wet: 0.3,
        },
      };
    case 'delay':
      return {
        ...baseEffect,
        params: {
          time: 0.25,
          feedback: 0.4,
          wet: 0.3,
        },
      };
  }
}

export function createSend(fromTrackId: UUID, toTrackId: UUID, gain: number = 0.5): Send {
  return {
    id: uuidv4(),
    fromTrackId,
    toTrackId,
    gain,
    preFader: false,
  };
}

// ============================================
// Clip Operations
// ============================================

export function moveClip(clip: Clip, deltaX: number, deltaY: number, maxTrackIndex?: number): Clip {
  const newTrackIndex = Math.max(0, clip.trackIndex + deltaY);
  return {
    ...clip,
    startTick: Math.max(0, clip.startTick + deltaX),
    trackIndex: maxTrackIndex !== undefined ? Math.min(newTrackIndex, maxTrackIndex) : newTrackIndex,
  };
}

export function resizeClip(clip: Clip, newDuration: number): Clip {
  return {
    ...clip,
    durationTick: Math.max(1, newDuration),
  };
}

export function duplicateClip(clip: Clip, offsetTick?: number): Clip {
  return {
    ...clip,
    id: uuidv4(),
    startTick: clip.startTick + (offsetTick ?? clip.durationTick),
  };
}

export function splitClip(clip: Clip, splitTick: number): [Clip, Clip] | null {
  if (splitTick <= clip.startTick || splitTick >= clip.startTick + clip.durationTick) {
    return null;
  }

  const firstDuration = splitTick - clip.startTick;
  const secondDuration = clip.durationTick - firstDuration;

  const firstClip: Clip = {
    ...clip,
    durationTick: firstDuration,
  };

  const secondClip: Clip = {
    ...clip,
    id: uuidv4(),
    startTick: splitTick,
    durationTick: secondDuration,
    offset: clip.offset + firstDuration,
  };

  return [firstClip, secondClip];
}

// ============================================
// Note Operations
// ============================================

export function moveNote(note: Note, deltaPitch: number, deltaTick: number): Note {
  return {
    ...note,
    pitch: Math.max(0, Math.min(127, note.pitch + deltaPitch)),
    startTick: Math.max(0, note.startTick + deltaTick),
  };
}

export function resizeNote(note: Note, newDuration: number): Note {
  return {
    ...note,
    durationTick: Math.max(1, newDuration),
  };
}

export function duplicateNote(note: Note, offsetTick?: number): Note {
  return {
    ...note,
    id: uuidv4(),
    startTick: note.startTick + (offsetTick ?? note.durationTick),
  };
}

export function quantizeNote(note: Note, gridSize: number): Note {
  const quantizedStart = Math.round(note.startTick / gridSize) * gridSize;
  const quantizedDuration = Math.max(gridSize, Math.round(note.durationTick / gridSize) * gridSize);

  return {
    ...note,
    startTick: quantizedStart,
    durationTick: quantizedDuration,
  };
}

export function quantizeNotes(notes: Note[], gridSize: number): Note[] {
  return notes.map((note) => quantizeNote(note, gridSize));
}

// ============================================
// Pattern Operations
// ============================================

export function duplicatePattern(pattern: Pattern, newName?: string): Pattern {
  return {
    ...pattern,
    id: uuidv4(),
    name: newName || `${pattern.name} (copy)`,
    stepEvents: pattern.stepEvents.map((e) => ({ ...e })),
    notes: pattern.notes.map((n) => ({ ...n, id: uuidv4() })),
  };
}

export function resizePattern(pattern: Pattern, newLengthInSteps: number): Pattern {
  return {
    ...pattern,
    lengthInSteps: Math.max(1, newLengthInSteps),
    // Remove events beyond new length
    stepEvents: pattern.stepEvents.filter((e) => e.step < newLengthInSteps),
    notes: pattern.notes.filter(
      (n) => n.startTick < (newLengthInSteps / pattern.stepsPerBeat) * 96
    ),
  };
}

export function clearPattern(pattern: Pattern): Pattern {
  return {
    ...pattern,
    stepEvents: [],
    notes: [],
  };
}

// ============================================
// Time Conversion
// ============================================

export function ticksToBeats(ticks: number, ppq: number = 96): number {
  return ticks / ppq;
}

export function beatsToTicks(beats: number, ppq: number = 96): number {
  return Math.round(beats * ppq);
}

export function ticksToSeconds(ticks: number, bpm: number, ppq: number = 96): number {
  return (ticks / ppq) * (60 / bpm);
}

export function secondsToTicks(seconds: number, bpm: number, ppq: number = 96): number {
  return Math.round((seconds * bpm * ppq) / 60);
}

export function ticksToTime(ticks: number, ppq: number = 96, timeSignature = { numerator: 4, denominator: 4 }): { bar: number; beat: number; tick: number } {
  const ticksPerBeat = ppq;
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;

  const bar = Math.floor(ticks / ticksPerBar) + 1;
  const remainingAfterBar = ticks % ticksPerBar;
  const beat = Math.floor(remainingAfterBar / ticksPerBeat) + 1;
  const tick = remainingAfterBar % ticksPerBeat;

  return { bar, beat, tick };
}

export function timeToTicks(bar: number, beat: number, tick: number, ppq: number = 96, timeSignature = { numerator: 4, denominator: 4 }): number {
  const ticksPerBeat = ppq;
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;

  return (bar - 1) * ticksPerBar + (beat - 1) * ticksPerBeat + tick;
}

// ============================================
// Snap to Grid
// ============================================

export function snapToGrid(tick: number, gridSize: number): number {
  return Math.round(tick / gridSize) * gridSize;
}

export function snapToGridFloor(tick: number, gridSize: number): number {
  return Math.floor(tick / gridSize) * gridSize;
}

export function snapToGridCeil(tick: number, gridSize: number): number {
  return Math.ceil(tick / gridSize) * gridSize;
}

// ============================================
// MIDI Utilities
// ============================================

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiNoteToName(note: number): string {
  const octave = Math.floor(note / 12) - 1;
  const noteName = NOTE_NAMES[note % 12];
  return `${noteName}${octave}`;
}

export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G]#?)(-?\d+)$/i);
  if (!match) return 60; // Default to C4

  const noteName = match[1]?.toUpperCase() ?? 'C';
  const octave = parseInt(match[2] ?? '4', 10);
  const noteIndex = NOTE_NAMES.indexOf(noteName);

  if (noteIndex === -1) return 60;
  return (octave + 1) * 12 + noteIndex;
}

export function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// ============================================
// Color Utilities
// ============================================

const PATTERN_COLORS = [
  '#ff6b35', // Orange
  '#4ecdc4', // Cyan
  '#ffe66d', // Yellow
  '#9b59b6', // Purple
  '#3498db', // Blue
  '#27ae60', // Green
  '#e74c3c', // Red
  '#f39c12', // Amber
  '#1abc9c', // Teal
  '#e91e63', // Pink
];

let colorIndex = 0;

export function getRandomColor(): string {
  const color = PATTERN_COLORS[colorIndex % PATTERN_COLORS.length];
  colorIndex++;
  return color ?? '#ff6b35';
}

export function getColorForIndex(index: number): string {
  return PATTERN_COLORS[index % PATTERN_COLORS.length] ?? '#ff6b35';
}

// Audio Sample Color Mapping
// Different colors for different sample categories/types
const SAMPLE_COLORS: Record<string, string> = {
  // Drums - Orange tones
  'drums': '#ff6b35',      // Orange
  'kick': '#ff8c42',       // Light orange
  'snare': '#ffd93d',      // Yellow
  'clap': '#fcbf49',       // Golden yellow
  'hihat': '#f4a261',      // Light brown/orange
  'cymbal': '#e76f51',     // Dark orange
  'tom': '#d95d39',        // Deep orange
  'perc': '#ff9770',       // Peachy orange

  // Instruments - Blue/Purple tones
  'instruments': '#3498db',  // Blue
  'piano': '#5dade2',        // Light blue
  'guitar': '#3498db',       // Blue
  'bass': '#2874a6',         // Dark blue
  'strings': '#8e44ad',      // Purple
  'brass': '#9b59b6',        // Light purple
  'woodwind': '#7d3c98',     // Medium purple

  // Synth - Cyan/Teal tones
  'synth': '#4ecdc4',        // Cyan
  'lead': '#45b7aa',         // Dark teal
  'pad': '#5fccbd',          // Light teal
  'pluck': '#38ada9',        // Teal
  'wavetable': '#4ecdc4',    // Cyan

  // Orchestral - Green tones
  'orchestral': '#27ae60',   // Green
  'violin': '#2ecc71',       // Light green
  'cello': '#229954',        // Medium green
  'horn': '#1e8449',         // Dark green

  // FX - Red/Pink tones
  'fx': '#e74c3c',           // Red
  'riser': '#ec7063',        // Light red
  'impact': '#e91e63',       // Pink
  'sweep': '#f06292',        // Light pink
  'transition': '#c2185b',   // Dark pink

  // Default
  'default': '#4ecdc4'       // Cyan (fallback)
};

/**
 * Get a color for an audio sample based on its category/subcategory
 * Extracts category from sample ID (format: category_subcategory_name) or name
 */
export function getSampleColor(sampleIdOrName: string): string {
  if (!sampleIdOrName) return SAMPLE_COLORS['default'];

  const lower = sampleIdOrName.toLowerCase();

  // Try to extract category from ID format (e.g., "drums_kick_sample-name")
  const parts = lower.split('_');
  if (parts.length >= 2) {
    const category = parts[0];
    const subcategory = parts[1];

    // Try subcategory first (more specific)
    if (SAMPLE_COLORS[subcategory]) {
      return SAMPLE_COLORS[subcategory];
    }

    // Try category
    if (SAMPLE_COLORS[category]) {
      return SAMPLE_COLORS[category];
    }
  }

  // Fallback: check if any keyword is in the name
  for (const [key, color] of Object.entries(SAMPLE_COLORS)) {
    if (lower.includes(key)) {
      return color;
    }
  }

  return SAMPLE_COLORS['default'];
}

// ============================================
// Project Statistics
// ============================================

export function getProjectStats(project: Project) {
  return {
    patternCount: project.patterns.length,
    channelCount: project.channels.length,
    clipCount: project.playlist.clips.length,
    noteCount: project.patterns.reduce((sum, p) => sum + p.notes.length, 0),
    totalLength: Math.max(
      ...project.playlist.clips.map((c) => c.startTick + c.durationTick),
      0
    ),
  };
}

// ============================================
// Demo Project
// ============================================

export function createDemoProject(ownerId: UUID): Project {
  const project = createProject('Demo Project', ownerId);

  // Create additional patterns
  const pattern2 = createPattern('Pattern 2');
  pattern2.color = '#4ecdc4';
  project.patterns.push(pattern2);

  // Add a bass synth channel
  const bassChannel = createChannel('Bass', 'synth', undefined, undefined, 'bass');
  bassChannel.color = '#9b59b6';

  // Add bass synth to mixer
  const bassMixerTrack = createMixerTrack('Bass', project.mixer.tracks.length);
  project.mixer.tracks.push(bassMixerTrack);
  bassChannel.mixerTrackId = bassMixerTrack.id;

  project.channels.push(bassChannel);

  // Add some step events to pattern 1 (kick pattern)
  const kickChannelId = project.channels[0]?.id;
  if (kickChannelId && project.patterns[0]) {
    project.patterns[0].stepEvents = [
      createStepEvent(kickChannelId, 0, 100),
      createStepEvent(kickChannelId, 4, 100),
      createStepEvent(kickChannelId, 8, 100),
      createStepEvent(kickChannelId, 12, 100),
    ];
  }

  // Add some notes to pattern 2 (bass line)
  if (project.patterns[1]) {
    project.patterns[1].notes = [
      createNote(36, 0, 24, 100),
      createNote(36, 24, 24, 80),
      createNote(38, 48, 24, 100),
      createNote(36, 72, 24, 90),
    ];
  }

  // Add clips to playlist
  const firstPattern = project.patterns[0];
  if (firstPattern) {
    const clip1 = createPatternClip(firstPattern.id, 0, 0, 384, firstPattern.color);
    const clip2 = createPatternClip(firstPattern.id, 0, 384, 384, firstPattern.color);
    project.playlist.clips.push(clip1, clip2);
  }

  // Add more playlist tracks
  project.playlist.tracks.push(
    createPlaylistTrack('Track 2', 1),
    createPlaylistTrack('Track 3', 2)
  );

  // Add more mixer tracks
  project.mixer.tracks.push(
    createMixerTrack('Track 2', 2),
    createMixerTrack('Track 3', 3)
  );

  // Add some effects to mixer track 1
  const mixerTrack1 = project.mixer.tracks[1];
  if (mixerTrack1) {
    mixerTrack1.inserts = [
      createInsertEffect('eq'),
      createInsertEffect('compressor'),
    ];
  }

  return project;
}


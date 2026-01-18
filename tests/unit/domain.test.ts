// ============================================
// Pulse Studio - Domain Unit Tests
// ============================================

import { describe, it, expect } from 'vitest';
import {
  createProject,
  createPattern,
  createChannel,
  createNote,
  duplicatePattern,
  moveNote,
  resizeNote,
  quantizeNote,
  quantizeNotes,
  ticksToBeats,
  beatsToTicks,
  ticksToSeconds,
  secondsToTicks,
  ticksToTime,
  timeToTicks,
  snapToGrid,
  midiNoteToName,
  noteNameToMidi,
} from '@/domain/operations';
import {
  validateNote,
  validatePattern,
  validateChannel,
  validateMixerRouting,
  isValidBpm,
  isValidMidiNote,
  isValidVelocity,
} from '@/domain/validators';

// ============================================
// Factory Function Tests
// ============================================

describe('Factory Functions', () => {
  describe('createProject', () => {
    it('should create a project with default values', () => {
      const project = createProject('Test Project', 'user-123');
      
      expect(project.name).toBe('Test Project');
      expect(project.ownerId).toBe('user-123');
      expect(project.bpm).toBe(120);
      expect(project.ppq).toBe(96);
      expect(project.patterns.length).toBeGreaterThan(0);
      expect(project.channels.length).toBeGreaterThan(0);
      expect(project.mixer.tracks.length).toBeGreaterThan(0);
    });

    it('should create unique IDs for each project', () => {
      const project1 = createProject('Project 1', 'user-123');
      const project2 = createProject('Project 2', 'user-123');
      
      expect(project1.id).not.toBe(project2.id);
    });
  });

  describe('createPattern', () => {
    it('should create a pattern with default values', () => {
      const pattern = createPattern('Test Pattern');
      
      expect(pattern.name).toBe('Test Pattern');
      expect(pattern.lengthInSteps).toBe(16);
      expect(pattern.stepsPerBeat).toBe(4);
      expect(pattern.stepEvents).toEqual([]);
      expect(pattern.notes).toEqual([]);
    });
  });

  describe('createChannel', () => {
    it('should create a sampler channel', () => {
      const channel = createChannel('Kick', 'sampler');
      
      expect(channel.name).toBe('Kick');
      expect(channel.type).toBe('sampler');
      expect(channel.samplerSettings).toBeDefined();
    });

    it('should create a synth channel', () => {
      const channel = createChannel('Lead', 'synth');
      
      expect(channel.name).toBe('Lead');
      expect(channel.type).toBe('synth');
      expect(channel.synthSettings).toBeDefined();
    });
  });

  describe('createNote', () => {
    it('should create a note with correct values', () => {
      const note = createNote(60, 0, 96, 100);
      
      expect(note.pitch).toBe(60);
      expect(note.startTick).toBe(0);
      expect(note.durationTick).toBe(96);
      expect(note.velocity).toBe(100);
    });
  });
});

// ============================================
// Note Operations Tests
// ============================================

describe('Note Operations', () => {
  describe('moveNote', () => {
    it('should move note by pitch and tick delta', () => {
      const note = createNote(60, 0, 96, 100);
      const moved = moveNote(note, 2, 48);
      
      expect(moved.pitch).toBe(62);
      expect(moved.startTick).toBe(48);
    });

    it('should clamp pitch to valid MIDI range', () => {
      const note = createNote(127, 0, 96, 100);
      const moved = moveNote(note, 5, 0);
      
      expect(moved.pitch).toBe(127);
    });

    it('should not allow negative start tick', () => {
      const note = createNote(60, 10, 96, 100);
      const moved = moveNote(note, 0, -20);
      
      expect(moved.startTick).toBe(0);
    });
  });

  describe('resizeNote', () => {
    it('should resize note duration', () => {
      const note = createNote(60, 0, 96, 100);
      const resized = resizeNote(note, 48);
      
      expect(resized.durationTick).toBe(48);
    });

    it('should not allow zero or negative duration', () => {
      const note = createNote(60, 0, 96, 100);
      const resized = resizeNote(note, -10);
      
      expect(resized.durationTick).toBe(1);
    });
  });

  describe('quantizeNote', () => {
    it('should quantize note to grid', () => {
      const note = createNote(60, 25, 90, 100);
      const quantized = quantizeNote(note, 24);
      
      expect(quantized.startTick).toBe(24);
      expect(quantized.durationTick).toBe(96); // Rounded to nearest grid
    });
  });

  describe('quantizeNotes', () => {
    it('should quantize multiple notes', () => {
      const notes = [
        createNote(60, 25, 90, 100),
        createNote(62, 50, 45, 80),
      ];
      const quantized = quantizeNotes(notes, 24);
      
      expect(quantized[0]?.startTick).toBe(24);
      expect(quantized[1]?.startTick).toBe(48);
    });
  });
});

// ============================================
// Time Conversion Tests
// ============================================

describe('Time Conversions', () => {
  describe('ticksToBeats', () => {
    it('should convert ticks to beats', () => {
      expect(ticksToBeats(96)).toBe(1);
      expect(ticksToBeats(192)).toBe(2);
      expect(ticksToBeats(48)).toBe(0.5);
    });
  });

  describe('beatsToTicks', () => {
    it('should convert beats to ticks', () => {
      expect(beatsToTicks(1)).toBe(96);
      expect(beatsToTicks(2)).toBe(192);
      expect(beatsToTicks(0.5)).toBe(48);
    });
  });

  describe('ticksToSeconds', () => {
    it('should convert ticks to seconds at 120 BPM', () => {
      // At 120 BPM, 1 beat = 0.5 seconds
      expect(ticksToSeconds(96, 120)).toBe(0.5);
      expect(ticksToSeconds(192, 120)).toBe(1);
    });

    it('should convert ticks to seconds at 60 BPM', () => {
      // At 60 BPM, 1 beat = 1 second
      expect(ticksToSeconds(96, 60)).toBe(1);
    });
  });

  describe('secondsToTicks', () => {
    it('should convert seconds to ticks', () => {
      expect(secondsToTicks(0.5, 120)).toBe(96);
      expect(secondsToTicks(1, 120)).toBe(192);
    });
  });

  describe('ticksToTime', () => {
    it('should convert ticks to BBT format', () => {
      const time = ticksToTime(0);
      expect(time).toEqual({ bar: 1, beat: 1, tick: 0 });

      const time2 = ticksToTime(96);
      expect(time2).toEqual({ bar: 1, beat: 2, tick: 0 });

      const time3 = ticksToTime(384);
      expect(time3).toEqual({ bar: 2, beat: 1, tick: 0 });
    });
  });

  describe('timeToTicks', () => {
    it('should convert BBT to ticks', () => {
      expect(timeToTicks(1, 1, 0)).toBe(0);
      expect(timeToTicks(1, 2, 0)).toBe(96);
      expect(timeToTicks(2, 1, 0)).toBe(384);
    });
  });
});

// ============================================
// Grid Snapping Tests
// ============================================

describe('Grid Snapping', () => {
  describe('snapToGrid', () => {
    it('should snap to nearest grid position', () => {
      expect(snapToGrid(25, 24)).toBe(24);
      expect(snapToGrid(35, 24)).toBe(24);
      expect(snapToGrid(36, 24)).toBe(48);
    });
  });
});

// ============================================
// MIDI Utilities Tests
// ============================================

describe('MIDI Utilities', () => {
  describe('midiNoteToName', () => {
    it('should convert MIDI note to name', () => {
      expect(midiNoteToName(60)).toBe('C4');
      expect(midiNoteToName(69)).toBe('A4');
      expect(midiNoteToName(61)).toBe('C#4');
    });
  });

  describe('noteNameToMidi', () => {
    it('should convert note name to MIDI', () => {
      expect(noteNameToMidi('C4')).toBe(60);
      expect(noteNameToMidi('A4')).toBe(69);
      expect(noteNameToMidi('C#4')).toBe(61);
    });
  });
});

// ============================================
// Validation Tests
// ============================================

describe('Validators', () => {
  describe('validateNote', () => {
    it('should validate correct note', () => {
      const note = createNote(60, 0, 96, 100);
      const result = validateNote(note);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid pitch', () => {
      const note = createNote(200, 0, 96, 100);
      const result = validateNote(note);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('pitch'))).toBe(true);
    });

    it('should reject invalid velocity', () => {
      const note = createNote(60, 0, 96, 200);
      const result = validateNote(note);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePattern', () => {
    it('should validate correct pattern', () => {
      const pattern = createPattern('Test');
      const result = validatePattern(pattern);
      
      expect(result.valid).toBe(true);
    });

    it('should reject empty name', () => {
      const pattern = createPattern('');
      const result = validatePattern(pattern);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('validateMixerRouting', () => {
    it('should detect self-routing', () => {
      const tracks = [{ id: 'track-1', name: 'Track 1', index: 0, volume: 1, pan: 0, mute: false, solo: false, inserts: [], color: '#fff' }];
      const sends = [{ id: 'send-1', fromTrackId: 'track-1', toTrackId: 'track-1', gain: 0.5, preFader: false }];
      
      const result = validateMixerRouting(sends, tracks);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('itself'))).toBe(true);
    });
  });

  describe('isValidBpm', () => {
    it('should validate BPM range', () => {
      expect(isValidBpm(120)).toBe(true);
      expect(isValidBpm(20)).toBe(true);
      expect(isValidBpm(999)).toBe(true);
      expect(isValidBpm(10)).toBe(false);
      expect(isValidBpm(1000)).toBe(false);
    });
  });

  describe('isValidMidiNote', () => {
    it('should validate MIDI note range', () => {
      expect(isValidMidiNote(60)).toBe(true);
      expect(isValidMidiNote(0)).toBe(true);
      expect(isValidMidiNote(127)).toBe(true);
      expect(isValidMidiNote(-1)).toBe(false);
      expect(isValidMidiNote(128)).toBe(false);
    });
  });

  describe('isValidVelocity', () => {
    it('should validate velocity range', () => {
      expect(isValidVelocity(100)).toBe(true);
      expect(isValidVelocity(0)).toBe(true);
      expect(isValidVelocity(127)).toBe(true);
      expect(isValidVelocity(-1)).toBe(false);
      expect(isValidVelocity(128)).toBe(false);
    });
  });
});

// ============================================
// Pattern Operations Tests
// ============================================

describe('Pattern Operations', () => {
  describe('duplicatePattern', () => {
    it('should duplicate pattern with new ID', () => {
      const original = createPattern('Original');
      const duplicate = duplicatePattern(original);
      
      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.name).toBe('Original (copy)');
      expect(duplicate.lengthInSteps).toBe(original.lengthInSteps);
    });

    it('should allow custom name', () => {
      const original = createPattern('Original');
      const duplicate = duplicatePattern(original, 'Custom Name');
      
      expect(duplicate.name).toBe('Custom Name');
    });
  });
});


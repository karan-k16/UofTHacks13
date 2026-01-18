// ============================================
// Pulse Studio - Synth Instrument
// ============================================

import { getTone } from '../ToneProvider';
import type { SynthSettings } from '@/domain/types';

// ============================================
// Synth Presets
// ============================================

export const SYNTH_PRESETS: Record<string, Partial<SynthSettings>> = {
  // ===== KEYBOARDS =====
  piano: {
    oscillatorType: 'sine',
    attack: 0.005,
    decay: 0.1,
    sustain: 0.3,
    release: 1.0,
    filterCutoff: 3000,
    filterResonance: 1,
  },
  electricPiano: {
    oscillatorType: 'triangle',
    attack: 0.002,
    decay: 0.3,
    sustain: 0.2,
    release: 0.5,
    filterCutoff: 2500,
    filterResonance: 1.5,
  },
  organ: {
    oscillatorType: 'sine',
    attack: 0.001,
    decay: 0.01,
    sustain: 0.9,
    release: 0.05,
    filterCutoff: 4000,
    filterResonance: 0.5,
  },
  harpsichord: {
    oscillatorType: 'sawtooth',
    attack: 0.001,
    decay: 0.3,
    sustain: 0.1,
    release: 0.2,
    filterCutoff: 3500,
    filterResonance: 2,
  },

  // ===== SYNTH LEADS =====
  lead: {
    oscillatorType: 'square',
    attack: 0.01,
    decay: 0.1,
    sustain: 0.7,
    release: 0.2,
    filterCutoff: 3000,
    filterResonance: 2,
  },
  brightLead: {
    oscillatorType: 'sawtooth',
    attack: 0.005,
    decay: 0.05,
    sustain: 0.8,
    release: 0.1,
    filterCutoff: 5000,
    filterResonance: 3,
  },
  
  // ===== BASS =====
  bass: {
    oscillatorType: 'sawtooth',
    attack: 0.01,
    decay: 0.3,
    sustain: 0.4,
    release: 0.2,
    filterCutoff: 800,
    filterResonance: 3,
  },
  subBass: {
    oscillatorType: 'sine',
    attack: 0.01,
    decay: 0.2,
    sustain: 0.6,
    release: 0.3,
    filterCutoff: 400,
    filterResonance: 1,
  },
  acidBass: {
    oscillatorType: 'square',
    attack: 0.01,
    decay: 0.15,
    sustain: 0.3,
    release: 0.1,
    filterCutoff: 1200,
    filterResonance: 8,
  },

  // ===== PADS =====
  pad: {
    oscillatorType: 'sine',
    attack: 0.5,
    decay: 0.5,
    sustain: 0.8,
    release: 1.0,
    filterCutoff: 1500,
    filterResonance: 0.5,
  },
  warmPad: {
    oscillatorType: 'triangle',
    attack: 0.8,
    decay: 0.3,
    sustain: 0.9,
    release: 1.5,
    filterCutoff: 1200,
    filterResonance: 0.3,
  },
  stringPad: {
    oscillatorType: 'sawtooth',
    attack: 0.3,
    decay: 0.4,
    sustain: 0.85,
    release: 0.8,
    filterCutoff: 2000,
    filterResonance: 1,
  },

  // ===== STRINGS & ORCHESTRAL =====
  strings: {
    oscillatorType: 'sawtooth',
    attack: 0.2,
    decay: 0.3,
    sustain: 0.8,
    release: 0.6,
    filterCutoff: 2500,
    filterResonance: 1.2,
  },
  violin: {
    oscillatorType: 'sawtooth',
    attack: 0.15,
    decay: 0.2,
    sustain: 0.7,
    release: 0.4,
    filterCutoff: 3000,
    filterResonance: 1.5,
  },
  cello: {
    oscillatorType: 'sawtooth',
    attack: 0.12,
    decay: 0.25,
    sustain: 0.75,
    release: 0.5,
    filterCutoff: 1800,
    filterResonance: 1.3,
  },

  // ===== BRASS =====
  brass: {
    oscillatorType: 'sawtooth',
    attack: 0.05,
    decay: 0.2,
    sustain: 0.7,
    release: 0.3,
    filterCutoff: 2200,
    filterResonance: 2,
  },
  trumpet: {
    oscillatorType: 'square',
    attack: 0.03,
    decay: 0.15,
    sustain: 0.8,
    release: 0.2,
    filterCutoff: 2800,
    filterResonance: 2.5,
  },
  trombone: {
    oscillatorType: 'sawtooth',
    attack: 0.08,
    decay: 0.2,
    sustain: 0.75,
    release: 0.35,
    filterCutoff: 1500,
    filterResonance: 1.8,
  },

  // ===== BELLS & MALLETS =====
  bell: {
    oscillatorType: 'sine',
    attack: 0.001,
    decay: 1.0,
    sustain: 0.3,
    release: 1.5,
    filterCutoff: 4500,
    filterResonance: 2,
  },
  glockenspiel: {
    oscillatorType: 'triangle',
    attack: 0.001,
    decay: 0.5,
    sustain: 0.1,
    release: 0.8,
    filterCutoff: 6000,
    filterResonance: 1.5,
  },
  marimba: {
    oscillatorType: 'sine',
    attack: 0.001,
    decay: 0.4,
    sustain: 0.2,
    release: 0.6,
    filterCutoff: 2500,
    filterResonance: 1,
  },

  // ===== PLUCKED =====
  pluck: {
    oscillatorType: 'triangle',
    attack: 0.001,
    decay: 0.4,
    sustain: 0,
    release: 0.1,
    filterCutoff: 4000,
    filterResonance: 1,
  },
  guitar: {
    oscillatorType: 'triangle',
    attack: 0.001,
    decay: 0.5,
    sustain: 0.3,
    release: 0.4,
    filterCutoff: 3000,
    filterResonance: 1.2,
  },
  harp: {
    oscillatorType: 'sine',
    attack: 0.001,
    decay: 0.8,
    sustain: 0.2,
    release: 1.0,
    filterCutoff: 4000,
    filterResonance: 0.8,
  },

  // ===== FX & SPECIAL =====
  atmosphericPad: {
    oscillatorType: 'sine',
    attack: 1.0,
    decay: 0.5,
    sustain: 0.9,
    release: 2.0,
    filterCutoff: 1000,
    filterResonance: 0.3,
  },
  metallic: {
    oscillatorType: 'square',
    attack: 0.001,
    decay: 0.6,
    sustain: 0.2,
    release: 0.8,
    filterCutoff: 5000,
    filterResonance: 5,
  },
  
  // ===== DEFAULT =====
  default: {
    oscillatorType: 'sawtooth',
    attack: 0.01,
    decay: 0.2,
    sustain: 0.5,
    release: 0.3,
    filterCutoff: 2000,
    filterResonance: 1,
  },
};

// ============================================
// Synth Instrument Class
// ============================================

export class SynthInstrument {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private synth: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private filter: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private output: any;
  private settings: SynthSettings;
  private initialized = false;

  constructor(settings: SynthSettings) {
    this.settings = settings;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const Tone = getTone();
    if (!Tone) {
      throw new Error('Tone.js not available');
    }

    // Create synth
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: this.settings.oscillatorType },
      envelope: {
        attack: this.settings.attack,
        decay: this.settings.decay,
        sustain: this.settings.sustain,
        release: this.settings.release,
      },
    });

    // Create filter
    this.filter = new Tone.Filter({
      frequency: this.settings.filterCutoff,
      Q: this.settings.filterResonance,
      type: 'lowpass',
    });

    // Create output channel
    this.output = new Tone.Gain(1);

    // Connect chain
    this.synth.connect(this.filter);
    this.filter.connect(this.output);

    this.initialized = true;
  }

  // ==========================================
  // Playback
  // ==========================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerAttack(notes: any, time?: any, velocity?: number): void {
    if (!this.synth) return;
    this.synth.triggerAttack(notes, time, velocity);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerRelease(notes: any, time?: any): void {
    if (!this.synth) return;
    this.synth.triggerRelease(notes, time);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerAttackRelease(notes: any, duration: any, time?: any, velocity?: number): void {
    if (!this.synth) return;
    this.synth.triggerAttackRelease(notes, duration, time, velocity);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  releaseAll(time?: any): void {
    if (!this.synth) return;
    this.synth.releaseAll(time);
  }

  // ==========================================
  // Settings
  // ==========================================

  updateSettings(settings: Partial<SynthSettings>): void {
    this.settings = { ...this.settings, ...settings };

    if (!this.synth) return;

    if (settings.oscillatorType) {
      this.synth.set({
        oscillator: { type: settings.oscillatorType },
      });
    }

    if (
      settings.attack !== undefined ||
      settings.decay !== undefined ||
      settings.sustain !== undefined ||
      settings.release !== undefined
    ) {
      this.synth.set({
        envelope: {
          attack: settings.attack ?? this.settings.attack,
          decay: settings.decay ?? this.settings.decay,
          sustain: settings.sustain ?? this.settings.sustain,
          release: settings.release ?? this.settings.release,
        },
      });
    }

    if (settings.filterCutoff !== undefined && this.filter) {
      this.filter.frequency.value = settings.filterCutoff;
    }

    if (settings.filterResonance !== undefined && this.filter) {
      this.filter.Q.value = settings.filterResonance;
    }
  }

  getSettings(): SynthSettings {
    return { ...this.settings };
  }

  // ==========================================
  // Routing
  // ==========================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connect(destination: any): this {
    if (this.output) {
      this.output.connect(destination);
    }
    return this;
  }

  disconnect(): this {
    if (this.output) {
      this.output.disconnect();
    }
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOutput(): any {
    return this.output;
  }

  // ==========================================
  // Volume/Pan
  // ==========================================

  setVolume(volume: number): void {
    if (!this.output) return;
    const Tone = getTone();
    if (!Tone) return;
    this.output.volume.value = Tone.gainToDb(volume);
  }

  setPan(pan: number): void {
    if (!this.output) return;
    this.output.pan.value = pan;
  }

  setMute(mute: boolean): void {
    if (!this.output) return;
    this.output.mute = mute;
  }

  // ==========================================
  // Cleanup
  // ==========================================

  dispose(): void {
    if (this.synth) this.synth.dispose();
    if (this.filter) this.filter.dispose();
    if (this.output) this.output.dispose();
  }
}

// ==========================================
// Factory Function
// ==========================================

export function createSynthInstrument(
  preset: keyof typeof SYNTH_PRESETS = 'default'
): SynthInstrument {
  const presetSettings = SYNTH_PRESETS[preset];
  const settings: SynthSettings = {
    oscillatorType: presetSettings?.oscillatorType ?? 'sawtooth',
    attack: presetSettings?.attack ?? 0.01,
    decay: presetSettings?.decay ?? 0.2,
    sustain: presetSettings?.sustain ?? 0.5,
    release: presetSettings?.release ?? 0.3,
    filterCutoff: presetSettings?.filterCutoff ?? 2000,
    filterResonance: presetSettings?.filterResonance ?? 1,
  };

  return new SynthInstrument(settings);
}

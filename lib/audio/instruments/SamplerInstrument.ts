// ============================================
// Pulse Studio - Sampler Instrument
// ============================================

import { getTone } from '../ToneProvider';
import type { SamplerSettings } from '@/domain/types';

// ============================================
// Sampler Instrument Class
// ============================================

export class SamplerInstrument {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sampler: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private fallbackSynth: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private output: any = null;
  private settings: SamplerSettings;
  private isLoaded = false;
  private initialized = false;

  constructor(settings: SamplerSettings) {
    this.settings = settings;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const Tone = getTone();
    if (!Tone) {
      throw new Error('Tone.js not available');
    }

    // Create output channel
    this.output = new Tone.Gain(1);

    // Create fallback synth (used when no sample is loaded)
    this.fallbackSynth = new Tone.MembraneSynth().connect(this.output);

    // Load sample if URL is provided
    if (this.settings.sampleUrl) {
      await this.loadSample(this.settings.sampleUrl);
    }

    this.initialized = true;
  }

  // ==========================================
  // Sample Loading
  // ==========================================

  async loadSample(url: string): Promise<void> {
    const Tone = getTone();
    if (!Tone) {
      throw new Error('Tone.js not available');
    }

    return new Promise((resolve, reject) => {
      try {
        // Dispose existing sampler
        if (this.sampler) {
          this.sampler.dispose();
        }

        this.sampler = new Tone.Sampler({
          urls: {
            C4: url,
          },
          attack: this.settings.attack,
          release: this.settings.release,
          onload: () => {
            this.isLoaded = true;
            if (this.sampler && this.output) {
              this.sampler.connect(this.output);
            }
            resolve();
          },
          onerror: (error: Error) => {
            console.error('Failed to load sample:', error);
            this.isLoaded = false;
            reject(error);
          },
        });

        this.settings.sampleUrl = url;
      } catch (error) {
        reject(error);
      }
    });
  }

  isSampleLoaded(): boolean {
    return this.isLoaded;
  }

  // ==========================================
  // Playback
  // ==========================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerAttack(notes: any, time?: any, velocity?: number): void {
    if (this.isLoaded && this.sampler) {
      this.sampler.triggerAttack(notes, time, velocity);
    } else if (this.fallbackSynth) {
      // Use fallback synth
      if (Array.isArray(notes)) {
        notes.forEach((note: string | number) => {
          this.fallbackSynth.triggerAttack(note, time, velocity);
        });
      } else {
        this.fallbackSynth.triggerAttack(notes, time, velocity);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerRelease(notes: any, time?: any): void {
    if (this.isLoaded && this.sampler) {
      this.sampler.triggerRelease(notes, time);
    } else if (this.fallbackSynth) {
      this.fallbackSynth.triggerRelease(time);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerAttackRelease(notes: any, duration: any, time?: any, velocity?: number): void {
    if (this.isLoaded && this.sampler) {
      this.sampler.triggerAttackRelease(notes, duration, time, velocity);
    } else if (this.fallbackSynth) {
      // Use fallback
      if (Array.isArray(notes)) {
        notes.forEach((note: string | number) => {
          this.fallbackSynth.triggerAttackRelease(note, duration, time, velocity);
        });
      } else {
        this.fallbackSynth.triggerAttackRelease(notes, duration, time, velocity);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  releaseAll(time?: any): void {
    if (this.isLoaded && this.sampler) {
      this.sampler.releaseAll(time);
    } else if (this.fallbackSynth) {
      this.fallbackSynth.triggerRelease(time);
    }
  }

  // ==========================================
  // Settings
  // ==========================================

  updateSettings(settings: Partial<SamplerSettings>): void {
    this.settings = { ...this.settings, ...settings };

    if (this.sampler) {
      if (settings.attack !== undefined) {
        this.sampler.attack = settings.attack;
      }
      if (settings.release !== undefined) {
        this.sampler.release = settings.release;
      }
    }

    // Reload sample if URL changed
    if (settings.sampleUrl && settings.sampleUrl !== this.settings.sampleUrl) {
      this.loadSample(settings.sampleUrl);
    }
  }

  getSettings(): SamplerSettings {
    return { ...this.settings };
  }

  setRootNote(note: number): void {
    this.settings.rootNote = note;
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
    if (this.sampler) this.sampler.dispose();
    if (this.fallbackSynth) this.fallbackSynth.dispose();
    if (this.output) this.output.dispose();
  }
}

// ==========================================
// Factory Function
// ==========================================

export function createSamplerInstrument(sampleUrl?: string): SamplerInstrument {
  const settings: SamplerSettings = {
    sampleUrl: sampleUrl ?? '',
    rootNote: 60, // C4
    attack: 0.001,
    decay: 0.1,
    sustain: 1,
    release: 0.1,
  };

  return new SamplerInstrument(settings);
}

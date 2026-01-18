// ============================================
// Pulse Studio - Delay Effect
// ============================================

import { getTone } from '../ToneProvider';

import type { DelayParams } from '@/domain/types';

// ============================================
// Default Parameters
// ============================================

export const DEFAULT_DELAY_PARAMS: DelayParams = {
  time: 0.25,
  feedback: 0.4,
  wet: 0.3,
};

// ============================================
// Delay Effect Class
// ============================================

export class DelayEffect {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private delay: any = null;
  private params: DelayParams;
  private _enabled: boolean = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bypass: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private input: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private output: any = null;
  private initialized = false;

  constructor(params: Partial<DelayParams> = {}) {
    this.params = { ...DEFAULT_DELAY_PARAMS, ...params };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const Tone = getTone();
    if (!Tone) {
      throw new Error('Tone.js not available');
    }

    // Create nodes
    this.input = new Tone.Gain();
    this.output = new Tone.Gain();
    this.bypass = new Tone.Gain(0);

    this.delay = new Tone.FeedbackDelay({
      delayTime: this.params.time,
      feedback: this.params.feedback,
      wet: this.params.wet,
    });

    // Connect chain
    this.input.connect(this.delay);
    this.delay.connect(this.output);
    this.input.connect(this.bypass);
    this.bypass.connect(this.output);

    this.initialized = true;
  }

  // ==========================================
  // Parameters
  // ==========================================

  setParams(params: Partial<DelayParams>): void {
    this.params = { ...this.params, ...params };

    if (!this.delay) return;

    if (params.time !== undefined) {
      this.delay.delayTime.value = params.time;
    }
    if (params.feedback !== undefined) {
      this.delay.feedback.value = params.feedback;
    }
    if (params.wet !== undefined) {
      this.delay.wet.value = params.wet;
    }
  }

  getParams(): DelayParams {
    return { ...this.params };
  }

  // ==========================================
  // Sync to Tempo
  // ==========================================

  syncToTempo(subdivision: string): void {
    const Tone = getTone();
    if (!this.delay || !Tone) return;
    // subdivision: '4n', '8n', '8t', '16n', etc.
    const time = Tone.Time(subdivision).toSeconds();
    this.delay.delayTime.value = time;
    this.params.time = time;
  }

  // ==========================================
  // Enable/Disable
  // ==========================================

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    if (!this.delay || !this.bypass) return;

    if (value) {
      this.delay.wet.value = this.params.wet;
      this.bypass.gain.value = 0;
    } else {
      this.delay.wet.value = 0;
      this.bypass.gain.value = 1;
    }
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
  getInput(): any {
    return this.input;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOutput(): any {
    return this.output;
  }

  // ==========================================
  // Cleanup
  // ==========================================

  dispose(): void {
    if (this.delay) this.delay.dispose();
    if (this.bypass) this.bypass.dispose();
    if (this.input) this.input.dispose();
    if (this.output) this.output.dispose();
  }
}

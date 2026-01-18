// ============================================
// Pulse Studio - EQ Effect
// ============================================

import { getTone } from '../ToneProvider';

import type { EQParams } from '@/domain/types';

// ============================================
// Default Parameters
// ============================================

export const DEFAULT_EQ_PARAMS: EQParams = {
  lowGain: 0,
  midGain: 0,
  highGain: 0,
  lowFreq: 200,
  highFreq: 3000,
};

// ============================================
// EQ Effect Class
// ============================================

export class EQEffect {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private eq: any = null;
  private params: EQParams;
  private _enabled: boolean = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bypass: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private input: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private output: any = null;
  private initialized = false;

  constructor(params: Partial<EQParams> = {}) {
    this.params = { ...DEFAULT_EQ_PARAMS, ...params };
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

    this.eq = new Tone.EQ3({
      low: this.params.lowGain,
      mid: this.params.midGain,
      high: this.params.highGain,
      lowFrequency: this.params.lowFreq,
      highFrequency: this.params.highFreq,
    });

    // Connect chain
    this.input.connect(this.eq);
    this.eq.connect(this.output);
    this.input.connect(this.bypass);
    this.bypass.connect(this.output);

    this.initialized = true;
  }

  // ==========================================
  // Parameters
  // ==========================================

  setParams(params: Partial<EQParams>): void {
    this.params = { ...this.params, ...params };

    if (!this.eq) return;

    if (params.lowGain !== undefined) {
      this.eq.low.value = params.lowGain;
    }
    if (params.midGain !== undefined) {
      this.eq.mid.value = params.midGain;
    }
    if (params.highGain !== undefined) {
      this.eq.high.value = params.highGain;
    }
    if (params.lowFreq !== undefined) {
      this.eq.lowFrequency.value = params.lowFreq;
    }
    if (params.highFreq !== undefined) {
      this.eq.highFrequency.value = params.highFreq;
    }
  }

  getParams(): EQParams {
    return { ...this.params };
  }

  // ==========================================
  // Enable/Disable
  // ==========================================

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    if (!this.eq || !this.bypass) return;

    if (value) {
      this.eq.wet.value = 1;
      this.bypass.gain.value = 0;
    } else {
      this.eq.wet.value = 0;
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
    if (this.eq) this.eq.dispose();
    if (this.bypass) this.bypass.dispose();
    if (this.input) this.input.dispose();
    if (this.output) this.output.dispose();
  }
}

// ============================================
// Pulse Studio - Compressor Effect
// ============================================

import { getTone } from '../ToneProvider';

import type { CompressorParams } from '@/domain/types';

// ============================================
// Default Parameters
// ============================================

export const DEFAULT_COMPRESSOR_PARAMS: CompressorParams = {
  threshold: -24,
  ratio: 4,
  attack: 0.003,
  release: 0.25,
  makeupGain: 0,
};

// ============================================
// Compressor Effect Class
// ============================================

export class CompressorEffect {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private compressor: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private makeupGain: any = null;
  private params: CompressorParams;
  private _enabled: boolean = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bypass: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private input: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private output: any = null;
  private initialized = false;

  constructor(params: Partial<CompressorParams> = {}) {
    this.params = { ...DEFAULT_COMPRESSOR_PARAMS, ...params };
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

    this.compressor = new Tone.Compressor({
      threshold: this.params.threshold,
      ratio: this.params.ratio,
      attack: this.params.attack,
      release: this.params.release,
    });

    this.makeupGain = new Tone.Gain(Tone.dbToGain(this.params.makeupGain));

    // Connect chain
    this.input.connect(this.compressor);
    this.compressor.connect(this.makeupGain);
    this.makeupGain.connect(this.output);
    this.input.connect(this.bypass);
    this.bypass.connect(this.output);

    this.initialized = true;
  }

  // ==========================================
  // Parameters
  // ==========================================

  setParams(params: Partial<CompressorParams>): void {
    this.params = { ...this.params, ...params };

    if (!this.compressor) return;

    const Tone = getTone();

    if (params.threshold !== undefined) {
      this.compressor.threshold.value = params.threshold;
    }
    if (params.ratio !== undefined) {
      this.compressor.ratio.value = params.ratio;
    }
    if (params.attack !== undefined) {
      this.compressor.attack.value = params.attack;
    }
    if (params.release !== undefined) {
      this.compressor.release.value = params.release;
    }
    if (params.makeupGain !== undefined && this.makeupGain) {
      this.makeupGain.gain.value = Tone.dbToGain(params.makeupGain);
    }
  }

  getParams(): CompressorParams {
    return { ...this.params };
  }

  // ==========================================
  // Metering
  // ==========================================

  getReduction(): number {
    if (!this.compressor) return 0;
    return this.compressor.reduction;
  }

  // ==========================================
  // Enable/Disable
  // ==========================================

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    const Tone = getTone();
    if (!this.makeupGain || !this.bypass || !Tone) return;

    if (value) {
      this.makeupGain.gain.value = Tone.dbToGain(this.params.makeupGain);
      this.bypass.gain.value = 0;
    } else {
      this.makeupGain.gain.value = 0;
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
    if (this.compressor) this.compressor.dispose();
    if (this.makeupGain) this.makeupGain.dispose();
    if (this.bypass) this.bypass.dispose();
    if (this.input) this.input.dispose();
    if (this.output) this.output.dispose();
  }
}

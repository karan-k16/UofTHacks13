// ============================================
// Pulse Studio - Reverb Effect
// ============================================

import { getTone } from '../ToneProvider';

import type { ReverbParams } from '@/domain/types';

// ============================================
// Default Parameters
// ============================================

export const DEFAULT_REVERB_PARAMS: ReverbParams = {
  decay: 2,
  preDelay: 0.01,
  wet: 0.3,
};

// ============================================
// Reverb Effect Class
// ============================================

export class ReverbEffect {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private reverb: any = null;
  private params: ReverbParams;
  private _enabled: boolean = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bypass: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private input: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private output: any = null;
  private initialized = false;

  constructor(params: Partial<ReverbParams> = {}) {
    this.params = { ...DEFAULT_REVERB_PARAMS, ...params };
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

    this.reverb = new Tone.Reverb({
      decay: this.params.decay,
      preDelay: this.params.preDelay,
      wet: this.params.wet,
    });

    // Connect chain
    this.input.connect(this.reverb);
    this.reverb.connect(this.output);
    this.input.connect(this.bypass);
    this.bypass.connect(this.output);

    // Generate impulse response
    await this.reverb.generate();

    this.initialized = true;
  }

  // ==========================================
  // Parameters
  // ==========================================

  async setParams(params: Partial<ReverbParams>): Promise<void> {
    const needsRegenerate =
      params.decay !== undefined && params.decay !== this.params.decay;

    this.params = { ...this.params, ...params };

    if (!this.reverb) return;

    if (params.preDelay !== undefined) {
      this.reverb.preDelay = params.preDelay;
    }
    if (params.wet !== undefined) {
      this.reverb.wet.value = params.wet;
    }
    if (needsRegenerate) {
      this.reverb.decay = this.params.decay;
      await this.reverb.generate();
    }
  }

  getParams(): ReverbParams {
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
    if (!this.reverb || !this.bypass) return;

    if (value) {
      this.reverb.wet.value = this.params.wet;
      this.bypass.gain.value = 0;
    } else {
      this.reverb.wet.value = 0;
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
    if (this.reverb) this.reverb.dispose();
    if (this.bypass) this.bypass.dispose();
    if (this.input) this.input.dispose();
    if (this.output) this.output.dispose();
  }
}

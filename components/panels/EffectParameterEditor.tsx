'use client';

import { useCallback } from 'react';
import Modal from '@/components/common/Modal';
import Knob from '@/components/common/Knob';
import type {
  InsertEffect,
  EffectParams,
  EQParams,
  CompressorParams,
  ReverbParams,
  DelayParams,
} from '@/domain/types';

const DEFAULT_PARAMS = {
  eq: { lowGain: 0, midGain: 0, highGain: 0, lowFreq: 200, highFreq: 3000 } as EQParams,
  compressor: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25, makeupGain: 0 } as CompressorParams,
  reverb: { decay: 2, preDelay: 0.01, wet: 0.3 } as ReverbParams,
  delay: { time: 0.25, feedback: 0.4, wet: 0.3 } as DelayParams,
};

interface EffectParameterEditorProps {
  effect: InsertEffect;
  trackName?: string;
  onParamsChange: (params: Partial<EffectParams>) => void;
  onClose: () => void;
}

export default function EffectParameterEditor({ effect, trackName, onParamsChange, onClose }: EffectParameterEditorProps) {
  const getEffectTitle = () => {
    switch (effect.type) {
      case 'eq': return '3-Band EQ';
      case 'compressor': return 'Compressor';
      case 'reverb': return 'Reverb';
      case 'delay': return 'Delay';
      default: return 'Effect';
    }
  };

  const handleReset = useCallback(() => {
    const defaults = DEFAULT_PARAMS[effect.type];
    if (defaults) onParamsChange(defaults);
  }, [effect.type, onParamsChange]);

  return (
    <Modal isOpen={true} onClose={onClose} title={getEffectTitle()} size="md">
      <div className="p-4">
        {trackName && (
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ps-bg-700">
            <span className="text-xs text-ps-text-muted">Track:</span>
            <span className="text-xs font-medium text-ps-accent-primary">{trackName}</span>
          </div>
        )}
        {effect.type === 'eq' && <EQEditor params={effect.params as EQParams} onChange={onParamsChange} />}
        {effect.type === 'compressor' && <CompressorEditor params={effect.params as CompressorParams} onChange={onParamsChange} />}
        {effect.type === 'reverb' && <ReverbEditor params={effect.params as ReverbParams} onChange={onParamsChange} />}
        {effect.type === 'delay' && <DelayEditor params={effect.params as DelayParams} onChange={onParamsChange} />}
        <div className="flex justify-between mt-6 pt-4 border-t border-ps-bg-600">
          <button className="btn btn-ghost text-xs text-ps-text-muted hover:text-ps-accent-primary" onClick={handleReset} title="Reset all parameters to default values">Reset to Defaults</button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

interface ParamRowProps { label: string; value: number; unit: string; min: number; max: number; step?: number; decimals?: number; onChange: (value: number) => void; color?: string; }

function ParamRow({ label, value, unit, min, max, step = 0.01, decimals = 2, onChange, color = '#ff6b35' }: ParamRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-ps-text-muted">{value.toFixed(decimals)} {unit}</div>
      </div>
      <Knob value={value} min={min} max={max} step={step} onChange={onChange} color={color} size={40} />
    </div>
  );
}

function EQEditor({ params, onChange }: { params: EQParams; onChange: (p: Partial<EQParams>) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-ps-text-muted mb-4">3-band equalizer with adjustable crossover frequencies</div>
      <div className="grid grid-cols-1 gap-1">
        <ParamRow label="Low Gain" value={params.lowGain} unit="dB" min={-12} max={12} step={0.5} decimals={1} onChange={(v) => onChange({ lowGain: v })} color="#4ecdc4" />
        <ParamRow label="Mid Gain" value={params.midGain} unit="dB" min={-12} max={12} step={0.5} decimals={1} onChange={(v) => onChange({ midGain: v })} color="#ffe66d" />
        <ParamRow label="High Gain" value={params.highGain} unit="dB" min={-12} max={12} step={0.5} decimals={1} onChange={(v) => onChange({ highGain: v })} color="#ff6b35" />
        <ParamRow label="Low Freq" value={params.lowFreq} unit="Hz" min={20} max={500} step={10} decimals={0} onChange={(v) => onChange({ lowFreq: v })} color="#4ecdc4" />
        <ParamRow label="High Freq" value={params.highFreq} unit="Hz" min={1000} max={10000} step={100} decimals={0} onChange={(v) => onChange({ highFreq: v })} color="#ff6b35" />
      </div>
    </div>
  );
}

function CompressorEditor({ params, onChange }: { params: CompressorParams; onChange: (p: Partial<CompressorParams>) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-ps-text-muted mb-4">Dynamic range compressor with adjustable threshold and ratio</div>
      <div className="grid grid-cols-1 gap-1">
        <ParamRow label="Threshold" value={params.threshold} unit="dB" min={-60} max={0} step={1} decimals={0} onChange={(v) => onChange({ threshold: v })} color="#ff6b35" />
        <ParamRow label="Ratio" value={params.ratio} unit=":1" min={1} max={20} step={0.5} decimals={1} onChange={(v) => onChange({ ratio: v })} color="#ffe66d" />
        <ParamRow label="Attack" value={params.attack * 1000} unit="ms" min={0.1} max={100} step={0.1} decimals={1} onChange={(v) => onChange({ attack: v / 1000 })} color="#4ecdc4" />
        <ParamRow label="Release" value={params.release * 1000} unit="ms" min={10} max={1000} step={10} decimals={0} onChange={(v) => onChange({ release: v / 1000 })} color="#4ecdc4" />
        <ParamRow label="Makeup Gain" value={params.makeupGain} unit="dB" min={0} max={24} step={0.5} decimals={1} onChange={(v) => onChange({ makeupGain: v })} color="#95d5b2" />
      </div>
    </div>
  );
}

function ReverbEditor({ params, onChange }: { params: ReverbParams; onChange: (p: Partial<ReverbParams>) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-ps-text-muted mb-4">Convolution reverb with adjustable decay and mix</div>
      <div className="grid grid-cols-1 gap-1">
        <ParamRow label="Decay" value={params.decay} unit="s" min={0.1} max={10} step={0.1} decimals={1} onChange={(v) => onChange({ decay: v })} color="#4ecdc4" />
        <ParamRow label="Pre-Delay" value={params.preDelay * 1000} unit="ms" min={0} max={100} step={1} decimals={0} onChange={(v) => onChange({ preDelay: v / 1000 })} color="#ffe66d" />
        <ParamRow label="Wet/Dry Mix" value={params.wet * 100} unit="%" min={0} max={100} step={1} decimals={0} onChange={(v) => onChange({ wet: v / 100 })} color="#ff6b35" />
      </div>
    </div>
  );
}

function DelayEditor({ params, onChange }: { params: DelayParams; onChange: (p: Partial<DelayParams>) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-ps-text-muted mb-4">Feedback delay with adjustable time and feedback</div>
      <div className="grid grid-cols-1 gap-1">
        <ParamRow label="Time" value={params.time * 1000} unit="ms" min={10} max={2000} step={10} decimals={0} onChange={(v) => onChange({ time: v / 1000 })} color="#4ecdc4" />
        <ParamRow label="Feedback" value={params.feedback * 100} unit="%" min={0} max={95} step={1} decimals={0} onChange={(v) => onChange({ feedback: v / 100 })} color="#ffe66d" />
        <ParamRow label="Wet/Dry Mix" value={params.wet * 100} unit="%" min={0} max={100} step={1} decimals={0} onChange={(v) => onChange({ wet: v / 100 })} color="#ff6b35" />
      </div>
    </div>
  );
}

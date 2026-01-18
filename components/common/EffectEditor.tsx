'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import type {
  InsertEffect,
  EQParams,
  CompressorParams,
  ReverbParams,
  DelayParams,
} from '@/domain/types';
import { getAudioEngine } from '@/lib/audio/AudioEngine';

interface EffectEditorProps {
  effect: InsertEffect;
  trackId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<InsertEffect>) => void;
}

export default function EffectEditor({
  effect,
  trackId,
  isOpen,
  onClose,
  onUpdate,
}: EffectEditorProps) {
  const [localParams, setLocalParams] = useState(effect.params);

  // Update local params when effect changes
  useEffect(() => {
    setLocalParams(effect.params);
  }, [effect]);

  // Update both store and audio engine
  const updateParam = (key: string, value: number) => {
    const newParams = { ...localParams, [key]: value };
    setLocalParams(newParams);
    onUpdate({ params: newParams });

    // Update audio engine in real-time
    const engine = getAudioEngine();
    engine.updateEffectParams(trackId, effect.id, { [key]: value });
  };

  const renderControls = () => {
    switch (effect.type) {
      case 'eq':
        return <EQControls params={localParams as EQParams} onUpdate={updateParam} />;
      case 'compressor':
        return (
          <CompressorControls
            params={localParams as CompressorParams}
            onUpdate={updateParam}
          />
        );
      case 'reverb':
        return (
          <ReverbControls params={localParams as ReverbParams} onUpdate={updateParam} />
        );
      case 'delay':
        return <DelayControls params={localParams as DelayParams} onUpdate={updateParam} />;
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${effect.type.toUpperCase()} Settings`} size="md">
      <div className="space-y-4">{renderControls()}</div>
    </Modal>
  );
}

// ============================================
// EQ Controls
// ============================================

interface EQControlsProps {
  params: EQParams;
  onUpdate: (key: string, value: number) => void;
}

function EQControls({ params, onUpdate }: EQControlsProps) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-ps-text-muted mb-2">3-Band Equalizer</div>

      {/* Low Band */}
      <SliderControl
        label="Low Gain"
        value={params.lowGain}
        min={-24}
        max={24}
        step={0.5}
        unit="dB"
        onChange={(v) => onUpdate('lowGain', v)}
      />
      <SliderControl
        label="Low Frequency"
        value={params.lowFreq}
        min={20}
        max={500}
        step={10}
        unit="Hz"
        onChange={(v) => onUpdate('lowFreq', v)}
      />

      <div className="border-t border-ps-bg-600 pt-4" />

      {/* Mid Band */}
      <SliderControl
        label="Mid Gain"
        value={params.midGain}
        min={-24}
        max={24}
        step={0.5}
        unit="dB"
        onChange={(v) => onUpdate('midGain', v)}
      />

      <div className="border-t border-ps-bg-600 pt-4" />

      {/* High Band */}
      <SliderControl
        label="High Gain"
        value={params.highGain}
        min={-24}
        max={24}
        step={0.5}
        unit="dB"
        onChange={(v) => onUpdate('highGain', v)}
      />
      <SliderControl
        label="High Frequency"
        value={params.highFreq}
        min={1000}
        max={20000}
        step={100}
        unit="Hz"
        onChange={(v) => onUpdate('highFreq', v)}
      />
    </div>
  );
}

// ============================================
// Compressor Controls
// ============================================

interface CompressorControlsProps {
  params: CompressorParams;
  onUpdate: (key: string, value: number) => void;
}

function CompressorControls({ params, onUpdate }: CompressorControlsProps) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-ps-text-muted mb-2">Dynamic Range Compressor</div>

      <SliderControl
        label="Threshold"
        value={params.threshold}
        min={-60}
        max={0}
        step={1}
        unit="dB"
        onChange={(v) => onUpdate('threshold', v)}
      />
      <SliderControl
        label="Ratio"
        value={params.ratio}
        min={1}
        max={20}
        step={0.1}
        unit=":1"
        onChange={(v) => onUpdate('ratio', v)}
      />
      <SliderControl
        label="Attack"
        value={params.attack}
        min={0.001}
        max={0.5}
        step={0.001}
        unit="s"
        onChange={(v) => onUpdate('attack', v)}
      />
      <SliderControl
        label="Release"
        value={params.release}
        min={0.01}
        max={2}
        step={0.01}
        unit="s"
        onChange={(v) => onUpdate('release', v)}
      />
      <SliderControl
        label="Makeup Gain"
        value={params.makeupGain}
        min={0}
        max={24}
        step={0.5}
        unit="dB"
        onChange={(v) => onUpdate('makeupGain', v)}
      />
    </div>
  );
}

// ============================================
// Reverb Controls
// ============================================

interface ReverbControlsProps {
  params: ReverbParams;
  onUpdate: (key: string, value: number) => void;
}

function ReverbControls({ params, onUpdate }: ReverbControlsProps) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-ps-text-muted mb-2">Algorithmic Reverb</div>

      <SliderControl
        label="Decay Time"
        value={params.decay}
        min={0.1}
        max={10}
        step={0.1}
        unit="s"
        onChange={(v) => onUpdate('decay', v)}
      />
      <SliderControl
        label="Pre-Delay"
        value={params.preDelay}
        min={0}
        max={0.2}
        step={0.001}
        unit="s"
        onChange={(v) => onUpdate('preDelay', v)}
      />
      <SliderControl
        label="Wet/Dry"
        value={params.wet}
        min={0}
        max={1}
        step={0.01}
        unit="%"
        formatter={(v) => Math.round(v * 100)}
        onChange={(v) => onUpdate('wet', v)}
      />
    </div>
  );
}

// ============================================
// Delay Controls
// ============================================

interface DelayControlsProps {
  params: DelayParams;
  onUpdate: (key: string, value: number) => void;
}

function DelayControls({ params, onUpdate }: DelayControlsProps) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-ps-text-muted mb-2">Feedback Delay</div>

      <SliderControl
        label="Delay Time"
        value={params.time}
        min={0.01}
        max={2}
        step={0.01}
        unit="s"
        onChange={(v) => onUpdate('time', v)}
      />
      <SliderControl
        label="Feedback"
        value={params.feedback}
        min={0}
        max={0.95}
        step={0.01}
        unit="%"
        formatter={(v) => Math.round(v * 100)}
        onChange={(v) => onUpdate('feedback', v)}
      />
      <SliderControl
        label="Wet/Dry"
        value={params.wet}
        min={0}
        max={1}
        step={0.01}
        unit="%"
        formatter={(v) => Math.round(v * 100)}
        onChange={(v) => onUpdate('wet', v)}
      />
    </div>
  );
}

// ============================================
// Slider Control Component
// ============================================

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  formatter?: (value: number) => number;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  formatter,
}: SliderControlProps) {
  const displayValue = formatter ? formatter(value) : value.toFixed(step < 0.01 ? 3 : step < 1 ? 2 : 1);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-ps-text-secondary">{label}</label>
        <span className="text-xs text-ps-accent-primary font-mono">
          {displayValue} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-ps-bg-600 rounded-lg appearance-none cursor-pointer slider-thumb"
      />
    </div>
  );
}

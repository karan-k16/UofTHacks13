'use client';

import { useState } from 'react';
import { useStore } from '@/state/store';
import type { TrackEffects, UUID } from '@/domain/types';
import { DEFAULT_TRACK_EFFECTS } from '@/domain/types';

/**
 * Simplified Mixer Panel
 * 
 * - Select a track from dropdown
 * - Adjust volume, pan, EQ, compression, reverb with sliders
 * - Click "Apply Effects" to process the audio
 * - Non-destructive: always processes from original file
 */
export default function Mixer() {
  const {
    project,
    setTrackEffect,
    resetTrackEffects,
    applyTrackEffects,
    setMasterVolume,
  } = useStore();

  const [selectedTrackId, setSelectedTrackId] = useState<UUID | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [needsApply, setNeedsApply] = useState(false); // Track if effects need applying (even after reset)

  const tracks = project?.playlist.tracks ?? [];
  const masterVolume = project?.mixer.masterVolume ?? 1;

  // Find selected track
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? tracks[0] ?? null;
  const effects = selectedTrack?.effects ?? DEFAULT_TRACK_EFFECTS;

  // Handle effect change
  const handleEffectChange = (key: keyof TrackEffects, value: number) => {
    if (selectedTrack) {
      setTrackEffect(selectedTrack.id, key, value);
      setNeedsApply(true); // Mark as needing apply
    }
  };

  // Handle apply effects
  const handleApplyEffects = async () => {
    if (!selectedTrack) return;
    setIsProcessing(true);
    try {
      await applyTrackEffects(selectedTrack.id);
      setNeedsApply(false); // Clear after successful apply
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (selectedTrack) {
      resetTrackEffects(selectedTrack.id);
      setNeedsApply(true); // Reset to defaults still needs apply to revert processed audio
    }
  };

  // Check if any effects are non-default
  const hasChanges = selectedTrack && (
    effects.volume !== 1 ||
    effects.pan !== 0 ||
    effects.eqLow !== 0 ||
    effects.eqMid !== 0 ||
    effects.eqHigh !== 0 ||
    effects.compThreshold !== -24 ||
    effects.compRatio !== 4 ||
    effects.reverbWet !== 0
  );

  return (
    <div className="h-full flex flex-col bg-ps-bg-800 text-ps-text-primary" data-panel="mixer">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ps-bg-600 shrink-0">
        <span className="text-sm font-medium">🎛️ Mixer</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ps-text-muted">Master</span>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-20 h-2 accent-ps-accent-primary"
          />
          <span className="text-xs text-ps-text-muted w-10 text-right">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tracks.length === 0 ? (
          <div className="text-center text-ps-text-muted py-8">
            <p>No tracks in playlist.</p>
            <p className="text-xs mt-2">Add a track to use the mixer.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Track Selector */}
            <div>
              <label className="block text-xs text-ps-text-muted mb-1">Track</label>
              <select
                className="w-full bg-ps-bg-700 border border-ps-bg-600 rounded px-3 py-2 text-sm"
                value={selectedTrack?.id ?? ''}
                onChange={(e) => setSelectedTrackId(e.target.value as UUID)}
              >
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTrack && (
              <>
                {/* Volume & Pan */}
                <div className="grid grid-cols-2 gap-4">
                  <SliderControl
                    label="Volume"
                    value={effects.volume}
                    min={0}
                    max={2}
                    step={0.01}
                    defaultValue={1}
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                    onChange={(v) => handleEffectChange('volume', v)}
                  />
                  <SliderControl
                    label="Pan"
                    value={effects.pan}
                    min={-1}
                    max={1}
                    step={0.01}
                    defaultValue={0}
                    formatValue={(v) => v === 0 ? 'C' : v < 0 ? `L${Math.round(Math.abs(v) * 100)}` : `R${Math.round(v * 100)}`}
                    onChange={(v) => handleEffectChange('pan', v)}
                  />
                </div>

                {/* EQ Section */}
                <div>
                  <div className="text-xs text-ps-text-muted mb-2 uppercase tracking-wide">Equalizer</div>
                  <div className="grid grid-cols-3 gap-4">
                    <SliderControl
                      label="Low"
                      value={effects.eqLow}
                      min={-12}
                      max={12}
                      step={0.5}
                      defaultValue={0}
                      formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
                      onChange={(v) => handleEffectChange('eqLow', v)}
                    />
                    <SliderControl
                      label="Mid"
                      value={effects.eqMid}
                      min={-12}
                      max={12}
                      step={0.5}
                      defaultValue={0}
                      formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
                      onChange={(v) => handleEffectChange('eqMid', v)}
                    />
                    <SliderControl
                      label="High"
                      value={effects.eqHigh}
                      min={-12}
                      max={12}
                      step={0.5}
                      defaultValue={0}
                      formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
                      onChange={(v) => handleEffectChange('eqHigh', v)}
                    />
                  </div>
                </div>

                {/* Compression Section */}
                <div>
                  <div className="text-xs text-ps-text-muted mb-2 uppercase tracking-wide">Compression</div>
                  <div className="grid grid-cols-2 gap-4">
                    <SliderControl
                      label="Threshold"
                      value={effects.compThreshold}
                      min={-60}
                      max={0}
                      step={1}
                      defaultValue={-24}
                      formatValue={(v) => `${v} dB`}
                      onChange={(v) => handleEffectChange('compThreshold', v)}
                    />
                    <SliderControl
                      label="Ratio"
                      value={effects.compRatio}
                      min={1}
                      max={20}
                      step={0.5}
                      defaultValue={4}
                      formatValue={(v) => `${v.toFixed(1)}:1`}
                      onChange={(v) => handleEffectChange('compRatio', v)}
                    />
                  </div>
                </div>

                {/* Reverb Section */}
                <div>
                  <div className="text-xs text-ps-text-muted mb-2 uppercase tracking-wide">Reverb</div>
                  <SliderControl
                    label="Amount"
                    value={effects.reverbWet}
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={0}
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                    onChange={(v) => handleEffectChange('reverbWet', v)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-ps-bg-600">
                  <button
                    className="flex-1 py-2 px-4 text-sm rounded bg-ps-bg-600 hover:bg-ps-bg-500 text-ps-text-secondary"
                    onClick={handleReset}
                    disabled={!hasChanges && !needsApply}
                  >
                    Reset to Default
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 text-sm rounded font-medium ${isProcessing
                      ? 'bg-ps-bg-600 text-ps-text-muted cursor-wait'
                      : (hasChanges || needsApply)
                        ? 'bg-ps-accent-primary text-white hover:bg-ps-accent-primary/80'
                        : 'bg-ps-bg-600 text-ps-text-muted cursor-not-allowed'
                      }`}
                    onClick={handleApplyEffects}
                    disabled={isProcessing || (!hasChanges && !needsApply)}
                  >
                    {isProcessing ? '⏳ Processing...' : '✨ Apply Effects'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable slider control component
 */
interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  formatValue,
  onChange,
}: SliderControlProps) {
  const isDefault = value === defaultValue;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs text-ps-text-muted">{label}</label>
        <span className={`text-xs ${isDefault ? 'text-ps-text-muted' : 'text-ps-accent-primary'}`}>
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 accent-ps-accent-primary cursor-pointer"
        onDoubleClick={() => onChange(defaultValue)}
        title="Double-click to reset"
      />
    </div>
  );
}

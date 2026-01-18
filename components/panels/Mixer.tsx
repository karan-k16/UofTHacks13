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
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white" data-panel="mixer">
      {/* Header - Sleek dark header with pink accent */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] shrink-0 bg-gradient-to-r from-[#0d0d0d] to-[#111]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b6b] to-[#ff8585] flex items-center justify-center shadow-lg shadow-[#ff6b6b]/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="4" y="4" width="4" height="16" rx="1" />
              <rect x="10" y="8" width="4" height="12" rx="1" />
              <rect x="16" y="2" width="4" height="18" rx="1" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-white tracking-tight">Mixer</span>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Audio Processing</p>
          </div>
        </div>
        
        {/* Master Volume - Premium look */}
        <div className="flex items-center gap-4 bg-[#111] rounded-xl px-4 py-2.5 border border-[#222]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff6b6b] animate-pulse" />
            <span className="text-[10px] text-[#888] uppercase tracking-widest font-medium">Master</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="mixer-slider w-28 h-1.5"
            />
          </div>
          <span className="text-xs font-mono text-white w-12 text-right tabular-nums">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-[#0a0a0a] to-[#080808]">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#222] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
                <rect x="4" y="4" width="4" height="16" rx="1" />
                <rect x="10" y="8" width="4" height="12" rx="1" />
                <rect x="16" y="2" width="4" height="18" rx="1" />
              </svg>
            </div>
            <p className="text-sm text-[#888] font-medium">No tracks in playlist</p>
            <p className="text-xs mt-1.5 text-[#555]">Add a track to start mixing</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Track Selector - Card style */}
            <div className="mixer-card p-4">
              <label className="block text-[10px] text-[#666] mb-2.5 uppercase tracking-widest font-semibold">Select Track</label>
              <div className="relative">
                <select
                  className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-[#ff6b6b] focus:outline-none focus:ring-1 focus:ring-[#ff6b6b]/30 transition-all appearance-none cursor-pointer hover:border-[#333]"
                  value={selectedTrack?.id ?? ''}
                  onChange={(e) => setSelectedTrackId(e.target.value as UUID)}
                >
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                    <path d="M6 9L12 15L18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {selectedTrack && (
              <>
                {/* Volume & Pan - Side by side cards */}
                <div className="grid grid-cols-2 gap-4">
                  <MixerSlider
                    label="Volume"
                    value={effects.volume}
                    min={0}
                    max={2}
                    step={0.01}
                    defaultValue={1}
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                    onChange={(v) => handleEffectChange('volume', v)}
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>}
                  />
                  <MixerSlider
                    label="Pan"
                    value={effects.pan}
                    min={-1}
                    max={1}
                    step={0.01}
                    defaultValue={0}
                    formatValue={(v) => v === 0 ? 'C' : v < 0 ? `L${Math.round(Math.abs(v) * 100)}` : `R${Math.round(v * 100)}`}
                    onChange={(v) => handleEffectChange('pan', v)}
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>}
                  />
                </div>

                {/* EQ Section - Premium card design */}
                <div className="mixer-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-[#1a1a1a] flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
                        <path d="M2 12h4l3-9 4 18 3-9h6" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-[#888] uppercase tracking-widest font-semibold">Equalizer</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <MixerSlider
                      label="Low"
                      value={effects.eqLow}
                      min={-12}
                      max={12}
                      step={0.5}
                      defaultValue={0}
                      formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
                      onChange={(v) => handleEffectChange('eqLow', v)}
                      compact
                    />
                    <MixerSlider
                      label="Mid"
                      value={effects.eqMid}
                      min={-12}
                      max={12}
                      step={0.5}
                      defaultValue={0}
                      formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
                      onChange={(v) => handleEffectChange('eqMid', v)}
                      compact
                    />
                    <MixerSlider
                      label="High"
                      value={effects.eqHigh}
                      min={-12}
                      max={12}
                      step={0.5}
                      defaultValue={0}
                      formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
                      onChange={(v) => handleEffectChange('eqHigh', v)}
                      compact
                    />
                  </div>
                </div>

                {/* Compression Section */}
                <div className="mixer-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-[#1a1a1a] flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
                        <path d="M4 14h6v6H4zM14 4h6v6h-6z" />
                        <path d="M7 14V4h10v10H7" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-[#888] uppercase tracking-widest font-semibold">Compression</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <MixerSlider
                      label="Threshold"
                      value={effects.compThreshold}
                      min={-60}
                      max={0}
                      step={1}
                      defaultValue={-24}
                      formatValue={(v) => `${v} dB`}
                      onChange={(v) => handleEffectChange('compThreshold', v)}
                    />
                    <MixerSlider
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
                <div className="mixer-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-[#1a1a1a] flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
                        <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-[#888] uppercase tracking-widest font-semibold">Reverb</span>
                  </div>
                  <MixerSlider
                    label="Amount"
                    value={effects.reverbWet}
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={0}
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                    onChange={(v) => handleEffectChange('reverbWet', v)}
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 5v2M12 17v2M5 12h2M17 12h2" /></svg>}
                  />
                </div>

                {/* Action Buttons - Premium style */}
                <div className="flex gap-3 pt-4">
                  <button
                    className="flex-1 py-3.5 px-4 text-sm rounded-xl bg-[#111] hover:bg-[#1a1a1a] text-[#888] border border-[#222] hover:border-[#333] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    onClick={handleReset}
                    disabled={!hasChanges && !needsApply}
                  >
                    Reset to Default
                  </button>
                  <button
                    className={`flex-1 py-3.5 px-4 text-sm rounded-xl font-semibold transition-all duration-200 ${isProcessing
                      ? 'bg-[#1a1a1a] text-[#555] cursor-wait'
                      : (hasChanges || needsApply)
                        ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] text-white shadow-lg shadow-[#ff6b6b]/25 hover:shadow-[#ff6b6b]/40 hover:scale-[1.02]'
                        : 'bg-[#1a1a1a] text-[#555] cursor-not-allowed'
                      }`}
                    onClick={handleApplyEffects}
                    disabled={isProcessing || (!hasChanges && !needsApply)}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : 'Apply Effects'}
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
 * Premium mixer slider component
 */
interface MixerSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
  compact?: boolean;
}

function MixerSlider({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  formatValue,
  onChange,
  icon,
  compact = false,
}: MixerSliderProps) {
  const isDefault = value === defaultValue;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`group ${compact ? '' : 'mixer-card p-3'}`}>
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#666] group-hover:text-[#ff6b6b] transition-colors">{icon}</span>}
          <label className="text-[10px] text-[#888] font-semibold uppercase tracking-wider">{label}</label>
        </div>
        <span className={`text-xs font-mono tabular-nums transition-colors ${isDefault ? 'text-[#555]' : 'text-[#ff6b6b]'}`}>
          {formatValue(value)}
        </span>
      </div>
      <div className="relative h-4 group/slider flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden top-1/2 -translate-y-1/2">
          {/* Fill */}
          <div 
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#ff6b6b]/60 to-[#ff6b6b] transition-all duration-100"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="mixer-slider absolute inset-0 w-full cursor-pointer"
          onDoubleClick={() => onChange(defaultValue)}
          title="Double-click to reset"
        />
      </div>
    </div>
  );
}

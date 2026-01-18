'use client';

import { useCallback } from 'react';
import Modal from '@/components/common/Modal';
import { useStore } from '@/state/store';
import type { SynthSettings, SamplerSettings, AudioAsset } from '@/domain/types';

interface InstrumentSettingsModalProps {
    channelId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function InstrumentSettingsModal({
    channelId,
    isOpen,
    onClose,
}: InstrumentSettingsModalProps) {
    const { updateChannel, project, getAudioAssetData } = useStore();
    const samples = project?.assets ?? [];

    // Get live channel from store instead of using prop
    const channel = project?.channels.find((c) => c.id === channelId);

    const handleSynthChange = useCallback(
        (key: keyof SynthSettings, value: number | string) => {
            if (!channel?.synthSettings) return;

            updateChannel(channel.id, {
                synthSettings: {
                    ...channel.synthSettings,
                    [key]: value,
                },
            });
        },
        [channel, updateChannel]
    );

    const handleSamplerChange = useCallback(
        (key: keyof SamplerSettings, value: number | string) => {
            if (!channel?.samplerSettings) return;

            updateChannel(channel.id, {
                samplerSettings: {
                    ...channel.samplerSettings,
                    [key]: value,
                },
            });
        },
        [channel, updateChannel]
    );

    const handleSampleSelect = useCallback(
        (sample: AudioAsset) => {
            const sampleData = getAudioAssetData(sample.id);
            if (sampleData && channel?.samplerSettings) {
                updateChannel(channel.id, {
                    samplerSettings: {
                        ...channel.samplerSettings,
                        sampleUrl: sampleData,
                    },
                });
            }
        },
        [channel, updateChannel, getAudioAssetData]
    );

    if (!channel) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${channel.name} - Instrument Settings`} size="lg">
            <div className="space-y-6 p-4">
                {/* Channel Info */}
                <div className="flex items-center gap-3 p-3 bg-ps-bg-700 rounded-lg">
                    <div
                        className="w-4 h-10 rounded"
                        style={{ backgroundColor: channel.color }}
                    />
                    <div>
                        <div className="font-medium">{channel.name}</div>
                        <div className="text-xs text-ps-text-muted capitalize">{channel.type}</div>
                    </div>
                </div>

                {/* Synth Settings */}
                {channel.type === 'synth' && channel.synthSettings && (
                    <SynthSettingsPanel
                        settings={channel.synthSettings}
                        onChange={handleSynthChange}
                    />
                )}

                {/* Sampler Settings */}
                {channel.type === 'sampler' && channel.samplerSettings && (
                    <SamplerSettingsPanel
                        settings={channel.samplerSettings}
                        samples={samples}
                        onChange={handleSamplerChange}
                        onSampleSelect={handleSampleSelect}
                    />
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-ps-bg-600">
                    <button className="btn btn-ghost" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ============================================
// Synth Settings Panel
// ============================================

interface SynthSettingsPanelProps {
    settings: SynthSettings;
    onChange: (key: keyof SynthSettings, value: number | string) => void;
}

function SynthSettingsPanel({ settings, onChange }: SynthSettingsPanelProps) {
    const oscillatorTypes = ['sine', 'square', 'sawtooth', 'triangle'] as const;

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-ps-text-secondary">Oscillator</h3>

            {/* Oscillator Type */}
            <div className="space-y-1">
                <label className="text-xs text-ps-text-muted">Waveform</label>
                <div className="flex gap-1">
                    {oscillatorTypes.map((type) => (
                        <button
                            key={type}
                            type="button"
                            className={`px-3 py-1.5 rounded text-xs capitalize transition-colors ${settings.oscillatorType === type
                                ? 'bg-ps-accent-primary text-black'
                                : 'bg-ps-bg-600 hover:bg-ps-bg-500'
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange('oscillatorType', type);
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <h3 className="text-sm font-medium text-ps-text-secondary pt-4">Envelope (ADSR)</h3>

            {/* Attack */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs text-ps-text-muted">Attack</label>
                    <span className="text-xs text-ps-text-secondary">{settings.attack.toFixed(3)}s</span>
                </div>
                <input
                    type="range"
                    min="0.001"
                    max="2"
                    step="0.001"
                    value={settings.attack}
                    onChange={(e) => onChange('attack', parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* Decay */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs text-ps-text-muted">Decay</label>
                    <span className="text-xs text-ps-text-secondary">{settings.decay.toFixed(3)}s</span>
                </div>
                <input
                    type="range"
                    min="0.001"
                    max="2"
                    step="0.001"
                    value={settings.decay}
                    onChange={(e) => onChange('decay', parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* Sustain */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs text-ps-text-muted">Sustain</label>
                    <span className="text-xs text-ps-text-secondary">{settings.sustain.toFixed(2)}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.sustain}
                    onChange={(e) => onChange('sustain', parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* Release */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs text-ps-text-muted">Release</label>
                    <span className="text-xs text-ps-text-secondary">{settings.release.toFixed(3)}s</span>
                </div>
                <input
                    type="range"
                    min="0.001"
                    max="5"
                    step="0.001"
                    value={settings.release}
                    onChange={(e) => onChange('release', parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>

            <h3 className="text-sm font-medium text-ps-text-secondary pt-4">Filter</h3>

            {/* Filter Cutoff */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs text-ps-text-muted">Cutoff</label>
                    <span className="text-xs text-ps-text-secondary">{settings.filterCutoff.toFixed(0)} Hz</span>
                </div>
                <input
                    type="range"
                    min="20"
                    max="20000"
                    step="1"
                    value={settings.filterCutoff}
                    onChange={(e) => onChange('filterCutoff', parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* Filter Resonance */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs text-ps-text-muted">Resonance</label>
                    <span className="text-xs text-ps-text-secondary">{settings.filterResonance.toFixed(1)}</span>
                </div>
                <input
                    type="range"
                    min="0.001"
                    max="30"
                    step="0.1"
                    value={settings.filterResonance}
                    onChange={(e) => onChange('filterResonance', parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>
        </div>
    );
}

// ============================================
// Sampler Settings Panel
// ============================================

interface SamplerSettingsPanelProps {
    settings: SamplerSettings;
    samples: AudioAsset[];
    onChange: (key: keyof SamplerSettings, value: number | string) => void;
    onSampleSelect: (sample: AudioAsset) => void;
}

function SamplerSettingsPanel({ settings, samples, onChange, onSampleSelect }: SamplerSettingsPanelProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-ps-text-secondary">Sample</h3>

            {/* Current Sample */}
            <div className="p-3 bg-ps-bg-700 rounded-lg">
                <div className="text-xs text-ps-text-muted mb-1">Current Sample</div>
                <div className="text-sm font-medium">
                    {settings.sampleUrl ? 'Custom Sample Loaded' : 'Default Kick'}
                </div>
            </div>

            {/* Sample Library */}
            {samples.length > 0 && (
                <div className="space-y-2">
                    <label className="text-xs text-ps-text-muted">Available Samples</label>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {samples.map((sample) => (
                            <button
                                key={sample.id}
                                type="button"
                                className="w-full text-left px-3 py-2 bg-ps-bg-700 hover:bg-ps-bg-600 rounded text-xs transition-colors"
                                onClick={() => onSampleSelect(sample)}
                            >
                                {sample.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <h3 className="text-sm font-medium text-ps-text-secondary pt-4">Envelope</h3>

            {/* Attack */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs text-ps-text-muted">Attack</label>
                    <span className="text-xs text-ps-text-secondary">{settings.attack.toFixed(3)}s</span>
                </div>
                <input
                    type="range"
                    min="0.001"
                    max="1"
                    step="0.001"
                    value={settings.attack}
                    onChange={(e) => onChange('attack', parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* Release */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs text-ps-text-muted">Release</label>
                    <span className="text-xs text-ps-text-secondary">{settings.release.toFixed(3)}s</span>
                </div>
                <input
                    type="range"
                    min="0.001"
                    max="5"
                    step="0.001"
                    value={settings.release}
                    onChange={(e) => onChange('release', parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>
        </div>
    );
}

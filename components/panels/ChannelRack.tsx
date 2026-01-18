'use client';

import { useCallback, useState } from 'react';
import { useStore } from '@/state/store';
import type { Channel, Pattern, StepEvent, UUID } from '@/domain/types';
import InstrumentSettingsModal from './InstrumentSettingsModal';

// Instrument categories and presets
const INSTRUMENT_CATEGORIES = {
  Keyboards: ['piano', 'electricPiano', 'organ', 'harpsichord'],
  'Synth Leads': ['lead', 'brightLead'],
  Bass: ['bass', 'subBass', 'acidBass'],
  Pads: ['pad', 'warmPad', 'stringPad', 'atmosphericPad'],
  Strings: ['strings', 'violin', 'cello'],
  Brass: ['brass', 'trumpet', 'trombone'],
  'Bells & Mallets': ['bell', 'glockenspiel', 'marimba'],
  Plucked: ['pluck', 'guitar', 'harp'],
  FX: ['metallic'],
  Drums: ['sampler'], // Special case for drum sampler
};

// Friendly names for instruments
const INSTRUMENT_NAMES: Record<string, string> = {
  piano: 'Piano',
  electricPiano: 'Electric Piano',
  organ: 'Organ',
  harpsichord: 'Harpsichord',
  lead: 'Synth Lead',
  brightLead: 'Bright Lead',
  bass: 'Bass',
  subBass: 'Sub Bass',
  acidBass: 'Acid Bass',
  pad: 'Pad',
  warmPad: 'Warm Pad',
  stringPad: 'String Pad',
  atmosphericPad: 'Atmospheric Pad',
  strings: 'Strings',
  violin: 'Violin',
  cello: 'Cello',
  brass: 'Brass',
  trumpet: 'Trumpet',
  trombone: 'Trombone',
  bell: 'Bell',
  glockenspiel: 'Glockenspiel',
  marimba: 'Marimba',
  pluck: 'Pluck',
  guitar: 'Guitar',
  harp: 'Harp',
  metallic: 'Metallic',
  sampler: 'Drum Sampler',
};

export default function ChannelRack() {
  const {
    project,
    selectedPatternId,
    selectedChannelId,
    selectChannel,
    addChannel,
    deleteChannel,
    toggleStep,
    toggleChannelMute,
    toggleChannelSolo,
    setChannelVolume,
    updateChannel,
    getAudioAssetData,
  } = useStore();

  const [dropDebug, setDropDebug] = useState<string>('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const channels = project?.channels ?? [];
  const patterns = project?.patterns ?? [];
  const assets = project?.assets ?? [];
  const selectedPattern = patterns.find((p) => p.id === selectedPatternId);

  const resolveAssetUrl = useCallback(
    (assetId: UUID): string | null => {
      const asset = assets.find((a) => a.id === assetId);
      return getAudioAssetData(assetId) || asset?.storageUrl || null;
    },
    [assets, getAudioAssetData]
  );

  const handleAddChannel = () => {
    addChannel(`Channel ${channels.length + 1}`, 'sampler');
  };

  return (
    <div className="h-full flex flex-col" data-panel="channelRack">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ps-bg-600 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ps-text-secondary">Pattern:</span>
          <span className="text-xs font-medium text-ps-accent-primary">
            {selectedPattern?.name ?? 'None'}
          </span>
        </div>
        <div className="relative">
          <button
            className="btn btn-ghost text-xs py-1 px-2"
            onClick={() => setShowAddMenu(!showAddMenu)}
          >
            + Add Channel
          </button>
          {showAddMenu && (
            <AddInstrumentMenu
              onSelect={handleAddChannel}
              onClose={() => setShowAddMenu(false)}
            />
          )}
        </div>
      </div>

      {/* Channel List with Step Sequencer */}
      <div className="flex-1 overflow-auto">
        {channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            pattern={selectedPattern}
            isSelected={selectedChannelId === channel.id}
            onSelect={() => selectChannel(channel.id)}
            onToggleStep={(step) =>
              selectedPattern && toggleStep(selectedPattern.id, channel.id, step)
            }
            onToggleMute={() => toggleChannelMute(channel.id)}
            onToggleSolo={() => toggleChannelSolo(channel.id)}
            onVolumeChange={(vol) => setChannelVolume(channel.id, vol)}
            onPanChange={(pan) => setChannelPan(channel.id, pan)}
            onDelete={() => deleteChannel(channel.id)}
            onUpdateChannel={(updates) => updateChannel(channel.id, updates)}
            resolveAssetUrl={resolveAssetUrl}
            onDropDebug={setDropDebug}
            canDelete={channels.length > 1}
          />
        ))}
      </div>
      {dropDebug && (
        <div className="absolute top-2 right-2 z-50 text-2xs px-2 py-1 rounded bg-ps-bg-800/80 text-ps-text-secondary">
          {dropDebug}
        </div>
      )}
    </div>
  );
}

// Add Instrument Menu Component
interface AddInstrumentMenuProps {
  onSelect: (preset: string) => void;
  onClose: () => void;
}

function AddInstrumentMenu({ onSelect, onClose }: AddInstrumentMenuProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div className="absolute right-0 mt-1 w-64 bg-ps-bg-800 border border-ps-bg-600 rounded-lg shadow-xl z-50 max-h-[500px] overflow-y-auto">
        {Object.entries(INSTRUMENT_CATEGORIES).map(([category, presets]) => (
          <div key={category} className="border-b border-ps-bg-700 last:border-b-0">
            <div className="px-3 py-2 text-2xs font-semibold text-ps-text-muted uppercase tracking-wide bg-ps-bg-750">
              {category}
            </div>
            <div className="py-1">
              {presets.map((preset) => (
                <button
                  key={preset}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-ps-bg-700 transition-colors"
                  onClick={() => onSelect(preset)}
                >
                  {INSTRUMENT_NAMES[preset]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

interface ChannelRowProps {
  channel: Channel;
  pattern: Pattern | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStep: (step: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onVolumeChange: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onDelete: () => void;
  onUpdateChannel: (updates: Partial<Channel>) => void;
  resolveAssetUrl: (assetId: UUID) => string | null;
  onDropDebug: (message: string) => void;
  canDelete: boolean;
}

function ChannelRow({
  channel,
  pattern,
  isSelected,
  onSelect,
  onToggleStep,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onPanChange,
  onDelete,
  onUpdateChannel,
  resolveAssetUrl,
  onDropDebug,
  canDelete,
}: ChannelRowProps) {
  const [showSettings, setShowSettings] = useState(false);
  const stepsPerBeat = pattern?.stepsPerBeat ?? 4;
  const totalSteps = pattern?.lengthInSteps ?? 16;

  // Get active steps for this channel
  const activeSteps = new Set(
    pattern?.stepEvents
      .filter((e) => e.channelId === channel.id)
      .map((e) => e.step) ?? []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      onDropDebug('drop: received');

      try {
        const raw =
          e.dataTransfer.getData('application/json') ||
          e.dataTransfer.getData('text/plain');
        if (!raw) {
          onDropDebug('drop: no payload');
          return;
        }
        const data = JSON.parse(raw);
        onDropDebug(`drop: ${data?.type ?? 'unknown'}`);
        console.info('[ChannelRack] drop payload', data);

        // Handle library samples
        if (data.type === 'library-sample' && data.sample) {
          if (channel.type === 'sampler') {
            onUpdateChannel({
              samplerSettings: {
                ...channel.samplerSettings,
                sampleUrl: data.sample.path,
              } as any,
            });
            onDropDebug('drop: library sample set');
          }
        }

        // Handle user-uploaded samples
        if (data.type === 'user-sample' && data.assetId) {
          if (channel.type === 'sampler') {
            const url = resolveAssetUrl(data.assetId);
            if (url) {
              onUpdateChannel({
                samplerSettings: {
                  ...channel.samplerSettings,
                  sampleUrl: url,
                } as any,
              });
              onDropDebug('drop: user sample set');
            }
          }
        }
      } catch (err) {
        onDropDebug('drop: parse error');
        console.error('Failed to parse drop data:', err);
      }
    },
    [channel, onUpdateChannel, resolveAssetUrl, onDropDebug]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    onDropDebug('dragover');
  }, [onDropDebug]);

  return (
    <>
      <InstrumentSettingsModal
        channelId={channel.id}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <div
        className={`flex items-center border-b border-ps-bg-700 ${isSelected ? 'bg-ps-bg-700' : 'hover:bg-ps-bg-700/50'
          }`}
        onClick={onSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDropCapture={handleDrop}
        onDragOverCapture={handleDragOver}
      >
        {/* Channel Info */}
        <div className="w-32 shrink-0 p-2 flex items-center gap-2">
          {/* Color */}
          <div
            className="w-2 h-8 rounded-sm shrink-0"
            style={{ backgroundColor: channel.color }}
          />

          {/* Name */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{channel.name}</div>
            <div className="text-2xs text-ps-text-muted capitalize">
              {channel.type}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 px-2 shrink-0">
          <button
            className="btn btn-ghost btn-icon w-5 h-5"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(true);
            }}
            title="Instrument Settings"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className={`btn btn-icon w-5 h-5 text-2xs ${channel.mute ? 'bg-ps-accent-red text-white' : 'btn-ghost'
              }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            title="Mute"
          >
            M
          </button>
          <button
            className={`btn btn-icon w-5 h-5 text-2xs ${channel.solo ? 'bg-ps-accent-tertiary text-black' : 'btn-ghost'
              }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSolo();
            }}
            title="Solo"
          >
            S
          </button>
        </div>

        {/* Step Sequencer Grid */}
        <div className="flex-1 flex items-center gap-0.5 px-2 overflow-x-auto py-2">
          {Array.from({ length: totalSteps }).map((_, step) => {
            const isActive = activeSteps.has(step);
            const isDownbeat = step % stepsPerBeat === 0;
            const isBar = step % (stepsPerBeat * 4) === 0;

            return (
              <button
                key={step}
                className={`
                w-5 h-5 rounded-sm shrink-0 transition-all step
                ${isActive ? 'step-active' : ''}
                ${isBar ? 'ml-1' : ''}
              `}
                style={{
                  backgroundColor: isActive
                    ? channel.color
                    : isDownbeat
                      ? 'var(--ps-bg-500)'
                      : 'var(--ps-bg-600)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStep(step);
                }}
              />
            );
          })}
        </div>

        {/* Volume */}
        <div className="w-16 shrink-0 px-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={channel.volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Delete */}
        {canDelete && (
          <button
            className="btn btn-ghost btn-icon w-6 h-6 mr-2 opacity-50 hover:opacity-100 text-ps-accent-red"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete channel"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}
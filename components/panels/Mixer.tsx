'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/state/store';
import { getAudioEngine } from '@/lib/audio/AudioEngine';
import type { MixerTrack, InsertEffect, EffectType, EffectParams, UUID, Send } from '@/domain/types';
import EffectParameterEditor from './EffectParameterEditor';

export default function Mixer() {
  const {
    project,
    setMixerTrackVolume,
    setMixerTrackPan,
    toggleMixerTrackMute,
    toggleMixerTrackSolo,
    addInsertEffect,
    removeInsertEffect,
    updateInsertEffect,
    addMixerTrack,
    setMasterVolume,
  } = useStore();

  const [editingEffect, setEditingEffect] = useState<{
    trackId: UUID;
    effectId: UUID;
  } | null>(null);

  const mixer = project?.mixer;
  const tracks = mixer?.tracks ?? [];
  const sends = mixer?.sends ?? [];
  const masterVolume = mixer?.masterVolume ?? 1;

  // Find the effect being edited
  const getEditingEffectData = (): InsertEffect | null => {
    if (!editingEffect) return null;
    const track = tracks.find((t) => t.id === editingEffect.trackId);
    if (!track) return null;
    return track.inserts.find((e) => e.id === editingEffect.effectId) ?? null;
  };

  const editingEffectData = getEditingEffectData();

  // Handle parameter changes from the editor
  const handleParamsChange = useCallback(
    (params: Partial<EffectParams>) => {
      if (!editingEffect || !editingEffectData) return;
      updateInsertEffect(editingEffect.trackId, editingEffect.effectId, {
        params: { ...editingEffectData.params, ...params },
      });
    },
    [editingEffect, editingEffectData, updateInsertEffect]
  );

  return (
    <div className="h-full flex flex-col" data-panel="mixer">
      {/* Mixer header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ps-bg-600 shrink-0">
        <span className="text-xs text-ps-text-secondary">Mixer</span>
        <button
          className="btn btn-ghost text-xs py-1 px-2"
          onClick={() => addMixerTrack()}
        >
          + Add Track
        </button>
      </div>

      {/* Mixer tracks */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-w-max p-2 gap-1">
          {tracks.map((track) => (
            <MixerStrip
              key={track.id}
              track={track}
              isMaster={track.index === 0}
              sends={sends.filter((s) => s.fromTrackId === track.id)}
              allTracks={tracks}
              masterVolume={track.index === 0 ? masterVolume : undefined}
              onVolumeChange={(vol) => setMixerTrackVolume(track.id, vol)}
              onMasterVolumeChange={track.index === 0 ? setMasterVolume : undefined}
              onPanChange={(pan) => setMixerTrackPan(track.id, pan)}
              onMuteToggle={() => toggleMixerTrackMute(track.id)}
              onSoloToggle={() => toggleMixerTrackSolo(track.id)}
              onAddEffect={(type) => addInsertEffect(track.id, type)}
              onRemoveEffect={(effectId) => removeInsertEffect(track.id, effectId)}
              onToggleEffect={(effectId, enabled) =>
                updateInsertEffect(track.id, effectId, { enabled })
              }
              onEditEffect={(effectId) =>
                setEditingEffect({ trackId: track.id, effectId })
              }
            />
          ))}
        </div>
      </div>

      {/* Effect Parameter Editor Modal */}
      {editingEffect && editingEffectData && (
        <EffectParameterEditor
          effect={editingEffectData}
          trackName={
            tracks.find((t) => t.id === editingEffect.trackId)?.index === 0
              ? 'Master'
              : tracks.find((t) => t.id === editingEffect.trackId)?.name
          }
          onParamsChange={handleParamsChange}
          onClose={() => setEditingEffect(null)}
        />
      )}
    </div>
  );
}

interface MixerStripProps {
  track: MixerTrack;
  isMaster: boolean;
  sends: Send[];
  allTracks: MixerTrack[];
  masterVolume?: number;
  onVolumeChange: (volume: number) => void;
  onMasterVolumeChange?: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onAddEffect: (type: EffectType) => void;
  onRemoveEffect: (effectId: string) => void;
  onToggleEffect: (effectId: string, enabled: boolean) => void;
  onEditEffect: (effectId: string) => void;
}

function MixerStrip({
  track,
  isMaster,
  sends,
  allTracks,
  masterVolume,
  onVolumeChange,
  onMasterVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onAddEffect,
  onRemoveEffect,
  onToggleEffect,
  onEditEffect,
}: MixerStripProps) {
  const [level, setLevel] = useState(-60);
  const [showEffectMenu, setShowEffectMenu] = useState(false);
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [editingEffect, setEditingEffect] = useState<InsertEffect | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(track.name);
  const { updateInsertEffect, updateMixerTrack, addSend, updateSend, removeSend, reorderInsertEffect } = useStore();

  // Helper to get track name by ID
  const getTrackName = (trackId: UUID): string => {
    const t = allTracks.find((tr) => tr.id === trackId);
    if (!t) return '?';
    return t.index === 0 ? 'Master' : t.name;
  };

  // Level metering
  useEffect(() => {
    const engine = getAudioEngine();
    let animationId: number;

    const updateLevel = () => {
      const newLevel = engine.getTrackLevel(track.id);
      setLevel(typeof newLevel === 'number' ? newLevel : -60);
      animationId = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [track.id]);

  // Convert dB to percentage for display
  const levelPercent = Math.max(0, Math.min(100, ((level + 60) / 60) * 100));

  return (
    <div
      className={`mixer-track flex flex-col w-20 h-full p-2 ${isMaster ? 'bg-ps-bg-600' : ''
        }`}
      style={{ borderLeft: isMaster ? `3px solid ${track.color}` : undefined }}
    >
      {/* Track name */}
      {isMaster ? (
        <div className="text-xs font-medium text-center truncate mb-2">Master</div>
      ) : isEditingName ? (
        <input
          type="text"
          className="w-full text-xs text-center bg-ps-bg-900 border border-ps-accent-primary rounded px-1 mb-2"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={() => {
            if (editedName.trim()) {
              updateMixerTrack(track.id, { name: editedName.trim() });
            }
            setIsEditingName(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editedName.trim()) {
                updateMixerTrack(track.id, { name: editedName.trim() });
              }
              setIsEditingName(false);
            } else if (e.key === 'Escape') {
              setEditedName(track.name);
              setIsEditingName(false);
            }
          }}
          autoFocus
          maxLength={20}
        />
      ) : (
        <div
          className="text-xs font-medium text-center truncate mb-2 cursor-pointer hover:text-ps-accent-primary"
          onClick={() => setIsEditingName(true)}
          title="Click to rename"
        >
          {track.name}
        </div>
      )}

      {/* Inserts */}
      <div className="space-y-1 mb-2">
        {track.inserts.slice(0, 4).map((insert, index) => (
          <InsertSlot
            key={insert.id}
            insert={insert}
            onToggle={() => onToggleEffect(insert.id, !insert.enabled)}
            onRemove={() => onRemoveEffect(insert.id)}
            onEdit={() => onEditEffect(insert.id)}
            onMoveUp={() => reorderInsertEffect(track.id, insert.id, 'up')}
            onMoveDown={() => reorderInsertEffect(track.id, insert.id, 'down')}
            canMoveUp={index > 0}
            canMoveDown={index < track.inserts.length - 1}
          />
        ))}

        {/* Add effect button */}
        {track.inserts.length < 8 && (
          <div className="relative">
            <button
              className="w-full h-5 bg-ps-bg-700 hover:bg-ps-bg-600 rounded text-2xs text-ps-text-muted"
              onClick={() => setShowEffectMenu(!showEffectMenu)}
            >
              + FX
            </button>

            {showEffectMenu && (
              <div className="absolute left-0 top-full mt-1 bg-ps-bg-700 border border-ps-bg-500 rounded shadow-lg z-50 min-w-[80px]">
                {(['eq', 'compressor', 'reverb', 'delay'] as EffectType[]).map(
                  (type) => (
                    <button
                      key={type}
                      className="w-full px-2 py-1 text-left text-2xs hover:bg-ps-bg-600 capitalize"
                      onClick={() => {
                        onAddEffect(type);
                        setShowEffectMenu(false);
                      }}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sends Section */}
      {!isMaster && (
        <div className="space-y-1 mb-2">
          {/* Section label */}
          <div className="text-2xs text-ps-text-muted text-center">Sends</div>

          {/* Send slots */}
          {sends.slice(0, 4).map((send) => (
            <SendSlot
              key={send.id}
              send={send}
              destinationName={getTrackName(send.toTrackId)}
              onGainChange={(gain) => updateSend(send.id, { gain })}
              onRemove={() => removeSend(send.id)}
            />
          ))}

          {/* Add send button */}
          {sends.length < 4 && (
            <div className="relative">
              <button
                className="w-full h-5 bg-ps-bg-700 hover:bg-ps-bg-600 rounded text-2xs text-ps-text-muted"
                onClick={() => setShowSendMenu(!showSendMenu)}
              >
                + Send
              </button>

              {showSendMenu && (
                <div className="absolute left-0 top-full mt-1 bg-ps-bg-700 border border-ps-bg-500 rounded shadow-lg z-50 min-w-[80px]">
                  {/* Available destination tracks (exclude self, include tracks not already sent to) */}
                  {allTracks
                    .filter((t) => {
                      // Exclude self
                      if (t.id === track.id) return false;
                      // Exclude tracks we already have a send to
                      if (sends.some((s) => s.toTrackId === t.id)) return false;
                      return true;
                    })
                    .map((destTrack) => (
                      <button
                        key={destTrack.id}
                        className="w-full px-2 py-1 text-left text-2xs hover:bg-ps-bg-600"
                        onClick={() => {
                          addSend(track.id, destTrack.id, 0.5);
                          setShowSendMenu(false);
                        }}
                      >
                        → {destTrack.index === 0 ? 'Master' : destTrack.name}
                      </button>
                    ))}
                  {/* Show message if no available destinations */}
                  {allTracks.filter((t) => t.id !== track.id && !sends.some((s) => s.toTrackId === t.id)).length === 0 && (
                    <div className="px-2 py-1 text-2xs text-ps-text-muted">
                      No available tracks
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pan knob */}
      <div className="flex flex-col items-center mb-2">
        <span className="text-2xs text-ps-text-muted mb-1">Pan</span>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={track.pan}
          onChange={(e) => onPanChange(parseFloat(e.target.value))}
          className="w-12"
        />
      </div>

      {/* Master Volume Control (only on master track) */}
      {isMaster && masterVolume !== undefined && onMasterVolumeChange && (
        <div className="mb-2 p-1 bg-ps-accent-primary/10 rounded border border-ps-accent-primary/30">
          <div className="text-2xs text-ps-accent-primary text-center mb-1 font-medium">
            Master Out
          </div>
          {/* Horizontal slider for better browser compatibility */}
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2"
            style={{ accentColor: '#ff6b35' }}
          />
          <div className="text-center text-2xs text-ps-accent-primary mt-1">
            {Math.round(masterVolume * 100)}%
          </div>
        </div>
      )}

      {/* Track Volume Control */}
      <div className="mb-2 p-1 bg-ps-bg-secondary rounded">
        <div className="text-2xs text-ps-text-muted text-center mb-1">
          {isMaster ? 'Track Vol' : 'Volume'}
        </div>
        {/* Level meter bar */}
        <div className="h-1 bg-ps-bg-primary rounded mb-1 overflow-hidden">
          <div
            className="h-full bg-ps-accent-secondary transition-all duration-75"
            style={{ width: `${levelPercent}%` }}
          />
        </div>
        {/* Horizontal slider for better browser compatibility */}
        <input
          type="range"
          min="0"
          max="1.5"
          step="0.01"
          value={track.volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full h-2"
        />
        <div className="text-center text-2xs text-ps-text-muted mt-1">
          {Math.round(track.volume * 100)}%
        </div>
      </div>

      {/* Mute/Solo buttons */}
      {!isMaster && (
        <div className="flex gap-1">
          <button
            className={`flex-1 btn text-2xs py-1 ${track.mute ? 'bg-ps-accent-red text-white' : 'btn-ghost'
              }`}
            onClick={onMuteToggle}
          >
            M
          </button>
          <button
            className={`flex-1 btn text-2xs py-1 ${track.solo ? 'bg-ps-accent-tertiary text-black' : 'btn-ghost'
              }`}
            onClick={onSoloToggle}
          >
            S
          </button>
        </div>
      )}

      {/* Effect Editor Modal */}
      {editingEffect && (
        <EffectEditor
          effect={editingEffect}
          trackId={track.id}
          isOpen={!!editingEffect}
          onClose={() => setEditingEffect(null)}
          onUpdate={(updates) => updateInsertEffect(track.id, editingEffect.id, updates)}
        />
      )}
    </div>
  );
}

// Insert slot component
function InsertSlot({
  insert,
  onToggle,
  onRemove,
  onEdit,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  insert: InsertEffect;
  onToggle: () => void;
  onRemove: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div
      className={`group h-6 px-1 rounded text-2xs flex items-center justify-between cursor-pointer ${insert.enabled
          ? 'bg-ps-accent-secondary/30 text-ps-text-primary'
          : 'bg-ps-bg-700 text-ps-text-muted'
        }`}
      onClick={onEdit}
    >
      {/* Reorder buttons */}
      <div className="flex flex-col opacity-0 group-hover:opacity-100 mr-1">
        <button
          className={`text-[8px] leading-none ${canMoveUp ? 'text-ps-text-muted hover:text-white' : 'text-ps-bg-500 cursor-not-allowed'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (canMoveUp) onMoveUp();
          }}
          disabled={!canMoveUp}
          title="Move up"
        >
          ▲
        </button>
        <button
          className={`text-[8px] leading-none ${canMoveDown ? 'text-ps-text-muted hover:text-white' : 'text-ps-bg-500 cursor-not-allowed'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (canMoveDown) onMoveDown();
          }}
          disabled={!canMoveDown}
          title="Move down"
        >
          ▼
        </button>
      </div>

      {/* Enable/disable toggle button */}
      <button
        className={`w-3 h-3 rounded-sm mr-1 flex-shrink-0 border ${insert.enabled
            ? 'bg-ps-accent-secondary border-ps-accent-secondary'
            : 'bg-transparent border-ps-text-muted'
          }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        title={insert.enabled ? 'Disable effect' : 'Enable effect'}
      />
      <span className="capitalize truncate flex-1">{insert.type}</span>
      <button
        className="opacity-0 group-hover:opacity-100 text-ps-accent-red hover:text-white ml-1"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        title="Remove effect"
      >
        ×
      </button>
    </div>
  );
}

// Send slot component with gain control and remove button
function SendSlot({
  send,
  destinationName,
  onGainChange,
  onRemove,
}: {
  send: Send;
  destinationName: string;
  onGainChange: (gain: number) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  // Calculate gain percentage for display
  const gainPercent = Math.round(send.gain * 100);

  return (
    <div
      className="group h-5 px-1 rounded text-2xs flex items-center justify-between bg-ps-accent-primary/20 text-ps-text-primary"
      title={`Send to ${destinationName}${send.preFader ? ' - Pre-fader' : ''}`}
    >
      {/* Pre/Post indicator */}
      <span
        className={`text-2xs mr-1 px-0.5 rounded flex-shrink-0 ${send.preFader
            ? 'bg-ps-accent-tertiary/30 text-ps-accent-tertiary'
            : 'text-ps-text-muted'
          }`}
        title={send.preFader ? 'Pre-fader send' : 'Post-fader send'}
      >
        {send.preFader ? 'Pre' : 'Post'}
      </span>

      {/* Destination name */}
      <span className="truncate flex-1 min-w-0">→ {destinationName}</span>

      {/* Gain control - click to toggle slider */}
      {isEditing ? (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={send.gain}
          onChange={(e) => onGainChange(parseFloat(e.target.value))}
          onBlur={() => setIsEditing(false)}
          onMouseUp={() => setIsEditing(false)}
          className="w-10 h-2 ml-1 flex-shrink-0"
          autoFocus
        />
      ) : (
        <button
          className="text-ps-text-muted ml-1 flex-shrink-0 hover:text-ps-accent-primary"
          onClick={() => setIsEditing(true)}
          title="Click to adjust gain"
        >
          {gainPercent}%
        </button>
      )}

      {/* Remove button */}
      <button
        className="opacity-0 group-hover:opacity-100 text-ps-accent-red hover:text-white ml-1 flex-shrink-0"
        onClick={onRemove}
        title="Remove send"
      >
        ×
      </button>
    </div>
  );
}

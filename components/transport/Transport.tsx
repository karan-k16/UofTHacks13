'use client';

import { useState } from 'react';
import { useStore } from '@/state/store';
import { formatTicksAsBBT, formatTicksAsTime } from '@/lib/utils/time';
import { useAudioSync } from '@/lib/audio/useAudioSync';
import { useAudioRecorder } from '@/lib/audio/useAudioRecorder';
import LevelMeter from '@/components/common/LevelMeter';

export default function Transport() {
  // Sync audio parameters in real-time
  useAudioSync();

  const [isRecordingInProgress, setIsRecordingInProgress] = useState(false);

  const {
    transportState,
    position,
    project,
    play,
    stop,
    pause,
    isRecording,
    recording,
    toggleLoop,
    setLoopCount,
    prepareRecording,
    setRecordingInputDevice,
    setCountInBars,
  } = useStore();

  const { availableDevices, selectInputDevice, error: recorderError } = useAudioRecorder();
  const [showRecordingSettings, setShowRecordingSettings] = useState(false);

  const bpm = project?.bpm ?? 120;
  const ppq = project?.ppq ?? 96;
  const timeSignature = project?.timeSignature ?? { numerator: 4, denominator: 4 };
  const loopEnabled = project?.playlist.loopEnabled ?? false;
  const loopCount = project?.playlist.loopCount ?? 0;

  const isPlaying = transportState === 'playing';
  const isStopped = transportState === 'stopped';

  const handlePlayStop = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleStop = () => {
    stop();
    if (isRecording) {
      cancelRecording();
    }
  };

  const handleRecord = async () => {
    if (isRecording || isRecordingInProgress) {
      // Stop recording
      setIsRecordingInProgress(false);
      try {
        await useStore.getState().finishRecording();
        console.log('[Transport] Recording finished');
      } catch (error) {
        console.error('[Transport] Failed to finish recording:', error);
      }
    } else {
      // Start recording with 1 bar count-in
      setIsRecordingInProgress(true);
      try {
        await useStore.getState().recordAudio(1);
        console.log('[Transport] Recording started');
      } catch (error) {
        console.error('[Transport] Failed to start recording:', error);
        setIsRecordingInProgress(false);
      }
    }
  };

  const handleInputDeviceChange = (deviceId: string) => {
    setRecordingInputDevice(deviceId);
    selectInputDevice(deviceId);
  };

  // Convert 0-1 level to dB
  const levelToDb = (level: number): number => {
    if (level === 0) return -60;
    return 20 * Math.log10(level);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Position Display */}
      <div className="transport-display min-w-[100px] text-center">
        {formatTicksAsBBT(position, ppq, timeSignature)}
      </div>

      {/* Transport Controls */}
      <div className="flex items-center gap-1">
        {/* Stop */}
        <button
          className={`btn btn-icon ${isStopped ? 'btn-primary' : 'btn-ghost'}`}
          onClick={handleStop}
          title="Stop (Enter)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <rect x="4" y="4" width="12" height="12" rx="1" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          className={`btn btn-icon ${isPlaying ? 'btn-primary' : 'btn-ghost'}`}
          onClick={handlePlayStop}
          title="Play/Pause (Space)"
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Record */}
        <button
          className={`btn btn-icon ${isRecording || isRecordingInProgress ? 'recording-indicator' : 'btn-ghost'}`}
          onClick={handleRecord}
          title="Record (1 bar count-in)"
          disabled={isRecordingInProgress && !isRecording}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="6" />
          </svg>
        </button>

        {/* Recording Settings */}
        <button
          className={`btn btn-icon ${showRecordingSettings ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setShowRecordingSettings(!showRecordingSettings)}
          title="Recording Settings"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Loop */}
        <button
          className={`btn btn-icon ${loopEnabled ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={toggleLoop}
          title="Loop"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
          </svg>
        </button>

        {/* Loop Count */}
        {loopEnabled && (
          <div className="flex items-center gap-1 ml-1">
            <span className="text-xs text-ps-text-muted">x</span>
            <input
              type="number"
              min="0"
              max="999"
              value={loopCount}
              onChange={(e) => setLoopCount(parseInt(e.target.value) || 0)}
              className="w-12 px-1 text-xs text-center bg-ps-bg-800 border border-ps-bg-600 rounded focus:border-ps-accent-primary focus:outline-none"
              title="Loop count (0 = infinite)"
            />
          </div>
        )}
      </div>

      {/* Input Level Meter */}
      {(isRecording || recording.isPreparing || showRecordingSettings) && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Input:</span>
          <LevelMeter
            level={levelToDb(recording.inputLevel)}
            width={80}
            height={16}
            orientation="horizontal"
            showPeak={true}
          />
        </div>
      )}

      {/* Recording Settings Panel */}
      {showRecordingSettings && (
        <div className="absolute top-full left-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-lg p-4 shadow-xl z-50 min-w-[300px]">
          <h3 className="text-sm font-semibold mb-3">Recording Settings</h3>

          {/* Input Device Selection */}
          <div className="mb-3">
            <label className="text-xs text-neutral-400 block mb-1">Input Device</label>
            <select
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm"
              value={recording.inputDeviceId || ''}
              onChange={(e) => handleInputDeviceChange(e.target.value)}
            >
              {availableDevices.length === 0 && (
                <option value="">No devices available</option>
              )}
              {availableDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Device ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Count-in Bars */}
          <div className="mb-3">
            <label className="text-xs text-neutral-400 block mb-1">Count-in (bars)</label>
            <select
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm"
              value={recording.countInBars}
              onChange={(e) => setCountInBars(parseInt(e.target.value))}
            >
              <option value="0">None</option>
              <option value="1">1 bar</option>
              <option value="2">2 bars</option>
              <option value="4">4 bars</option>
            </select>
          </div>

          {/* Error Display */}
          {recorderError && (
            <div className="text-xs text-red-400 mt-2">
              {recorderError}
            </div>
          )}
        </div>
      )}

      {/* Count-in Display */}
      {recording.isPreparing && recording.countInRemaining > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-orange-400 font-bold animate-pulse">
            Count-in: {recording.countInRemaining}
          </span>
        </div>
      )}

      {/* Time Display */}
      <div className="transport-display min-w-[80px] text-center text-xs">
        {formatTicksAsTime(position, bpm, ppq)}
      </div>
    </div>
  );
}

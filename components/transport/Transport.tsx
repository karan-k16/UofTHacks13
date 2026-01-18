'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { formatTicksAsBBT, formatTicksAsTime } from '@/lib/utils/time';
import { useAudioSync } from '@/lib/audio/useAudioSync';
import LevelMeter from '@/components/common/LevelMeter';

export default function Transport() {
  // Sync audio parameters in real-time
  useAudioSync();

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
    setRecordingInputDevice,
    setCountInBars,
    cancelRecording,
  } = useStore();

  const [showRecordingSettings, setShowRecordingSettings] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Check microphone permission and enumerate devices
  useEffect(() => {
    const checkPermissionAndDevices = async () => {
      try {
        // Try to enumerate devices first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        
        // If we have devices with labels, permission was granted
        if (audioInputs.length > 0 && audioInputs[0].label) {
          setPermissionState('granted');
          setAvailableDevices(audioInputs);
        } else if (audioInputs.length > 0) {
          // Devices exist but no labels - permission not yet granted
          setPermissionState('prompt');
        }

        // Also check permissions API if available
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
            
            result.onchange = () => {
              setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
              // Re-enumerate devices on permission change
              navigator.mediaDevices.enumerateDevices().then(devs => {
                setAvailableDevices(devs.filter(d => d.kind === 'audioinput'));
              });
            };
          } catch {
            // Permissions API not fully supported
          }
        }
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
      }
    };
    
    checkPermissionAndDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        setAvailableDevices(devices.filter(d => d.kind === 'audioinput'));
      });
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  // Update recording duration timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        setRecordingDuration((Date.now() - recordingStartTime) / 1000);
      }, 100);
    } else {
      setRecordingDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingStartTime]);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowRecordingSettings(false);
      }
    };

    if (showRecordingSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRecordingSettings]);

  const requestMicrophonePermission = async () => {
    setIsRequestingPermission(true);
    setRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the tracks immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      
      // Re-enumerate devices after permission granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      setAvailableDevices(audioInputs);
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissionState('denied');
      setRecordingError('Microphone access was denied');
    } finally {
      setIsRequestingPermission(false);
    }
  };

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
      setRecordingStartTime(null);
    }
  };

  const handleRecord = async () => {
    setRecordingError(null);
    
    if (isRecording) {
      // Stop recording
      try {
        await useStore.getState().finishRecording();
        setRecordingStartTime(null);
        console.log('[Transport] Recording finished');
      } catch (error) {
        console.error('[Transport] Failed to finish recording:', error);
        setRecordingError(error instanceof Error ? error.message : 'Failed to stop recording');
      }
    } else {
      // Check permission first
      if (permissionState !== 'granted') {
        setRecordingError('Please grant microphone permission first');
        setShowRecordingSettings(true);
        return;
      }

      // Start recording
      try {
        const countIn = recording.countInBars;
        const deviceId = recording.inputDeviceId || undefined;
        
        console.log('[Transport] Starting recording with count-in:', countIn, 'device:', deviceId);
        setRecordingStartTime(Date.now());
        
        await useStore.getState().recordAudio(countIn, deviceId);
        console.log('[Transport] Recording started');
      } catch (error) {
        console.error('[Transport] Failed to start recording:', error);
        setRecordingError(error instanceof Error ? error.message : 'Failed to start recording');
        setRecordingStartTime(null);
      }
    }
  };

  const handleInputDeviceChange = async (deviceId: string) => {
    setRecordingInputDevice(deviceId);
    setRecordingError(null);
  };

  // Convert 0-1 level to dB
  const levelToDb = (level: number): number => {
    if (level === 0) return -60;
    return 20 * Math.log10(level);
  };

  // Format duration as mm:ss.s
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 relative">
      {/* Position Display */}
      <div className="font-mono text-sm text-white bg-[#111] px-3 py-1.5 rounded-lg border border-[#1a1a1a] min-w-[100px] text-center tabular-nums">
        {formatTicksAsBBT(position, ppq, timeSignature)}
      </div>

      {/* Transport Controls */}
      <div className="flex items-center gap-1">
        {/* Stop */}
        <button
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isStopped ? 'bg-[#ff6b6b] text-white' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
          onClick={handleStop}
          title="Stop (Enter)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <rect x="4" y="4" width="12" height="12" rx="1" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isPlaying ? 'bg-[#ff6b6b] text-white' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
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
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
              : 'text-[#888] hover:bg-red-600/20 hover:text-red-400'
          }`}
          onClick={handleRecord}
          title={isRecording ? 'Stop Recording' : `Record (${recording.countInBars} bar count-in)`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="6" />
          </svg>
        </button>

        {/* Recording Settings */}
        <div className="relative" ref={settingsRef}>
          <button
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${showRecordingSettings ? 'bg-[#1a1a1a] text-white' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
            onClick={() => setShowRecordingSettings(!showRecordingSettings)}
            title="Recording Settings"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Recording Settings Panel */}
          {showRecordingSettings && (
            <div className="absolute top-full right-0 mt-2 bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[#222] rounded-xl p-4 shadow-xl z-50 min-w-[300px]">
              <h3 className="text-sm font-semibold mb-3 text-white">Recording Settings</h3>

              {/* Permission Request */}
              {permissionState !== 'granted' && (
                <div className="mb-4 p-3 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
                  {permissionState === 'denied' ? (
                    <div className="text-center">
                      <div className="text-red-400 text-sm mb-2">🚫 Microphone Access Denied</div>
                      <p className="text-xs text-[#666]">
                        Please enable microphone access in your browser settings to use recording features.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-[#888] text-sm mb-2">🎤 Microphone Permission Required</div>
                      <p className="text-xs text-[#666] mb-3">
                        Grant microphone access to record audio and see available input devices.
                      </p>
                      <button
                        onClick={requestMicrophonePermission}
                        disabled={isRequestingPermission}
                        className="px-4 py-2 bg-[#ff6b6b] text-white rounded-lg text-sm font-medium hover:bg-[#ff8585] transition-colors disabled:opacity-50"
                      >
                        {isRequestingPermission ? 'Requesting...' : 'Allow Microphone Access'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Input Device Selection */}
              <div className="mb-3">
                <label className="text-xs text-[#666] block mb-1.5">Input Device</label>
                <select
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50 focus:border-[#ff6b6b] focus:outline-none"
                  value={recording.inputDeviceId || ''}
                  onChange={(e) => handleInputDeviceChange(e.target.value)}
                  disabled={permissionState !== 'granted'}
                >
                  {availableDevices.length === 0 ? (
                    <option value="">{permissionState === 'granted' ? 'No devices found' : 'Grant permission first'}</option>
                  ) : (
                    <>
                      <option value="">Default Microphone</option>
                      {availableDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Count-in Bars */}
              <div className="mb-3">
                <label className="text-xs text-[#666] block mb-1.5">Count-in (bars)</label>
                <select
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:border-[#ff6b6b] focus:outline-none"
                  value={recording.countInBars}
                  onChange={(e) => setCountInBars(parseInt(e.target.value))}
                >
                  <option value="0">None</option>
                  <option value="1">1 bar</option>
                  <option value="2">2 bars</option>
                  <option value="4">4 bars</option>
                </select>
              </div>

              {/* Input Level Preview */}
              {permissionState === 'granted' && (
                <div className="mb-3">
                  <label className="text-xs text-[#666] block mb-1.5">Input Level</label>
                  <LevelMeter
                    level={levelToDb(recording.inputLevel)}
                    width={268}
                    height={20}
                    orientation="horizontal"
                    showPeak={true}
                  />
                  <p className="text-xs text-[#666] mt-1.5">
                    {recording.inputLevel > 0 ? 'Microphone is active' : 'No input detected'}
                  </p>
                </div>
              )}

              {/* Error Display */}
              {recordingError && (
                <div className="text-xs text-red-400 mt-2 p-2 bg-red-900/20 rounded-lg border border-red-900/50">
                  ⚠️ {recordingError}
                </div>
              )}

              {/* Help Text */}
              <div className="text-xs text-[#555] mt-3 pt-3 border-t border-[#222]">
                💡 Click the red record button to start. The metronome will play during count-in.
              </div>
            </div>
          )}
        </div>

        {/* Loop */}
        <button
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${loopEnabled ? 'bg-[#1a1a1a] text-[#ff6b6b]' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
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
            <span className="text-xs text-[#666]">x</span>
            <input
              type="number"
              min="0"
              max="999"
              value={loopCount}
              onChange={(e) => setLoopCount(parseInt(e.target.value) || 0)}
              className="w-12 px-1 text-xs text-center bg-[#111] border border-[#222] rounded-lg focus:border-[#ff6b6b] focus:outline-none text-white"
              title="Loop count (0 = infinite)"
            />
          </div>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 rounded-lg border border-red-600/50">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-red-400 font-mono tabular-nums">
            REC {formatDuration(recordingDuration)}
          </span>
        </div>
      )}

      {/* Count-in Display */}
      {recording.isPreparing && recording.countInRemaining > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/20 rounded-lg border border-orange-600/50">
          <span className="text-sm text-orange-400 font-bold animate-pulse">
            Count-in: {recording.countInRemaining}
          </span>
        </div>
      )}

      {/* Time Display */}
      <div className="font-mono text-xs text-[#888] bg-[#111] px-3 py-1.5 rounded-lg border border-[#1a1a1a] min-w-[80px] text-center tabular-nums">
        {formatTicksAsTime(position, bpm, ppq)}
      </div>
    </div>
  );
}

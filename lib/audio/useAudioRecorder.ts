'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/state/store';

/**
 * Hook for managing audio input devices and recording permission
 * Note: Actual recording is handled by the AudioEngine via store actions
 */
export function useAudioRecorder() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

    const { setRecordingInputLevel } = useStore();

    // Initialize and enumerate devices
    useEffect(() => {
        let levelCheckInterval: ReturnType<typeof setInterval> | null = null;
        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let mediaStream: MediaStream | null = null;

        const init = async () => {
            try {
                // Try to enumerate devices
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(d => d.kind === 'audioinput');
                
                // Check if we have labels (meaning permission was granted)
                if (audioInputs.length > 0 && audioInputs[0].label) {
                    setPermissionState('granted');
                    setAvailableDevices(audioInputs);
                    setIsInitialized(true);
                    
                    // Set up level monitoring
                    try {
                        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        audioContext = new AudioContext();
                        const source = audioContext.createMediaStreamSource(mediaStream);
                        analyser = audioContext.createAnalyser();
                        analyser.fftSize = 256;
                        source.connect(analyser);
                        
                        const dataArray = new Uint8Array(analyser.frequencyBinCount);
                        
                        levelCheckInterval = setInterval(() => {
                            if (!analyser) return;
                            analyser.getByteFrequencyData(dataArray);
                            
                            // Calculate RMS level
                            let sum = 0;
                            for (let i = 0; i < dataArray.length; i++) {
                                const value = (dataArray[i] ?? 0) / 255;
                                sum += value * value;
                            }
                            const rms = Math.sqrt(sum / dataArray.length);
                            setRecordingInputLevel(rms);
                        }, 50);
                    } catch (levelError) {
                        console.warn('[useAudioRecorder] Could not set up level monitoring:', levelError);
                    }
                } else {
                    setPermissionState('prompt');
                    setAvailableDevices(audioInputs);
                }
                
                setError(null);
            } catch (err) {
                console.error('[useAudioRecorder] Failed to initialize:', err);
                setError(err instanceof Error ? err.message : 'Failed to initialize');
                setIsInitialized(false);
            }
        };

        init();

        // Listen for device changes
        const handleDeviceChange = async () => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');
            setAvailableDevices(audioInputs);
        };
        
        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
            if (levelCheckInterval) {
                clearInterval(levelCheckInterval);
            }
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            if (audioContext) {
                audioContext.close();
            }
        };
    }, [setRecordingInputLevel]);

    const selectInputDevice = async (deviceId: string) => {
        try {
            // Store the selected device ID in the store
            useStore.getState().setRecordingInputDevice(deviceId);
            setError(null);
        } catch (err) {
            console.error('[useAudioRecorder] Failed to select input device:', err);
            setError(err instanceof Error ? err.message : 'Failed to select input device');
        }
    };

    const requestPermission = async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setPermissionState('granted');
            
            // Re-enumerate devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');
            setAvailableDevices(audioInputs);
            setIsInitialized(true);
            
            return true;
        } catch (err) {
            console.error('[useAudioRecorder] Permission denied:', err);
            setPermissionState('denied');
            setError('Microphone permission denied');
            return false;
        }
    };

    return {
        isInitialized,
        availableDevices,
        error,
        permissionState,
        selectInputDevice,
        requestPermission,
    };
}

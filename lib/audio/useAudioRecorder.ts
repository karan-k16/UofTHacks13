'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioRecorder } from './AudioRecorder';
import { useStore } from '@/state/store';

export function useAudioRecorder() {
    const recorderRef = useRef<AudioRecorder | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
    const [error, setError] = useState<string | null>(null);

    const {
        recording,
        setRecordingInputLevel,
        finalizeRecording,
        cancelRecording,
    } = useStore();

    // Initialize recorder
    useEffect(() => {
        let recorder: AudioRecorder | null = null;

        const init = async () => {
            try {
                recorder = new AudioRecorder();
                await recorder.initialize();

                // Set up level callback
                recorder.setOnLevelChange((level) => {
                    setRecordingInputLevel(level);
                });

                recorderRef.current = recorder;
                setIsInitialized(true);
                setError(null);

                // Get available audio input devices
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(d => d.kind === 'audioinput');
                setAvailableDevices(audioInputs);
            } catch (err) {
                console.error('Failed to initialize recorder:', err);
                setError(err instanceof Error ? err.message : 'Failed to initialize recorder');
                setIsInitialized(false);
            }
        };

        init();

        return () => {
            if (recorder) {
                recorder.dispose();
            }
        };
    }, [setRecordingInputLevel]);

    // Handle recording state changes
    useEffect(() => {
        const recorder = recorderRef.current;
        if (!recorder) return;

        const handleRecording = async () => {
            if (recording.isRecording && !recording.isPreparing) {
                try {
                    await recorder.start();
                } catch (err) {
                    console.error('Failed to start recording:', err);
                    setError(err instanceof Error ? err.message : 'Failed to start recording');
                    cancelRecording();
                }
            } else if (!recording.isRecording && recorder.getState() === 'recording') {
                try {
                    const result = await recorder.stop();
                    await finalizeRecording(result.blob, result.duration);
                } catch (err) {
                    console.error('Failed to stop recording:', err);
                    setError(err instanceof Error ? err.message : 'Failed to stop recording');
                    cancelRecording();
                }
            }
        };

        handleRecording();
    }, [recording.isRecording, recording.isPreparing, finalizeRecording, cancelRecording]);

    const selectInputDevice = async (deviceId: string) => {
        const recorder = recorderRef.current;
        if (!recorder) return;

        try {
            // Reinitialize with specific device
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: { exact: deviceId },
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            });

            // Update recorder with new stream
            recorder.dispose();
            const newRecorder = new AudioRecorder();
            await newRecorder.initialize();
            newRecorder.setOnLevelChange((level) => {
                setRecordingInputLevel(level);
            });

            recorderRef.current = newRecorder;
            setError(null);
        } catch (err) {
            console.error('Failed to select input device:', err);
            setError(err instanceof Error ? err.message : 'Failed to select input device');
        }
    };

    return {
        isInitialized,
        availableDevices,
        error,
        selectInputDevice,
    };
}

'use client';

import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { getWaveformForAsset, WAVEFORM_COLORS } from '@/lib/audio/waveform';

interface WaveformCanvasProps {
    /** Unique identifier for the audio asset */
    assetId: string;
    /** Base64 encoded audio data (optional if audioUrl is provided) */
    audioData?: string;
    /** URL to audio file (optional if audioData is provided) */
    audioUrl?: string;
    /** Width of the canvas in pixels */
    width?: number;
    /** Height of the canvas in pixels */
    height?: number;
    /** Optional override color for the waveform */
    color?: string;
    /** Zoom level (0.5 to 4) */
    zoom?: number;
    /** Whether to show the waveform in a compact/mini style */
    compact?: boolean;
    /** Optional CSS class name */
    className?: string;
}

/**
 * WaveformCanvas - A canvas-based waveform visualization component.
 * 
 * Features:
 * - Efficient canvas rendering for performance
 * - Automatic color coding based on audio energy
 * - Support for zoom levels
 * - Responsive sizing
 * - Cached waveform data
 */
function WaveformCanvasComponent({
    assetId,
    audioData,
    audioUrl,
    width = 200,
    height = 40,
    color,
    zoom = 1,
    compact = false,
    className = '',
}: WaveformCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [waveformData, setWaveformData] = useState<number[] | null>(null);
    const [waveformColor, setWaveformColor] = useState<string>(color || WAVEFORM_COLORS.default);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadedAudioData, setLoadedAudioData] = useState<string | null>(null);

    // Calculate number of samples based on width and zoom
    const numSamples = Math.floor(width * zoom);

    // Load audio data from URL if needed
    useEffect(() => {
        let cancelled = false;

        async function fetchAudioData() {
            if (audioData) {
                setLoadedAudioData(audioData);
                return;
            }

            if (!audioUrl) {
                setError('No audio data or URL provided');
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();
                const base64 = btoa(
                    new Uint8Array(arrayBuffer).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ''
                    )
                );
                
                if (!cancelled) {
                    setLoadedAudioData(base64);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to fetch audio:', err);
                    setError('Failed to load audio');
                    setIsLoading(false);
                }
            }
        }

        fetchAudioData();

        return () => {
            cancelled = true;
        };
    }, [audioData, audioUrl]);

    // Load waveform data
    useEffect(() => {
        let cancelled = false;

        async function loadWaveform() {
            if (!loadedAudioData) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const result = await getWaveformForAsset(assetId, loadedAudioData, numSamples);

                if (!cancelled) {
                    setWaveformData(result.data);
                    setWaveformColor(color || result.color);
                    setIsLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to load waveform:', err);
                    setError('Failed to load waveform');
                    setIsLoading(false);
                }
            }
        }

        loadWaveform();

        return () => {
            cancelled = true;
        };
    }, [assetId, loadedAudioData, numSamples, color]);

    // Draw waveform on canvas
    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !waveformData || waveformData.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size (account for device pixel ratio for crisp rendering)
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate dimensions
        const barWidth = Math.max(1, (width / waveformData.length) - (compact ? 0 : 1));
        const centerY = height / 2;
        const maxAmplitude = compact ? height / 2 - 1 : height / 2 - 2;

        // Draw waveform bars
        ctx.fillStyle = waveformColor;

        for (let i = 0; i < waveformData.length; i++) {
            const sample = waveformData[i];
            if (sample === undefined) continue;
            const amplitude = sample * maxAmplitude;
            const x = i * (width / waveformData.length);

            if (compact) {
                // Compact mode: single bars from bottom
                ctx.fillRect(x, height - amplitude * 2, barWidth, amplitude * 2);
            } else {
                // Full mode: symmetrical around center
                ctx.fillRect(x, centerY - amplitude, barWidth, amplitude * 2);
            }
        }

        // Add subtle gradient overlay for depth
        if (!compact) {
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }

        // Draw center line in full mode
        if (!compact) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();
        }
    }, [waveformData, width, height, waveformColor, compact]);

    // Redraw when data or dimensions change
    useEffect(() => {
        drawWaveform();
    }, [drawWaveform]);

    // Render loading state
    if (isLoading) {
        return (
            <div
                className={`flex items-center justify-center bg-ps-bg-700 rounded ${className}`}
                style={{ width, height }}
            >
                <div className="loading-spinner w-4 h-4" />
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div
                className={`flex items-center justify-center bg-ps-bg-700 rounded text-ps-text-muted text-2xs ${className}`}
                style={{ width, height }}
            >
                ⚠️
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className={`rounded ${className}`}
            style={{
                width,
                height,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}
        />
    );
}

// Memoize to prevent unnecessary re-renders
export const WaveformCanvas = memo(WaveformCanvasComponent);

/**
 * WaveformZoomControl - A slider component for controlling waveform zoom level.
 */
interface WaveformZoomControlProps {
    zoom: number;
    onZoomChange: (zoom: number) => void;
    min?: number;
    max?: number;
    className?: string;
}

export function WaveformZoomControl({
    zoom,
    onZoomChange,
    min = 0.5,
    max = 4,
    className = '',
}: WaveformZoomControlProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                className="btn btn-ghost btn-icon p-1 text-ps-text-secondary hover:text-ps-text-primary"
                onClick={() => onZoomChange(Math.max(min, zoom - 0.5))}
                title="Zoom out"
                disabled={zoom <= min}
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
            </button>

            <input
                type="range"
                min={min}
                max={max}
                step={0.25}
                value={zoom}
                onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-ps-bg-600 rounded-lg appearance-none cursor-pointer accent-ps-accent-primary"
                title={`Zoom: ${zoom.toFixed(1)}x`}
            />

            <button
                className="btn btn-ghost btn-icon p-1 text-ps-text-secondary hover:text-ps-text-primary"
                onClick={() => onZoomChange(Math.min(max, zoom + 0.5))}
                title="Zoom in"
                disabled={zoom >= max}
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    );
}

export default WaveformCanvas;

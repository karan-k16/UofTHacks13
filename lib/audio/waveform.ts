// ============================================
// Pulse Studio - Waveform Utilities
// ============================================

/**
 * Extract normalized amplitude samples from an AudioBuffer for waveform display.
 * Uses RMS (Root Mean Square) for each segment to get a more accurate representation.
 * 
 * @param audioBuffer - The decoded audio buffer
 * @param numSamples - Number of data points to extract (width of waveform display)
 * @returns Array of normalized amplitude values (-1 to 1 range for display)
 */
export function extractWaveformData(
    audioBuffer: AudioBuffer,
    numSamples: number = 100
): number[] {
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const samplesPerPixel = Math.floor(channelData.length / numSamples);
    const waveformData: number[] = [];

    for (let i = 0; i < numSamples; i++) {
        const start = i * samplesPerPixel;
        const end = Math.min(start + samplesPerPixel, channelData.length);

        // Calculate RMS for this segment
        let sumSquares = 0;
        let maxAbs = 0;

        for (let j = start; j < end; j++) {
            const sample = channelData[j] ?? 0;
            sumSquares += sample * sample;
            maxAbs = Math.max(maxAbs, Math.abs(sample));
        }

        // Use peak value for better visual representation
        waveformData.push(maxAbs);
    }

    return waveformData;
}

/**
 * Calculate the RMS (Root Mean Square) level of an audio buffer.
 * Used for determining the overall loudness/energy of the audio.
 * 
 * @param audioBuffer - The decoded audio buffer
 * @returns RMS value between 0 and 1
 */
export function calculateRMSLevel(audioBuffer: AudioBuffer): number {
    const channelData = audioBuffer.getChannelData(0);
    let sumSquares = 0;

    for (let i = 0; i < channelData.length; i++) {
        const sample = channelData[i] ?? 0;
        sumSquares += sample * sample;
    }

    return Math.sqrt(sumSquares / channelData.length);
}

/**
 * Get a color for the waveform based on audio energy level.
 * Quieter samples get cooler colors (blue/cyan), 
 * louder samples get warmer colors (orange/red).
 * 
 * @param rmsLevel - RMS level of the audio (0 to 1)
 * @returns CSS color string
 */
export function getWaveformColor(rmsLevel: number): string {
    // Normalize RMS to a 0-1 scale (typical RMS is 0.1-0.3)
    const normalizedLevel = Math.min(1, rmsLevel * 4);

    // Color gradient from cool (blue) to warm (orange/red)
    // HSL: 200 (blue) -> 30 (orange)
    const hue = 200 - (normalizedLevel * 170);
    const saturation = 70 + (normalizedLevel * 15);
    const lightness = 55 + (normalizedLevel * 10);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get a color palette for waveform display.
 * Returns gradient colors for different loudness zones.
 */
export const WAVEFORM_COLORS = {
    quiet: '#60a5fa',     // Blue - quiet sections
    medium: '#34d399',    // Green - medium levels
    loud: '#fbbf24',      // Amber - loud sections
    peak: '#ef4444',      // Red - peak/clipping
    default: '#a78bfa',   // Purple - default accent
    muted: '#6b7280',     // Gray - muted/disabled
};

/**
 * Decode audio data from a base64 string.
 * Used to decode stored audio assets for waveform generation.
 * 
 * @param base64Data - Base64 encoded audio data (data URL format)
 * @returns Promise resolving to AudioBuffer
 */
export async function decodeAudioFromBase64(base64Data: string): Promise<AudioBuffer> {
    // Remove data URL prefix if present
    const base64WithoutPrefix = base64Data.replace(/^data:audio\/[^;]+;base64,/, '');

    // Decode base64 to binary
    const binaryString = atob(base64WithoutPrefix);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode using Web Audio API
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
    await audioContext.close();

    return audioBuffer;
}

/**
 * Cache for waveform data to avoid re-computation.
 */
const waveformCache = new Map<string, { data: number[]; color: string; rms: number }>();

/**
 * Get or generate waveform data for an audio asset.
 * Results are cached by asset ID for performance.
 * 
 * @param assetId - Unique identifier for the audio asset
 * @param base64Data - Base64 encoded audio data
 * @param numSamples - Number of waveform samples to extract
 * @returns Promise resolving to waveform data object
 */
export async function getWaveformForAsset(
    assetId: string,
    base64Data: string,
    numSamples: number = 100
): Promise<{ data: number[]; color: string; rms: number }> {
    // Check cache first
    const cacheKey = `${assetId}_${numSamples}`;
    const cached = waveformCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const audioBuffer = await decodeAudioFromBase64(base64Data);
        const waveformData = extractWaveformData(audioBuffer, numSamples);
        const rms = calculateRMSLevel(audioBuffer);
        const color = getWaveformColor(rms);

        const result = { data: waveformData, color, rms };
        waveformCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Failed to generate waveform:', error);
        // Return default empty waveform
        return {
            data: new Array(numSamples).fill(0),
            color: WAVEFORM_COLORS.muted,
            rms: 0,
        };
    }
}

/**
 * Clear waveform cache for a specific asset or all assets.
 * 
 * @param assetId - Optional asset ID to clear; if omitted, clears entire cache
 */
export function clearWaveformCache(assetId?: string): void {
    if (assetId) {
        // Clear all entries for this asset
        Array.from(waveformCache.keys()).forEach(key => {
            if (key.startsWith(assetId)) {
                waveformCache.delete(key);
            }
        });
    } else {
        waveformCache.clear();
    }
}

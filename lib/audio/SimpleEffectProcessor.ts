/**
 * Simple Effect Processor - Non-destructive audio processing
 * 
 * Processes audio files offline with track effects applied.
 * Uses Tone.Offline for reliable offline rendering.
 */

import { getTone } from './ToneProvider';
import type { TrackEffects } from '@/domain/types';

export class SimpleEffectProcessor {
    /**
     * Process an audio file with the given track effects
     * Returns a new AudioBuffer with effects applied
     */
    static async processAudio(
        audioUrl: string,
        effects: TrackEffects
    ): Promise<AudioBuffer> {
        const Tone = getTone();
        if (!Tone) {
            throw new Error('Tone.js not available');
        }

        console.log('[SimpleEffectProcessor] Loading audio from:', audioUrl);
        console.log('[SimpleEffectProcessor] Effects:', effects);

        // Load the original audio buffer first (in the main context)
        const sourceBuffer = new Tone.ToneAudioBuffer();
        await new Promise<void>((resolve, reject) => {
            sourceBuffer.load(audioUrl)
                .then(() => {
                    console.log(`[SimpleEffectProcessor] Audio loaded: ${sourceBuffer.duration}s`);
                    resolve();
                })
                .catch((err: Error) => {
                    console.error('[SimpleEffectProcessor] Failed to load audio:', err);
                    reject(err);
                });
        });

        // Get actual audio properties from loaded buffer
        const duration = sourceBuffer.duration;
        const sampleRate = sourceBuffer.sampleRate;
        const numberOfChannels = sourceBuffer.numberOfChannels;

        console.log(`[SimpleEffectProcessor] Creating offline context: ${duration}s @ ${sampleRate}Hz`);

        // Use Tone.Offline to render with effects
        const renderedBuffer = await Tone.Offline(async (context: { destination: unknown }) => {
            const { destination } = context;

            // Create player in offline context
            const player = new Tone.Player(sourceBuffer);

            // Build effect chain: Player → Gain → Panner → EQ3 → Compressor → Reverb → Destination

            // 1. Volume (Gain)
            const gain = new Tone.Gain(effects.volume);

            // 2. Panner
            const panner = new Tone.Panner(effects.pan);

            // 3. EQ3 (only if any EQ is non-zero)
            const hasEQ = effects.eqLow !== 0 || effects.eqMid !== 0 || effects.eqHigh !== 0;
            const eq = hasEQ ? new Tone.EQ3({
                low: effects.eqLow,
                mid: effects.eqMid,
                high: effects.eqHigh,
            }) : null;

            // 4. Compressor (only if threshold is not at minimum)
            const hasCompressor = effects.compThreshold > -60;
            const compressor = hasCompressor ? new Tone.Compressor({
                threshold: effects.compThreshold,
                ratio: effects.compRatio,
                attack: 0.003,
                release: 0.25,
            }) : null;

            // 5. Reverb (only if wet > 0)
            const hasReverb = effects.reverbWet > 0;
            let reverb: InstanceType<typeof Tone.Reverb> | null = null;
            if (hasReverb) {
                reverb = new Tone.Reverb({
                    decay: 1.5,
                    preDelay: 0.01,
                });
                reverb.wet.value = effects.reverbWet;
                await reverb.generate();
            }

            // Connect the chain
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let currentNode: any = player;

            currentNode.connect(gain);
            currentNode = gain;

            currentNode.connect(panner);
            currentNode = panner;

            if (eq) {
                currentNode.connect(eq);
                currentNode = eq;
            }

            if (compressor) {
                currentNode.connect(compressor);
                currentNode = compressor;
            }

            if (reverb) {
                currentNode.connect(reverb);
                currentNode = reverb;
            }

            // Connect to destination
            currentNode.connect(destination);

            // Start playback immediately
            player.start(0);

        }, duration, numberOfChannels, sampleRate);

        console.log(`[SimpleEffectProcessor] Rendered buffer: ${renderedBuffer.duration}s`);

        return renderedBuffer;
    }

    /**
     * Convert an AudioBuffer to a WAV Blob for storage
     */
    static audioBufferToWav(buffer: AudioBuffer): Blob {
        const numberOfChannels = buffer.numberOfChannels;
        const length = buffer.length * numberOfChannels * 2;
        const arrayBuffer = new ArrayBuffer(44 + length);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length, true);

        // Write audio data (interleaved)
        const channels: Float32Array[] = [];
        for (let i = 0; i < numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const channelData = channels[channel];
                if (!channelData) continue;
                const sampleValue = channelData[i];
                if (sampleValue === undefined) continue;
                const sample = Math.max(-1, Math.min(1, sampleValue));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
}

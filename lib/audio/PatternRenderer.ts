/**
 * Pattern Renderer - Renders pattern clips to audio with effects
 * 
 * Uses Tone.Offline to render MIDI patterns to audio buffers
 * with track effects applied.
 */

import { getTone } from './ToneProvider';
import { ticksToSeconds, midiNoteToFrequency } from '@/domain/operations';
import type { Project, Pattern, Clip, TrackEffects } from '@/domain/types';

export class PatternRenderer {
    /**
     * Render a pattern clip to an AudioBuffer with effects applied
     */
    static async renderPattern(
        project: Project,
        pattern: Pattern,
        clip: Clip,
        effects: TrackEffects
    ): Promise<AudioBuffer> {
        const Tone = getTone();
        if (!Tone) {
            throw new Error('Tone.js not available');
        }

        console.log('[PatternRenderer] Rendering pattern:', pattern.name);
        console.log('[PatternRenderer] Effects:', effects);

        const bpm = project.bpm;
        const ppq = project.ppq;

        // Calculate duration based on clip duration
        const clipDurationSeconds = ticksToSeconds(clip.durationTick, bpm, ppq);
        // Add a small buffer for release tails
        const renderDuration = clipDurationSeconds + 2;

        console.log(`[PatternRenderer] Rendering ${renderDuration}s @ ${bpm} BPM`);

        // Render offline with Tone.js
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderedBuffer = await Tone.Offline(async (context: any) => {
            const { transport, destination } = context;
            transport.bpm.value = bpm;

            // Build effect chain
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

            // Create instruments for each channel used in the pattern
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const instruments = new Map<string, any>();

            for (const channel of project.channels) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let instrument: any;

                if (channel.type === 'synth' && channel.synthSettings) {
                    const settings = channel.synthSettings;
                    instrument = new Tone.PolySynth(Tone.Synth, {
                        oscillator: { type: settings.oscillatorType },
                        envelope: {
                            attack: settings.attack,
                            decay: settings.decay,
                            sustain: settings.sustain,
                            release: settings.release,
                        },
                    });
                } else {
                    // Default to membrane synth for drums
                    instrument = new Tone.MembraneSynth();
                }

                instrument.volume.value = Tone.gainToDb(channel.volume);

                // Connect through effect chain
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let currentNode: any = instrument;

                currentNode.connect(gain);

                instruments.set(channel.id, instrument);
            }

            // Connect effect chain: gain -> panner -> eq -> compressor -> reverb -> destination
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let lastNode: any = gain;

            lastNode.connect(panner);
            lastNode = panner;

            if (eq) {
                lastNode.connect(eq);
                lastNode = eq;
            }

            if (compressor) {
                lastNode.connect(compressor);
                lastNode = compressor;
            }

            if (reverb) {
                lastNode.connect(reverb);
                lastNode = reverb;
            }

            lastNode.connect(destination);

            // Calculate pattern duration for repeats
            const patternDuration = ticksToSeconds(
                (pattern.lengthInSteps / pattern.stepsPerBeat) * ppq,
                bpm,
                ppq
            );

            const repeats = Math.ceil(clipDurationSeconds / patternDuration);

            // Schedule step events
            for (const stepEvent of pattern.stepEvents) {
                const channel = project.channels.find((c) => c.id === stepEvent.channelId);
                if (!channel) continue;

                const instrument = instruments.get(channel.id);
                if (!instrument) continue;

                const stepTicks = (stepEvent.step / pattern.stepsPerBeat) * ppq;
                const stepTime = ticksToSeconds(stepTicks, bpm, ppq);

                for (let i = 0; i < repeats; i++) {
                    const time = stepTime + i * patternDuration;
                    if (time >= clipDurationSeconds) break;

                    const velocity = stepEvent.velocity / 127;

                    transport.schedule((scheduledTime: number) => {
                        if (instrument.triggerAttackRelease) {
                            instrument.triggerAttackRelease(
                                midiNoteToFrequency(channel.type === 'sampler' ? 60 : 36),
                                '16n',
                                scheduledTime,
                                velocity
                            );
                        }
                    }, time);
                }
            }

            // Schedule piano roll notes
            for (const note of pattern.notes) {
                // Get the first synth channel for piano roll notes
                const synthChannel = project.channels.find((c) => c.type === 'synth');
                if (!synthChannel) continue;

                const instrument = instruments.get(synthChannel.id);
                if (!instrument) continue;

                const noteStartTime = ticksToSeconds(note.startTick, bpm, ppq);
                const noteDuration = ticksToSeconds(note.durationTick, bpm, ppq);

                for (let i = 0; i < repeats; i++) {
                    const time = noteStartTime + i * patternDuration;
                    if (time >= clipDurationSeconds) break;

                    const velocity = note.velocity / 127;

                    transport.schedule((scheduledTime: number) => {
                        if (instrument.triggerAttackRelease) {
                            instrument.triggerAttackRelease(
                                midiNoteToFrequency(note.pitch),
                                noteDuration,
                                scheduledTime,
                                velocity
                            );
                        }
                    }, time);
                }
            }

            // Start transport
            transport.start();
        }, renderDuration);

        // Extract the raw AudioBuffer from Tone's buffer
        const audioBuffer = renderedBuffer.get ? renderedBuffer.get() : renderedBuffer;

        console.log('[PatternRenderer] Rendered pattern:', pattern.name, 'duration:', audioBuffer.duration);

        return audioBuffer;
    }
}

'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { getAudioEngine } from './AudioEngine';
import type { Channel, MixerTrack, InsertEffect } from '@/domain/types';

/**
 * Hook to sync store state changes to AudioEngine in real-time
 * This handles pan, volume, mute, solo, synth settings, and mixer effect changes
 */
export function useAudioSync() {
    const { project } = useStore();
    const prevChannelsRef = useRef<Channel[]>([]);
    const prevMixerTracksRef = useRef<MixerTrack[]>([]);

    useEffect(() => {
        if (!project) return;

        const engine = getAudioEngine();
        const channels = project.channels;
        const mixerTracks = project.mixer.tracks;

        // First render - just store references
        if (prevChannelsRef.current.length === 0) {
            prevChannelsRef.current = JSON.parse(JSON.stringify(channels));
            prevMixerTracksRef.current = JSON.parse(JSON.stringify(mixerTracks));
            return;
        }

        // Check each channel for changes
        channels.forEach((channel) => {
            const prevChannel = prevChannelsRef.current.find((c) => c.id === channel.id);

            if (!prevChannel) {
                // New channel added
                console.log(`[useAudioSync] New channel detected: ${channel.name}`);
                prevChannelsRef.current.push(JSON.parse(JSON.stringify(channel)));
                return;
            }

            // Check for volume changes
            if (prevChannel.volume !== channel.volume) {
                console.log(`[useAudioSync] Volume changed for ${channel.name}: ${prevChannel.volume} -> ${channel.volume}`);
                engine.setChannelVolume(channel.id, channel.volume);
            }

            // Check for pan changes
            if (prevChannel.pan !== channel.pan) {
                console.log(`[useAudioSync] Pan changed for ${channel.name}: ${prevChannel.pan} -> ${channel.pan}`);
                engine.setChannelPan(channel.id, channel.pan);
            }

            // Check for mute changes
            if (prevChannel.mute !== channel.mute) {
                console.log(`[useAudioSync] Mute changed for ${channel.name}: ${prevChannel.mute} -> ${channel.mute}`);
                engine.setChannelMute(channel.id, channel.mute);
            }

            // Check for synth settings changes
            if (channel.type === 'synth' && channel.synthSettings && prevChannel.synthSettings) {
                const prev = prevChannel.synthSettings;
                const curr = channel.synthSettings;

                // Oscillator type
                if (prev.oscillatorType !== curr.oscillatorType) {
                    console.log(`[useAudioSync] Oscillator type changed for ${channel.name}: ${prev.oscillatorType} -> ${curr.oscillatorType}`);
                    engine.updateSynthOscillator(channel.id, curr.oscillatorType);
                }

                // ADSR Envelope
                if (
                    prev.attack !== curr.attack ||
                    prev.decay !== curr.decay ||
                    prev.sustain !== curr.sustain ||
                    prev.release !== curr.release
                ) {
                    console.log(`[useAudioSync] Envelope changed for ${channel.name}: A:${curr.attack} D:${curr.decay} S:${curr.sustain} R:${curr.release}`);
                    engine.updateSynthEnvelope(channel.id, {
                        attack: curr.attack,
                        decay: curr.decay,
                        sustain: curr.sustain,
                        release: curr.release,
                    });
                }

                // Filter
                if (
                    prev.filterCutoff !== curr.filterCutoff ||
                    prev.filterResonance !== curr.filterResonance
                ) {
                    console.log(`[useAudioSync] Filter changed for ${channel.name}: cutoff=${curr.filterCutoff}Hz resonance=${curr.filterResonance}`);
                    engine.updateSynthFilter(channel.id, curr.filterCutoff, curr.filterResonance);
                }
            }
        });

        // Check each mixer track for effect changes
        mixerTracks.forEach((track) => {
            const prevTrack = prevMixerTracksRef.current.find((t) => t.id === track.id);
            if (!prevTrack) return;

            // Check each insert effect
            track.inserts.forEach((insert) => {
                const prevInsert = prevTrack.inserts.find((i) => i.id === insert.id);
                if (!prevInsert) return;

                // Compare params
                const prevParams = JSON.stringify(prevInsert.params);
                const currParams = JSON.stringify(insert.params);

                if (prevParams !== currParams) {
                    console.log(`[useAudioSync] Effect params changed for ${track.name} - ${insert.type}`);
                    engine.updateInsertEffect(track.id, insert.id, insert.params as unknown as Record<string, unknown>);
                }
            });
        });

        // Update references for next comparison
        prevChannelsRef.current = JSON.parse(JSON.stringify(channels));
        prevMixerTracksRef.current = JSON.parse(JSON.stringify(mixerTracks));
    }, [project]);
}

// ============================================
// Pulse Studio - Offline Renderer
// ============================================

import type { Project, Pattern, Channel, Clip } from '@/domain/types';
import { ticksToSeconds, midiNoteToFrequency } from '@/domain/operations';
import { getTone } from './ToneProvider';

// ============================================
// Types
// ============================================

export interface RenderProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
}

export interface RenderResult {
  wavBlob: Blob;
  duration: number;
  sampleRate: number;
}

export interface RenderOptions {
  onlyTrackId?: string;
}

// ============================================
// Offline Renderer
// ============================================

export class OfflineRenderer {
  private onProgress: ((progress: RenderProgress) => void) | null = null;

  setProgressCallback(callback: (progress: RenderProgress) => void): void {
    this.onProgress = callback;
  }

  private reportProgress(progress: RenderProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  async render(project: Project, options: RenderOptions = {}): Promise<RenderResult> {
    try {
      // Get Tone.js from the provider
      const Tone = getTone();

      if (!Tone) {
        throw new Error('Tone.js not available');
      }

      // Check for Offline function specifically (handle different import styles)
      const Offline = Tone.Offline || Tone.default?.Offline;
      if (typeof Offline !== 'function') {
        console.error('[OfflineRenderer] Tone.Offline is missing. Tone properties:', Object.keys(Tone));
        throw new Error('Tone.Offline is not a function');
      }

      this.reportProgress({
        phase: 'preparing',
        progress: 0,
        message: options.onlyTrackId ? 'Preparing stem render...' : 'Preparing to render...',
      });

      // Calculate total duration
      const totalDurationTicks = this.calculateProjectDuration(project);
      const durationSeconds = ticksToSeconds(totalDurationTicks, project.bpm, project.ppq) + 2;

      this.reportProgress({
        phase: 'preparing',
        progress: 10,
        message: `Rendering ${Math.round(durationSeconds)} seconds of audio...`,
      });

      // Create offline context
      const buffer = await Tone.Offline((context) => {
        const { transport } = context;
        transport.bpm.value = project.bpm;

        // Set up master volume
        if (!options.onlyTrackId) {
          Tone.getDestination().volume.value = Tone.gainToDb(project.mixer.masterVolume);
        }

        // Set up instruments for offline rendering
        const instruments = this.setupOfflineInstruments(project, options);

        // Schedule all content
        this.scheduleOfflineContent(project, instruments, transport, options);

        // Start transport
        transport.start();

        this.reportProgress({
          phase: 'rendering',
          progress: 50,
          message: options.onlyTrackId ? 'Rendering stem...' : 'Rendering audio...',
        });
      }, durationSeconds);

      this.reportProgress({
        phase: 'encoding',
        progress: 80,
        message: 'Encoding WAV file...',
      });

      // Convert AudioBuffer to WAV
      const wavBlob = this.audioBufferToWav(buffer);

      this.reportProgress({
        phase: 'complete',
        progress: 100,
        message: 'Render complete!',
      });

      return {
        wavBlob,
        duration: buffer.duration,
        sampleRate: buffer.sampleRate,
      };
    } catch (error) {
      this.reportProgress({
        phase: 'error',
        progress: 0,
        message: `Render failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  }

  private calculateProjectDuration(project: Project): number {
    let maxTick = 0;

    for (const clip of project.playlist.clips) {
      const endTick = clip.startTick + clip.durationTick;
      if (endTick > maxTick) {
        maxTick = endTick;
      }
    }

    // Minimum 4 bars
    const minTicks = project.ppq * project.timeSignature.numerator * 4;
    return Math.max(maxTick, minTicks);
  }

  private setupOfflineInstruments(
    project: Project,
    options: RenderOptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Map<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instruments = new Map<string, any>();
    const { channels, mixer } = project;

    const Tone = getTone();
    if (!Tone) return instruments;

    // First, set up mixer tracks
    const trackNodes = new Map<string, any>();
    for (const track of mixer.tracks) {
      // If we are rendering only one track, skip others
      if (options.onlyTrackId && track.id !== options.onlyTrackId && track.index !== 0) {
        continue;
      }

      const volumeNode = new Tone.Volume(Tone.gainToDb(track.volume));
      const panNode = new Tone.Panner(track.pan);
      
      // Chain: Volume -> Pan
      volumeNode.connect(panNode);

      // Add effects (Inserts)
      let lastNode = panNode;
      for (const effect of track.inserts) {
        if (!effect.enabled) continue;
        
        const effectNode = this.createEffectNode(effect);
        if (effectNode) {
          lastNode.connect(effectNode);
          lastNode = effectNode;
        }
      }

      // Final connection
      if (options.onlyTrackId) {
        // If this is the track we want, connect to destination
        if (track.id === options.onlyTrackId) {
          lastNode.toDestination();
        }
      } else {
        // Master or multiple tracks render
        if (track.index === 0) {
          // Master track connects to destination
          lastNode.toDestination();
        } else {
          // Other tracks connect to master track (index 0) or destination if master not found
          const masterTrack = mixer.tracks.find(t => t.index === 0);
          if (masterTrack && trackNodes.has(masterTrack.id)) {
            lastNode.connect(trackNodes.get(masterTrack.id));
          } else {
            lastNode.toDestination();
          }
        }
      }

      trackNodes.set(track.id, volumeNode); // We store the start of the chain (volumeNode)
    }

    // Now set up instruments and connect to mixer tracks
    for (const channel of channels) {
      const trackNode = trackNodes.get(channel.mixerTrackId);
      if (!trackNode) continue;

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
        instrument = new Tone.MembraneSynth();
      }

      instrument.volume.value = Tone.gainToDb(channel.volume);
      
      // Connect instrument to the mixer track's volume node
      instrument.connect(trackNode);

      instruments.set(channel.id, instrument);
    }

    return instruments;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createEffectNode(effect: any): any {
    if (!Tone) return null;
    
    switch (effect.type) {
      case 'eq':
        // Simplified EQ for offline render
        return new Tone.EQ3({
          low: effect.params.lowGain,
          mid: effect.params.midGain,
          high: effect.params.highGain,
          lowFrequency: effect.params.lowFreq,
          highFrequency: effect.params.highFreq,
        });
      case 'compressor':
        return new Tone.Compressor({
          threshold: effect.params.threshold,
          ratio: effect.params.ratio,
          attack: effect.params.attack,
          release: effect.params.release,
        });
      case 'reverb':
        return new Tone.Reverb({
          decay: effect.params.decay,
          preDelay: effect.params.preDelay,
          wet: effect.params.wet,
        });
      case 'delay':
        return new Tone.FeedbackDelay({
          delayTime: effect.params.time,
          feedback: effect.params.feedback,
          wet: effect.params.wet,
        });
      default:
        return null;
    }
  }

  private scheduleOfflineContent(
    project: Project,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instruments: Map<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: any,
    options: RenderOptions
  ): void {
    const { playlist, patterns, channels } = project;
    const bpm = project.bpm;
    const ppq = project.ppq;

    for (const clip of playlist.clips) {
      if (clip.mute) continue;

      if (clip.type === 'pattern') {
        const pattern = patterns.find((p) => p.id === clip.patternId);
        if (pattern) {
          this.scheduleOfflinePattern(
            pattern,
            clip,
            channels,
            instruments,
            transport,
            bpm,
            ppq,
            options
          );
        }
      }
    }
  }

  private scheduleOfflinePattern(
    pattern: Pattern,
    clip: Clip,
    channels: Channel[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instruments: Map<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: any,
    bpm: number,
    ppq: number,
    options: RenderOptions
  ): void {
    const Tone = getTone();
    if (!Tone) return;

    const clipStartTime = ticksToSeconds(clip.startTick, bpm, ppq);
    const clipDuration = ticksToSeconds(clip.durationTick, bpm, ppq);
    const patternDuration = ticksToSeconds(
      (pattern.lengthInSteps / pattern.stepsPerBeat) * ppq,
      bpm,
      ppq
    );

    // Schedule step events
    for (const stepEvent of pattern.stepEvents) {
      const channel = channels.find((c) => c.id === stepEvent.channelId);
      if (!channel) continue;

      // If we are rendering only one track, and this channel isn't on that track, skip
      if (options.onlyTrackId && channel.mixerTrackId !== options.onlyTrackId) {
        continue;
      }

      const instrument = instruments.get(channel.id);
      if (!instrument) continue;

      const stepTicks = (stepEvent.step / pattern.stepsPerBeat) * ppq;
      const stepTime = ticksToSeconds(stepTicks, bpm, ppq);

      const repeats = Math.ceil(clipDuration / patternDuration);

      for (let i = 0; i < repeats; i++) {
        const time = clipStartTime + stepTime + i * patternDuration;
        if (time >= clipStartTime + clipDuration) break;

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
      const channel = channels[0]; // TODO: Piano roll should specify channel
      if (!channel) continue;

      // If we are rendering only one track, and this channel isn't on that track, skip
      if (options.onlyTrackId && channel.mixerTrackId !== options.onlyTrackId) {
        continue;
      }

      const instrument = instruments.get(channel.id);
      if (!instrument) continue;

      const noteStartTicks = note.startTick;
      const noteStartTime = ticksToSeconds(noteStartTicks, bpm, ppq);
      const noteDuration = ticksToSeconds(note.durationTick, bpm, ppq);

      const repeats = Math.ceil(clipDuration / patternDuration);

      for (let i = 0; i < repeats; i++) {
        const time = clipStartTime + noteStartTime + i * patternDuration;
        if (time >= clipStartTime + clipDuration) break;

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
  }

  // ==========================================
  // WAV Encoding
  // ==========================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private audioBufferToWav(buffer: any): Blob {
    const audioBuffer = buffer.get ? buffer.get() : buffer;
    if (!audioBuffer) {
      throw new Error('Failed to get audio buffer');
    }

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = audioBuffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write interleaved audio data
    const channelsData: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channelsData.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channelsData[ch]?.[i] ?? 0));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}

// Export singleton instance
export const offlineRenderer = new OfflineRenderer();

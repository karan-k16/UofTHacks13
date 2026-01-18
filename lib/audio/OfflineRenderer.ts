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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buffer = await Tone.Offline((context: any) => {
        const { transport } = context;
        transport.bpm.value = project.bpm;

        // Set up master volume
        Tone.getDestination().volume.value = Tone.gainToDb(project.mixer.masterVolume);

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
    const { channels } = project;

    const Tone = getTone();
    if (!Tone) return instruments;

    // Set up master volume
    const masterVolume = new Tone.Volume(Tone.gainToDb(project.mixer.masterVolume));
    masterVolume.toDestination();

    // Now set up instruments and connect directly to master
    for (const channel of channels) {
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

      // Connect instrument directly to master volume
      instrument.connect(masterVolume);

      instruments.set(channel.id, instrument);
    }

    return instruments;
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

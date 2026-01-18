// ============================================
// Pulse Studio - Audio Engine (Tone.js Wrapper)
// ============================================

import type {
  Project,
  Pattern,
  Channel as ChannelType,
  Clip,
  MixerTrack,
  InsertEffect,
  Send,
  UUID,
} from '@/domain/types';
import { ticksToSeconds, midiNoteToFrequency } from '@/domain/operations';
import { getTone, initializeToneContext, getTransport, getToneContext } from './ToneProvider';
import { audioRecorder } from './AudioRecorder';

// ============================================
// Types
// ============================================

interface InstrumentNode {
  type: 'synth' | 'sampler';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel: any; // This is now a Panner node
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gain: any; // Gain node for volume control
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: any; // Store filter reference for real-time updates
  volume: number; // Track volume for mute/unmute
  muted: boolean; // Track mute state
}

interface MixerTrackNode {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel: any; // This is now a Panner node
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gain: any; // Gain node for volume control
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meter: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inserts: Map<UUID, any>;
  volume: number; // Track volume for mute/unmute
  muted: boolean; // Track mute state
}

interface ScheduledEvent {
  id: number;
  dispose: () => void;
}

// ============================================
// Audio Engine Class
// ============================================

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private isInitialized = false;
  private instruments: Map<UUID, InstrumentNode> = new Map();
  private mixerTracks: Map<UUID, MixerTrackNode> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private masterChannel: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private masterMeter: any = null;
  private scheduledEvents: ScheduledEvent[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private metronome: any = null;
  private metronomeEnabled = false;
  private currentProject: Project | null = null;
  // Cache for preloaded audio buffers (URL -> ToneAudioBuffer)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private audioBufferCache: Map<string, any> = new Map();
  private positionCallback: ((position: number) => void) | null = null;
  private positionInterval: ReturnType<typeof setInterval> | null = null;
  private currentLoopIteration = 0; // Track how many times we've looped
  private loopCountReached = false; // Flag to stop checking loop boundaries after count is reached

  private constructor() {
    // Private constructor for singleton
  }

  // ==========================================
  // Singleton Instance
  // ==========================================

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  // ==========================================
  // Initialization
  // ==========================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Client-side only
    if (typeof window === 'undefined') {
      throw new Error('AudioEngine can only be initialized in the browser');
    }

    console.log('[AudioEngine] Initializing...');

    // Get Tone.js from the provider
    const Tone = getTone();

    // Start Tone.js audio context
    try {
      await initializeToneContext();
      const ctx = getToneContext();
      console.log('[AudioEngine] Audio context started, state:', ctx.state);
    } catch (contextErr) {
      console.warn('[AudioEngine] Error starting audio context:', contextErr);
    }

    // Create master channel
    console.log('[AudioEngine] Creating master channel...');
    this.masterChannel = new Tone.Gain(1).toDestination();
    this.masterMeter = new Tone.Meter();
    this.masterChannel.connect(this.masterMeter);
    console.log('[AudioEngine] Master channel created');

    // Create metronome
    console.log('[AudioEngine] Creating metronome...');
    this.metronome = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination();
    this.metronome.volume.value = -10;
    console.log('[AudioEngine] Metronome created');

    // Set up transport
    const transport = getTransport();
    if (transport) {
      transport.PPQ = 96;
      console.log('[AudioEngine] Transport configured');
    } else {
      console.warn('[AudioEngine] Transport not available');
    }

    this.isInitialized = true;
    console.log('[AudioEngine] Initialized successfully');
  }

  // ==========================================
  // Project Setup
  // ==========================================

  async loadProject(project: Project): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('[AudioEngine] loadProject called - clips:', project.playlist.clips.length, 'assets:', project.assets.length);

    // Clear existing setup
    this.clearProject();

    this.currentProject = project;

    // Set BPM
    this.setBpm(project.bpm);

    // Set up mixer tracks
    for (const mixerTrack of project.mixer.tracks) {
      this.setupMixerTrack(mixerTrack);
    }

    // Set up sends
    for (const send of project.mixer.sends) {
      this.setupSend(send);
    }

    // Set up instruments
    for (const channel of project.channels) {
      await this.setupInstrument(channel);
    }
  }

  private clearProject(): void {
    // Stop playback
    this.stop();

    // Clear scheduled events
    this.clearScheduledEvents();

    // Dispose instruments
    for (const [, instrument] of Array.from(this.instruments.entries())) {
      instrument.node.dispose();
      instrument.channel.dispose();
    }
    this.instruments.clear();

    // Dispose mixer tracks (except master)
    for (const [, track] of Array.from(this.mixerTracks.entries())) {
      track.channel.dispose();
      track.meter.dispose();
      for (const [, effect] of Array.from(track.inserts.entries())) {
        effect.dispose();
      }
    }
    this.mixerTracks.clear();

    this.currentProject = null;
  }

  // ==========================================
  // Mixer Setup
  // ==========================================

  private setupMixerTrack(mixerTrack: MixerTrack): void {
    const Tone = getTone();
    if (!Tone) return;

    const panner = new Tone.Panner(mixerTrack.pan);
    const gain = new Tone.Gain(mixerTrack.volume);
    gain.gain.value = mixerTrack.mute ? 0 : mixerTrack.volume;
    panner.connect(gain);
    const channel = panner;

    const meter = new Tone.Meter();
    gain.connect(meter);

    // For master track, connect to destination
    if (mixerTrack.index === 0) {
      gain.toDestination();
    } else {
      // Connect to master
      if (this.masterChannel) {
        gain.connect(this.masterChannel);
      }
    }

    // Set up inserts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inserts = new Map<UUID, any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastNode: any = channel;

    for (const insert of mixerTrack.inserts) {
      if (!insert.enabled) continue;

      const effectNode = this.createEffectNode(insert);
      if (effectNode) {
        lastNode.connect(effectNode);
        inserts.set(insert.id, effectNode);
        lastNode = effectNode;
      }
    }

    this.mixerTracks.set(mixerTrack.id, {
      channel,
      gain,
      meter,
      inserts,
      volume: mixerTrack.volume,
      muted: mixerTrack.mute
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createEffectNode(insert: InsertEffect): any | null {
    const Tone = getTone();
    if (!Tone) return null;

    switch (insert.type) {
      case 'eq': {
        const params = insert.params as {
          lowGain: number;
          midGain: number;
          highGain: number;
          lowFreq: number;
          highFreq: number;
        };
        const eq = new Tone.EQ3({
          low: params.lowGain,
          mid: params.midGain,
          high: params.highGain,
          lowFrequency: params.lowFreq,
          highFrequency: params.highFreq,
        });
        return eq;
      }
      case 'compressor': {
        const params = insert.params as {
          threshold: number;
          ratio: number;
          attack: number;
          release: number;
        };
        const comp = new Tone.Compressor({
          threshold: params.threshold,
          ratio: params.ratio,
          attack: params.attack,
          release: params.release,
        });
        return comp;
      }
      case 'reverb': {
        const params = insert.params as {
          decay: number;
          preDelay: number;
          wet: number;
        };
        const reverb = new Tone.Reverb({
          decay: params.decay,
          preDelay: params.preDelay,
          wet: params.wet,
        });
        return reverb;
      }
      case 'delay': {
        const params = insert.params as {
          time: number;
          feedback: number;
          wet: number;
        };
        const delay = new Tone.FeedbackDelay({
          delayTime: params.time,
          feedback: params.feedback,
          wet: params.wet,
        });
        return delay;
      }
      default:
        return null;
    }
  }

  private setupSend(send: Send): void {
    const Tone = getTone();
    if (!Tone) return;

    const fromTrack = this.mixerTracks.get(send.fromTrackId);
    const toTrack = this.mixerTracks.get(send.toTrackId);

    if (fromTrack && toTrack) {
      // Create a gain node for the send
      const sendGain = new Tone.Gain(send.gain);
      fromTrack.channel.connect(sendGain);
      sendGain.connect(toTrack.channel);
    }
  }

  // ==========================================
  // Effect Parameter Updates
  // ==========================================

  updateEffectParams(
    trackId: UUID,
    effectId: UUID,
    params: Record<string, number>
  ): void {
    const Tone = getTone();
    if (!Tone) return;

    const trackNode = this.mixerTracks.get(trackId);
    if (!trackNode) return;

    const effectNode = trackNode.inserts.get(effectId);
    if (!effectNode) return;

    // Update parameters based on effect type
    for (const [key, value] of Object.entries(params)) {
      try {
        switch (key) {
          // EQ parameters
          case 'lowGain':
            if (effectNode.low) effectNode.low.value = value;
            break;
          case 'midGain':
            if (effectNode.mid) effectNode.mid.value = value;
            break;
          case 'highGain':
            if (effectNode.high) effectNode.high.value = value;
            break;
          case 'lowFreq':
            if (effectNode.lowFrequency) effectNode.lowFrequency.value = value;
            break;
          case 'highFreq':
            if (effectNode.highFrequency) effectNode.highFrequency.value = value;
            break;
          // Compressor parameters
          case 'threshold':
            if (effectNode.threshold) effectNode.threshold.value = value;
            break;
          case 'ratio':
            if (effectNode.ratio) effectNode.ratio.value = value;
            break;
          case 'attack':
            if (effectNode.attack) effectNode.attack.value = value;
            break;
          case 'release':
            if (effectNode.release) effectNode.release.value = value;
            break;
          case 'makeupGain':
            // Compressor doesn't have direct makeup gain, handled separately
            break;
          // Reverb parameters
          case 'decay':
            if (effectNode.decay !== undefined) {
              effectNode.decay = value;
              // Reverb needs regeneration for decay changes
              if (effectNode.generate) {
                effectNode.generate();
              }
            }
            break;
          case 'preDelay':
            if (effectNode.preDelay !== undefined) effectNode.preDelay = value;
            break;
          case 'wet':
            if (effectNode.wet) effectNode.wet.value = value;
            break;
          // Delay parameters
          case 'time':
            if (effectNode.delayTime) effectNode.delayTime.value = value;
            break;
          case 'feedback':
            if (effectNode.feedback) effectNode.feedback.value = value;
            break;
        }
      } catch (error) {
        console.error(`Error updating effect parameter ${key}:`, error);
      }
    }
  }

  // ==========================================
  // Instrument Setup
  // ==========================================

  private async setupInstrument(channel: ChannelType): Promise<void> {
    const Tone = getTone();
    if (!Tone) return;

    const mixerTrack = this.mixerTracks.get(channel.mixerTrackId);
    const output = mixerTrack?.channel || this.masterChannel;

    if (!output) return;

    // Create channel for routing
    const panner = new Tone.Panner(channel.pan);
    const gain = new Tone.Gain(channel.volume);
    gain.gain.value = channel.mute ? 0 : channel.volume;
    panner.connect(gain);
    gain.connect(output);
    const instrumentChannel = panner;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let instrumentNode: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filter: any | undefined;

    if (channel.type === 'synth' && channel.synthSettings) {
      const settings = channel.synthSettings;

      // Create filter first
      filter = new Tone.Filter({
        frequency: settings.filterCutoff,
        Q: settings.filterResonance,
        type: 'lowpass',
      });

      // Create synth and route through filter
      instrumentNode = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: settings.oscillatorType },
        envelope: {
          attack: settings.attack,
          decay: settings.decay,
          sustain: settings.sustain,
          release: settings.release,
        },
      });

      // Connect: synth -> filter -> channel -> output
      instrumentNode.connect(filter);
      filter.connect(instrumentChannel);
    } else {
      // Sampler - use MembraneSynth as fallback
      const settings = channel.samplerSettings;
      if (settings?.sampleUrl) {
        instrumentNode = new Tone.Sampler({
          urls: { C4: settings.sampleUrl },
          attack: settings.attack,
          release: settings.release,
        }).connect(instrumentChannel);
      } else {
        // Default kick-like sound if no sample
        instrumentNode = new Tone.MembraneSynth().connect(instrumentChannel);
      }
    }

    this.instruments.set(channel.id, {
      type: channel.type,
      node: instrumentNode,
      channel: instrumentChannel,
      gain: gain,
      filter: filter, // Store filter reference
      volume: channel.volume,
      muted: channel.mute
    });
  }

  // ==========================================
  // Transport Controls
  // ==========================================

  private getTransport() {
    return getTransport();
  }

  setBpm(bpm: number): void {
    const transport = this.getTransport();
    if (transport) {
      transport.bpm.value = bpm;
    }
  }

  getBpm(): number {
    const transport = this.getTransport();
    return transport?.bpm?.value ?? 120;
  }

  setMasterVolume(volume: number): void {
    if (this.masterChannel && this.masterChannel.gain) {
      // Clamp volume between 0 and 1.5 (150%)
      const clampedVolume = Math.max(0, Math.min(1.5, volume));
      this.masterChannel.gain.value = clampedVolume;
      console.log(`[AudioEngine] Master volume set to ${clampedVolume}`);
    }
  }

  async play(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const transport = this.getTransport();
    if (!transport) return;

    // Preload audio clips before scheduling
    await this.preloadAudioClips();

    // Schedule all content
    this.scheduleContent();

    // Start position tracking
    this.startPositionTracking();

    // Start transport
    transport.start();
  }

  /**
   * Preloads all audio buffers for audio clips in the current project.
   * This ensures buffers are ready before playback starts.
   */
  private async preloadAudioClips(): Promise<void> {
    if (!this.currentProject) return;

    const Tone = getTone();
    const audioClips = this.currentProject.playlist.clips.filter(
      (clip) => clip.type === 'audio' && !clip.mute
    );

    console.log('[AudioEngine] Audio clips to preload:', audioClips.length);

    const loadPromises: Promise<void>[] = [];

    for (const clip of audioClips) {
      if (clip.type !== 'audio') continue;

      const asset = this.currentProject.assets.find((a) => a.id === clip.assetId);
      if (!asset?.storageUrl) {
        console.warn('[AudioEngine] Preload: No asset found for clip:', clip.assetId);
        continue;
      }

      // Skip if already cached
      if (this.audioBufferCache.has(asset.storageUrl)) {
        console.log('[AudioEngine] Preload: Already cached:', asset.name);
        continue;
      }

      console.log('[AudioEngine] Preload: Loading', asset.name, 'from', asset.storageUrl);

      const loadPromise = new Promise<void>((resolve) => {
        try {
          const buffer = new Tone.ToneAudioBuffer(
            asset.storageUrl,
            () => {
              this.audioBufferCache.set(asset.storageUrl, buffer);
              console.log('[AudioEngine] Preloaded buffer:', asset.name);
              resolve();
            },
            (err: Error) => {
              console.error('[AudioEngine] Failed to preload:', asset.name, err);
              resolve(); // Don't block on failed loads
            }
          );
        } catch (err) {
          console.error('[AudioEngine] Error creating buffer:', asset.name, err);
          resolve();
        }
      });

      loadPromises.push(loadPromise);
    }

    if (loadPromises.length > 0) {
      console.log(`[AudioEngine] Preloading ${loadPromises.length} audio buffers...`);
      await Promise.all(loadPromises);
      console.log('[AudioEngine] All audio buffers preloaded');
    }
  }

  stop(): void {
    const transport = this.getTransport();
    if (!transport) return;

    transport.stop();
    transport.position = 0;
    this.clearScheduledEvents();
    this.stopPositionTracking();
  }

  pause(): void {
    const transport = this.getTransport();
    if (!transport) return;

    transport.pause();
    this.stopPositionTracking();
  }

  seek(ticks: number): void {
    const transport = this.getTransport();
    if (!transport) return;

    const seconds = ticksToSeconds(ticks, this.getBpm(), 96);
    transport.seconds = seconds;
  }

  getPosition(): number {
    const transport = this.getTransport();
    if (!transport) return 0;

    // Return position in ticks
    const seconds = transport.seconds;
    const bpm = this.getBpm();
    const ppq = 96;
    return Math.round((seconds * bpm * ppq) / 60);
  }

  isPlaying(): boolean {
    const transport = this.getTransport();
    return transport?.state === 'started';
  }

  // ==========================================
  // Position Tracking
  // ==========================================

  onPositionChange(callback: (position: number) => void): void {
    this.positionCallback = callback;
  }

  private startPositionTracking(): void {
    if (this.positionInterval) return;

    // Reset loop counters when starting
    this.currentLoopIteration = 0;
    this.loopCountReached = false;

    this.positionInterval = setInterval(() => {
      // Check loop boundaries
      this.checkLoopBoundaries();

      if (this.positionCallback) {
        this.positionCallback(this.getPosition());
      }
    }, 50); // Update ~20 times per second
  }

  private checkLoopBoundaries(): void {
    if (!this.currentProject || !this.isPlaying()) return;

    const { loopStart, loopEnd, loopEnabled, loopCount } = this.currentProject.playlist;

    // Skip loop checking if we've already finished looping
    if (this.loopCountReached) return;

    if (!loopEnabled) return;

    const currentPosition = this.getPosition();

    // If we've passed the loop end
    if (currentPosition >= loopEnd) {
      this.currentLoopIteration++;

      // Check if we've reached the loop count (loopCount = 0 means infinite)
      if (loopCount > 0 && this.currentLoopIteration >= loopCount) {
        // Mark that we've finished looping - playback will continue naturally
        this.loopCountReached = true;
        return;
      }

      // Loop back to start
      this.seek(loopStart);
    }
  }

  private stopPositionTracking(): void {
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
  }

  // ==========================================
  // Content Scheduling
  // ==========================================

  private scheduleContent(): void {
    if (!this.currentProject) return;

    this.clearScheduledEvents();

    const { playlist, patterns, channels, assets } = this.currentProject;
    const bpm = this.currentProject.bpm;
    const ppq = this.currentProject.ppq;

    console.log('[AudioEngine] scheduleContent - clips:', playlist.clips.length, 'assets:', assets.length);

    // Check if any tracks are soloed
    const hasSoloedTracks = playlist.tracks.some(t => t.solo);

    // Schedule clips
    for (const clip of playlist.clips) {
      if (clip.mute) continue;

      // Get the track for this clip
      const track = playlist.tracks.find(t => t.index === clip.trackIndex);
      if (!track) continue;

      // Skip if track is muted
      if (track.mute) continue;

      // If any tracks are soloed, only play clips on soloed tracks
      if (hasSoloedTracks && !track.solo) continue;

      if (clip.type === 'pattern') {
        const pattern = patterns.find((p) => p.id === clip.patternId);
        if (pattern) {
          this.schedulePattern(pattern, clip, channels, bpm, ppq);
        }
      } else if (clip.type === 'audio') {
        console.log('[AudioEngine] Scheduling audio clip:', clip.assetId);
        this.scheduleAudioClip(clip, bpm, ppq);
      }
    }

    // Schedule metronome if enabled
    if (this.metronomeEnabled) {
      this.scheduleMetronome();
    }
  }

  private schedulePattern(
    pattern: Pattern,
    clip: Clip,
    channels: ChannelType[],
    bpm: number,
    ppq: number
  ): void {
    const transport = this.getTransport();
    if (!transport) return;

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

      const instrument = this.instruments.get(channel.id);
      if (!instrument) continue;

      const stepTicks = (stepEvent.step / pattern.stepsPerBeat) * ppq;
      const stepTime = ticksToSeconds(stepTicks, bpm, ppq);

      // Calculate how many times the pattern repeats
      const repeats = Math.ceil(clipDuration / patternDuration);

      for (let i = 0; i < repeats; i++) {
        const time = clipStartTime + stepTime + i * patternDuration;
        if (time >= clipStartTime + clipDuration) break;

        const noteFreq = channel.type === 'sampler' ? 60 : 36; // C4 or C2
        const velocity = stepEvent.velocity / 127;

        const eventId = transport.schedule((scheduledTime: number) => {
          if (instrument.node.triggerAttackRelease) {
            instrument.node.triggerAttackRelease(
              midiNoteToFrequency(noteFreq),
              '16n',
              scheduledTime,
              velocity
            );
          }
        }, time);

        this.scheduledEvents.push({
          id: eventId,
          dispose: () => transport.clear(eventId),
        });
      }
    }

    // Schedule piano roll notes
    for (const note of pattern.notes) {
      // Find a synth channel to use for melodic notes (prefer synth over sampler for piano roll)
      let channel = channels.find((c) => !c.mute && c.type === 'synth' && this.instruments.has(c.id));
      if (!channel) {
        // Fallback to any non-muted channel with an instrument
        channel = channels.find((c) => !c.mute && this.instruments.has(c.id));
      }
      if (!channel) {
        // Last resort: any channel with an instrument
        channel = channels.find((c) => this.instruments.has(c.id));
      }
      if (!channel) continue;

      const instrument = this.instruments.get(channel.id);
      if (!instrument) continue;

      const noteStartTicks = note.startTick;
      const noteStartTime = ticksToSeconds(noteStartTicks, bpm, ppq);
      const noteDuration = ticksToSeconds(note.durationTick, bpm, ppq);

      // Calculate repeats
      const repeats = Math.ceil(clipDuration / patternDuration);

      for (let i = 0; i < repeats; i++) {
        const time = clipStartTime + noteStartTime + i * patternDuration;
        if (time >= clipStartTime + clipDuration) break;

        const velocity = note.velocity / 127;

        const eventId = transport.schedule((scheduledTime: number) => {
          if (instrument.node.triggerAttackRelease) {
            instrument.node.triggerAttackRelease(
              midiNoteToFrequency(note.pitch),
              noteDuration,
              scheduledTime,
              velocity
            );
          }
        }, time);

        this.scheduledEvents.push({
          id: eventId,
          dispose: () => transport.clear(eventId),
        });
      }
    }
  }

  private scheduleAudioClip(clip: Clip, bpm: number, ppq: number): void {
    const Tone = getTone();
    const transport = this.getTransport();
    if (!Tone || !transport || !this.currentProject) return;
    if (clip.type !== 'audio') return;

    const asset = this.currentProject.assets.find((a) => a.id === clip.assetId);
    if (!asset?.storageUrl) {
      console.warn('[AudioEngine] Audio clip missing asset or storageUrl:', clip.assetId,
        'Available assets:', this.currentProject.assets.map(a => ({ id: a.id, url: a.storageUrl })));
      return;
    }

    const clipStartTime = ticksToSeconds(clip.startTick, bpm, ppq);
    const clipDuration = ticksToSeconds(clip.durationTick, bpm, ppq);
    const clipOffset = clip.offset ?? 0;

    // Get the actual sample duration from the asset
    const sampleDuration = asset.duration || 1; // fallback to 1 second if unknown

    // Calculate the effective sample duration after offset
    const effectiveSampleDuration = Math.max(0.01, sampleDuration - clipOffset);

    console.log('[AudioEngine] Audio clip scheduled:', {
      asset: asset.name,
      url: asset.storageUrl,
      startTick: clip.startTick,
      startTime: clipStartTime,
      clipDuration: clipDuration,
      sampleDuration: sampleDuration,
      effectiveSampleDuration: effectiveSampleDuration,
      offset: clipOffset,
    });

    // Use cached buffer if available, otherwise create player with URL
    const cachedBuffer = this.audioBufferCache.get(asset.storageUrl);
    console.log('[AudioEngine] Using cached buffer:', !!cachedBuffer, 'for:', asset.storageUrl);

    // Calculate how many times the sample needs to repeat to fill the clip duration
    const repeatCount = Math.ceil(clipDuration / effectiveSampleDuration);

    console.log('[AudioEngine] Repeat count:', repeatCount);

    // Schedule each repetition
    for (let i = 0; i < repeatCount; i++) {
      const repeatStartTime = clipStartTime + (i * effectiveSampleDuration);
      const remainingClipDuration = clipDuration - (i * effectiveSampleDuration);

      // Don't schedule if we've gone past the clip end
      if (remainingClipDuration <= 0) break;

      // For the last repetition, only play the remaining portion
      const playDuration = Math.min(effectiveSampleDuration, remainingClipDuration);

      // Create a player for this repetition
      let player;
      if (cachedBuffer) {
        player = new Tone.Player({
          url: cachedBuffer,
          loop: false,
          autostart: false,
        }).connect(this.masterChannel);
      } else {
        player = new Tone.Player({
          url: asset.storageUrl,
          loop: false,
          autostart: false,
        }).connect(this.masterChannel);
      }

      let hasStarted = false;
      let disposed = false;

      const eventId = transport.schedule((scheduledTime: number) => {
        if (disposed) return;

        // Check if buffer is loaded before attempting to play
        if (!player.loaded) {
          console.warn('[AudioEngine] Buffer not loaded yet for:', asset.name, 'repetition:', i);
          return;
        }

        console.log('[AudioEngine] Playing audio clip repetition', i, 'at', scheduledTime, 'offset:', clipOffset, 'duration:', playDuration);

        try {
          hasStarted = true;
          player.start(scheduledTime, clipOffset, playDuration);
        } catch (err) {
          console.error('[AudioEngine] Failed to start audio clip player:', err);
        }
      }, repeatStartTime);

      this.scheduledEvents.push({
        id: eventId,
        dispose: () => {
          disposed = true;
          try {
            transport.clear(eventId);
          } catch (e) {
            // Ignore errors clearing already-cleared events
          }
          try {
            // Only stop if it was started; dispose is safe either way
            if (hasStarted && player.state === 'started') {
              player.stop();
            }
            player.dispose();
          } catch (e) {
            // Ignore disposal errors - player may already be disposed or in invalid state
          }
        },
      });
    }
  }

  private scheduleMetronome(): void {
    if (!this.metronome || !this.currentProject) return;

    const transport = this.getTransport();
    if (!transport) return;

    const bpm = this.currentProject.bpm;
    const ppq = this.currentProject.ppq;
    const totalBars = 32; // Schedule 32 bars ahead
    const beatsPerBar = this.currentProject.timeSignature.numerator;

    for (let bar = 0; bar < totalBars; bar++) {
      for (let beat = 0; beat < beatsPerBar; beat++) {
        const ticks = (bar * beatsPerBar + beat) * ppq;
        const time = ticksToSeconds(ticks, bpm, ppq);
        const isDownbeat = beat === 0;

        const eventId = transport.schedule((scheduledTime: number) => {
          if (this.metronome) {
            const freq = isDownbeat ? 1000 : 800;
            this.metronome.triggerAttackRelease(freq, '32n', scheduledTime);
          }
        }, time);

        this.scheduledEvents.push({
          id: eventId,
          dispose: () => transport.clear(eventId),
        });
      }
    }
  }

  private clearScheduledEvents(): void {
    for (const event of this.scheduledEvents) {
      event.dispose();
    }
    this.scheduledEvents = [];
  }

  // ==========================================
  // Metronome
  // ==========================================

  setMetronomeEnabled(enabled: boolean): void {
    this.metronomeEnabled = enabled;
  }

  // ==========================================
  // Recording
  // ==========================================

  /**
   * Get available audio input devices
   */
  async getInputDevices() {
    return await audioRecorder.getInputDevices();
  }

  /**
   * Start recording audio with optional count-in
   * @param countInBars - Number of bars to count in before recording (0 for immediate)
   * @param deviceId - Optional device ID to record from
   */
  async startRecording(countInBars: number = 0, deviceId?: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Initialize recorder with selected device
    await audioRecorder.initialize(deviceId);

    // If count-in requested, enable metronome temporarily
    if (countInBars > 0 && this.currentProject) {
      const wasMetronomeEnabled = this.metronomeEnabled;
      this.setMetronomeEnabled(true);

      // Calculate count-in duration
      const beatsPerBar = this.currentProject.timeSignature.numerator;
      const bpm = this.currentProject.bpm;
      const countInBeats = countInBars * beatsPerBar;
      const countInSeconds = (countInBeats / bpm) * 60;

      console.log(`[AudioEngine] Count-in: ${countInBars} bars (${countInSeconds.toFixed(2)}s)`);

      // Start playback for count-in if not already playing
      const wasPlaying = this.isPlaying();
      if (!wasPlaying) {
        await this.play();
      }

      // Wait for count-in
      await new Promise(resolve => setTimeout(resolve, countInSeconds * 1000));

      // Restore metronome state
      if (!wasMetronomeEnabled) {
        this.setMetronomeEnabled(false);
      }
    }

    // Start recording
    await audioRecorder.start();
    console.log('[AudioEngine] Recording started');
  }

  /**
   * Stop recording and return the recorded audio
   */
  async stopRecording() {
    const result = await audioRecorder.stop();
    console.log('[AudioEngine] Recording stopped, duration:', result.duration.toFixed(2), 's');
    return result;
  }

  /**
   * Cancel recording without saving
   */
  cancelRecording(): void {
    audioRecorder.cancel();
    console.log('[AudioEngine] Recording cancelled');
  }

  /**
   * Get recording level (0-1) for UI metering
   */
  getRecordingLevel(): number {
    // Level is updated via callback, return 0 if not recording
    return 0;
  }

  /**
   * Set callback for recording level changes
   */
  onRecordingLevelChange(callback: (level: number) => void): void {
    audioRecorder.setOnLevelChange(callback);
  }

  // ==========================================
  // Preview/Trigger Notes
  // ==========================================

  triggerNote(channelId: UUID, pitch: number, velocity: number = 100): void {
    const instrument = this.instruments.get(channelId);
    if (!instrument) return;

    const vel = velocity / 127;

    if (instrument.node.triggerAttackRelease) {
      instrument.node.triggerAttackRelease(midiNoteToFrequency(pitch), '8n', undefined, vel);
    }
  }

  // ==========================================
  // Metering
  // ==========================================

  getMasterLevel(): number {
    if (!this.masterMeter) return -60;
    const value = this.masterMeter.getValue();
    return typeof value === 'number' ? value : -60;
  }

  getTrackLevel(trackId: UUID): number {
    const track = this.mixerTracks.get(trackId);
    if (!track) return -60;
    const value = track.meter.getValue();
    return typeof value === 'number' ? value : -60;
  }

  // ==========================================
  // Mixer Updates
  // ==========================================

  setMixerTrackVolume(trackId: UUID, volume: number): void {
    const track = this.mixerTracks.get(trackId);
    if (track && track.gain) {
      track.volume = volume;
      if (!track.muted) {
        track.gain.gain.value = volume;
      }
    }
  }

  setMixerTrackPan(trackId: UUID, pan: number): void {
    const track = this.mixerTracks.get(trackId);
    if (track && track.channel) {
      track.channel.pan.value = pan;
    }
  }

  setMixerTrackMute(trackId: UUID, mute: boolean): void {
    const track = this.mixerTracks.get(trackId);
    if (track && track.gain) {
      track.muted = mute;
      track.gain.gain.value = mute ? 0 : track.volume;
    }
  }

  setChannelVolume(channelId: UUID, volume: number): void {
    const instrument = this.instruments.get(channelId);
    if (instrument && instrument.gain) {
      instrument.volume = volume;
      if (!instrument.muted) {
        instrument.gain.gain.value = volume;
      }
    }
  }

  setChannelPan(channelId: UUID, pan: number): void {
    const instrument = this.instruments.get(channelId);
    if (instrument && instrument.channel) {
      instrument.channel.pan.value = pan;
    }
  }

  setChannelMute(channelId: UUID, mute: boolean): void {
    const instrument = this.instruments.get(channelId);
    if (instrument && instrument.gain) {
      instrument.muted = mute;
      instrument.gain.gain.value = mute ? 0 : instrument.volume;
    }
  }

  updateSynthOscillator(channelId: UUID, type: string): void {
    const instrument = this.instruments.get(channelId);
    if (instrument && instrument.type === 'synth') {
      console.log(`[AudioEngine] Updating oscillator type to ${type}`);
      instrument.node.set({ oscillator: { type } });
    }
  }

  updateSynthEnvelope(channelId: UUID, envelope: { attack: number; decay: number; sustain: number; release: number }): void {
    const instrument = this.instruments.get(channelId);
    if (instrument && instrument.type === 'synth') {
      console.log(`[AudioEngine] Updating envelope`, envelope);
      instrument.node.set({ envelope });
    }
  }

  updateSynthFilter(channelId: UUID, cutoff: number, resonance: number): void {
    const instrument = this.instruments.get(channelId);
    if (instrument && instrument.type === 'synth' && instrument.filter) {
      console.log(`[AudioEngine] Updating filter: cutoff=${cutoff}Hz, Q=${resonance}`);
      instrument.filter.frequency.value = cutoff;
      instrument.filter.Q.value = resonance;
    }
  }

  updateInsertEffect(trackId: UUID, effectId: UUID, params: Record<string, unknown>): void {
    const track = this.mixerTracks.get(trackId);
    if (!track) return;

    const effectNode = track.inserts.get(effectId);
    if (!effectNode) return;

    console.log(`[AudioEngine] Updating insert effect ${effectId}`, params);

    // Update effect parameters based on type
    try {
      // EQ3
      if ('low' in effectNode || 'lowGain' in params) {
        if (params.lowGain !== undefined) effectNode.low.value = params.lowGain;
        if (params.midGain !== undefined) effectNode.mid.value = params.midGain;
        if (params.highGain !== undefined) effectNode.high.value = params.highGain;
        if (params.lowFreq !== undefined) effectNode.lowFrequency.value = params.lowFreq;
        if (params.highFreq !== undefined) effectNode.highFrequency.value = params.highFreq;
      }
      // Compressor
      else if ('threshold' in effectNode || 'threshold' in params) {
        if (params.threshold !== undefined) effectNode.threshold.value = params.threshold;
        if (params.ratio !== undefined) effectNode.ratio.value = params.ratio;
        if (params.attack !== undefined) effectNode.attack.value = params.attack;
        if (params.release !== undefined) effectNode.release.value = params.release;
        // Note: makeupGain would need a separate gain node
      }
      // Reverb
      else if ('decay' in effectNode || 'decay' in params) {
        if (params.decay !== undefined) effectNode.decay = params.decay;
        if (params.preDelay !== undefined) effectNode.preDelay = params.preDelay;
        if (params.wet !== undefined) effectNode.wet.value = params.wet;
      }
      // Delay (FeedbackDelay)
      else if ('delayTime' in effectNode || 'time' in params) {
        if (params.time !== undefined) effectNode.delayTime.value = params.time;
        if (params.feedback !== undefined) effectNode.feedback.value = params.feedback;
        if (params.wet !== undefined) effectNode.wet.value = params.wet;
      }
    } catch (err) {
      console.warn('[AudioEngine] Failed to update effect params:', err);
    }
  }

  // ==========================================
  // Playlist Track Mute/Solo
  // ==========================================

  refreshPlayback(): void {
    // Re-schedule content if currently playing
    if (this.isPlaying()) {
      this.scheduleContent();
    }
  }

  // ==========================================
  // Cleanup
  // ==========================================

  dispose(): void {
    this.clearProject();

    if (this.masterChannel) {
      this.masterChannel.dispose();
      this.masterChannel = null;
    }

    if (this.masterMeter) {
      this.masterMeter.dispose();
      this.masterMeter = null;
    }

    if (this.metronome) {
      this.metronome.dispose();
      this.metronome = null;
    }

    this.isInitialized = false;
    AudioEngine.instance = null;
  }
}

// Export singleton getter
export const getAudioEngine = () => AudioEngine.getInstance();

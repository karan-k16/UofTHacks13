// ============================================
// Pulse Studio - Audio Engine (Tone.js Wrapper)
// ============================================

import type {
  Project,
  Pattern,
  Channel as ChannelType,
  Clip,
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

interface ScheduledEvent {
  id: number;
  dispose: () => void;
}

// ============================================
// Audio Engine Class
// ============================================

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private _isInitialized = false;
  
  get isInitialized(): boolean {
    return this._isInitialized;
  }
  private instruments: Map<UUID, InstrumentNode> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private masterChannel: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private masterMeter: any = null;
  private scheduledEvents: ScheduledEvent[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private metronome: any = null;
  private metronomeEnabled = false;
  private metronomeScheduleId: number | null = null;
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
    if (this._isInitialized) return;

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

    this._isInitialized = true;
    console.log('[AudioEngine] Initialized successfully');
  }

  // ==========================================
  // Project Setup
  // ==========================================

  async loadProject(project: Project): Promise<void> {
    if (!this._isInitialized) {
      await this.initialize();
    }

    console.log('[AudioEngine] loadProject called - clips:', project.playlist.clips.length, 'assets:', project.assets.length);

    // Clear existing setup
    this.clearProject();

    this.currentProject = project;

    // Set BPM
    this.setBpm(project.bpm);

    // Set up instruments (they connect directly to master)
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

    this.currentProject = null;
  }

  // ==========================================
  // Master Setup (Effects are applied offline via Apply button)
  // ==========================================

  // ==========================================
  // Instrument Setup
  // ==========================================

  private async setupInstrument(channel: ChannelType): Promise<void> {
    const Tone = getTone();
    if (!Tone) return;

    // Route directly to master channel
    const output = this.masterChannel;
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
    if (!this._isInitialized) {
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
    this.clearMetronome();
    this.stopPositionTracking();
  }

  pause(): void {
    const transport = this.getTransport();
    if (!transport) return;

    transport.pause();
    this.clearScheduledEvents();
    this.clearMetronome();
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
        this.scheduleAudioClip(clip, track, bpm, ppq);
      }
    }

    // Schedule metronome if enabled
    if (this.metronomeEnabled) {
      this.startMetronome();
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

  private scheduleAudioClip(clip: Clip, playlistTrack: { index: number; mute: boolean; solo: boolean }, bpm: number, ppq: number): void {
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

    // Route audio directly to master channel
    const outputNode = this.masterChannel;
    if (!outputNode) {
      console.warn('[AudioEngine] No output node available for audio clip');
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
        }).connect(outputNode);
      } else {
        player = new Tone.Player({
          url: asset.storageUrl,
          loop: false,
          autostart: false,
        }).connect(outputNode);
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

  private startMetronome(): void {
    if (!this.metronome || !this.currentProject) return;

    const transport = this.getTransport();
    if (!transport) return;

    // Clear any existing metronome schedule
    this.clearMetronome();

    const beatsPerBar = this.currentProject.timeSignature.numerator;
    let beatCount = 0;

    // Schedule a repeating event that triggers every beat
    this.metronomeScheduleId = transport.scheduleRepeat((time: number) => {
      if (this.metronome && this.metronomeEnabled) {
        const isDownbeat = (beatCount % beatsPerBar) === 0;
        const freq = isDownbeat ? 1000 : 800;
        this.metronome.triggerAttackRelease(freq, '32n', time);
        beatCount++;
      }
    }, '4n', 0); // Repeat every quarter note, starting immediately
  }

  private clearMetronome(): void {
    const transport = this.getTransport();
    if (transport && this.metronomeScheduleId !== null) {
      transport.clear(this.metronomeScheduleId);
      this.metronomeScheduleId = null;
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

    // If playing, start or stop the metronome accordingly
    if (this.isPlaying()) {
      if (enabled) {
        this.startMetronome();
      } else {
        this.clearMetronome();
      }
    }
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
    if (!this._isInitialized) {
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

  // ==========================================
  // Channel Volume/Pan/Mute (kept for channel rack)
  // ==========================================

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

    this._isInitialized = false;
    AudioEngine.instance = null;
  }
}

// Export singleton getter
export const getAudioEngine = () => AudioEngine.getInstance();

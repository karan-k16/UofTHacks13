// ============================================
// Pulse Studio - Audio Recorder
// ============================================

import { getTone, getToneContext } from './ToneProvider';

// ============================================
// Types
// ============================================

export interface RecordingResult {
  blob: Blob;
  duration: number;
  sampleRate: number;
}

export type RecorderState = 'inactive' | 'recording' | 'paused';

export interface AudioInputDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

// ============================================
// Audio Recorder Class
// ============================================

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private state: RecorderState = 'inactive';
  private onStateChange: ((state: RecorderState) => void) | null = null;
  private onLevelChange: ((level: number) => void) | null = null;
  private analyser: AnalyserNode | null = null;
  private levelCheckInterval: ReturnType<typeof setInterval> | null = null;
  private currentDeviceId: string | null = null;

  // ==========================================
  // Input Device Management
  // ==========================================

  /**
   * Get list of available audio input devices
   */
  async getInputDevices(): Promise<AudioInputDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          groupId: device.groupId,
        }));
    } catch (error) {
      console.error('[AudioRecorder] Failed to enumerate devices:', error);
      return [];
    }
  }

  /**
   * Get the currently selected input device ID
   */
  getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  // ==========================================
  // Callbacks
  // ==========================================

  setOnStateChange(callback: (state: RecorderState) => void): void {
    this.onStateChange = callback;
  }

  setOnLevelChange(callback: (level: number) => void): void {
    this.onLevelChange = callback;
  }

  // ==========================================
  // State
  // ==========================================

  getState(): RecorderState {
    return this.state;
  }

  private setState(state: RecorderState): void {
    this.state = state;
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  // ==========================================
  // Recording Controls
  // ==========================================

  async initialize(deviceId?: string): Promise<void> {
    // Close existing stream if any
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Request microphone access
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId 
          ? {
              deviceId: { exact: deviceId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          : {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentDeviceId = deviceId || null;

      // Set up level monitoring using Tone's audio context
      const audioContext = getToneContext().rawContext as AudioContext;
      const source = audioContext.createMediaStreamSource(this.stream);
      this.analyser = audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      console.log('[AudioRecorder] Initialized with device:', deviceId || 'default');
    } catch (error) {
      console.error('[AudioRecorder] Failed to access microphone:', error);
      throw new Error('Microphone access denied');
    }
  }

  async start(): Promise<void> {
    if (!this.stream) {
      await this.initialize();
    }

    if (!this.stream) {
      throw new Error('No audio stream available');
    }

    this.audioChunks = [];
    this.startTime = Date.now();

    // Create MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
    this.setState('recording');

    // Start level monitoring
    this.startLevelMonitoring();
  }

  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      this.setState('paused');
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
      this.setState('recording');
    }
  }

  async stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.stopLevelMonitoring();

      this.mediaRecorder.onstop = async () => {
        const duration = (Date.now() - this.startTime) / 1000;
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });

        // Convert to WAV for better compatibility
        try {
          const wavBlob = await this.convertToWav(blob);
          this.setState('inactive');
          resolve({
            blob: wavBlob,
            duration,
            sampleRate: 48000,
          });
        } catch {
          // Fall back to webm
          this.setState('inactive');
          resolve({
            blob,
            duration,
            sampleRate: 48000,
          });
        }
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.audioChunks = [];
    this.stopLevelMonitoring();
    this.setState('inactive');
  }

  // ==========================================
  // Level Monitoring
  // ==========================================

  private startLevelMonitoring(): void {
    if (!this.analyser || this.levelCheckInterval) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.levelCheckInterval = setInterval(() => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate RMS level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] ?? 0) / 255;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      if (this.onLevelChange) {
        this.onLevelChange(rms);
      }
    }, 50);
  }

  private stopLevelMonitoring(): void {
    if (this.levelCheckInterval) {
      clearInterval(this.levelCheckInterval);
      this.levelCheckInterval = null;
    }
  }

  // ==========================================
  // Conversion
  // ==========================================

  private async convertToWav(webmBlob: Blob): Promise<Blob> {
    // Decode the webm audio
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: 48000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Convert to WAV
    const wavBlob = this.audioBufferToWav(audioBuffer);

    audioContext.close();
    return wavBlob;
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
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

    // Write audio data
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch]?.[i] ?? 0));
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

  // ==========================================
  // Cleanup
  // ==========================================

  dispose(): void {
    this.cancel();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.analyser = null;
    this.mediaRecorder = null;
  }
}

// Export singleton instance
export const audioRecorder = new AudioRecorder();

// ============================================
// Pulse Studio - MP3 Encoder (using lamejs)
// ============================================

// Note: lamejs doesn't have great TypeScript support, so we'll use dynamic import
// and type assertions

export interface Mp3EncoderProgress {
  phase: 'encoding' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface Mp3EncoderResult {
  blob: Blob;
  duration: number;
}

// ============================================
// MP3 Encoder
// ============================================

export class Mp3Encoder {
  private onProgress: ((progress: Mp3EncoderProgress) => void) | null = null;

  setProgressCallback(callback: (progress: Mp3EncoderProgress) => void): void {
    this.onProgress = callback;
  }

  private reportProgress(progress: Mp3EncoderProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  async encodeWavToMp3(wavBlob: Blob, bitrate: number = 192): Promise<Mp3EncoderResult> {
    this.reportProgress({
      phase: 'encoding',
      progress: 0,
      message: 'Loading WAV data...',
    });

    try {
      // Load lamejs dynamically
      const lamejs = await import('lamejs');

      // Read WAV file
      const arrayBuffer = await wavBlob.arrayBuffer();
      const wavData = this.parseWav(arrayBuffer);

      this.reportProgress({
        phase: 'encoding',
        progress: 10,
        message: 'Encoding MP3...',
      });

      // Create MP3 encoder
      const mp3encoder = new lamejs.Mp3Encoder(
        wavData.channels,
        wavData.sampleRate,
        bitrate
      );

      const mp3Data: Int8Array[] = [];
      const sampleBlockSize = 1152;

      // Convert to 16-bit samples
      const leftChannel = this.convertFloat32ToInt16(wavData.leftChannel);
      const rightChannel = wavData.rightChannel
        ? this.convertFloat32ToInt16(wavData.rightChannel)
        : leftChannel;

      // Encode in chunks
      const totalSamples = leftChannel.length;
      let processedSamples = 0;

      for (let i = 0; i < totalSamples; i += sampleBlockSize) {
        const leftChunk = leftChannel.subarray(i, i + sampleBlockSize);
        const rightChunk = rightChannel.subarray(i, i + sampleBlockSize);

        let mp3buf: Int8Array;
        if (wavData.channels === 2) {
          mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        } else {
          mp3buf = mp3encoder.encodeBuffer(leftChunk);
        }

        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }

        processedSamples += sampleBlockSize;
        const progress = 10 + Math.min(80, (processedSamples / totalSamples) * 80);

        // Report progress every 10%
        if (Math.floor(progress / 10) > Math.floor((progress - 8) / 10)) {
          this.reportProgress({
            phase: 'encoding',
            progress,
            message: `Encoding MP3... ${Math.round(progress)}%`,
          });
        }
      }

      // Flush remaining data
      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }

      this.reportProgress({
        phase: 'encoding',
        progress: 95,
        message: 'Finalizing MP3...',
      });

      // Combine all chunks into a single blob
      const blob = new Blob(mp3Data as BlobPart[], { type: 'audio/mp3' });

      this.reportProgress({
        phase: 'complete',
        progress: 100,
        message: 'MP3 encoding complete!',
      });

      return {
        blob,
        duration: wavData.duration,
      };
    } catch (error) {
      this.reportProgress({
        phase: 'error',
        progress: 0,
        message: `MP3 encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  }

  // ==========================================
  // WAV Parsing
  // ==========================================

  private parseWav(arrayBuffer: ArrayBuffer): {
    sampleRate: number;
    channels: number;
    duration: number;
    leftChannel: Float32Array;
    rightChannel: Float32Array | null;
  } {
    const view = new DataView(arrayBuffer);

    // Read WAV header
    const riff = this.readString(view, 0, 4);
    if (riff !== 'RIFF') {
      throw new Error('Invalid WAV file: missing RIFF header');
    }

    const wave = this.readString(view, 8, 4);
    if (wave !== 'WAVE') {
      throw new Error('Invalid WAV file: missing WAVE header');
    }

    // Find fmt chunk
    let offset = 12;
    let channels = 2;
    let sampleRate = 44100;
    let bitsPerSample = 16;

    while (offset < arrayBuffer.byteLength - 8) {
      const chunkId = this.readString(view, offset, 4);
      const chunkSize = view.getUint32(offset + 4, true);

      if (chunkId === 'fmt ') {
        channels = view.getUint16(offset + 10, true);
        sampleRate = view.getUint32(offset + 12, true);
        bitsPerSample = view.getUint16(offset + 22, true);
      }

      if (chunkId === 'data') {
        const dataOffset = offset + 8;
        const dataLength = chunkSize;
        const bytesPerSample = bitsPerSample / 8;
        const numSamples = dataLength / (channels * bytesPerSample);

        const leftChannel = new Float32Array(numSamples);
        const rightChannel = channels === 2 ? new Float32Array(numSamples) : null;

        for (let i = 0; i < numSamples; i++) {
          const sampleOffset = dataOffset + i * channels * bytesPerSample;

          if (bitsPerSample === 16) {
            leftChannel[i] = view.getInt16(sampleOffset, true) / 32768;
            if (rightChannel && channels === 2) {
              rightChannel[i] = view.getInt16(sampleOffset + 2, true) / 32768;
            }
          } else if (bitsPerSample === 32) {
            leftChannel[i] = view.getFloat32(sampleOffset, true);
            if (rightChannel && channels === 2) {
              rightChannel[i] = view.getFloat32(sampleOffset + 4, true);
            }
          }
        }

        const duration = numSamples / sampleRate;

        return {
          sampleRate,
          channels,
          duration,
          leftChannel,
          rightChannel,
        };
      }

      offset += 8 + chunkSize;
      if (chunkSize % 2 !== 0) offset++; // Padding byte
    }

    throw new Error('Invalid WAV file: missing data chunk');
  }

  private readString(view: DataView, offset: number, length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += String.fromCharCode(view.getUint8(offset + i));
    }
    return result;
  }

  private convertFloat32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i] ?? 0));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }
}

// Export singleton instance
export const mp3Encoder = new Mp3Encoder();


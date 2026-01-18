# Audio Library - Tone.js Integration

## Overview

This directory contains all audio-related code for Pulse Studio, including the audio engine, instruments, effects, recording, and offline rendering.

## Tone.js Strategy

**✅ UNIFIED APPROACH:** All audio code uses the `ToneProvider.ts` module to access Tone.js.

### How to Use Tone.js in This Codebase

**Always import from ToneProvider:**

```typescript
import { getTone, initializeToneContext } from './ToneProvider';

// In your code:
const Tone = getTone();
if (!Tone) {
  throw new Error('Tone.js not available');
}

// Use Tone normally:
const synth = new Tone.Synth();
```

### DO NOT:

- ❌ Use CDN script tags to load Tone.js
- ❌ Use dynamic imports like `await import('tone')`
- ❌ Access `window.Tone`
- ❌ Create multiple loading mechanisms

### Key Files

#### Core Audio
- **`ToneProvider.ts`** - Single source of truth for Tone.js access
- **`AudioEngine.ts`** - Main audio engine (playback, scheduling, mixer)
- **`OfflineRenderer.ts`** - Exports audio to WAV files
- **`AudioRecorder.ts`** - Records audio from microphone

#### Instruments
- **`SynthInstrument.ts`** - Software synthesizer
- **`SamplerInstrument.ts`** - Sample playback engine

#### Effects
- **`CompressorEffect.ts`** - Dynamic range compression
- **`DelayEffect.ts`** - Feedback delay
- **`EQEffect.ts`** - 3-band equalizer
- **`ReverbEffect.ts`** - Reverb effect

## Initialization Flow

1. User clicks "Start Creating" button in `app/page.tsx`
2. `AudioEngine.initialize()` is called
3. Tone.js context is started via `initializeToneContext()`
4. Master channel, metronome, and transport are set up
5. Demo project is loaded

## Audio Architecture

```
User Input → AudioEngine
              ↓
         Instruments (Synth/Sampler)
              ↓
         Channel Mixer
              ↓
         Insert Effects
              ↓
         Master Channel
              ↓
         Audio Output
```

## Performance Considerations

- Audio buffers are cached in `AudioEngine.audioBufferCache`
- Clips are preloaded before playback starts
- Position tracking runs at 50ms intervals
- Offline rendering uses separate Tone.Offline context

## Future Work (Person 1 Tasks)

### Phase 2 - Recording Pipeline
- Wire `AudioRecorder` to store state
- Add input device selection UI
- Implement count-in and metronome during recording
- Create audio clips from recorded data

### Phase 3 - Rendering Stability
- Profile and optimize long project rendering
- Add timeout handling for hung renders
- Ensure multichannel audio support

### Phase 4 - Performance
- Implement buffer cache eviction
- Optimize position tracking
- Lazy-load effects and instruments
- Consider Web Worker for offline rendering

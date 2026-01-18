# AI Context Injection Strategy

## Overview

This document explains how the AI assistant gains awareness of your specific project state, available samples, and DAW capabilities. Rather than using a vector database (which is overkill for structured data), we use **Dynamic Context Injection** with **Function Calling** semantics.

## The Problem We Solved

Previously, the AI had a static system prompt that didn't know:
- What samples exist in your library
- What patterns/tracks/channels exist in your current project
- What IDs to use when referencing existing items
- What synth presets are available

This caused the AI to hallucinate sample names, use non-existent IDs, and generate invalid commands.

## The Solution: Dynamic Context Injection

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ Sample       │    │ Project State    │    │ Context Builder  │  │
│  │ Library      │───▶│ (Zustand Store)  │───▶│ (Dynamic Prompt) │  │
│  │ (JSON)       │    │                  │    │                  │  │
│  └──────────────┘    └──────────────────┘    └────────┬─────────┘  │
│                                                        │            │
│                                                        ▼            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      ChatPanel.tsx                            │  │
│  │  - Builds context before each API call                        │  │
│  │  - Sends systemPrompt with request                            │  │
│  │  - Executes returned commands against store                   │  │
│  └───────────────────────────────────┬──────────────────────────┘  │
│                                       │                             │
└───────────────────────────────────────┼─────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (API Route)                           │
├─────────────────────────────────────────────────────────────────────┤
│  /api/chat                                                          │
│  - Receives request with text + model + systemPrompt                │
│  - Passes systemPrompt to Backboard SDK                             │
│  - Returns structured command JSON                                  │
└─────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Backboard.io / LLM                              │
├─────────────────────────────────────────────────────────────────────┤
│  - Receives dynamic system prompt with:                             │
│    • Current project state (patterns, channels, tracks, clips)      │
│    • Available samples (IDs, categories, names)                     │
│    • Available synth presets                                        │
│    • Exact command schemas                                          │
│    • Validation constraints                                         │
│  - Returns structured JSON command                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/ai/contextBuilder.ts` | Builds dynamic context from project + samples |
| `lib/ai/sampleResolver.ts` | Fuzzy matching for sample lookup |
| `lib/ai/backboard.ts` | Sends messages with dynamic system prompt |
| `app/api/chat/route.ts` | API endpoint accepting systemPrompt |
| `components/panels/ChatPanel.tsx` | Builds and sends context per request |
| `lib/ai/dawController.ts` | Executes commands against store |

## How It Works

### 1. Context Building (Client-side)

When the user sends a message, the ChatPanel:

```typescript
// Build dynamic context from current state
const project = useStore.getState().project;
const sampleLibrary = await loadSampleLibrary();
const dawContext = buildDAWContext(project, sampleLibrary);
const systemPrompt = generateSystemPrompt(dawContext);

// Send with request
fetch('/api/chat', {
  body: JSON.stringify({
    text: userMessage,
    model: selectedModel,
    conversationHistory: messages.slice(-5),
    systemPrompt, // Dynamic context!
  }),
});
```

### 2. System Prompt Structure

The generated system prompt includes:

```
## CURRENT PROJECT STATE
- BPM: 128
- Master Volume: 80%
- PPQ: 96

### Patterns (2 total):
  - "Kick Pattern" (id: abc123, 16 steps, 4 notes)
  - "Melody" (id: def456, 32 steps, 12 notes)

### Channels (2 total):
  - "Piano" (id: ch001, type: synth, preset: piano, vol: 75%)
  - "Bass" (id: ch002, type: synth, preset: subBass, vol: 90%)

### Playlist Tracks (3 total):
  - Track 0: "Drums" (id: trk001, 2 clips)
  - Track 1: "Bass" (id: trk002, 1 clip)
  - Track 2: "Lead" (id: trk003, 0 clips)

## Available Samples (220 total):

## DRUMS
  kick: synth-kick-3, kick-1, fx-boom, ...
  snare: sbuc-snare-002, fx-boom, ...
  hihat: ...

## AVAILABLE SYNTH PRESETS
piano, electricPiano, organ, bass, subBass, acidBass, ...

## AVAILABLE COMMANDS
- addAudioSample: Parameters: { sampleId: string, trackIndex?: number }
- setTrackEffect: Parameters: { trackId: string, effectKey: string, value: number }
...
```

### 3. Command Execution

When the AI returns a command, the DAW Controller:

1. Validates all parameters
2. Resolves IDs (sample ID → asset, track index → track ID)
3. Calls the appropriate store action
4. Returns success/failure message

```typescript
export async function executeCommand(command: AICommand): Promise<CommandResult> {
  // Route to appropriate handler
  if (command.action === 'addAudioSample') {
    return await executeSampleCommand(command);
  }
  // ...
}
```

## Why Not a Vector Database?

| Approach | Pros | Cons |
|----------|------|------|
| **Vector DB** | Good for semantic search over large unstructured docs | Overkill for ~220 structured samples, adds latency |
| **Dynamic Context** | Fast, no external deps, always current | Limited by context window (~128k tokens is plenty) |
| **RAG** | Can retrieve relevant subset | Adds complexity, may miss context |

**Our data is structured (JSON samples + Zustand store), not unstructured documents.** Direct context injection is faster, simpler, and guaranteed to include all relevant info.

## How the AI Uses Context

### Example 1: Adding a Sample

User: "add a kick drum"

AI sees in context:
```
## DRUMS
  kick: drums_kick_drums-kick-01-synth-kick-3_mp3_0, drums_kick_drums-kick-02-kick-1_mp3_1, ...
```

AI responds:
```json
{
  "action": "addAudioSample",
  "parameters": { "sampleId": "drums_kick_drums-kick-01-synth-kick-3_mp3_0" },
  "confidence": 0.95,
  "reasoning": "Adding kick drum sample to new track"
}
```

### Example 2: Modifying a Track

User: "add some reverb to track 1"

AI sees in context:
```
### Playlist Tracks:
  - Track 1: "Bass" (id: trk002, 1 clip)
```

AI responds:
```json
{
  "action": "setTrackEffect",
  "parameters": { "trackId": "trk002", "effectKey": "reverbWet", "value": 0.3 },
  "confidence": 0.9,
  "reasoning": "Adding reverb to Bass track"
}
```

### Example 3: Creating Notes

User: "add a C major chord to the melody pattern"

AI sees in context:
```
### Patterns:
  - "Melody" (id: def456, 32 steps, 12 notes)
```

AI responds:
```json
{
  "action": "addNoteSequence",
  "parameters": {
    "patternId": "def456",
    "notes": [
      { "pitch": 60, "startTick": 0, "durationTick": 96, "velocity": 100 },
      { "pitch": 64, "startTick": 0, "durationTick": 96, "velocity": 100 },
      { "pitch": 67, "startTick": 0, "durationTick": 96, "velocity": 100 }
    ]
  },
  "confidence": 0.95,
  "reasoning": "Adding C major chord (C4, E4, G4)"
}
```

## New Command Types Added

| Command | Parameters | Description |
|---------|------------|-------------|
| `addNoteSequence` | `patternId`, `notes[]` | Add multiple notes at once |
| `clearPatternNotes` | `patternId` | Clear all notes from pattern |
| `focusPanel` | `panel` | Focus a UI panel |
| `addAudioSample` | `sampleId`, `trackIndex?` | Add sample from library |

## Mixer Control

The AI can now control mixer effects:

```json
{
  "action": "setTrackEffect",
  "parameters": {
    "trackId": "trk001",
    "effectKey": "reverbWet",
    "value": 0.4
  }
}
```

Available effect keys:
- `volume` (0-2)
- `pan` (-1 to 1)
- `eqLow`, `eqMid`, `eqHigh` (-12 to +12 dB)
- `compThreshold`, `compRatio`
- `reverbWet` (0-1)

## Testing the Integration

1. Start the dev server: `npm run dev`
2. Open the Chat panel
3. Try commands like:
   - "add a kick drum"
   - "set the tempo to 140"
   - "create a pattern called melody"
   - "add reverb to track 1"
   - "mute the drums track"

## Future Improvements

1. **Token Optimization**: Compress sample list for very large libraries
2. **Caching**: Cache the system prompt when project hasn't changed
3. **Streaming**: Stream AI responses for faster perceived response
4. **Function Calling**: Use native OpenAI function calling for stricter schema enforcement
5. **Fallback Matching**: Use `sampleResolver.ts` when AI uses a non-exact sample reference

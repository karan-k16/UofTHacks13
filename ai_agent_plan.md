# AI Chat Agent Implementation Plan - Pulse Studio DAW

## Overview
Build a conversational AI assistant that accepts natural language commands, routes them through Backboard.io with model selection (Gemini/fallback), translates responses into structured DAW actions, and executes them against the Zustand store's 100+ actions.

---

## Phase 1: Foundation & Setup
**Goal**: Set up infrastructure without UI dependencies. All work can proceed in parallel.

### Person 1: Backboard Integration
**Files**: `lib/ai/backboard.ts`, `.env.local`, `package.json`

- Install Backboard.io SDK (`npm install @backboard/sdk` or equivalent)
- Create `lib/ai/backboard.ts`:
  - Initialize Backboard client with API key from env
  - Implement `async sendToModel(text: string, model: string)` function
  - Add retry logic (2 retries on timeout)
  - Handle errors and return parsed JSON response
- Add `BACKBOARD_API_KEY` to `.env.local`
- Document usage examples in code comments

### Person 2: Type Definitions & Schemas
**Files**: `lib/ai/types.ts`

- Define command type schemas as TypeScript interfaces:
  - `AddPatternCommand`: `{ action: 'addPattern', name: string, lengthInSteps?: number }`
  - `AddNoteCommand`: `{ action: 'addNote', patternId: string, pitch: number, startTick: number, durationTick: number, velocity?: number }`
  - `SetBPMCommand`: `{ action: 'setBpm', bpm: number }`
  - `AddChannelCommand`: `{ action: 'addChannel', type: 'synth' | 'sampler', preset?: string }`
  - `AddClipCommand`: `{ action: 'addClip', patternId: string, trackIndex: number, startTick: number }`
  - `PlayCommand`, `StopCommand`, `SetVolumeCommand`, etc.
- Define `AICommand` union type of all command types
- Define `CommandResult`: `{ success: boolean, message: string, data?: any }`
- Define `BackboardResponse`: `{ action: string, parameters: Record<string, any> }`

### Person 3: API Endpoint
**Files**: `app/api/chat/route.ts`

- Create `POST /api/chat` endpoint
- Validate request body schema: `{ text: string, model: string }`
- Import `sendToModel` from Person 1's module (will integrate in Phase 4)
- Return response: `{ success: boolean, data?: any, error?: string }`
- Add error handling for missing fields, invalid model names
- Add basic rate limiting (optional)

### Person 4: Chat State Management
**Files**: `state/slices/chatSlice.ts`

- Create Zustand slice with state:
  - `messages: Array<{ id: string, from: 'user' | 'agent', text: string, timestamp: number }>`
  - `isPending: boolean`
  - `selectedModel: 'gemini' | 'fallback'`
  - `lastAICommandId: string | null`
- Add actions:
  - `addMessage(from, text)`
  - `setModel(model)`
  - `setPending(isPending)`
  - `setLastCommand(commandId)`
  - `clearHistory()`
- Integrate into main store in `state/store.ts`

### Person 5: Command Validation Utilities
**Files**: `lib/ai/validators.ts`

- Create validation functions for command parameters:
  - `validateBPM(bpm: number): boolean` - Check 20-999 range
  - `validatePitch(pitch: number): boolean` - Check 0-127 range
  - `validateVolume(volume: number): boolean` - Check 0-1.5 range
  - `validatePan(pan: number): boolean` - Check -1 to 1 range
  - `validateTrackIndex(index: number, maxTracks: number): boolean`
- Return descriptive error messages
- Export validation schemas

**Phase 1 Testing**: Verify types compile, env variables load, chat slice integrates with store, validators work with unit tests.

---

## Phase 2: Command Processing
**Goal**: Parse AI responses and map to DAW actions. Minimal cross-dependencies.

### Person 1: Command Parser Core
**Files**: `lib/ai/commandParser.ts`

- Import `AICommand`, `BackboardResponse` from `lib/ai/types.ts`
- Implement `parseAIResponse(response: BackboardResponse): AICommand`
- Map response.action strings to typed command objects
- Handle unknown actions gracefully (return error command type)
- Validate parameter types match expected schemas
- Add comprehensive JSDoc comments

### Person 2: DAW Controller - Pattern & Note Operations
**Files**: `lib/ai/dawController.ts` (section 1)

- Import store actions from `state/store.ts`: `addPattern`, `addNote`, `updateNote`, `deletePattern`
- Import validators from `lib/ai/validators.ts`
- Create `executePatternCommand(cmd: AddPatternCommand): CommandResult`
- Create `executeNoteCommand(cmd: AddNoteCommand): CommandResult`
- Validate all parameters before execution
- Return success/error with descriptive messages
- Use `useStore.getState()` to access store

### Person 3: DAW Controller - Playback & Transport
**Files**: `lib/ai/dawController.ts` (section 2)

- Import transport actions: `play`, `stop`, `pause`, `setBpm`, `setPosition`, `toggleMetronome`
- Create `executeTransportCommand(cmd: PlayCommand | StopCommand | SetBPMCommand): CommandResult`
- Validate BPM range (20-999)
- Handle position ticks validation
- Return transport state confirmations

### Person 4: DAW Controller - Channels & Mixer
**Files**: `lib/ai/dawController.ts` (section 3)

- Import channel/mixer actions: `addChannel`, `updateChannel`, `setVolume`, `setPan`, `toggleMute`
- Import mixer actions: `setMixerTrackVolume`, `addInsertEffect`, `updateEffectParameters`
- Create `executeChannelCommand(cmd: AddChannelCommand): CommandResult`
- Create `executeMixerCommand(cmd: SetVolumeCommand): CommandResult`
- Validate preset names against available synth presets from `lib/audio/instruments/`
- Handle invalid mixer track indices

### Person 5: DAW Controller - Playlist Operations
**Files**: `lib/ai/dawController.ts` (section 4)

- Import playlist actions: `addClip`, `deleteClip`, `moveClip`, `resizeClip`, `setLoopRegion`
- Create `executePlaylistCommand(cmd: AddClipCommand | MoveClipCommand): CommandResult`
- Validate track indices, tick positions
- Ensure clip references valid patterns/assets
- Handle clip collision detection (optional)

**Phase 2 Testing**: Test command parser with mock AI responses, test each DAW controller section independently with unit tests.

---

## Phase 3: UI Components
**Goal**: Build chat interface with no execution logic yet. Pure UI work, no conflicts.

### Person 1: Chat Panel Layout
**Files**: `components/panels/ChatPanel.tsx` (main structure)

- Create functional component with Tailwind styling
- Build message list container (scrollable, auto-scroll to bottom)
- Add message bubbles (user: right-aligned blue, agent: left-aligned gray)
- Style to match existing panel design from `components/panels/Browser.tsx`
- Add loading spinner component
- Add empty state ("Ask me to help with your track...")

### Person 2: Chat Input Controls
**Files**: `components/panels/ChatPanel.tsx` (input section)

- Create textarea input (auto-resize, max 5 lines)
- Add Send button (disabled when pending)
- Add keyboard handler (Enter to send, Shift+Enter for newline)
- Style input area with focus states
- Add character counter (optional)
- Disable input when pending

### Person 3: Model Selector & Actions
**Files**: `components/panels/ChatPanel.tsx` (controls section)

- Create model selector dropdown:
  - Options: "Gemini", "Fallback Model"
  - Styled select element matching DAW theme
- Add "Undo Last AI Action" button (disabled initially)
- Add "Clear Chat" button
- Wire up to `chatSlice` state (read only, no API calls yet)
- Add tooltips for controls

### Person 4: Message Rendering & Timestamps
**Files**: `components/panels/ChatPanel.tsx` (message components)

- Create `Message` sub-component for rendering individual messages
- Add timestamp formatting (relative: "2 minutes ago")
- Add message status indicators (sending, sent, error)
- Handle long messages with word wrap
- Add markdown support for code blocks (optional)
- Style error messages in red

### Person 5: Chat Panel Integration
**Files**: `components/layout/DockingLayout.tsx`

- Add ChatPanel to mosaic layout configuration
- Position as left sidebar above Browser (20% width)
- Add chat icon/tab to panel header
- Make panel collapsible/expandable
- Ensure responsive behavior
- Update default layout config in `state/slices/uiSlice.ts` if needed

**Phase 3 Testing**: Render ChatPanel, test model selector, verify messages display, test responsive layout. Mock message data for visual testing.

---

## Phase 4: Integration & Execution
**Goal**: Connect all pieces. Coordinate between teams required.

### Person 1: API Integration in Chat Panel
**Files**: `components/panels/ChatPanel.tsx` (API calls)

- Import `chatSlice` actions
- Implement `handleSendMessage()`:
  - Get text and model from state
  - Call `POST /api/chat` with `fetch`
  - Set pending state
  - Add user message to chat immediately
  - Handle response/errors
  - Add agent response to chat
- Add error toast notifications
- Handle network errors gracefully

### Person 2: Command Execution Pipeline
**Files**: `lib/ai/dawController.ts` (main executor)

- Create main `executeCommand(command: AICommand): CommandResult` router
- Switch on command.action to call appropriate executor (from Phase 2)
- Import command parser from Phase 2
- Chain parser → executor
- Log all executions to console
- Return aggregated results

### Person 3: API Route - Backboard Connection
**Files**: `app/api/chat/route.ts` (complete implementation)

- Import Backboard client from Phase 1
- Call `sendToModel(text, model)` in POST handler
- Import command parser and executor from Phase 2
- Parse Backboard response → execute command → return result
- Add request/response logging
- Handle Backboard API errors (timeout, rate limit, invalid key)

### Person 4: Undo Integration
**Files**: `lib/ai/undoHandler.ts`, `components/panels/ChatPanel.tsx`

- Create AI command tracking system
- After each successful execution, push to `chatSlice.lastAICommandId`
- Implement `undoLastAIAction()`:
  - Call store's `undo()` from `state/undoRedo.ts`
  - Update chat with "Undone: {action description}"
  - Clear `lastAICommandId`
- Wire Undo button in ChatPanel to this handler
- Disable button when no AI action to undo

### Person 5: End-to-End Flow Testing
**Files**: `tests/e2e/aiChat.spec.ts`

- Write Playwright test:
  - Open chat panel
  - Type "add a kick drum pattern"
  - Click Send
  - Verify pattern appears in Browser panel
  - Verify chat shows success message
- Test model switching mid-conversation
- Test error scenarios (invalid BPM, etc.)
- Test undo functionality

**Phase 4 Testing**: Full integration test - send real command through UI → API → Backboard → parser → executor → DAW state update. Verify undo works.

---

## Phase 5: Advanced Features
**Goal**: Expand command coverage and robustness. Can work independently on different command domains.

### Person 1: Effect Commands
**Files**: `lib/ai/commandParser.ts`, `lib/ai/dawController.ts` (effects section)

- Add command types for effects:
  - `AddEffectCommand`: `{ action: 'addEffect', trackId: string, effectType: 'reverb' | 'delay' | 'eq' | 'compressor' }`
  - `UpdateEffectCommand`: `{ action: 'updateEffect', effectId: string, parameters: Record<string, number> }`
- Implement effect parameter validation (decay 0-10, feedback 0-1, etc.)
- Create executor for effect commands using `addInsertEffect`, `updateEffectParameters` from store
- Handle invalid effect types

### Person 2: Sample Loading Commands
**Files**: `lib/ai/commandParser.ts`, `lib/ai/dawController.ts` (samples section)

- Add command types:
  - `LoadSampleCommand`: `{ action: 'loadSample', category: string, subcategory: string, sampleName: string, trackIndex?: number }`
  - `AddSamplerCommand`: `{ action: 'addSampler', sampleUrl: string }`
- Import `SampleLibrary` from `lib/audio/SampleLibrary.ts`
- Search library for matching sample
- Create sampler channel + clip with loaded sample
- Handle sample not found errors

### Person 3: Multi-Note & Pattern Commands
**Files**: `lib/ai/commandParser.ts`, `lib/ai/dawController.ts` (sequences section)

- Add command for note sequences:
  - `AddNoteSequenceCommand`: `{ action: 'addNoteSequence', patternId: string, notes: Array<{ pitch, startTick, durationTick }> }`
- Support common patterns:
  - "add a C major chord" → [60, 64, 67]
  - "add a 4-bar drum beat" → kick/snare/hihat pattern
- Implement batch note creation
- Validate sequence doesn't exceed pattern length

### Person 4: Mixer & Routing Commands
**Files**: `lib/ai/commandParser.ts`, `lib/ai/dawController.ts` (mixer section)

- Add command types:
  - `SetMixerVolumeCommand`, `SetPanCommand`, `ToggleMuteCommand`, `ToggleSoloCommand`
  - `AddSendCommand`: `{ action: 'addSend', fromTrack: number, toTrack: number, gain: number }`
- Implement mixer track resolution (by name or index)
- Validate mixer track indices (max tracks check)
- Create send executors using store actions

### Person 5: Error Handling & Logging
**Files**: `lib/ai/logger.ts`, `lib/ai/dawController.ts` (logging)

- Create logging utility that writes to `chat.log`:
  - Log format: `[timestamp] [level] [action] message`
  - Levels: INFO, WARN, ERROR
- Log all incoming AI responses
- Log all command executions (success/failure)
- Log parameter validation failures with details
- Add file rotation (optional)
- Update all executors to use logger

**Phase 5 Testing**: Test each new command type independently. Verify logging works. Test error cases for all new features.

---

## Phase 6: Polish & Context
**Goal**: Add conversational memory, persistence, and UX refinements.

### Person 1: Conversational Context
**Files**: `lib/ai/contextBuilder.ts`, `app/api/chat/route.ts`

- Create context builder that formats last 5 messages for Backboard
- Include current project state summary (BPM, pattern count, track count)
- Modify API route to send conversation history to Backboard
- Add system prompt defining DAW capabilities and command format
- Test multi-turn conversations ("add a kick" → "now add a snare")

### Person 2: Follow-up Questions
**Files**: `lib/ai/commandParser.ts`, `components/panels/ChatPanel.tsx`

- Handle ambiguous commands that need clarification:
  - "Which pattern?" → Parser returns `ClarificationNeededCommand`
  - "Which mixer track?" → Request track name/index
- Add UI for quick-reply buttons (optional)
- Store pending command context in chat slice
- Resume command execution after clarification

### Person 3: Chat History Persistence
**Files**: `domain/types.ts`, `app/api/projects/[id]/route.ts`, `state/slices/chatSlice.ts`

- Add `chatHistory: ChatMessage[]` to `Project` interface in `domain/types.ts`
- Update project save API to persist chat messages
- Update project load to restore chat history
- Load chat history into `chatSlice` on project open
- Clear chat history on new project

### Person 4: Keyboard Shortcuts & Accessibility
**Files**: `state/shortcuts.ts`, `components/panels/ChatPanel.tsx`

- Add keyboard shortcut `Ctrl+K` (or `Cmd+K` on Mac) to focus chat input
- Register shortcut in `state/shortcuts.ts`
- Add `KeyboardShortcutsModal.tsx` entry for chat shortcuts
- Add ARIA labels to all chat controls
- Ensure screen reader compatibility
- Add focus management (ESC to close input)

### Person 5: Final Testing & Documentation
**Files**: `tests/e2e/aiChat.spec.ts`, `README.md`

- Expand E2E tests:
  - Test conversation with context ("add pattern X" → "make it longer")
  - Test chat persistence across project save/load
  - Test keyboard shortcuts
  - Test follow-up questions flow
- Write user documentation:
  - Supported commands list
  - Example conversations
  - Model selection guide
  - Troubleshooting common errors
- Update `README.md` with AI agent feature

**Phase 6 Testing**: Full regression test of all features. Test conversation flows. Load test with rapid commands. Verify persistence works.

---

## Success Criteria

- ✅ User types "add a four-bar drum loop at 100 BPM" → pattern + clip created
- ✅ Agent response appears in chat within 2 seconds
- ✅ Model selector switches between Gemini/fallback without errors
- ✅ Undo button removes last AI action and updates DAW state
- ✅ Chat history persists across project save/reload
- ✅ All 100+ DAW actions are controllable via natural language
- ✅ Error messages are clear and actionable
- ✅ No merge conflicts due to file separation

---

## File Ownership Summary

| Person | Primary Files | Touches |
|--------|--------------|---------|
| **Person 1** | `lib/ai/backboard.ts`, `lib/ai/commandParser.ts`, `lib/ai/contextBuilder.ts` | API route (Phase 4) |
| **Person 2** | `lib/ai/types.ts`, DAW controller (patterns/notes), samples section | Command parser (collab) |
| **Person 3** | `app/api/chat/route.ts`, DAW controller (transport), persistence | API integration |
| **Person 4** | `state/slices/chatSlice.ts`, DAW controller (mixer), undo, shortcuts | Chat panel (collab) |
| **Person 5** | `lib/ai/validators.ts`, DAW controller (playlist), logging, testing | Layout integration |

**Chat Panel**: Persons 1-4 collaborate in Phase 3 (separate sections), Person 1 owns API integration in Phase 4.

---

## Environment Setup

```bash
# All developers run once before Phase 1
npm install @backboard/sdk
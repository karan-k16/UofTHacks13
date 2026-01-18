/**
 * Backboard.io integration for AI model routing
 * Handles communication with Gemini and fallback models through Backboard SDK
 * 
 * Uses the official backboard-sdk package (SDK-first, no REST endpoints)
 * 
 * CONTEXT INJECTION: The system prompt is now dynamically generated based on:
 * - Current project state (patterns, channels, tracks, clips)
 * - Available samples from the sample library
 * - DAW capabilities and constraints
 */

import type { BackboardResponse } from './types';

// Backboard SDK is not yet available - using mock implementation
// Once the SDK is published, uncomment:
// import { BackboardClient } from 'backboard-sdk';

const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// TEMPORARY: Mock mode for testing (set to false when real API is available)
const USE_MOCK = true; // Always use mock until SDK is available

// Backboard client instance (singleton) - currently null as SDK is not available
let client: unknown | null = null;

// Cached assistant and thread IDs - keyed by context hash for cache invalidation
let cachedAssistantId: string | null = null;
let cachedThreadId: string | null = null;
let cachedContextHash: string | null = null;

// Default system prompt (fallback if no context provided)
const DEFAULT_SYSTEM_PROMPT = `You are a DAW (Digital Audio Workstation) assistant for Pulse Studio. Convert natural language commands into structured JSON actions.

IMPORTANT: Always respond with ONLY valid JSON, no markdown, no explanation.

Response format:
{
  "action": "commandName",
  "parameters": { ... },
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Available actions:
- addPattern: Create a new pattern. Parameters: { name?: string, lengthInSteps?: number }
- addNote: Add a note. Parameters: { patternId: string, pitch: number, startTick: number, durationTick: number, velocity?: number }
- setBpm: Set tempo. Parameters: { bpm: number }
- play, stop, pause: Control playback (no parameters)
- addChannel: Add instrument. Parameters: { name?: string, type: "synth"|"sampler", preset?: string }
- addClip: Add clip to playlist. Parameters: { patternId: string, trackIndex: number, startTick: number }
- setTrackEffect: Set mixer effect. Parameters: { trackId: string, effectKey: string, value: number }
- addAudioSample: Add sample. Parameters: { sampleId: string, trackIndex?: number }
- clarificationNeeded: When unclear. Parameters: { message: string, suggestedOptions?: string[] }

For unclear commands use action "clarificationNeeded" with a message explaining what you need.`;

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simple hash function for context comparison
 */
function hashContext(context: string): string {
  let hash = 0;
  for (let i = 0; i < context.length; i++) {
    const char = context.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Mock Backboard response for testing
 * Parses simple natural language commands into structured responses
 */
function mockBackboardResponse(text: string, model: string): BackboardResponse {
  console.log(`[Mock Backboard] Processing: "${text}" with model: ${model}`);

  const lowerText = text.toLowerCase();

  // Pattern: "add a [instrument] pattern"
  if (lowerText.includes('pattern') && (lowerText.includes('add') || lowerText.includes('create'))) {
    const instruments = ['kick', 'snare', 'hihat', 'clap', 'tom', 'cymbal'];
    const found = instruments.find(inst => lowerText.includes(inst));

    return {
      action: 'addPattern',
      parameters: {
        name: found ? `${found.charAt(0).toUpperCase() + found.slice(1)} Pattern` : 'New Pattern',
        lengthInSteps: 16,
      },
      confidence: 0.9,
      reasoning: `Creating a new pattern${found ? ` for ${found}` : ''}`,
    };
  }

  // Pattern: "set bpm to [number]"
  if (lowerText.includes('bpm') || lowerText.includes('tempo')) {
    const match = text.match(/\d+/);
    const bpm = match ? parseInt(match[0]) : 120;

    return {
      action: 'setBpm',
      parameters: { bpm },
      confidence: 0.95,
      reasoning: `Setting tempo to ${bpm} BPM`,
    };
  }

  // Pattern: "play"
  if (lowerText.match(/^(play|start)/) || lowerText.includes('play it')) {
    return {
      action: 'play',
      parameters: {},
      confidence: 1.0,
      reasoning: 'Starting playback',
    };
  }

  // Pattern: "stop"
  if (lowerText.match(/^stop/)) {
    return {
      action: 'stop',
      parameters: {},
      confidence: 1.0,
      reasoning: 'Stopping playback',
    };
  }

  // Pattern: "add note" or "add [note]"
  if (lowerText.includes('note')) {
    return {
      action: 'addNote',
      parameters: {
        patternId: 'current',
        pitch: 60, // C4
        startTick: 0,
        durationTick: 96,
        velocity: 100,
      },
      confidence: 0.7,
      reasoning: 'Adding a note to the current pattern',
    };
  }

  // Default: unknown command
  return {
    action: 'clarificationNeeded',
    parameters: {
      message: `I understand you want to "${text}", but I'm not sure how to help with that. Try commands like "add a kick pattern", "set BPM to 128", or "play".`,
      suggestedOptions: ['Add a pattern', 'Set BPM', 'Play/Stop', 'Add a note'],
    },
    confidence: 0.1,
    reasoning: 'Command not recognized',
  };
}

/**
 * Initialize and validate Backboard configuration
 */
export function initializeBackboard(): void {
  if (!BACKBOARD_API_KEY) {
<<<<<<< HEAD
    throw new Error('BACKBOARD_API_KEY environment variable is not set');
  }

  // Initialize the SDK client
  if (!client) {
    client = new BackboardClient({
      apiKey: BACKBOARD_API_KEY,
    });
=======
    console.warn('BACKBOARD_API_KEY not set - using mock mode');
    return;
>>>>>>> 8dab3ef1a8b52acd0cf15ba302d2c0c449c85b4d
  }

  // SDK not yet available - using mock mode
  console.log('[Backboard] Initialized in mock mode (SDK not available)');
}

/**
 * Get or create the Backboard client
 * Currently returns null as SDK is not available
 */
function getClient(): unknown | null {
  if (!BACKBOARD_API_KEY) {
    console.warn('Backboard API key not configured - using mock mode');
    return null;
  }
  // SDK not available yet
  return null;
}

/**
<<<<<<< HEAD
 * Create or get cached assistant with dynamic system prompt
 * If the context has changed significantly, create a new assistant
=======
 * Create or get cached assistant
 * Note: Currently returns placeholder as SDK is not available
>>>>>>> 8dab3ef1a8b52acd0cf15ba302d2c0c449c85b4d
 */
async function getAssistant(systemPrompt: string): Promise<string> {
  const contextHash = hashContext(systemPrompt);

  // If context changed significantly, invalidate cache
  if (cachedAssistantId && cachedContextHash !== contextHash) {
    console.log('[Backboard] Context changed, creating new assistant');
    cachedAssistantId = null;
    cachedThreadId = null;
  }

  if (cachedAssistantId) {
    return cachedAssistantId;
  }

<<<<<<< HEAD
  const backboard = getClient();
  const assistant = await backboard.createAssistant({
    name: 'Pulse Studio Music Copilot',
    description: systemPrompt,
  });

  cachedAssistantId = assistant.assistantId;
  cachedContextHash = contextHash;
  console.log(`[Backboard] Created assistant: ${cachedAssistantId}`);
  return cachedAssistantId!;
=======
  // SDK not available - return placeholder
  console.warn('[Backboard] SDK not available - using placeholder assistant ID');
  cachedAssistantId = 'mock-assistant-id';
  return cachedAssistantId;
>>>>>>> 8dab3ef1a8b52acd0cf15ba302d2c0c449c85b4d
}

/**
 * Create or get cached thread
 * Note: Currently returns placeholder as SDK is not available
 */
async function getThread(assistantId: string): Promise<string> {
  if (cachedThreadId) {
    return cachedThreadId;
  }

<<<<<<< HEAD
  const backboard = getClient();
  const thread = await backboard.createThread(assistantId);

  cachedThreadId = thread.threadId;
  console.log(`[Backboard] Created thread: ${cachedThreadId}`);
  return cachedThreadId!;
=======
  // SDK not available - return placeholder
  console.warn('[Backboard] SDK not available - using placeholder thread ID');
  cachedThreadId = 'mock-thread-id';
  return cachedThreadId;
>>>>>>> 8dab3ef1a8b52acd0cf15ba302d2c0c449c85b4d
}

/**
 * Send a message to the specified AI model through Backboard
 * 
 * @param text - The user's natural language input
 * @param model - The model to use ('gemini' or 'fallback')
 * @param conversationHistory - Optional previous messages for context
 * @param systemPrompt - Dynamic system prompt with project context (from contextBuilder)
 * @returns Parsed JSON response from the AI model
 * 
 * @example
 * const context = buildDAWContext(project, sampleLibrary);
 * const systemPrompt = generateSystemPrompt(context);
 * const response = await sendToModel("add a kick drum", "gemini", [], systemPrompt);
 * console.log(response.action); // "addAudioSample"
 * console.log(response.parameters); // { sampleId: "drums_kick_..." }
 */
export async function sendToModel(
  text: string,
  model: 'gemini' | 'fallback',
  conversationHistory?: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<BackboardResponse> {
  // Use provided system prompt or fall back to default
  const effectiveSystemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;

  // MOCK MODE: Return mock responses for testing
  if (USE_MOCK) {
    console.log('[Backboard] Using MOCK mode');
    await sleep(300); // Simulate network delay
    return mockBackboardResponse(text, model);
  }

  // REAL API MODE using Backboard SDK
  if (!BACKBOARD_API_KEY) {
    throw new Error('Backboard API key not configured');
  }

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Get or create assistant and thread with dynamic context
      const assistantId = await getAssistant(effectiveSystemPrompt);
      const threadId = await getThread(assistantId);

      // Use OpenAI models (Gemini not available on this Backboard instance)
      const llmProvider = 'openai';
      const modelName = model === 'gemini' ? 'gpt-4o' : 'gpt-4o-mini';

<<<<<<< HEAD
      // Send message using SDK
      const backboard = getClient();
      const response = await backboard.addMessage(threadId, {
        content: text,
        llm_provider: llmProvider,
        model_name: modelName,
        stream: false,
      });

      // Check if the response was successful
      if (response.status === 'FAILED') {
        throw new Error(`Backboard response failed: ${response.content}`);
      }

      // Extract response content from SDK response
      let content = response.content || '';

      // Try to parse JSON from the response
      try {
        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(content);

        return {
          action: parsed.action || 'unknown',
          parameters: parsed.parameters || {},
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
        };
      } catch (parseError) {
        // If JSON parsing fails, return unknown command
        console.error('Failed to parse AI response:', content);
        return {
          action: 'unknown',
          parameters: {
            originalText: text,
            reason: 'Failed to parse AI response',
            rawResponse: content,
          },
        };
      }
=======
      // SDK not available - fall back to mock
      console.warn('[Backboard] SDK not available - falling back to mock mode');
      return mockBackboardResponse(text, model);
>>>>>>> 8dab3ef1a8b52acd0cf15ba302d2c0c449c85b4d
    } catch (error) {
      lastError = error as Error;
      console.error(`Backboard request attempt ${attempt + 1} failed:`, error);

      // Don't retry on certain errors
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Invalid Backboard API key');
        }
        if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }

      // Wait before retrying
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  // All retries failed
  throw new Error(`Failed to connect to Backboard after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

/**
 * Test the Backboard connection
 * @returns true if connection successful, throws error otherwise
 */
export async function testConnection(): Promise<boolean> {
  await sendToModel('test', 'fallback');
  return true;
}

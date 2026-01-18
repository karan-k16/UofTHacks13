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

import type { BackboardResponse, BackboardBatchResponse } from './types';

// @ts-expect-error - backboard-sdk doesn't have TypeScript types
import { BackboardClient } from 'backboard-sdk';

const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Set to false to use real SDK, true for testing without API
const USE_MOCK = false;

// Backboard client instance (singleton)
let client: InstanceType<typeof BackboardClient> | null = null;

// Cached assistant and thread IDs - keyed by context hash for cache invalidation
let cachedAssistantId: string | null = null;
let cachedThreadId: string | null = null;
let cachedContextHash: string | null = null;

// Default system prompt (fallback if no context provided)
// NOTE: All curly braces are escaped as {{ }} to prevent LangChain template interpretation
const DEFAULT_SYSTEM_PROMPT = `You are a DAW (Digital Audio Workstation) assistant for Pulse Studio. Convert natural language commands into structured JSON actions.

IMPORTANT: Always respond with ONLY valid JSON, no markdown, no explanation.

Response format (always use actions array):
{{
  "actions": [
    {{ "action": "commandName", "parameters": {{ ... }} }}
  ],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}}

Available actions:
- addPattern: Create a new pattern. Parameters: {{{{ name?: string, lengthInSteps?: number }}}}
- addNote: Add a note. Parameters: {{{{ patternId: string, pitch: number, startTick: number, durationTick: number, velocity?: number }}}}
- setBpm: Set tempo. Parameters: {{{{ bpm: number }}}}
- play, stop, pause: Control playback (no parameters)
- addChannel: Add instrument. Parameters: {{{{ name?: string, type: "synth"|"sampler", preset?: string }}}}
- addClip: Add clip to playlist. Parameters: {{{{ patternId: string, trackIndex: number, startTick: number }}}}
- setTrackEffect: Set mixer effect. Parameters: {{{{ trackId: string, effectKey: string, value: number }}}}
- addAudioSample: Add sample. Parameters: {{{{ category: string, subcategory: string, trackIndex?: number, startTick?: number }}}}
- clarificationNeeded: When unclear. Parameters: {{{{ message: string, suggestedOptions?: string[] }}}}

For unclear commands use action "clarificationNeeded" with a message explaining what you need.`;

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simple hash function for context comparison
 */
function hashContext(context: string): string {
  let hash = 0;
  for (let i = 0; i < context.length; i++) {
    const char = context.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Mock Backboard response for testing
 * Parses simple natural language commands into structured responses
 * Now returns batch format for consistency
 */
function mockBackboardResponse(text: string, model: string): BackboardResponse {
  console.log(`[Mock Backboard] Processing: "${text}" with model: ${model}`);

  const lowerText = text.toLowerCase();

  // Helper to wrap single action in batch format
  const wrapInBatch = (action: string, parameters: Record<string, any>, confidence: number, reasoning: string): BackboardResponse => ({
    action: '__batch__',
    parameters: {
      actions: [{ action, parameters }],
    },
    confidence,
    reasoning,
  });

  // Pattern: "make a beat" or "create a beat"
  if (lowerText.includes('beat') && (lowerText.includes('make') || lowerText.includes('create'))) {
    return {
      action: '__batch__',
      parameters: {
        actions: [
          { action: 'setBpm', parameters: { bpm: 90 } },
          { action: 'addAudioSample', parameters: { category: 'drums', subcategory: 'kick', trackIndex: 0, startTick: 0 } },
          { action: 'addAudioSample', parameters: { category: 'drums', subcategory: 'kick', trackIndex: 0, startTick: 384 } },
          { action: 'addAudioSample', parameters: { category: 'drums', subcategory: 'snare', trackIndex: 1, startTick: 192 } },
          { action: 'addAudioSample', parameters: { category: 'drums', subcategory: 'snare', trackIndex: 1, startTick: 576 } },
          { action: 'addAudioSample', parameters: { category: 'drums', subcategory: 'hihat', trackIndex: 2, startTick: 0 } },
          { action: 'addAudioSample', parameters: { category: 'drums', subcategory: 'hihat', trackIndex: 2, startTick: 96 } },
          { action: 'addAudioSample', parameters: { category: 'drums', subcategory: 'hihat', trackIndex: 2, startTick: 192 } },
          { action: 'addAudioSample', parameters: { category: 'drums', subcategory: 'hihat', trackIndex: 2, startTick: 288 } },
        ],
      },
      confidence: 0.85,
      reasoning: 'Creating a hip-hop style beat with kick, snare, and hi-hats',
    };
  }

  // Pattern: "add a [instrument] pattern"
  if (
    lowerText.includes('pattern') &&
    (lowerText.includes('add') || lowerText.includes('create'))
  ) {
    const instruments = ['kick', 'snare', 'hihat', 'clap', 'tom', 'cymbal'];
    const found = instruments.find((inst) => lowerText.includes(inst));

    return wrapInBatch(
      'addPattern',
      {
        name: found
          ? `${found.charAt(0).toUpperCase() + found.slice(1)} Pattern`
          : 'New Pattern',
        lengthInSteps: 16,
      },
      0.9,
      `Creating a new pattern${found ? ` for ${found}` : ''}`
    );
  }

  // Pattern: "set bpm to [number]"
  if (lowerText.includes('bpm') || lowerText.includes('tempo')) {
    const match = text.match(/\d+/);
    const bpm = match ? parseInt(match[0]) : 120;

    return wrapInBatch('setBpm', { bpm }, 0.95, `Setting tempo to ${bpm} BPM`);
  }

  // Pattern: "play"
  if (lowerText.match(/^(play|start)/) || lowerText.includes('play it')) {
    return wrapInBatch('play', {}, 1.0, 'Starting playback');
  }

  // Pattern: "stop"
  if (lowerText.match(/^stop/)) {
    return wrapInBatch('stop', {}, 1.0, 'Stopping playback');
  }

  // Pattern: "add note" or "add [note]"
  if (lowerText.includes('note')) {
    return wrapInBatch(
      'addNote',
      {
        patternId: 'current',
        pitch: 60, // C4
        startTick: 0,
        durationTick: 96,
        velocity: 100,
      },
      0.7,
      'Adding a note to the current pattern'
    );
  }

  // Default: unknown command
  return wrapInBatch(
    'clarificationNeeded',
    {
      message: `I understand you want to "${text}", but I'm not sure how to help with that. Try commands like "make a beat", "add a kick pattern", "set BPM to 128", or "play".`,
      suggestedOptions: ['Make a beat', 'Add a pattern', 'Set BPM', 'Play/Stop'],
    },
    0.1,
    'Command not recognized'
  );
}

/**
 * Initialize and validate Backboard configuration
 */
export function initializeBackboard(): void {
  if (!BACKBOARD_API_KEY) {
    throw new Error('BACKBOARD_API_KEY environment variable is not set');
  }

  // Initialize the SDK client
  if (!client) {
    client = new BackboardClient({
      apiKey: BACKBOARD_API_KEY,
    });
  }
}

/**
 * Get or create the Backboard client
 */
function getClient(): InstanceType<typeof BackboardClient> {
  if (!client) {
    if (!BACKBOARD_API_KEY) {
      throw new Error('Backboard API key not configured');
    }
    client = new BackboardClient({
      apiKey: BACKBOARD_API_KEY,
    });
  }
  return client;
}

/**
 * Create or get cached assistant with dynamic system prompt
 * If the context has changed significantly, create a new assistant
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

  const backboard = getClient();
  const assistant = await backboard.createAssistant({
    name: 'Pulse Studio Music Copilot',
    description: systemPrompt,
  });

  cachedAssistantId = assistant.assistantId;
  cachedContextHash = contextHash;
  console.log(`[Backboard] Created assistant: ${cachedAssistantId}`);
  return cachedAssistantId!;
}

/**
 * Create or get cached thread
 */
async function getThread(assistantId: string): Promise<string> {
  if (cachedThreadId) {
    return cachedThreadId;
  }

  const backboard = getClient();
  const thread = await backboard.createThread(assistantId);

  cachedThreadId = thread.threadId;
  console.log(`[Backboard] Created thread: ${cachedThreadId}`);
  return cachedThreadId!;
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
  _conversationHistory?: Array<{ role: string; content: string }>,
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
      const _threadId = await getThread(assistantId);

      // Use OpenAI models (Gemini not available on this Backboard instance)
      const _llmProvider = 'openai';
      const _modelName = model === 'gemini' ? 'gpt-4o' : 'gpt-4o-mini';

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
        content = content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        const parsed = JSON.parse(content);

        // Check if this is a batch response (has "actions" array) or single response
        if (parsed.actions && Array.isArray(parsed.actions)) {
          // Return as batch response format
          return {
            action: '__batch__',
            parameters: {
              actions: parsed.actions,
              sampleChoices: parsed.sampleChoices,
            },
            confidence: parsed.confidence,
            reasoning: parsed.reasoning,
          };
        }

        // Legacy single action response - wrap in batch format
        return {
          action: '__batch__',
          parameters: {
            actions: [{
              action: parsed.action || 'unknown',
              parameters: parsed.parameters || {},
            }],
          },
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
        };
      } catch (parseError) {
        // If JSON parsing fails, return unknown command
        console.error('Failed to parse AI response:', content);
        return {
          action: '__batch__',
          parameters: {
            actions: [{
              action: 'unknown',
              parameters: {
                originalText: text,
                reason: 'Failed to parse AI response',
                rawResponse: content,
              },
            }],
          },
        };
      }
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
  throw new Error(
    `Failed to connect to Backboard after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Test the Backboard connection
 * @returns true if connection successful, throws error otherwise
 */
export async function testConnection(): Promise<boolean> {
  await sendToModel('test', 'fallback');
  return true;
}

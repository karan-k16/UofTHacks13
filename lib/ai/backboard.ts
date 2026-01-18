/**
 * Backboard.io integration for AI model routing
 * Handles communication with Gemini and fallback models through Backboard API
 */

import type { BackboardResponse } from './types';

const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY;
const BACKBOARD_API_URL = process.env.BACKBOARD_API_URL || 'https://api.backboard.io/v1/chat';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Initialize and validate Backboard configuration
 */
export function initializeBackboard(): void {
  if (!BACKBOARD_API_KEY) {
    throw new Error('BACKBOARD_API_KEY environment variable is not set');
  }
}

/**
 * Send a message to the specified AI model through Backboard
 * 
 * @param text - The user's natural language input
 * @param model - The model to use ('gemini' or 'fallback')
 * @param conversationHistory - Optional previous messages for context
 * @returns Parsed JSON response from the AI model
 * 
 * @example
 * const response = await sendToModel("add a kick drum pattern", "gemini");
 * console.log(response.action); // "addPattern"
 * console.log(response.parameters); // { name: "kick", ... }
 */
export async function sendToModel(
  text: string,
  model: 'gemini' | 'fallback',
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<BackboardResponse> {
  if (!BACKBOARD_API_KEY) {
    throw new Error('Backboard API key not configured');
  }

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(BACKBOARD_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BACKBOARD_API_KEY}`,
        },
        body: JSON.stringify({
          model: model === 'gemini' ? 'gemini-pro' : 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a DAW (Digital Audio Workstation) assistant. Convert natural language commands into structured JSON actions.
              
Available actions:
- addPattern: Create a new pattern
- addNote: Add a note to a pattern
- setBpm: Set the tempo
- play/stop/pause: Control playback
- addChannel: Add a synth or sampler channel
- addClip: Add a clip to the playlist
- setVolume/setPan: Adjust mixer settings
- toggleMute/toggleSolo: Mixer controls

Always respond with JSON in this format:
{
  "action": "actionName",
  "parameters": { /* action-specific parameters */ }
}

For unclear commands, use:
{
  "action": "clarificationNeeded",
  "parameters": { "message": "What did you mean?" }
}`
            },
            ...(conversationHistory || []),
            {
              role: 'user',
              content: text,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backboard API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      // Extract response content
      let content = data.choices?.[0]?.message?.content || data.response || '';
      
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

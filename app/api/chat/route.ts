/**
 * API endpoint for AI chat agent
 * POST /api/chat - Process natural language commands and execute DAW actions
 * 
 * Now supports batch actions - AI can return multiple actions for complex requests
 * like "make a beat" which results in multiple samples being placed.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ChatAPIRequest, ChatAPIResponse, BackboardResponse, BackboardBatchResponse } from '@/lib/ai/types';
import { sendToModel } from '@/lib/ai/backboard';

// Rate limiting (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        } as ChatAPIResponse,
        { status: 429 }
      );
    }

    // Parse and validate request body
    let body: ChatAPIRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        } as ChatAPIResponse,
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid "text" field',
        } as ChatAPIResponse,
        { status: 400 }
      );
    }

    if (!body.model || !['gemini', 'fallback'].includes(body.model)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid "model" field. Must be "gemini" or "fallback"',
        } as ChatAPIResponse,
        { status: 400 }
      );
    }

    // Log request
    const requestLog = {
      text: body.text.substring(0, 100), // Truncate for logging
      model: body.model,
      timestamp: new Date().toISOString(),
      hasHistory: !!body.conversationHistory?.length,
      hasContext: !!body.systemPrompt,
    };
    console.log('[AI Chat API] Request:', requestLog);

    // Convert conversation history to Backboard format
    const conversationHistory = body.conversationHistory?.map(msg => ({
      role: msg.from === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    // Call Backboard integration with dynamic context
    let backboardResponse: BackboardResponse;
    try {
      backboardResponse = await sendToModel(
        body.text,
        body.model,
        conversationHistory,
        body.systemPrompt // Pass the dynamic system prompt with project context
      );

      // Log successful response
      const isBatch = backboardResponse.action === '__batch__';
      const actionCount = isBatch ? (backboardResponse.parameters?.actions?.length || 0) : 1;

      console.log('[AI Chat API] Backboard response:', {
        isBatch,
        actionCount,
        confidence: backboardResponse.confidence,
        reasoning: backboardResponse.reasoning,
        timestamp: new Date().toISOString(),
      });

    } catch (backboardError) {
      // Log Backboard error
      console.error('[AI Chat API] Backboard error:', {
        error: backboardError instanceof Error ? backboardError.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      // Handle specific Backboard errors
      if (backboardError instanceof Error) {
        const errorMessage = backboardError.message;

        // Invalid API key
        if (errorMessage.includes('Invalid Backboard API key')) {
          return NextResponse.json(
            {
              success: false,
              error: 'AI service configuration error. Please contact support.',
            } as ChatAPIResponse,
            { status: 503 }
          );
        }

        // Rate limit from Backboard
        if (errorMessage.includes('Rate limit exceeded')) {
          return NextResponse.json(
            {
              success: false,
              error: 'AI service is currently busy. Please try again in a moment.',
            } as ChatAPIResponse,
            { status: 429 }
          );
        }

        // Timeout
        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Request timed out. Please try again.',
            } as ChatAPIResponse,
            { status: 504 }
          );
        }

        // Connection failure
        if (errorMessage.includes('Failed to connect')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Unable to connect to AI service. Please try again later.',
            } as ChatAPIResponse,
            { status: 503 }
          );
        }
      }

      // Generic error for unknown issues
      return NextResponse.json(
        {
          success: false,
          error: 'AI service error. Please try again.',
        } as ChatAPIResponse,
        { status: 500 }
      );
    }

    // Check if this is a batch response
    const isBatch = backboardResponse.action === '__batch__';

    if (isBatch) {
      // Extract batch data for client-side execution
      const batchData: BackboardBatchResponse = {
        actions: backboardResponse.parameters?.actions || [],
        sampleChoices: backboardResponse.parameters?.sampleChoices,
        confidence: backboardResponse.confidence,
        reasoning: backboardResponse.reasoning,
      };

      const actionCount = batchData.actions.length;
      const message = backboardResponse.reasoning ||
        (actionCount > 1
          ? `Preparing ${actionCount} actions...`
          : 'Processing command...');

      // Return batch response for client-side execution
      return NextResponse.json({
        success: true,
        data: {
          message,
          commandResult: {
            action: '__batch__',
            parameters: batchData,
            confidence: backboardResponse.confidence,
            reasoning: backboardResponse.reasoning,
          },
        },
      } as ChatAPIResponse);
    }

    // Legacy single action response (shouldn't happen with new system)
    return NextResponse.json({
      success: true,
      data: {
        message: backboardResponse.reasoning || 'Command received',
        commandResult: backboardResponse,
      },
    } as ChatAPIResponse);

  } catch (error) {
    console.error('[AI Chat API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ChatAPIResponse,
      { status: 500 }
    );
  }
}

// GET method not allowed
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to send chat messages.',
    } as ChatAPIResponse,
    { status: 405 }
  );
}

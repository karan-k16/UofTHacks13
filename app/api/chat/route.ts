/**
 * API endpoint for AI chat agent
 * POST /api/chat - Process natural language commands and execute DAW actions
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ChatAPIRequest, ChatAPIResponse } from '@/lib/ai/types';

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

    // TODO: Phase 4 - Import and call Backboard integration
    // const backboardResponse = await sendToModel(body.text, body.model, conversationHistory);
    // const command = parseAIResponse(backboardResponse);
    // const result = await executeCommand(command);

    // Placeholder response for Phase 1
    console.log('[AI Chat API] Received request:', {
      text: body.text,
      model: body.model,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Phase 1: API endpoint ready. Backboard integration pending in Phase 4.',
        commandResult: {
          success: true,
          message: 'Placeholder response',
        },
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

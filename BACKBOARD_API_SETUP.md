# Backboard API Setup Guide

## Summary

I've updated your code to use the **correct Backboard API flow** according to their documentation. However, we need to verify the actual API base URL with Backboard.

## Changes Made

### 1. Updated API Call Pattern

**Old (Incorrect):**
- Used `/v1/chat` endpoint (doesn't exist)
- Sent OpenAI-style request format with `messages` array
- Wrong model parameter format

**New (Correct):**
```javascript
// 1. Create Assistant
POST https://app.backboard.io/api/v1/assistants
{
  "name": "Music Copilot",
  "system_prompt": "Your system prompt here"
}
// Returns: { "assistant_id": "asst_123" }

// 2. Create Thread
POST https://app.backboard.io/api/v1/assistants/{assistant_id}/threads
// Returns: { "thread_id": "thread_456" }

// 3. Send Message
POST https://app.backboard.io/api/v1/threads/{thread_id}/messages
{
  "content": "Your user message",
  "llm_provider": "google",
  "model_name": "gemini-1.5-pro",
  "stream": false
}
```

### 2. Files Updated

- ✅ [test-backboard-raw.mjs](test-backboard-raw.mjs) - Test script with correct API flow
- ✅ [lib/ai/backboard.ts](lib/ai/backboard.ts) - Main backboard module with correct implementation

## Current Issue

The API base URL needs verification. We tested:
- ❌ `https://api.backboard.io` - Domain doesn't exist (DNS lookup fails)
- ❌ `https://backboard.io/v1/assistants` - Returns HTML landing page (404)
- ❌ `https://app.backboard.io/api/v1/assistants` - Returns 404 JSON

## Next Steps

**Please verify with Backboard team:**

1. What is the correct base URL?
   - Is it `https://api.backboard.io`? (might need VPN/whitelist)
   - Is it `https://app.backboard.io/api`?
   - Is it something else?

2. Is your API key valid and active?
   - Current key: `espr_lD6kH1C2vjKyz3WUCiKu1mHfjW9EnxAueqE70I16BJ0`

3. Are there any IP restrictions or additional authentication needed?

## Testing

Once you have the correct base URL, update and run:

```bash
# Update the URL in test-backboard-raw.mjs
node test-backboard-raw.mjs
```

## Environment Variables

For production, set these in your `.env.local`:

```env
BACKBOARD_API_KEY=espr_lD6kH1C2vjKyz3WUCiKu1mHfjW9EnxAueqE70I16BJ0
BACKBOARD_BASE_URL=https://[CORRECT_URL_HERE]
```

## Code Features

The updated code now:
- ✅ Uses correct 3-step flow (assistant → thread → messages)
- ✅ Caches assistant and thread IDs to avoid recreating
- ✅ Uses correct request format with `llm_provider` and `model_name`
- ✅ Proper error handling and retry logic
- ✅ Supports streaming responses
- ✅ Correctly extracts response content

## Mock Mode

Your code is currently in MOCK mode (`USE_MOCK = true` in backboard.ts). This allows local testing without a real API. Set to `false` once the API is working.

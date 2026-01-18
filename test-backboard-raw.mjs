/**
 * Backboard SDK test - using official SDK (no REST endpoints)
 */
import { BackboardClient } from 'backboard-sdk';

const BACKBOARD_API_KEY = 'espr_lD6kH1C2vjKyz3WUCiKu1mHfjW9EnxAueqE70I16BJ0';

// DAW system prompt (no curly braces to avoid template issues)
const DAW_SYSTEM_PROMPT = `You are a DAW assistant. Convert natural language commands into structured JSON actions.
Available actions: addPattern, addNote, setBpm, play, stop, pause, addChannel, addClip, setVolume, setPan, toggleMute, toggleSolo.
Always respond with valid JSON only. No markdown. No explanation outside the JSON.
Include: action (string), parameters (object), confidence (0-1), reasoning (string).`;

async function testBackboardSDK() {
  console.log('🎵 Testing Backboard SDK for DAW Integration\n');
  console.log('═'.repeat(60));
  
  try {
    // Initialize the client
    const client = new BackboardClient({
      apiKey: BACKBOARD_API_KEY,
    });
    console.log('✅ Client initialized\n');

    // Create assistant with DAW prompt
    console.log('Creating DAW assistant...');
    const assistant = await client.createAssistant({
      name: 'DAW Copilot',
      description: DAW_SYSTEM_PROMPT,
    });
    const assistantId = assistant.assistantId;
    console.log(`✅ Assistant: ${assistantId}\n`);

    // Create thread
    console.log('Creating conversation thread...');
    const thread = await client.createThread(assistantId);
    const threadId = thread.threadId;
    console.log(`✅ Thread: ${threadId}\n`);

    // Test various DAW commands
    const testCommands = [
      'Set the BPM to 128',
      'Add a kick drum pattern',
      'Play the track',
    ];

    for (const command of testCommands) {
      console.log('─'.repeat(60));
      console.log(`🎤 User: "${command}"`);
      
      const response = await client.addMessage(threadId, {
        content: command,
        llm_provider: 'openai',
        model_name: 'gpt-4o',
        stream: false,
      });

      if (response.status === 'COMPLETED') {
        console.log(`🤖 AI Response:`);
        console.log(response.content);
        
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
          console.log(`\n📋 Parsed Action: ${parsed.action}`);
          console.log(`   Parameters: ${JSON.stringify(parsed.parameters)}`);
          console.log(`   Confidence: ${parsed.confidence}`);
        } catch (e) {
          console.log('   (Response not in expected JSON format)');
        }
      } else {
        console.log(`❌ Failed: ${response.content}`);
      }
      console.log('');
    }

    // Cleanup
    console.log('─'.repeat(60));
    console.log('Cleaning up...');
    await client.deleteThread(threadId);
    await client.deleteAssistant(assistantId);
    console.log('✅ Done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testBackboardSDK();

/**
 * Quick test script for Backboard integration
 */

const API_URL = 'http://localhost:3000/api/chat';

async function testBackboard(text, model = 'gemini') {
  console.log(`\n🧪 Testing: "${text}" with model: ${model}`);
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model,
        conversationHistory: [],
      }),
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.success) {
      console.log('✅ Response received!');
      console.log('Data:', JSON.stringify(data.data, null, 2));
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Run tests
(async () => {
  console.log('🎵 Pulse Studio - Backboard Integration Test');
  console.log('═'.repeat(60));
  
  // Test 1: Simple command
  await testBackboard('add a kick drum pattern');
  
  // Test 2: BPM command
  await testBackboard('set bpm to 128');
  
  // Test 3: Complex command
  await testBackboard('create a pattern with a snare and play it');
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Test complete! Check the output above.');
})();

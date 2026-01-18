// Simple direct test of backboard module
import { sendToModel } from './lib/ai/backboard.ts';

console.log('Testing Backboard directly...\n');

try {
  console.log('Sending test command: "add a kick drum pattern"');
  const result = await sendToModel('add a kick drum pattern', 'gemini');
  
  console.log('\n✅ Success!');
  console.log('Action:', result.action);
  console.log('Parameters:', JSON.stringify(result.parameters, null, 2));
  console.log('Confidence:', result.confidence);
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('Full error:', error);
}

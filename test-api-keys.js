/**
 * API Key Diagnostics
 * Run this to test your API keys without exposing them
 */

require('dotenv').config();

console.log('\n🔍 API Key Diagnostics\n');
console.log('═══════════════════════════════════════\n');

// Check environment variables
const geminiKey = process.env.GEMINI_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const provider = process.env.AI_PROVIDER || 'gemini';

console.log('📋 Configuration:');
console.log(`   AI_PROVIDER: ${provider}`);
console.log('');

// Check Gemini
console.log('🔑 Gemini API Key:');
if (!geminiKey) {
    console.log('   ❌ NOT SET');
} else if (geminiKey.includes('your_') || geminiKey.includes('example')) {
    console.log('   ❌ Still using placeholder value');
    console.log('   Current value starts with:', geminiKey.substring(0, 10) + '...');
} else {
    console.log('   ✅ Set (length:', geminiKey.length, 'characters)');
    console.log('   Starts with:', geminiKey.substring(0, 10) + '...');
    console.log('   Ends with: ...' + geminiKey.substring(geminiKey.length - 5));
}
console.log('');

// Check OpenAI
console.log('🔑 OpenAI API Key:');
if (!openaiKey) {
    console.log('   ❌ NOT SET');
} else if (openaiKey.includes('your_') || openaiKey.includes('example')) {
    console.log('   ❌ Still using placeholder value');
    console.log('   Current value:', openaiKey);
} else {
    console.log('   ✅ Set (length:', openaiKey.length, 'characters)');
    console.log('   Starts with:', openaiKey.substring(0, 10) + '...');
    console.log('   Ends with: ...' + openaiKey.substring(openaiKey.length - 5));
}
console.log('');

// Test Gemini API
if (geminiKey && !geminiKey.includes('your_') && !geminiKey.includes('example')) {
    console.log('🧪 Testing Gemini API...');

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiKey);

    (async () => {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent('Say "Hello"');
            const response = await result.response;
            const text = response.text();

            console.log('   ✅ Gemini API is WORKING!');
            console.log('   Response:', text.substring(0, 50));
        } catch (error) {
            console.log('   ❌ Gemini API FAILED');
            console.log('   Error:', error.message);

            if (error.message.includes('API key not valid')) {
                console.log('\n   💡 Tips:');
                console.log('   1. Check if key is copied correctly (no extra spaces)');
                console.log('   2. Verify key at: https://makersuite.google.com/app/apikey');
                console.log('   3. Make sure key is enabled and not restricted');
            }
        }
    })();
} else {
    console.log('⚠️  Skipping Gemini test (key not configured)\n');
}

console.log('\n═══════════════════════════════════════');
console.log('\n💡 Next Steps:\n');
console.log('1. If keys show placeholders, edit your .env file');
console.log('2. Get Gemini key: https://makersuite.google.com/app/apikey');
console.log('3. Restart server after adding key: Ctrl+C then npm start');
console.log('');

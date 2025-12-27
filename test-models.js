/**
 * Test different Gemini models to find which one works
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const models = [
    'gemini-1.5-pro',
    'gemini-1.0-pro',
    'gemini-pro',
    'gemini-1.5-flash',
    'models/gemini-1.5-flash',
    'models/gemini-pro'
];

async function testModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('your_')) {
        console.log('❌ Please set a valid GEMINI_API_KEY in .env');
        return;
    }

    console.log('🧪 Testing Gemini Models...\n');

    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of models) {
        try {
            console.log(`Testing: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say hello');
            const response = await result.response;
            const text = response.text();

            console.log(`✅ ${modelName} WORKS!`);
            console.log(`   Response: ${text.substring(0, 50)}\n`);

            // Found a working model!
            console.log(`\n🎯 USE THIS MODEL: ${modelName}\n`);
            break;

        } catch (error) {
            console.log(`❌ ${modelName} failed: ${error.message.substring(0, 80)}...\n`);
        }
    }
}

testModels();

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;

console.log(`🔑 Testing API Key: ${API_KEY ? API_KEY.substring(0, 15) + '...' : 'MISSING'}`);

async function testGemini() {
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log('📡 Sending test request to Gemini...');
        const result = await model.generateContent("Say hello in one word");
        const response = await result.response;

        console.log('✅ SUCCESS! Gemini Response:', response.text());
    } catch (error) {
        console.error('❌ FAILED! Error:', error.message);
        console.error('Full error:', error);
    }
}

testGemini();

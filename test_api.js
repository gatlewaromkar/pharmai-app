// Test Gemini API Key
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('🔑 Testing API Key:', API_KEY?.substring(0, 15) + '...');

const genAI = new GoogleGenerativeAI(API_KEY);

async function testAPI() {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            tools: [{
                googleSearchRetrieval: {
                    dynamicRetrievalConfig: {
                        mode: "DYNAMIC",
                        dynamicThreshold: 0.3
                    }
                }
            }]
        });

        console.log('📡 Sending test message...');

        const result = await model.generateContent("Say 'Hello from PharmAI!' in one sentence.");
        const response = result.response.text();

        console.log('✅ API Response:', response);
        console.log('✅ API Key is WORKING!');

    } catch (error) {
        console.error('❌ API Error:', error.message);
        console.error('❌ Full Error:', error);
    }
}

testAPI();

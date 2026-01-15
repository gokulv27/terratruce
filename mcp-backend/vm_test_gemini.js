import axios from 'axios';

async function testGemini() {
    try {
        console.log("🤖 Sending Chat Request to Gemini...");
        const res = await axios.post('http://localhost:3002/api/chat', {
            messages: [{ role: 'user', parts: [{ text: "Hello, are you rotating keys?" }] }]
        });
        console.log('✅ Status:', res.status);
        console.log('📝 Response:', res.data.response.substring(0, 50) + "...");
    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.response) {
            console.error('Data:', err.response.data);
        }
    }
}

testGemini();

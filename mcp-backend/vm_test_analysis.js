import axios from 'axios';

import fs from 'fs';

async function testAnalysis() {
    try {
        console.log("🏙️ Analyzing Property (Bangalore)...");
        const res = await axios.post('http://localhost:3002/api/analyze-property', {
            location: "Koramangala, Bangalore"
        });

        if (res.data.success) {
            console.log("✅ Analysis Success!");
            fs.writeFileSync('analysis_result.json', JSON.stringify(res.data.data, null, 2));
        } else {
            console.log("❌ Success=false:", res.data);
            fs.writeFileSync('analysis_result.json', JSON.stringify(res.data, null, 2));
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.response) {
            fs.writeFileSync('analysis_result.json', JSON.stringify(err.response.data, null, 2));
        } else {
            fs.writeFileSync('analysis_result.json', JSON.stringify({ error: err.message }, null, 2));
        }
    }
}

testAnalysis();

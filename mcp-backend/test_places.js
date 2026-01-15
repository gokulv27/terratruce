import axios from 'axios';

async function testPlaces() {
    try {
        const res = await axios.get('http://localhost:3002/api/places/autocomplete?input=Bangalore');
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

testPlaces();

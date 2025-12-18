
// This is a Vercel Serverless Function that proxies requests to Perplexity.
// It keeps your API KEY safe on the server side.

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get the key from Vercel Environment Variables (added in dashboard)
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || process.env.VITE_PERPLEXITY_API_KEY;

    if (!PERPLEXITY_API_KEY) {
        return res.status(500).json({ error: 'API key not configured on server' });
    }

    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Serverless Function Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

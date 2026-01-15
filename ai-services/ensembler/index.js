const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Calculate variance between multiple provider responses
 */
function calculateVariance(responses) {
    if (responses.length < 2) return 0;
    
    // Simple variance calculation based on confidence scores
    const confidences = responses.map(r => r.confidence);
    const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = confidences.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / confidences.length;
    
    return Math.sqrt(variance);
}

/**
 * Aggregate multiple provider responses using weighted voting
 */
function aggregateResponses(responses) {
    if (responses.length === 0) {
        throw new Error('No responses to aggregate');
    }
    
    if (responses.length === 1) {
        return {
            final_content: responses[0].content,
            confidence: responses[0].confidence,
            method: 'single'
        };
    }
    
    // Weight by confidence
    const totalConfidence = responses.reduce((sum, r) => sum + r.confidence, 0);
    const weights = responses.map(r => r.confidence / totalConfidence);
    
    // Use highest confidence response as base
    const best = responses.reduce((prev, current) => 
        (current.confidence > prev.confidence) ? current : prev
    );
    
    // Calculate weighted confidence
    const weightedConfidence = responses.reduce((sum, r, i) => 
        sum + (r.confidence * weights[i]), 0
    );
    
    return {
        final_content: best.content,
        confidence: weightedConfidence,
        method: 'weighted_voting',
        weights: weights
    };
}

/**
 * Build provenance information
 */
function buildProvenance(responses) {
    return responses.map(r => ({
        provider: r.provider,
        confidence: r.confidence,
        latency_ms: r.latency_ms,
        tokens_used: r.tokens_used || null,
        cost_usd: r.cost_usd || null
    }));
}

/**
 * POST /ensemble - Aggregate multiple provider responses
 */
app.post('/ensemble', (req, res) => {
    try {
        const { responses, variance_threshold = 0.15 } = req.body;
        
        if (!responses || !Array.isArray(responses)) {
            return res.status(400).json({ error: 'Invalid request: responses array required' });
        }
        
        const variance = calculateVariance(responses);
        const aggregated = aggregateResponses(responses);
        const provenance = buildProvenance(responses);
        
        const total_cost = responses.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
        const providers_used = responses.map(r => r.provider);
        
        // Early accept if variance is low
        const early_accept = variance < variance_threshold;
        
        res.json({
            final_content: aggregated.final_content,
            confidence: aggregated.confidence,
            variance: variance,
            early_accept: early_accept,
            providers_used: providers_used,
            total_cost_usd: total_cost,
            provenance: provenance,
            ensemble_method: aggregated.method
        });
        
    } catch (error) {
        console.error('Ensemble error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'ensembler',
        version: '1.0.0'
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🎯 Ensembler service listening on port ${PORT}`);
});

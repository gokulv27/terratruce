import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

class VoiceAgent {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-pro' }) : null;

        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.onStartCallback = null;
        this.onEndCallback = null;

        this.initRecognition();
    }

    initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-US';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('🎤 Voice agent listening...');
            if (this.onStartCallback) this.onStartCallback();
        };

        this.recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;

            console.log('📝 Heard:', transcript);

            // Process with AI
            const action = await this.processWithAI(transcript);

            if (this.onResultCallback) {
                this.onResultCallback({
                    transcript,
                    confidence,
                    action
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('❌ Voice error:', event.error);
            this.isListening = false;

            if (this.onErrorCallback) {
                this.onErrorCallback({
                    error: event.error,
                    message: this.getErrorMessage(event.error)
                });
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            console.log('🛑 Voice agent stopped');
            if (this.onEndCallback) this.onEndCallback();
        };
    }

    async processWithAI(transcript) {
        if (!this.model) {
            // Fallback to simple pattern matching
            return this.simplePatternMatch(transcript);
        }

        try {
            const prompt = `You are a voice assistant for a real estate app called Terra Truce. 
            
User said: "${transcript}"

Analyze this command and respond with a JSON object containing:
{
  "intent": "navigate|search|analyze|compare|help|unknown",
  "action": "home|dashboard|analyze|settings|land-management|income-tracker|search_property|compare_locations|show_help",
  "parameters": {
    "location": "extracted location if any",
    "query": "search query if any"
  },
  "response": "A brief, friendly response to speak back to the user (1 sentence)"
}

Examples:
- "go to dashboard" → {"intent": "navigate", "action": "dashboard", "response": "Opening your dashboard"}
- "search properties in Mumbai" → {"intent": "search", "action": "search_property", "parameters": {"location": "Mumbai"}, "response": "Searching for properties in Mumbai"}
- "analyze Chennai" → {"intent": "analyze", "action": "analyze", "parameters": {"location": "Chennai"}, "response": "Analyzing Chennai property market"}

Respond ONLY with valid JSON, no other text.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean and parse JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return this.simplePatternMatch(transcript);
        } catch (error) {
            console.error('AI processing error:', error);
            return this.simplePatternMatch(transcript);
        }
    }

    simplePatternMatch(transcript) {
        const lower = transcript.toLowerCase();

        // Navigation patterns
        if (lower.includes('home') || lower.includes('main page')) {
            return { intent: 'navigate', action: 'home', response: 'Going to home page' };
        }
        if (lower.includes('dashboard')) {
            return { intent: 'navigate', action: 'dashboard', response: 'Opening dashboard' };
        }
        if (lower.includes('analyze') || lower.includes('analysis')) {
            return { intent: 'navigate', action: 'analyze', response: 'Opening analysis page' };
        }
        if (lower.includes('settings') || lower.includes('setting')) {
            return { intent: 'navigate', action: 'settings', response: 'Opening settings' };
        }
        if (lower.includes('land') || lower.includes('property management')) {
            return { intent: 'navigate', action: 'land-management', response: 'Opening land management' };
        }
        if (lower.includes('income') || lower.includes('finance')) {
            return { intent: 'navigate', action: 'income-tracker', response: 'Opening income tracker' };
        }

        // Search patterns
        if (lower.includes('search') || lower.includes('find')) {
            const locationMatch = transcript.match(/in\s+([A-Za-z\s]+)/i);
            const location = locationMatch ? locationMatch[1].trim() : null;
            return {
                intent: 'search',
                action: 'search_property',
                parameters: { location },
                response: location ? `Searching in ${location}` : 'What location should I search?'
            };
        }

        // Compare patterns
        if (lower.includes('compare')) {
            return {
                intent: 'compare',
                action: 'compare_locations',
                response: 'Opening comparison tool'
            };
        }

        // Help
        if (lower.includes('help') || lower.includes('what can you do')) {
            return {
                intent: 'help',
                action: 'show_help',
                response: 'I can help you navigate, search properties, and analyze locations. Just ask!'
            };
        }

        return {
            intent: 'unknown',
            action: null,
            response: "I didn't understand that. Try saying 'go to dashboard' or 'search properties'"
        };
    }

    getErrorMessage(error) {
        switch (error) {
            case 'no-speech':
                return "I didn't hear anything. Please try again.";
            case 'audio-capture':
                return 'Microphone not found. Please check your device.';
            case 'not-allowed':
                return 'Microphone permission denied. Please allow access.';
            case 'network':
                return 'Network error. Please check your connection.';
            default:
                return `Voice error: ${error}`;
        }
    }

    startListening() {
        if (!this.recognition) {
            if (this.onErrorCallback) {
                this.onErrorCallback({
                    error: 'not-supported',
                    message: 'Voice recognition not supported in this browser'
                });
            }
            return false;
        }

        if (this.isListening) {
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error starting recognition:', error);
            return false;
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    speak(text, options = {}) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported');
            return;
        }

        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        if (options.onEnd) {
            utterance.onend = options.onEnd;
        }

        this.synthesis.speak(utterance);
    }

    onResult(callback) {
        this.onResultCallback = callback;
    }

    onError(callback) {
        this.onErrorCallback = callback;
    }

    onStart(callback) {
        this.onStartCallback = callback;
    }

    onEnd(callback) {
        this.onEndCallback = callback;
    }

    static isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
}

export default VoiceAgent;

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceAgent from '../../services/VoiceAgent';

const VoiceAssistant = () => {
    const navigate = useNavigate();
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const [voiceAgent] = useState(() => new VoiceAgent());

    useEffect(() => {
        // Set up callbacks
        voiceAgent.onStart(() => {
            setIsListening(true);
            setError(null);
            setTranscript('Listening...');
        });

        voiceAgent.onEnd(() => {
            setIsListening(false);
        });

        voiceAgent.onError((err) => {
            setError(err.message);
            setIsListening(false);
            setTimeout(() => setError(null), 3000);
        });

        voiceAgent.onResult(async (result) => {
            setTranscript(result.transcript);

            if (result.action) {
                // Speak response
                setIsSpeaking(true);
                voiceAgent.speak(result.action.response, {
                    onEnd: () => setIsSpeaking(false)
                });

                // Execute action
                setTimeout(() => {
                    executeAction(result.action);
                    setTranscript('');
                }, 1000);
            }
        });

        return () => {
            voiceAgent.stopListening();
        };
    }, [voiceAgent]);

    const executeAction = (action) => {
        switch (action.action) {
            case 'home':
                navigate('/');
                break;
            case 'dashboard':
                navigate('/dashboard');
                break;
            case 'analyze':
                navigate('/analyze');
                break;
            case 'settings':
                navigate('/settings');
                break;
            case 'land-management':
                navigate('/land-management');
                break;
            case 'income-tracker':
                navigate('/income-tracker');
                break;
            case 'search_property':
                if (action.parameters?.location) {
                    navigate(`/analyze?location=${encodeURIComponent(action.parameters.location)}`);
                } else {
                    navigate('/analyze');
                }
                break;
            case 'compare_locations':
                navigate('/analyze');
                break;
            case 'show_help':
                // Show help modal or navigate to help
                alert('Voice Commands:\n\n' +
                    '• "Go to dashboard"\n' +
                    '• "Search properties in [city]"\n' +
                    '• "Analyze [location]"\n' +
                    '• "Open settings"\n' +
                    '• "Show my lands"\n' +
                    '• "Open income tracker"');
                break;
            default:
                console.log('Unknown action:', action);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            voiceAgent.stopListening();
        } else {
            const started = voiceAgent.startListening();
            if (!started) {
                setError('Could not start voice recognition');
            }
        }
    };

    if (!VoiceAgent.isSupported()) {
        return null; // Don't show if not supported
    }

    return (
        <>
            {/* Floating Voice Button */}
            <button
                onClick={toggleListening}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 ${isListening
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 animate-pulse'
                        : isSpeaking
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-purple-500/50'
                    }`}
                title={isListening ? 'Stop listening' : 'Start voice command'}
            >
                {isListening ? (
                    <div className="relative">
                        <Mic className="h-6 w-6 text-white" />
                        <div className="absolute inset-0 rounded-full bg-white/30 animate-ping"></div>
                    </div>
                ) : isSpeaking ? (
                    <Loader className="h-6 w-6 text-white animate-spin" />
                ) : (
                    <MicOff className="h-6 w-6 text-white" />
                )}
            </button>

            {/* Transcript Display */}
            {(transcript || error) && (
                <div className="fixed bottom-24 right-6 z-50 max-w-xs animate-slide-up">
                    <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-lg border-2 ${error
                            ? 'bg-red-500/90 border-red-400 text-white'
                            : 'bg-purple-500/90 border-purple-400 text-white'
                        }`}>
                        <div className="flex items-start gap-3">
                            <Mic className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-bold mb-1">
                                    {error ? 'Error' : isListening ? 'Listening...' : 'Processing...'}
                                </p>
                                <p className="text-sm font-medium">
                                    {error || transcript}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx="true">{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default VoiceAssistant;

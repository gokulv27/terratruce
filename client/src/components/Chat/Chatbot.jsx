import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Minimize2, Sparkles, RefreshCcw, MapPin, BarChart2, Mic, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendChatMessage } from '../../services/api';
import { useAnalysis } from '../../context/AnalysisContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Chatbot = () => {
    const navigate = useNavigate();
    const { analysisState } = useAnalysis() || { analysisState: {} };
    const { location, riskData, chatTrigger, userLocation } = analysisState || {};

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Hello! I am the Terra Truce assistant. I can help you find properties, analyze risks, or compare locations. How can I help today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const lastTriggerRef = useRef(0);
    const chatContainerRef = useRef(null);
    const buttonRef = useRef(null);
    const recognitionRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    // Handle External Triggers
    useEffect(() => {
        if (chatTrigger && chatTrigger.timestamp > lastTriggerRef.current) {
            lastTriggerRef.current = chatTrigger.timestamp;
            if (!isOpen) setIsOpen(true);
            // Small delay to allow animation to start before sending
            setTimeout(() => handleSend(chatTrigger.message), 500);
        }
    }, [chatTrigger]);

    // GSAP Animation for Open/Close
    useGSAP(() => {
        if (isOpen) {
            gsap.fromTo(chatContainerRef.current,
                { opacity: 0, scale: 0.8, y: 20, transformOrigin: "bottom right" },
                { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.2)" }
            );
        }
    }, [isOpen]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const userMsg = { type: 'user', text: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Prepare context
            const context = {
                location: location || "",
                userLocation: userLocation || null,
                riskSummary: riskData ? {
                    overall_score: riskData.risk_analysis?.overall_score,
                    flood: riskData.risk_analysis?.flood_risk?.level,
                    crime: riskData.risk_analysis?.crime_rate?.trend,
                    market: riskData.market_intelligence?.current_trend
                } : null
            };

            // Format history for API
            // CRITICAL FIX: Filter out the initial static greeting to prevent "Assistant" being first message
            const apiHistory = messages
                .filter((_, index) => index > 0) // Skip first hello message
                .map(m => ({
                    role: m.type === 'bot' ? 'assistant' : 'user',
                    content: m.text
                }));

            apiHistory.push({ role: 'user', content: text });

            const response = await sendChatMessage(apiHistory, context);

            setMessages(prev => [...prev, { type: 'bot', text: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { type: 'bot', text: "I'm having trouble connecting to the network. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleNewChat = () => {
        setMessages([
            { type: 'bot', text: 'Chat context cleared. Starting a fresh conversation! Ask me about properties or risks.' }
        ]);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Voice Recognition Setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;

                // Direct Navigation Check
                const lower = transcript.toLowerCase();
                const isNav = lower.includes('go to') || lower.includes('open') || lower.includes('navigate');

                if (isNav) {
                    setIsListening(false);
                    if (lower.includes('dashboard')) {
                        speak("Opening Dashboard");
                        navigate('/dashboard');
                    } else if (lower.includes('market') || lower.includes('calculator')) {
                        speak("Opening Investment Calculator");
                        navigate('/market');
                    } else if (lower.includes('analyze') || lower.includes('map')) {
                        speak("Opening Analysis Map");
                        navigate('/analyze');
                    } else if (lower.includes('home')) {
                        speak("Going Home");
                        navigate('/');
                    } else {
                        // If nav command but unclear, put in chat
                        setInput(transcript);
                        setIsOpen(true);
                    }
                } else {
                    // Regular chat query
                    setInput(transcript);
                    setIsListening(false);
                    setIsOpen(true); // Open chat to show result
                }
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [navigate]);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            // Cancel current speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            // Get available voices
            const voices = window.speechSynthesis.getVoices();
            // Try to find a good female voice (Google US English or similar)
            const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
            if (preferredVoice) utterance.voice = preferredVoice;

            window.speechSynthesis.speak(utterance);
        }
    };

    // Keyboard Shortcuts (Cmd+M / Ctrl+M)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
                e.preventDefault();
                toggleVoiceInput();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isListening]);

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert('Voice recognition not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    // Suggestions based on context
    const suggestions = [
        { label: "Find plots for sale", icon: MapPin, action: () => handleSend(`Find plots for sale near ${location || "me"}`) },
        { label: "Analyze risk", icon: BarChart2, action: () => handleSend(`What are the main risks for buying property in ${location || "this area"}?`) },
        { label: "Compare prices", icon: Sparkles, action: () => handleSend(`How do property prices in ${location || "this area"} compare to nearby regions?`) },
    ];

    // GSAP Animation for Button Icon
    useGSAP(() => {
        const target = isOpen ? ".open-icon" : ".close-icon";
        gsap.fromTo(buttonRef.current,
            { rotation: isOpen ? -90 : 90, scale: 0.8 },
            { rotation: 0, scale: 1, duration: 0.4, ease: "back.out(1.5)" }
        );
    }, [isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {isOpen && (
                <div
                    ref={chatContainerRef}
                    className="bg-surface border border-border rounded-2xl shadow-2xl w-[350px] md:w-[400px] h-[600px] flex flex-col overflow-hidden mb-4 pointer-events-auto origin-bottom-right"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-4 flex items-center justify-between shadow-md z-10">
                        <div className="flex items-center gap-2 text-white">
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="font-bold block text-sm">Terra Assistant</span>
                                <span className="text-[10px] text-white/80 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Online & Search Enabled
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleNewChat}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Start New Chat"
                            >
                                <RefreshCcw className="h-4 w-4" />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <Minimize2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-elevated/30 custom-scrollbar">
                        {/* Context Bubble */}
                        {location && (
                            <div className="flex justify-center">
                                <span className="text-[10px] font-medium bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full border border-brand-primary/20">
                                    Context: {location}
                                </span>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex items-start gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-border ${msg.type === 'user' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gradient-to-br from-brand-primary to-brand-secondary'}`}>
                                    {msg.type === 'user' ? <User className="h-4 w-4 text-text-secondary" /> : <Bot className="h-4 w-4 text-white" />}
                                </div>
                                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.type === 'user'
                                    ? 'bg-brand-primary text-white rounded-tr-none'
                                    : 'bg-surface border border-border text-text-primary rounded-tl-none'
                                    }`}>
                                    <div className="whitespace-pre-wrap">
                                        {msg.type === 'bot' ? (
                                            msg.text.split(/(\[\[.*?\]\]\(.*?\))/g).map((part, i) => {
                                                const match = part.match(/\[\[(.*?)\]\]\((.*?)\)/);
                                                if (match) {
                                                    return (
                                                        <a
                                                            key={i}
                                                            href={match[2]}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 my-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-secondary transition-all shadow-md hover:scale-105 no-underline decoration-0"
                                                        >
                                                            {match[1]}
                                                            <span className="text-[10px] opacity-70 ml-1">↗</span>
                                                        </a>
                                                    );
                                                }
                                                // Strip asterisks if any remain
                                                return <span key={i}>{part.replace(/\*\*/g, '')}</span>;
                                            })
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-border bg-gradient-to-br from-brand-primary to-brand-secondary">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions - Always show when bot has responded and not typing */}
                    {!isTyping && messages.length > 0 && messages[messages.length - 1].type === 'bot' && (
                        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-border bg-surface-elevated/50">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={s.action}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-full text-xs font-medium text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all whitespace-nowrap shadow-sm"
                                >
                                    <s.icon className="h-3 w-3" />
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 bg-surface border-t border-border">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={isListening ? "Listening..." : "Ask about properties, risks..."}
                                className="flex-1 bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 text-text-primary placeholder:text-text-secondary transition-all"
                            />
                            <button
                                onClick={toggleVoiceInput}
                                className={`p-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 duration-200 ${isListening
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'bg-teal-500 text-white hover:bg-teal-600'
                                    }`}
                                title={isListening ? "Stop listening" : "Voice input"}
                            >
                                {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isTyping}
                                className="p-3 bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 duration-200"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-2xl pointer-events-auto relative group flex items-center justify-center ${isOpen ? 'bg-surface-elevated border border-border text-text-secondary' : 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white'}`}
            >
                {isOpen ? <X className="h-6 w-6" /> : (
                    <>
                        <MessageSquare className="h-6 w-6" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                        </span>
                    </>
                )}
            </button>


        </div>
    );
};

export default Chatbot;

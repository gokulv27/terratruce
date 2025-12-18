import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Hello! I am the Terra Truce assistant. Ask me anything about property risks, market trends, or how to use the dashboard.' }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { type: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simulate AI response (Replace with actual Perplexity/OpenAI call if needed later)
        setTimeout(() => {
            let botResponse = "I can help with that! However, I'm currently in demo mode. Try searching for a specific city in the dashboard.";

            if (input.toLowerCase().includes('risk')) {
                botResponse = "We analyze 10 key risk factors including crime, flood, and economic stability. Check the 'Risk Analysis' section after searching a location.";
            } else if (input.toLowerCase().includes('compare')) {
                botResponse = "You can compare up to 3 properties side-by-side using the 'Add to Compare' button on the analysis page.";
            }

            setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-surface border border-border rounded-2xl shadow-2xl w-[350px] h-[500px] flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <Bot className="h-5 w-5" />
                                <span className="font-bold">Terra Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                                <Minimize2 className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-elevated/30 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex items-start gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.type === 'user' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-brand-primary/20'}`}>
                                        {msg.type === 'user' ? <User className="h-4 w-4 text-text-secondary" /> : <Bot className="h-4 w-4 text-brand-primary" />}
                                    </div>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.type === 'user'
                                            ? 'bg-brand-primary text-white rounded-tr-none'
                                            : 'bg-surface border border-border text-text-primary rounded-tl-none shadow-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-surface border-t border-border">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-surface-elevated border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-text-primary"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="p-2 bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-2xl transition-all hover:scale-110 ${isOpen ? 'bg-surface-elevated border border-border text-text-secondary' : 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white'}`}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6 animate-pulse" />}
            </button>
        </div>
    );
};

export default Chatbot;

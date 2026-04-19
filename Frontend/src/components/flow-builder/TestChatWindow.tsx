import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
    sender: 'user' | 'bot';
    text: string;
    timestamp: number;
}

interface TestChatWindowProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
    onClose: () => void;
    isWaitingForInput: boolean;
}

export const TestChatWindow: React.FC<TestChatWindowProps> = ({
    messages,
    onSendMessage,
    onClose,
    isWaitingForInput
}) => {
    const [input, setInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (input.trim() && isWaitingForInput) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-24 right-6 bg-indigo-600 hover:bg-indigo-700 p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-40"
            >
                <span className="text-2xl">💬</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                <div>
                    <h3 className="font-semibold text-white">Test Chat</h3>
                    <p className="text-xs text-slate-400">Simulate user interactions</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    >
                        <Minimize2 size={16} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-950/50">
                {messages.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-1">Messages will appear here during flow execution</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${msg.sender === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'
                            }`}>
                            <p className="text-sm">{msg.text}</p>
                            <span className="text-[10px] opacity-50 mt-1 block">
                                {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                {!isWaitingForInput && (
                    <div className="text-center py-2 text-slate-500 text-xs">
                        Flow not waiting for input
                    </div>
                )}

                <div className={`flex gap-2 ${!isWaitingForInput ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isWaitingForInput ? "Type your response..." : "Waiting..."}
                        disabled={!isWaitingForInput}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || !isWaitingForInput}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed p-2.5 rounded-xl transition-colors flex items-center justify-center"
                    >
                        <Send size={16} className="text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

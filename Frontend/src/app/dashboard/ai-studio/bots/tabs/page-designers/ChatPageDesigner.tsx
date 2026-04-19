"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Save, MessageSquare } from "lucide-react";

interface ChatPageDesignerProps {
    config: any;
    orgId: string;
}

interface ChatConfig {
    bubbleStyle: 'rounded' | 'square';
    cornerRadius: number;
    showTimestamps: boolean;
    showTypingIndicator: boolean;
    showPoweredBy: boolean;
    placeholder: string;
    welcomeMessage: string;
    suggestedPrompts: string[];
}

const defaultChatConfig: ChatConfig = {
    bubbleStyle: 'rounded',
    cornerRadius: 16,
    showTimestamps: true,
    showTypingIndicator: true,
    showPoweredBy: true,
    placeholder: 'Type your message...',
    welcomeMessage: 'Hi! How can I help you today?',
    suggestedPrompts: ['What are your services?', 'Pricing information', 'Get support']
};

export function ChatPageDesigner({ config, orgId }: ChatPageDesignerProps) {
    const [chatConfig, setChatConfig] = useState<ChatConfig>(defaultChatConfig);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('cluaiz-chat-config');
        if (saved) {
            try {
                setChatConfig(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load chat config:', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cluaiz-chat-config', JSON.stringify(chatConfig));
    }, [chatConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            toast({
                title: "✅ Chat Page Saved!",
                description: "Your chat settings are updated"
            });
        } catch (error) {
            toast({
                title: "❌ Error",
                description: "Failed to save configuration",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center px-8 py-6 border-b border-white/5">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        Chat Interface Designer
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Customize your chat experience</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Display Options */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">Display Options</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <Label className="text-white">Show Timestamps</Label>
                                    <p className="text-xs text-slate-400 mt-1">Display message times</p>
                                </div>
                                <button
                                    onClick={() => setChatConfig(prev => ({ ...prev, showTimestamps: !prev.showTimestamps }))}
                                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all ${chatConfig.showTimestamps ? 'bg-green-600' : 'bg-slate-700'
                                        }`}
                                >
                                    <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${chatConfig.showTimestamps ? 'translate-x-11' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <Label className="text-white">Show Typing Indicator</Label>
                                    <p className="text-xs text-slate-400 mt-1">Bot typing animation</p>
                                </div>
                                <button
                                    onClick={() => setChatConfig(prev => ({ ...prev, showTypingIndicator: !prev.showTypingIndicator }))}
                                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all ${chatConfig.showTypingIndicator ? 'bg-green-600' : 'bg-slate-700'
                                        }`}
                                >
                                    <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${chatConfig.showTypingIndicator ? 'translate-x-11' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <Label className="text-white">Show "Powered by Cluaiz"</Label>
                                    <p className="text-xs text-slate-400 mt-1">Branding footer</p>
                                </div>
                                <button
                                    onClick={() => setChatConfig(prev => ({ ...prev, showPoweredBy: !prev.showPoweredBy }))}
                                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all ${chatConfig.showPoweredBy ? 'bg-green-600' : 'bg-slate-700'
                                        }`}
                                >
                                    <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${chatConfig.showPoweredBy ? 'translate-x-11' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Input Settings */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">Input Settings</h4>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-slate-300 mb-2">Placeholder Text</Label>
                                <Input
                                    value={chatConfig.placeholder}
                                    onChange={(e) => setChatConfig(prev => ({ ...prev, placeholder: e.target.value }))}
                                    placeholder="Type your message..."
                                    className="bg-black/40 border-white/20 text-white"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300 mb-2">Welcome Message</Label>
                                <Textarea
                                    value={chatConfig.welcomeMessage}
                                    onChange={(e) => setChatConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                                    placeholder="Hi! How can I help you today?"
                                    rows={2}
                                    className="bg-black/40 border-white/20 text-white resize-none"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

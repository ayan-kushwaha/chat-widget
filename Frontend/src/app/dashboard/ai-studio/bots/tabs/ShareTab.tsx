"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Copy, Download, Share2, MessageCircle, Mail, Link2, QrCode, ExternalLink } from "lucide-react";

interface ShareTabProps {
    config: any;
    orgId: string;
}

export function ShareTab({ config, orgId }: ShareTabProps) {
    const isLocal = process.env.NODE_ENV === 'development' ||
        (typeof window !== 'undefined' && window.location.hostname === 'localhost');
    const widgetUrl = isLocal ? 'http://localhost:3000' : 'https://app.cluaiz.com';
    const displayOrgId = orgId || "YOUR_ORG_ID";
    const shareUrl = `${widgetUrl}/embed/chat?embed=1&orgId=${displayOrgId}`;

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                    Share Your Live Bot
                </h1>
                <p className="text-slate-400 text-lg">
                    Share your AI assistant with the world using QR codes, direct links, or social channels
                </p>
            </div>

            {/* Direct Link Section */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Link2 className="w-6 h-6 text-purple-400" />
                    <h2 className="text-2xl font-bold text-white">Direct Link</h2>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
                    <div className="font-mono text-sm text-purple-300 break-all mb-4">
                        {shareUrl}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                toast({ title: "✅ Copied!", description: "Link copied to clipboard" });
                            }}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                        </Button>
                        <Button
                            onClick={() => window.open(shareUrl, '_blank')}
                            variant="outline"
                            className="flex-1 border-purple-500/30 hover:bg-purple-500/10 text-purple-400"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Preview
                        </Button>
                    </div>
                </div>
            </div>

            {/* QR Code & Social Share Grid */}
            <div className="grid lg:grid-cols-2 gap-8">

                {/* QR Code Section */}
                <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <QrCode className="w-6 h-6 text-blue-400" />
                        <h2 className="text-2xl font-bold text-white">QR Code</h2>
                    </div>

                    <div className="text-center space-y-6">
                        <div className="bg-white p-6 rounded-2xl inline-block shadow-xl">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(shareUrl)}`}
                                alt="QR Code"
                                className="w-64 h-64"
                            />
                        </div>

                        <p className="text-slate-400 text-sm">
                            Scan with mobile device to open bot
                        </p>

                        <Button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(shareUrl)}`;
                                link.download = `cluaiz-bot-qr-${displayOrgId}.png`;
                                link.click();
                                toast({ title: "✅ Downloaded!", description: "QR code saved as PNG" });
                            }}
                            variant="outline"
                            className="w-full border-blue-500/30 hover:bg-blue-500/10 text-blue-400"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download QR Code (1000x1000)
                        </Button>
                    </div>
                </div>

                {/* Social Share Section */}
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Share2 className="w-6 h-6 text-green-400" />
                        <h2 className="text-2xl font-bold text-white">Quick Share</h2>
                    </div>

                    <div className="space-y-4">
                        {/* WhatsApp */}
                        <button
                            onClick={() => {
                                const text = `Check out our AI assistant! Chat here: ${shareUrl}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="w-full flex items-center gap-4 p-5 bg-green-600/10 border border-green-600/30 rounded-xl hover:bg-green-600/20 hover:border-green-600/50 transition-all group"
                        >
                            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform">
                                📱
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-lg font-semibold text-green-400">Share on WhatsApp</div>
                                <div className="text-sm text-slate-500">Send to your contacts instantly</div>
                            </div>
                            <ExternalLink className="w-5 h-5 text-green-400/50 group-hover:text-green-400 transition-colors" />
                        </button>

                        {/* Email */}
                        <button
                            onClick={() => {
                                const subject = 'Try our AI Assistant';
                                const body = `Hi,\n\nI'd like to share our AI assistant with you. You can chat with it here:\n\n${shareUrl}\n\nBest regards`;
                                window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                            }}
                            className="w-full flex items-center gap-4 p-5 bg-blue-600/10 border border-blue-600/30 rounded-xl hover:bg-blue-600/20 hover:border-blue-600/50 transition-all group"
                        >
                            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform">
                                ✉️
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-lg font-semibold text-blue-400">Share via Email</div>
                                <div className="text-sm text-slate-500">Send invitation to anyone</div>
                            </div>
                            <ExternalLink className="w-5 h-5 text-blue-400/50 group-hover:text-blue-400 transition-colors" />
                        </button>

                        {/* Copy Link Card */}
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                toast({
                                    title: "✅ Link Copied!",
                                    description: "Paste anywhere to share"
                                });
                            }}
                            className="w-full flex items-center gap-4 p-5 bg-purple-600/10 border border-purple-600/30 rounded-xl hover:bg-purple-600/20 hover:border-purple-600/50 transition-all group"
                        >
                            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform">
                                🔗
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-lg font-semibold text-purple-400">Copy Direct Link</div>
                                <div className="text-sm text-slate-500">Share on any platform</div>
                            </div>
                            <Copy className="w-5 h-5 text-purple-400/50 group-hover:text-purple-400 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Embed Options */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-slate-400" />
                    More Sharing Options
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="text-3xl mb-2">📄</div>
                        <div className="font-semibold text-white mb-1">Embed Code</div>
                        <div className="text-xs text-slate-500">Go to Install tab for script</div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="text-3xl mb-2">🎨</div>
                        <div className="font-semibold text-white mb-1">Customize Widget</div>
                        <div className="text-xs text-slate-500">Design tab for branding</div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="text-3xl mb-2">📊</div>
                        <div className="font-semibold text-white mb-1">Track Analytics</div>
                        <div className="text-xs text-slate-500">Monitor engagement soon</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

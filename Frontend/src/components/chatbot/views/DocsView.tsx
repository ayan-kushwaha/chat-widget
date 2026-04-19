"use client";

import React from 'react';
import { Book, FileText, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface DocsViewProps {
    onNavigate: (view: string) => void;
}

export const DocsView: React.FC<DocsViewProps> = ({ onNavigate }) => {
    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 no-scrollbar animate-fadeIn">
            <header className="mb-6">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Book className="w-6 h-6 text-blue-500" />
                    Documentation
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Everything you need to know about Cluaiz</p>
            </header>

            <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <Zap className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-slate-800 dark:text-white">Quick Start</h2>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Learn how to set up your Cluaiz assistant in minutes. We provide easy-to-follow steps for embedding the widget on any website.
                    </p>
                    <button className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-wider hover:underline">
                        Read Guide <ExternalLink className="w-3 h-3" />
                    </button>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                            <FileText className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-slate-800 dark:text-white">API Reference</h2>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Detailed documentation for our developers. Integrate Cluaiz with your favorite tools via our robust API and Webhooks.
                    </p>
                    <button className="mt-4 flex items-center gap-1 text-[10px] font-bold text-purple-500 uppercase tracking-wider hover:underline">
                        View API Docs <ExternalLink className="w-3 h-3" />
                    </button>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-slate-800 dark:text-white">Privacy & Security</h2>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        We take your data seriously. Learn about our encryption standards and how we keep your business information safe and private.
                    </p>
                    <button className="mt-4 flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider hover:underline">
                        Security Policy <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <footer className="mt-8 pb-10 text-center">
                <p className="text-xs text-slate-400">Need more help? Visit our website at cluaiz.com</p>
            </footer>
        </div>
    );
};

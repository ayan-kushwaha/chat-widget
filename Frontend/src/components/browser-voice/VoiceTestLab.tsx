'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { BrowserTTS } from './BrowserTTS';
import { getVoiceMetadata, UNIVERSAL_VOICE_REGISTRY } from './UniversalVoiceRegistry';
import { SUPPORTED_LANGUAGES } from './LanguageData';
import { RefreshCcw, Search, Loader2 } from 'lucide-react';
import { NeuralVoicePlayer } from './NeuralVoicePlayer';
import { CloudTTS } from './CloudTTS';


export const VoiceTestLab: React.FC = () => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [testText, setTestText] = useState('Namaste! I am Cluaiz. I can speak every bhasha on Earth.');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeLangCode, setActiveLangCode] = useState<string | null>(null);
    const [activeWordIdx, setActiveWordIdx] = useState(-1);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const refreshVoices = () => {
        const availableVoices = BrowserTTS.getAvailableVoices();
        setVoices(availableVoices);
    };



    useEffect(() => {
        refreshVoices();
        window.speechSynthesis.onvoiceschanged = refreshVoices;
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            BrowserTTS.stop();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);



    const filteredLanguages = useMemo(() => {
        return SUPPORTED_LANGUAGES.filter(l =>
            searchQuery === '' ||
            l.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const DEFAULT_LOCALE_MAP: Record<string, string> = {
        'hi': 'hi-IN', 'ar': 'ar-SA', 'ur': 'ur-PK', 'bn': 'bn-IN',
        'gu': 'gu-IN', 'mr': 'mr-IN', 'ta': 'ta-IN', 'te': 'te-IN',
        'kn': 'kn-IN', 'ml': 'ml-IN', 'pa': 'pa-IN', 'bho': 'bho-IN',
        'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
        'ja': 'ja-JP', 'ko': 'ko-KR', 'zh': 'zh-CN', 'ru': 'ru-RU',
        'pt': 'pt-PT', 'en': 'en-US'
    };

    const categorized = useMemo(() => {
        const browserVoices = voices;
        const rawPreferred = typeof navigator !== 'undefined' ? navigator.languages.map(l => l.toLowerCase()) : [];

        const preferredSet = new Set<string>();
        rawPreferred.forEach(code => {
            const resolved = DEFAULT_LOCALE_MAP[code] || (UNIVERSAL_VOICE_REGISTRY[code as keyof typeof UNIVERSAL_VOICE_REGISTRY] ? code : null);
            if (resolved) preferredSet.add(resolved.toLowerCase());
            else {
                const base = code.split('-')[0];
                const fallback = DEFAULT_LOCALE_MAP[base] || Object.keys(UNIVERSAL_VOICE_REGISTRY).find(k => k.toLowerCase().startsWith(base + '-'));
                if (fallback) preferredSet.add(fallback.toLowerCase());
            }
        });

        return filteredLanguages.reduce((acc, lang) => {
            const target = lang.code.toLowerCase();
            const baseLang = target.split('-')[0];

            const hasBrowserNative = browserVoices.some(v => v.localService && (v.lang.toLowerCase().replace('_', '-').startsWith(baseLang)));
            const hasBrowserCloud = browserVoices.some(v => !v.localService && (v.lang.toLowerCase().replace('_', '-').startsWith(baseLang)));
            const hasEdgeSupport = BrowserTTS.getCloudVoice(lang.code);
            const isPreferred = preferredSet.has(target);

            const langData = { ...lang, isNative: hasBrowserNative, isCloud: hasBrowserCloud, isEdge: !!hasEdgeSupport };

            if (isPreferred) acc.preferred.push(langData);
            else if (hasBrowserNative) acc.native.push(langData);
            else if (hasBrowserCloud) acc.browserCloud.push(langData);
            else if (hasEdgeSupport) acc.edge.push(langData);

            return acc;
        }, { preferred: [] as any[], browserCloud: [] as any[], native: [] as any[], edge: [] as any[] });
    }, [filteredLanguages, voices]);



    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
            <audio ref={audioRef} className="hidden" />
            <div className="max-w-6xl mx-auto">
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tighter">
                            Universal Voice Lab
                        </h1>
                        <p className="text-gray-400 mt-1 text-lg font-medium">Test 150+ bhashas with native system voices.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={refreshVoices} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-white/10 transition-all font-bold text-xs uppercase tracking-widest">
                            <RefreshCcw size={16} /> Sync Engine
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 mb-12 shadow-2xl">
                    <div className="flex flex-col lg:flex-row gap-10 items-center">
                        <div className="flex-1 w-full space-y-4">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] px-2">Neural Text Stream</label>
                            <textarea
                                value={testText}
                                onChange={(e) => setTestText(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none h-32"
                                placeholder="Type anything to test..."
                            />
                        </div>
                        <div className="flex flex-col items-center gap-4 bg-white/5 p-10 rounded-[2rem] border border-white/5 min-w-[320px]">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Neural Analyzer</label>
                            <NeuralVoicePlayer
                                text={testText}
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-10 sticky top-4 z-40">
                    <div className="relative group">
                        <Search className="absolute z-20 left-6 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-400 transition-colors" size={22} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find any bhasha (Hindi, Urdu, Korean, Arabic...)"
                            className="w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-full py-5 pl-16 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-lg font-medium shadow-xl"
                        />
                    </div>
                </div>

                <div className="space-y-20 mb-20">
                    {[
                        { title: "Your Preferred", data: categorized.preferred, badge: "Browser Settings", color: "orange" },
                        { title: "Local Browser", data: categorized.native, badge: "Native System", color: "purple" },
                        { title: "Browser Cloud", data: categorized.browserCloud, badge: "Online Google", color: "blue" },
                        { title: "Edge Cloud", data: categorized.edge, badge: "Premium Neural", color: "emerald" }
                    ].map((section) => section.data.length > 0 && (
                        <div key={section.title} className="space-y-8">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{section.title}</h2>
                                <span className={`px-3 py-1 bg-${section.color}-500/10 text-${section.color}-400 text-[10px] font-black rounded-full border border-${section.color}-500/20 uppercase tracking-widest`}>
                                    {section.badge} ({section.data.length} Languages)
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {section.data.map((lang: any) => {
                                    const words = lang.sampleText.split(/(\s+)/);
                                    let wordCounter = 0;

                                    return (
                                        <div key={lang.code} className="group p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-500 overflow-hidden">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-black/20 flex items-center justify-center text-4xl group-hover:scale-110 group-hover:bg-black/30 transition-all duration-500">
                                                        {lang.flag}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h3 className="font-black text-xl tracking-tight text-gray-200 group-hover:text-white transition-colors">
                                                            {lang.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{lang.displayName}</span>
                                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${section.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                                                                section.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                                                                    'bg-emerald-500/20 text-emerald-400'
                                                                }`}>
                                                                {section.badge.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 px-3 py-1.5 bg-black/40 rounded-2xl border border-white/10 shadow-inner">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">{lang.code}</span>
                                                </div>
                                            </div>

                                            {/* 📖 Text Area with Highlighting */}
                                            <div className="relative mb-6 p-5 rounded-3xl bg-black/40 border border-white/5 min-h-[100px] flex flex-wrap gap-x-1.5 gap-y-1 items-start content-start transition-all duration-500">
                                                {words.map((w: string, i: number) => {
                                                    const isWhitespace = /\s+/.test(w);
                                                    if (isWhitespace) return <span key={i} className="w-1" />;
                                                    const idx = wordCounter++;
                                                    const isCurrentWord = activeLangCode === lang.code && idx === activeWordIdx;
                                                    return (
                                                        <span key={i} className={`relative  ${isCurrentWord ? 'text-white  ' : 'text-gray-500'}`}>
                                                            {isCurrentWord && (
                                                                <motion.span
                                                                    layoutId="highlight"
                                                                    className={`absolute inset-0 -z-10 rounded-lg  opacity-20 ${section.color === 'purple' ? 'bg-purple-500 shadow-purple-500/20' :
                                                                        section.color === 'blue' ? 'bg-blue-500 shadow-blue-500/20' :
                                                                            'bg-emerald-500 shadow-emerald-500/20'
                                                                        }`}
                                                                />
                                                            )}
                                                            {w}
                                                        </span>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex justify-center">
                                                <NeuralVoicePlayer
                                                    text={lang.sampleText}
                                                    lang={lang.code}
                                                    accentColor={section.color === 'orange' ? 'blue' : (section.color as any)}
                                                    preferOnline={section.color === 'blue' || section.color === 'emerald'}
                                                    onWordChange={(idx) => {
                                                        if (activeLangCode !== lang.code) setActiveLangCode(lang.code);
                                                        setActiveWordIdx(idx);
                                                    }}
                                                    onEnd={() => {
                                                        setActiveWordIdx(-1);
                                                        setActiveLangCode(null);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                    <h2 className="text-2xl font-black text-white mb-8">System Engine Diagnostic</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
                        {voices.map((v, i) => (
                            <div key={i} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-200 line-clamp-1">{v.name}</span>
                                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{v.lang}</span>
                                </div>
                                {v.localService ? <span className="text-[8px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg font-black uppercase">Local</span> : <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg font-black uppercase">Cloud</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-8 right-8 flex items-center gap-4 bg-black/80 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-full shadow-2xl z-50">
                <div className="flex -space-x-2">
                    {voices.slice(0, 3).map((v, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-sm ring-1 ring-white/5">
                            {getVoiceMetadata(v.lang).flag}
                        </div>
                    ))}
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Global Engine Live</span>
                    <span className="text-xs font-bold text-white">{SUPPORTED_LANGUAGES.length}+ Languages Active</span>
                </div>
            </div>
        </div>
    );
};

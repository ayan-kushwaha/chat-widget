
"use client";

import React, { useState } from 'react';
import { Sparkles, User, Play, Scissors, Trash2, AlertTriangle } from 'lucide-react';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';
import { BsBadgeHd, BsBadgeHdFill } from "react-icons/bs";
import { motion } from 'framer-motion';
import Image from 'next/image';

interface FilePreviewProps {
    file: File;
    previewUrl: string;
    sendToAI: boolean;
    onToggleAI: () => void;
    onRemove: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
    file,
    previewUrl,
    sendToAI,
    onToggleAI,
    onRemove,
}) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isLargeFile = file.size > 10 * 1024 * 1024; // > 10MB

    const [isHD, setIsHD] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isTrimming, setIsTrimming] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Trim State
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Constraints
    const MAX_DURATION = 60; // 1 minute
    // Duration is now valid if the TRIMMED duration is < 60s
    const currentDuration = trimEnd - trimStart;
    const isOverDuration = currentDuration > MAX_DURATION;

    // Calculate estimated size based on trim ratio
    const originalDuration = duration || 1; // Avoid divide by zero
    const trimRatio = isVideo ? (currentDuration / originalDuration) : 1;
    const estimatedSize = file.size * trimRatio;
    const isLargeTrimmedFile = estimatedSize > 10 * 1024 * 1024; // > 10MB check on trimmed size

    // Only invalid if the FINAL trimmed result is invalid
    const isInvalid = isLargeTrimmedFile || isOverDuration;

    const formatTime = (secs: number) => {
        if (!isFinite(secs) || secs < 0) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const vidDuration = e.currentTarget.duration;
        setDuration(vidDuration);
        setTrimEnd(vidDuration);
        // If long video, auto-suggest a 60s crop? Optional, but good UX.
        if (vidDuration > 60) {
            setTrimEnd(60);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`mb-2 bg-[#0f1115] border rounded-2xl overflow-hidden shadow-2xl relative group transition-colors ${isInvalid ? 'border-red-500/30' : 'border-white/10'}`}
        >
            {/* 🎥 Full Media Preview Area */}
            <div className="relative w-full bg-black/50 flex items-center justify-center overflow-hidden">
                {isImage && (
                    <div className="relative w-full bg-[#050505] flex items-center justify-center">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-w-full max-h-[300px] object-contain w-auto h-auto cursor-zoom-in"
                            onClick={() => setIsModalOpen(true)}
                        />
                        {/* HD Toggle Overlay for Image */}
                        <button
                            onClick={() => setIsHD(!isHD)}
                            className={`absolute top-3 right-3 p-1 rounded-md transition-all ${isHD ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-black/40 hover:text-white'}`}
                        >
                            {isHD ? <BsBadgeHdFill size={24} /> : <BsBadgeHd size={24} />}
                        </button>
                    </div>
                )}

                {/* 🌟 Full Screen Modal */}
                {isModalOpen && isImage && (
                    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8" onClick={() => setIsModalOpen(false)}>
                        <button className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white transition-colors bg-white/10 rounded-full">
                            <AnimatedX size={24} animateOnHover />
                        </button>
                        <img
                            src={previewUrl}
                            alt="Full Preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                {isVideo && (
                    <div className="relative w-full bg-[#050505] flex flex-col items-center">
                        <video
                            ref={videoRef}
                            src={previewUrl}
                            className="max-h-[45vh] w-full object-contain"
                            controls
                            onLoadedMetadata={handleLoadedMetadata}
                            onTimeUpdate={() => {
                                if (videoRef.current && isTrimming) {
                                    if (videoRef.current.currentTime >= trimEnd) {
                                        videoRef.current.currentTime = trimStart;
                                        videoRef.current.play();
                                    }
                                }
                            }}
                        />
                        {/* Video Controls Overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            {/* HD Toggle */}
                            <button
                                onClick={() => setIsHD(!isHD)}
                                className={`p-1 rounded-md transition-all backdrop-blur-md ${isHD ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 bg-black/60 hover:text-white'}`}
                                title={isHD ? "HD Quality (1080p)" : "Standard Quality (720p)"}
                            >
                                {isHD ? <BsBadgeHdFill size={20} /> : <BsBadgeHd size={20} />}
                            </button>
                        </div>

                        {/* ✂️ Dynamic Trimming UI */}
                        {isTrimming && (
                            <div className="w-full bg-[#121212] border-t border-white/5 p-3 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-2 font-mono uppercase tracking-wider">
                                    <span>Start: <span className="text-white">{formatTime(trimStart)}</span></span>
                                    <span className={isOverDuration ? "text-red-500 font-bold" : "text-emerald-500"}>Duration: {formatTime(currentDuration)}</span>
                                    <span>End: <span className="text-white">{formatTime(trimEnd)}</span></span>
                                </div>

                                <div className="relative h-6 w-full flex items-center select-none">
                                    {/* Track */}
                                    <div className="absolute inset-x-0 h-1.5 bg-zinc-800 rounded-full"></div>

                                    {/* Active Range */}
                                    <div
                                        className="absolute h-1.5 bg-emerald-500/50 rounded-full"
                                        style={{
                                            left: `${(trimStart / duration) * 100}%`,
                                            right: `${100 - (trimEnd / duration) * 100}%`
                                        }}
                                    ></div>

                                    {/* Range Inputs (Invisible but functional) */}
                                    <input
                                        type="range"
                                        min={0} max={duration} step={0.1}
                                        value={trimStart}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (val < trimEnd - 1) {
                                                setTrimStart(val);
                                                if (videoRef.current) videoRef.current.currentTime = val;
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-6"
                                    />
                                    <input
                                        type="range"
                                        min={0} max={duration} step={0.1}
                                        value={trimEnd}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (val > trimStart + 1) {
                                                setTrimEnd(val);
                                                if (videoRef.current) videoRef.current.currentTime = val;
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-6"
                                    />

                                    {/* Visual Thumbs */}
                                    <div
                                        className="absolute w-1.5 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10 pointer-events-none"
                                        style={{ left: `${(trimStart / duration) * 100}%` }}
                                    ></div>
                                    <div
                                        className="absolute w-1.5 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10 pointer-events-none"
                                        style={{ left: `${(trimEnd / duration) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isAudio && (
                    <div className="w-full h-32 bg-gradient-to-r from-violet-900/20 to-fuchsia-900/20 flex flex-col items-center justify-center gap-3 border-b border-white/5">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                            <Play size={20} className="text-white fill-current ml-1" />
                        </div>
                        <p className="text-xs font-mono text-zinc-400">Audio Preview</p>
                    </div>
                )}

                {!isImage && !isVideo && !isAudio && (
                    <div className="w-full h-24 bg-blue-500/5 flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <User size={20} className="text-blue-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white max-w-[200px] truncate">{file.name}</p>
                            <p className="text-xs text-blue-400">Document Attachment</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 🎛️ Control Panel (The "Cipka" Toolbar) */}
            <div className="bg-[#121212] p-3 border-t border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col min-w-0 pr-4">
                        <h4 className="text-xs font-bold text-white truncate max-w-[180px]">{file.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isLargeTrimmedFile ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                {(estimatedSize / 1024 / 1024).toFixed(1)} MB
                            </span>
                            {isHD && <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5"><Sparkles size={8} /> HD</span>}
                            {isLargeTrimmedFile && <span className="text-[10px] text-red-500 flex items-center gap-1"><AlertTriangle size={10} /> Max 10MB</span>}
                            {isOverDuration && <span className="text-[10px] text-red-500 flex items-center gap-1"><AlertTriangle size={10} /> {formatTime(currentDuration)} (Max 60s)</span>}
                        </div>
                    </div>

                    {/* Tools Row */}
                    <div className="flex items-center gap-1">
                        {isVideo && (
                            <button
                                onClick={() => {
                                    if (!isTrimming) {
                                        setIsTrimming(true);
                                    } else if (!isInvalid) {
                                        setIsTrimming(false);
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium cursor-pointer ${isTrimming
                                    ? (isInvalid ? 'bg-red-500/10 text-red-500 cursor-not-allowed opacity-50' : 'bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/50 hover:bg-emerald-500/30')
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                            >
                                <Scissors size={12} />
                                <span>{isTrimming ? 'Done' : 'Trim'}</span>
                            </button>
                        )}
                        <button
                            onClick={onRemove}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                            title="Remove File"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* 🤖 AI Logic Toggle (Images Only) */}
                {isImage ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => !sendToAI && onToggleAI()}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${sendToAI
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                : 'bg-zinc-900 border border-white/5 text-zinc-500 hover:bg-zinc-800'
                                }`}
                        >
                            <Sparkles size={14} className={sendToAI ? "animate-pulse" : ""} />
                            Analyze
                        </button>
                        <button
                            onClick={() => sendToAI && onToggleAI()}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!sendToAI
                                ? 'bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                : 'bg-zinc-900 border border-white/5 text-zinc-500 hover:bg-zinc-800'
                                }`}
                        >
                            <User size={14} />
                            Send Only
                        </button>
                    </div>
                ) : null}
            </div>
        </motion.div>
    );
};

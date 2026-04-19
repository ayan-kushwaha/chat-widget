"use client";

import React from 'react';
import { ChevronRight, Monitor, X, Sparkles, MousePointer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';

// ----------------------------------------------------------------------
// 🛠️ SHARED SETTINGS COMPONENTS
// ----------------------------------------------------------------------

export const SettingSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-3">
        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-4">{title}</h3>
        <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
            {children}
        </div>
    </div>
);

interface SettingItemProps {
    label: string;
    description: string;
    toggle?: boolean;
    action?: string;
    active?: boolean;
    onToggle?: () => void;
    icon?: any;
}

export const SettingItem = ({ label, description, toggle = false, action, active = false, onToggle, icon: Icon }: SettingItemProps) => {
    const handleClick = (e: React.MouseEvent) => {
        if (toggle && onToggle) {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "flex items-center justify-between p-6 hover:bg-white/5 transition-all group border-b border-white/5 last:border-none cursor-default",
                toggle && "cursor-pointer"
            )}
        >
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", active ? "bg-emerald-500/10 text-emerald-500" : "bg-black/40 text-zinc-500 group-hover:text-zinc-400")}>
                        <Icon size={20} />
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{label}</span>
                    <span className="text-[11px] text-zinc-500 font-medium leading-relaxed">{description}</span>
                </div>
            </div>
            {toggle ? (
                <button type="button" className={cn("w-10 h-5 rounded-full relative transition-all pointer-events-none", active ? "bg-emerald-500" : "bg-zinc-700")}>
                    <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", active ? "left-6" : "left-1")} />
                </button>
            ) : action ? (
                <button type="button" className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-white transition-colors">{action}</button>
            ) : (
                <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
            )}
        </div>
    );
};

export const ThemeCard = ({ label, active = false }: { label: string, active?: boolean }) => (
    <div className={cn(
        "flex-1 p-6 bg-zinc-800/50 border rounded-3xl cursor-pointer transition-all flex flex-col items-center gap-4 group",
        active ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/5 hover:border-zinc-700"
    )}>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-black/40", active ? "text-emerald-500" : "text-zinc-600 group-hover:text-zinc-400")}>
            <Monitor size={24} />
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-emerald-500" : "text-zinc-600 group-hover:text-zinc-400")}>{label}</span>
    </div>
);

export const BackgroundCard = ({ mode, isActive }: { mode: string, isActive: boolean }) => {
    const setBg = useThemeStore((state) => state.setBgType);

    return (
        <div
            onClick={() => setBg(mode as any)}
            className={cn(
                "relative group cursor-pointer overflow-hidden rounded-2xl border transition-all h-24 flex items-center justify-center bg-black",
                isActive ? "border-emerald-500 ring-1 ring-emerald-500/50" : "border-white/10 hover:border-white/30"
            )}
        >
            <div className={cn(
                "absolute inset-0 opacity-40 transition-opacity group-hover:opacity-60",
                mode === 'galaxy' && "bg-gradient-to-br from-indigo-900 via-purple-900 to-black",
                mode === 'liquid' && "bg-gradient-to-tr from-blue-900 via-cyan-900 to-black",
                mode === 'ripple' && "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black",
                mode === 'threads' && "bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-zinc-900 to-black",
                mode === 'PixelBlast' && "bg-gradient-to-b from-emerald-900/40 to-black",
                mode === 'none' && "bg-zinc-900"
            )} />

            <div className="relative z-10 flex flex-col items-center gap-2">
                {mode === 'none' ? <X size={20} className="text-zinc-500" /> : <Sparkles size={16} className={isActive ? "text-emerald-400" : "text-white/70"} />}
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    isActive ? "text-white" : "text-zinc-400"
                )}>
                    {mode}
                </span>
            </div>

            {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}
        </div>
    );
};

export const CursorCard = ({ type, isActive }: { type: string, isActive: boolean }) => {
    const setCursor = useThemeStore((state) => state.setCursorType);

    return (
        <div
            onClick={() => setCursor(type as any)}
            className={cn(
                "flex-1 p-4 bg-zinc-800/50 border rounded-2xl cursor-pointer transition-all flex flex-col items-center gap-2 group",
                isActive ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/5 hover:border-zinc-700"
            )}
        >
            <MousePointer size={20} className={isActive ? "text-emerald-500" : "text-zinc-500 group-hover:text-zinc-400"} />
            <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isActive ? "text-emerald-500" : "text-zinc-600 group-hover:text-zinc-400"
            )}>
                {type}
            </span>
        </div>
    );
};

export const InputGroup = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col gap-2 p-5 bg-black/40 border border-white/5 rounded-3xl focus-within:border-emerald-500/30 transition-all">
        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</label>
        <input
            type="text"
            defaultValue={value}
            className="bg-transparent border-none outline-none text-white text-sm font-bold"
        />
    </div>
);

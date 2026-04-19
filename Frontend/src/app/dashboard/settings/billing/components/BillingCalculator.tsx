'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Wallet, Bot, TrendingUp, Info, ShieldCheck } from 'lucide-react';

// 🎯 Master Rates (Matches the new model_pricing.config.ts)
const STATIC_RATING: Record<string, any> = {
    'gemini-2.0-flash-lite': { ir: 0.075, or: 0.30, m: 1.30, name: 'Gemini 2.0 Flash Lite' },
    'gemini-2.0-flash': { ir: 0.15, or: 0.60, m: 1.30, name: 'Gemini 2.0 Flash' },
    'gemini-2.5-flash-lite': { ir: 0.10, or: 0.40, m: 1.30, name: 'Gemini 2.5 Flash Lite' },
    'gemini-2.5-flash': { ir: 0.30, or: 2.50, m: 1.30, name: 'Gemini 2.5 Flash' },
    'qwen-local': { ir: 0.005, or: 0.005, m: 1.10, name: 'Qwen 3.5 Local' }
};

export function BillingCalculator() {
    const [modelKey, setModelKey] = useState('gemini-2.0-flash-lite');
    const [inputTokens, setInputTokens] = useState<string>('1000000');
    const [outputTokens, setOutputTokens] = useState<string>('500000');

    // 🧮 Real-time Calculation (Pure Usage-Based Logic)
    const config = STATIC_RATING[modelKey];
    const inTokens = parseInt(inputTokens) || 0;
    const outTokens = parseInt(outputTokens) || 0;

    const baseInput = (inTokens / 1000000) * config.ir;
    const baseOutput = (outTokens / 1000000) * config.or;
    const baseTotal = baseInput + baseOutput;
    
    const sellTotal = baseTotal * config.m;
    const profit = sellTotal - baseTotal;
    const remains = 1000000 - (sellTotal * 1000000); // Scaled for 1M Wallet Tokens

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Input Selection */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Simle Billing Simulator
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Verify exactly how tokens are burned and profit is made.
                        </p>
                    </div>

                    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Select AI Model</Label>
                            <Select value={modelKey} onValueChange={setModelKey}>
                                <SelectTrigger className="h-12 border-slate-200 dark:border-slate-800 text-lg font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STATIC_RATING).map(([key, val]) => (
                                        <SelectItem key={key} value={key}>{val.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Input Tokens</Label>
                                <Input 
                                    type="number" 
                                    value={inputTokens} 
                                    onChange={(e) => setInputTokens(e.target.value)}
                                    className="h-12 border-slate-200 dark:border-slate-800 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Output Tokens</Label>
                                <Input 
                                    type="number" 
                                    value={outputTokens} 
                                    onChange={(e) => setOutputTokens(e.target.value)}
                                    className="h-12 border-slate-200 dark:border-slate-800 font-mono"
                                />
                            </div>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg flex items-start gap-3 border border-emerald-100 dark:border-emerald-800/30">
                            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                            <div className="text-xs leading-relaxed">
                                <p className="font-bold text-emerald-800 dark:text-emerald-400">30% Fixed Margin</p>
                                <p className="text-emerald-700/70 dark:text-emerald-500/70">
                                    Base cost pe {((config.m - 1) * 100).toFixed(0)}% profit margin automatic apply ho raha hai.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Profit Matrix */}
                <div className="flex flex-col justify-center">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-2xl space-y-8 relative overflow-hidden">
                         <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                         
                         <div className="flex justify-between items-start relative z-10">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                                Model Profitability
                            </h3>
                            <Badge className="bg-emerald-500 text-emerald-950 font-bold border-none uppercase text-[10px]">
                                Profitable
                            </Badge>
                         </div>

                         {/* Main Stat Card */}
                         <div className="bg-black/20 p-6 rounded-2xl border border-white/10 text-center space-y-2">
                             <p className="text-xs text-indigo-100/60 uppercase font-bold tracking-widest">User Wallet Burn</p>
                             <div className="text-5xl font-extrabold text-white flex justify-center items-end gap-2">
                                 {Math.round(sellTotal * 1000000).toLocaleString()}
                                 <span className="text-lg font-normal text-indigo-200 mb-1">Tokens</span>
                             </div>
                             <p className="text-[10px] text-indigo-100/40">Applied for {((inTokens + outTokens)/1000000).toFixed(2)}M AI Usage</p>
                         </div>

                         {/* Mini Breakdown */}
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-[10px] text-indigo-100/60 uppercase font-bold">Base API Cost</p>
                                <div className="text-xl font-bold mt-1">
                                    {Math.round(baseTotal * 1000000).toLocaleString()} <span className="text-[10px] font-normal opacity-50">Tnk</span>
                                </div>
                            </div>
                            <div className="bg-emerald-400/10 p-4 rounded-xl border border-emerald-400/20">
                                <p className="text-[10px] text-emerald-300 uppercase font-bold">Net Profit</p>
                                <div className="text-xl font-bold mt-1 text-emerald-400">
                                    +{Math.round(profit * 1000000).toLocaleString()} <span className="text-[10px] font-normal opacity-70">Tnk</span>
                                </div>
                            </div>
                         </div>

                         {/* Progress Context */}
                         <div className="flex items-center gap-4 bg-indigo-800/30 p-4 rounded-xl border border-white/5">
                            <Wallet className="h-6 w-6 text-amber-300" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-indigo-100/40">1M Tokens Pack Lifespan</p>
                                <p className="text-sm">{(1000000 / (sellTotal * 1000000)).toFixed(1)}x Calls Remaining</p>
                            </div>
                            <ArrowRight className="h-4 w-4 ml-auto text-white/20" />
                         </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Clarity Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <Card className="bg-slate-50 dark:bg-slate-800/20 border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4 text-indigo-500" /> How it burns?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[11px] text-slate-500 leading-relaxed">
                        Total Burn = (AI Tokens * Rate * Margin). Humne Task Multipliers hata diye hain taaki billing bilkul transparent rahe.
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 dark:bg-slate-800/20 border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" /> Profit Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[11px] text-slate-500 leading-relaxed">
                        User se {((config.m - 1) * 100).toFixed(0)}% zyada tokens kaat-te hain. Ye extra tokens tumhara net profit hai without any infra cost dependencies.
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 dark:bg-slate-800/20 border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Bot className="h-4 w-4 text-amber-500" /> Infra is Separate
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[11px] text-slate-500 leading-relaxed">
                        Ye calculator sirf Gemini ka cost dikhata hai. WhatsApp/SMS aur Storage ka charge Billing Config se alag katega.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

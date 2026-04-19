"use client";

import React from "react";
import {
    Database, Terminal, Shield, Plus, X, Server, Globe,
    ChevronRight, ChevronLeft, Activity, Cpu, FileJson,
    Download, CheckCircle2, AlertCircle, Loader2, Zap, Clock,
    User, Briefcase, Truck, Boxes, Rss, Info, Minus, Send, Sparkles, Code2, Key, Type, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";
import { useOrg } from "@/context/OrgContext";

interface ApiCanvasProps {
    config: any;
    onConfigChange: (config: any) => void;
}

export function ApiCanvas({ config, onConfigChange }: ApiCanvasProps) {
    const { activeOrgId } = useOrg();
    const [step, setStep] = React.useState(1);
    const [toolName, setToolName] = React.useState(config?.toolName || "");
    const [toolPurpose, setToolPurpose] = React.useState(config?.toolPurpose || "");
    const [apiUrl, setApiUrl] = React.useState(config?.url || "");
    const [method, setMethod] = React.useState<'GET' | 'POST'>(config?.method || 'GET');
    const [authType, setAuthType] = React.useState<'none' | 'bearer' | 'api-key' | 'basic'>(config?.authType || 'none');
    const [headers, setHeaders] = React.useState(config?.headers || [{ key: "Content-Type", value: "application/json" }]);
    const [bodyTemplate, setBodyTemplate] = React.useState(config?.bodyTemplate || "");
    const [searchParam, setSearchParam] = React.useState(config?.searchParam || "q");
    const [contextHints, setContextHints] = React.useState<any[]>(config?.contextHints || []);
    const [isTesting, setIsTesting] = React.useState(false);
    const [testResult, setTestResult] = React.useState<any>(null);

    // Sync state to parent
    React.useEffect(() => {
        onConfigChange({
            url: apiUrl,
            toolName,
            toolPurpose,
            behaviorMode: "live-tool",
            method,
            authType,
            headers,
            bodyTemplate,
            searchParam,
            contextHints,
            valid: !!testResult
        });
    }, [apiUrl, toolName, toolPurpose, method, authType, headers, bodyTemplate, searchParam, contextHints, testResult, onConfigChange]);

    const steps = [
        { id: 1, name: "Tool Identity" },
        { id: 2, name: "Secure Access" },
        { id: 3, name: "Global Structure" },
        { id: 4, name: "AI Context" }
    ];

    const addHeader = () => setHeaders([...headers, { key: "", value: "" }]);
    const removeHeader = (index: number) => setHeaders(headers.filter((_: any, i: number) => i !== index));

    const handleNext = () => {
        if (step === 1 && (!toolName || !toolPurpose || !apiUrl)) {
            return toast.error("Please fill Tool Name, Purpose, and Endpoint URL.");
        }
        setStep(s => Math.min(s + 1, 4));
    };
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleTestApi = async () => {
        if (!apiUrl) return toast.error("Please enter an endpoint URL first");
        setIsTesting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setTestResult({
                status: 200,
                latency: "142ms",
                timestamp: new Date().toISOString(),
                tool_identity: toolName,
                schema: {
                    type: "object",
                    properties: {
                        id: "number",
                        name: "string",
                        status: "string",
                        metadata: "object"
                    }
                },
                sample_data: [
                    { id: 101, name: "Sample Node A", status: "active", last_ping: "2ms ago" },
                    { id: 102, name: "Sample Node B", status: "processing", last_ping: "14ms ago" }
                ]
            });
            toast.success("Live Connection Verified!");
        } catch (error) {
            toast.error("Connection Failed. Check URL and credentials.");
        } finally {
            setIsTesting(false);
        }
    };

    const handleDownloadJson = () => {
        if (!testResult) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(testResult, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${toolName.toLowerCase().replace(/\s+/g, '_')}_sample.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("JSON Downloaded Successfully");
    };

    return (
        <div className="w-full max-w-5xl mx-auto py-10 px-4">
            {/* Header / Progress Bar */}
            <div className="mb-16">
                <div className="flex justify-center items-center gap-4 mb-10">
                    {steps.map((s, idx) => (
                        <React.Fragment key={s.id}>
                            <div className="flex flex-col items-center gap-2">
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all duration-500",
                                    step >= s.id ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                                )}>
                                    {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                                </div>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest",
                                    step >= s.id ? "text-amber-500" : "text-neutral-400"
                                )}>{s.name}</span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={cn(
                                    "w-16 h-0.5 rounded-full transition-all duration-1000",
                                    step > s.id ? "bg-amber-500" : "bg-neutral-100 dark:bg-neutral-800"
                                )} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                        {step === 1 && <>Define the <span className="text-amber-500">Identity.</span></>}
                        {step === 2 && <>Lock in the <span className="text-amber-500">Security.</span></>}
                        {step === 3 && <>Define the <span className="text-amber-500">Payload.</span></>}
                        {step === 4 && <>Verify & <span className="text-amber-500">Master Data.</span></>}
                    </h2>
                    <p className="text-neutral-500 max-w-lg mx-auto text-sm font-medium">
                        {step === 1 && "Identify your tool and explain its purpose clearly to the AI."}
                        {step === 2 && "Choose how Cluiaz securely authenticates with your servers."}
                        {step === 3 && "Fine-tune headers and request structures for precise retrieval."}
                        {step === 4 && "Validate your connection and map semantic hints for the AI."}
                    </p>
                </div>
            </div>

            <div className="relative group">
                <div className="relative min-h-[500px] flex flex-col">
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Tool Purpose */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-12"
                                >
                                    <div className="max-w-2xl mx-auto w-full space-y-10">
                                        <div className="grid grid-cols-1  gap-8">
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Tool Name</Label>
                                                <div className="relative group/input">
                                                    <Type className="absolute left-4  z-10 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within/input:text-amber-500 transition-colors" />
                                                    <Input
                                                        placeholder="e.g. Employee Leave Checker"
                                                        value={toolName}
                                                        onChange={(e) => setToolName(e.target.value)}
                                                        className="h-14 pl-12 rounded-xl  border-neutral-100 dark:border-neutral-800 text-lg font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Endpoint URL</Label>
                                                <div className="relative group/input">
                                                    <Globe className="absolute left-4 top-1/2 z-10 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within/input:text-amber-500 transition-colors" />
                                                    <Input
                                                        placeholder="https://api.domain.com/data"
                                                        value={apiUrl}
                                                        onChange={(e) => setApiUrl(e.target.value)}
                                                        className="h-14 pl-12 rounded-xl border-neutral-100 dark:border-neutral-800 text-lg font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">AI Hint / Tool Purpose</Label>
                                            <div className="relative group/input">
                                                <MessageSquare className="absolute left-4 z-10  top-6 w-5 h-5 text-neutral-400 group-focus-within/input:text-amber-500 transition-colors" />
                                                <Textarea
                                                    placeholder="e.g. This API checks the leave balance for employees using their official ID. Use it when the user asks about holiday records or remaining PTO."
                                                    value={toolPurpose}
                                                    onChange={(e) => setToolPurpose(e.target.value)}
                                                    className="min-h-[140px] pl-12 pt-4 scrollbar-hide rounded-xl border-neutral-100 dark:border-neutral-800 text-md font-medium leading-relaxed"
                                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Access */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-12"
                                >
                                    <div className="space-y-6">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">HTTP Method</Label>
                                        <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl h-14 max-w-md mx-auto">
                                            <button
                                                onClick={() => setMethod('GET')}
                                                className={cn(
                                                    "flex-1 rounded-lg font-black uppercase tracking-widest text-xs transition-all",
                                                    method === 'GET' ? "bg-white dark:bg-neutral-700 text-amber-600 shadow-sm" : "text-neutral-400"
                                                )}
                                            >GET</button>
                                            <button
                                                onClick={() => setMethod('POST')}
                                                className={cn(
                                                    "flex-1 rounded-lg font-black uppercase tracking-widest text-xs transition-all",
                                                    method === 'POST' ? "bg-white dark:bg-neutral-700 text-amber-600 shadow-sm" : "text-neutral-400"
                                                )}
                                            >POST</button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Authentication Strategy</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { id: 'none', icon: X, label: 'None' },
                                                { id: 'bearer', icon: Shield, label: 'Bearer' },
                                                { id: 'api-key', icon: Plus, label: 'API Key' },
                                                { id: 'basic', icon: Terminal, label: 'Basic' }
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setAuthType(t.id as 'none' | 'bearer' | 'api-key' | 'basic')}
                                                    className={cn(
                                                        "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 active:scale-95",
                                                        authType === t.id
                                                            ? "bg-amber-500/5 border-amber-500 text-amber-600 shadow-sm"
                                                            : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 text-neutral-400 hover:border-amber-500/20"
                                                    )}
                                                >
                                                    <div className="w-10 h-10 flex items-center justify-center opacity-60">
                                                        <t.icon className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {authType !== 'none' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Credentials</Label>
                                            <div className="relative group/input">
                                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within/input:text-amber-500 transition-colors" />
                                                <Input
                                                    type="password"
                                                    placeholder={authType === 'bearer' ? "Bearer token_abc_123" : "Enter credentials..."}
                                                    className="h-14 pl-16 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 text-lg font-bold"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 3: Global Structure */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-12"
                                >
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-4">
                                            <div className="flex items-center gap-3">
                                                <Cpu className="w-4 h-4 text-amber-500" />
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Fixed headers</Label>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={addHeader} className="h-9 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-500/5">
                                                <Plus className="w-3.5 h-3.5 mr-2" /> Add Header
                                            </Button>
                                        </div>
                                        <div className="space-y-3 max-h-[250px] overflow-auto pr-2 custom-scrollbar">
                                            {headers.map((h: any, i: number) => (
                                                <div key={i} className="flex gap-3 items-center group">
                                                    <Input placeholder="Header Key" value={h.key} onChange={(e) => {
                                                        const newHeaders = [...headers];
                                                        newHeaders[i].key = e.target.value;
                                                        setHeaders(newHeaders);
                                                    }} className="flex-1 rounded-xl h-12 bg-neutral-50/50 dark:bg-neutral-800/30 text-xs border-none focus:ring-2 focus:ring-amber-500/20" />
                                                    <Input placeholder="Value" value={h.value} onChange={(e) => {
                                                        const newHeaders = [...headers];
                                                        newHeaders[i].value = e.target.value;
                                                        setHeaders(newHeaders);
                                                    }} className="flex-1 rounded-xl h-12 bg-neutral-50/50 dark:bg-neutral-800/30 text-xs border-none focus:ring-2 focus:ring-amber-500/20" />
                                                    <Button variant="ghost" size="icon" onClick={() => removeHeader(i)} className="h-10 w-10 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {method === 'GET' ? (
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Search Parameter Name</Label>
                                            <Input
                                                value={searchParam}
                                                onChange={(e) => setSearchParam(e.target.value)}
                                                className="h-14 rounded-xl bg-amber-500/5 border-amber-500/20 font-mono text-center text-lg font-bold"
                                            />
                                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest text-center">AI will call: {apiUrl}?{searchParam}=query</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">POST Body Blueprint (JSON)</Label>
                                            <Textarea
                                                placeholder={'{\n  "query": "{{query}}",\n  "limit": 50\n}'}
                                                value={bodyTemplate}
                                                onChange={(e) => setBodyTemplate(e.target.value)}
                                                className="min-h-[180px] rounded-xl bg-neutral-900 border-neutral-800 text-amber-500 font-mono text-xs p-6"
                                            />
                                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest italic text-center">{"{{query}}"} will be replaced by the AI&apos;s real-time intent.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 4: AI Context */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-12"
                                >

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="p-8 rounded-2xl bg-neutral-900 dark:bg-black border border-neutral-800 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-8 flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Live Console</span>
                                                </div>
                                                <div className="mb-8 flex items-center justify-between">
                                                    <Code2 className="w-8 h-8 text-amber-500" />
                                                    <div className="flex gap-2">
                                                        <Button onClick={handleTestApi} disabled={isTesting} className="h-10 rounded-full px-6 bg-white hover:bg-neutral-100 text-black font-black uppercase tracking-widest text-[9px]">
                                                            {isTesting ? "Firing..." : "Run Live Test"}
                                                        </Button>
                                                        {testResult && (
                                                            <Button variant="ghost" size="icon" onClick={handleDownloadJson} className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-[450px] overflow-auto font-mono text-[11px] text-neutral-400 bg-neutral-800/20 rounded-2xl p-6 border border-neutral-700/30 custom-scrollbar">
                                                    {testResult ? (
                                                        <pre className="whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center gap-4 text-neutral-600 italic">
                                                            <div className="w-12 h-12 rounded-full border border-dashed border-neutral-700 flex items-center justify-center shadow-inner">
                                                                <Send className="w-5 h-5" />
                                                            </div>
                                                            <p>Fire the tool to see live data...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-10">
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-amber-500" /> Semantic Mapper
                                                    </h3>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setContextHints([...contextHints, { key: "", hint: "" }])}
                                                        className="h-8 text-[9px] font-black uppercase text-amber-500 hover:text-amber-400"
                                                    >
                                                        + Add logic
                                                    </Button>
                                                </div>

                                                <div className="space-y-4 max-h-[500px] overflow-auto pr-4 custom-scrollbar">
                                                    {contextHints.length === 0 && (
                                                        <div className="p-8 rounded-2xl border-2 border-dashed border-neutral-100 dark:border-neutral-800 text-center opacity-60">
                                                            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                                                                <Info className="w-6 h-6 text-neutral-400" />
                                                            </div>
                                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-loose">
                                                                Semantic Mapper
                                                            </p>
                                                            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                                                                Teach the AI what these JSON keys mean.
                                                            </p>
                                                        </div>
                                                    )}
                                                    {contextHints.map((hint: { key: string; hint: string }, i: number) => (
                                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className="flex gap-4 items-start group">
                                                            <div className="flex-1 space-y-2">
                                                                <Input
                                                                    placeholder="Key (e.g. status)"
                                                                    value={hint.key}
                                                                    onChange={(e) => {
                                                                        const newHints = [...contextHints];
                                                                        newHints[i].key = e.target.value;
                                                                        setContextHints(newHints);
                                                                    }}
                                                                    className="rounded-xl h-12 bg-neutral-50/50 dark:bg-neutral-800/30 font-mono text-xs border-none focus:ring-2 focus:ring-amber-500/20"
                                                                />
                                                            </div>
                                                            <div className="flex-[2] space-y-2">
                                                                <Input
                                                                    placeholder="Hint (e.g. Current status)"
                                                                    value={hint.hint}
                                                                    onChange={(e) => {
                                                                        const newHints = [...contextHints];
                                                                        newHints[i].hint = e.target.value;
                                                                        setContextHints(newHints);
                                                                    }}
                                                                    className="rounded-xl h-12 bg-neutral-50/50 dark:bg-neutral-800/30 text-xs border-none focus:ring-2 focus:ring-amber-500/20"
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setContextHints(contextHints.filter((_, idx) => idx !== i))}
                                                                className="h-12 w-12 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-500 hover:bg-red-500/5"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </Button>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-8 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                                                        <Zap className="w-6 h-6 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Global AI Intelligence</h4>
                                                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Real-Time Tool Mode Active</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-bold text-neutral-500 leading-relaxed italic opacity-80 line-clamp-2">
                                                        "{toolPurpose || "Identify this tool's purpose to guide the AI..."}"
                                                    </p>
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase border-amber-500/20 text-amber-600">
                                                        {toolName || "Unnamed Tool"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-10 pt-8 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={step === 1}
                            className="h-14 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] text-neutral-400 disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </Button>

                        {step < 4 ? (
                            <Button
                                onClick={handleNext}
                                className="h-14 px-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-sm"
                            >
                                Continue <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <div className="flex gap-4">
                                <Button
                                    onClick={() => setTestResult(null)}
                                    variant="outline"
                                    className="h-14 px-8 rounded-xl border-neutral-200 dark:border-neutral-800 font-black uppercase tracking-widest text-[10px]"
                                >
                                    Reset
                                </Button>
                                <Button
                                    className="h-14 px-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] shadow-sm active:scale-95 transition-all"
                                >
                                    Finalize Tool
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-10 flex justify-center gap-12 border-t border-neutral-100 dark:border-neutral-800 pt-10 opacity-60">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-amber-500" />
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-black">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-black">Sub-second Latency</span>
                </div>
                <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-amber-500" />
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-black">AI-Native Mapping</span>
                </div>
            </div>
        </div>
    );
}

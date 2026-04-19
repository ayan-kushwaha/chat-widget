"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
    Save, Loader2, Plus, Trash2, GripVertical,
    ArrowDown, Flag, MapPin, Zap, MessageSquare,
    Target, Briefcase, Magnet, UserCircle2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { botConfigService } from "@/services/bot-config.service";
import { useOrg } from "@/context/OrgContext";
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";


// --- TYPES ---
interface JourneyStep {
    id: string;
    title: string;
    type: string;
    goal: string;
    enabled: boolean; // New: Individual Step Toggle
    system_instruction: string;
    activation: {
        type: "sequential" | "keyword" | "intent" | "fallback";
        keywords: string[];
        exclude_keywords?: string[]; // New: Negative logic
        match_type?: "any" | "all" | "exact"; // New: Granular control
        confidence?: number; // New: For Intent
    };
    psychology: {
        tone: string;
    };
}

const STEP_TYPES = [
    { value: "greeting", label: "👋 Greeting & Rapport", defaultPrompt: "Greet warmly. Mirror the user's language. Ask how they are doing. Do not sell yet." },
    { value: "investigation", label: "🕵️ Investigation / Discovery", defaultPrompt: "Ask open-ended questions about their current challenges. Dig deeper with 'Why?'." },
    { value: "education", label: "🎓 Education / Information", defaultPrompt: "Explain the product simply. Use analogies. Answer FAQs clearly." },
    { value: "pitch", label: "💎 Value Pitch", defaultPrompt: "Present the solution. Highlight Unique Selling Points (USPs) relevant to user's pain." },
    { value: "objection", label: "🚧 Objection Handling", defaultPrompt: "Validate the concern first. Then reframe with value/ROI. Be confident." },
    { value: "scheduling", label: "📅 Scheduling / Booking", defaultPrompt: "Propose specific times for a call/meeting. Make it easy to say yes." },
    { value: "data_collection", label: "📋 Data Collection", defaultPrompt: "Ask for missing details (Phone/Email) naturally. Explain why it's needed." },
    { value: "closing", label: "🏆 Closing / Sales", defaultPrompt: "Create urgency. Summarize the offer. Ask for the sale/payment directly." },
    { value: "re_engagement", label: "🔄 Re-Engagement", defaultPrompt: "User went silent. Ask a gentle question to bring them back." },
    { value: "support", label: "❤️ Support / Empathy", defaultPrompt: "Apologize for any issue. Show empathy. Promise a quick resolution." }
];

const TONE_PERSONAS = [
    { value: "friendly", label: "😊 Friendly & Warm (Receptionist)" },
    { value: "professional", label: "👔 Professional & Formal (Banker)" },
    { value: "urgent", label: "🔥 Urgent & Aggressive (Salesman)" },
    { value: "empathetic", label: "🤝 Empathetic & Caring (Support)" },
    { value: "witty", label: "😎 Witty & Creative (Gen Z)" },
    { value: "direct", label: "🤖 Direct & Concise (Robot)" }
];

const DEFAULT_STEPS: JourneyStep[] = [
    {
        id: "step_1",
        title: "Introduction",
        type: "greeting",
        goal: "Build Rapport",
        enabled: true,
        system_instruction: STEP_TYPES[0].defaultPrompt,
        activation: { type: "sequential", keywords: ["hi", "hello"], match_type: "any", exclude_keywords: [] },
        psychology: { tone: "friendly" }
    },
    {
        id: "step_2",
        title: "Closing Trap",
        type: "closing",
        goal: "Secure the Deal",
        enabled: true,
        system_instruction: STEP_TYPES[7].defaultPrompt,
        activation: { type: "keyword", keywords: ["price", "cost", "buy", "rate"], match_type: "any", exclude_keywords: [] },
        psychology: { tone: "urgent" }
    }
];

export function BehaviorTab() {
    const { activeOrgId } = useOrg();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // New: Edit Mode State

    // --- STATE ---
    const [journeyEnabled, setJourneyEnabled] = useState<boolean>(true);
    const [steps, setSteps] = useState<JourneyStep[]>(DEFAULT_STEPS);
    const [selectedStepId, setSelectedStepId] = useState<string>(DEFAULT_STEPS[0].id);

    const activeStep = steps.find(s => s.id === selectedStepId) || steps[0];

    const fetchConfig = async () => {
        setLoading(true);
        try {
            // FIX: Pass activeOrgId so backend fetches the correct doc (not just default)
            const apiConfig: any = await botConfigService.getBotConfig('default_bot', activeOrgId || undefined);

            // Handle Top-Level Journey Config (New Schema)
            if (apiConfig.journeyEnabled !== undefined) {
                setJourneyEnabled(apiConfig.journeyEnabled);
            }

            if (apiConfig.journey && Array.isArray(apiConfig.journey)) {
                // Migration: Ensure all steps have new properties
                const migratedSteps = apiConfig.journey.map((s: any) => ({
                    ...s,
                    enabled: s.enabled !== undefined ? s.enabled : true, // Default to true
                    activation: {
                        ...s.activation,
                        type: s.activation?.type || "sequential",
                        keywords: s.activation?.keywords || [],
                        exclude_keywords: s.activation?.exclude_keywords || [],
                        match_type: s.activation?.match_type || "any",
                        confidence: s.activation?.confidence || 0.7
                    },
                    psychology: s.psychology || { tone: "professional" }
                }));
                // User Request: If journey is empty (fresh bot), show Defaults so they understand how it works
                if (migratedSteps.length === 0) {
                    setSteps(DEFAULT_STEPS);
                    setSelectedStepId(DEFAULT_STEPS[0].id);
                } else {
                    setSteps(migratedSteps);

                    // Fix: Ensure selectedStepId points to a valid step
                    if (migratedSteps.length > 0) {
                        const currentExists = migratedSteps.find((s: any) => s.id === selectedStepId);
                        if (!currentExists) {
                            setSelectedStepId(migratedSteps[0].id);
                        }
                    }
                }
            } else if (apiConfig.behaviorConfig?.journey) {
                // Fallback: Check nested legacy location if migration is mid-way
                console.warn("Using legacy behaviorConfig.journey location");
            }

        } catch (error) {
            console.error("Failed to fetch behavior config", error);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            console.log("Saving Journey. Steps count:", steps.length);

            if (!activeOrgId) {
                toast.error("Organization ID missing. Please refresh.");
                return;
            }

            // Flatten the payload: Send journey & journeyEnabled at root
            await botConfigService.saveBotConfig('default_bot', {
                journey: steps,
                journeyEnabled: journeyEnabled,
                orgId: activeOrgId
            });
            toast.success(journeyEnabled ? "Decision Power ACTIVATED! 🚀" : "Strategist Mode PAUSED. ⏸️");
        } catch (error) {
            console.error("Failed to save behavior config", error);
            toast.error("Failed to save strategy");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (activeOrgId) {
            fetchConfig();
        }
    }, [activeOrgId]);

    const updateStep = (field: string, value: any) => {
        setSteps(prev => prev.map(s => {
            if (s.id === selectedStepId) {
                // If Type changes, also update Trigger Type hint if needed
                if (field === 'type') {
                    const typeInfo = STEP_TYPES.find(t => t.value === value);
                    return {
                        ...s,
                        type: value
                        // FIX: Don't overwrite instruction on type change. Let them rely on placeholder.
                    };
                }

                if (field.includes('.')) {
                    const [parent, child] = field.split('.');
                    return { ...s, [parent]: { ...(s as any)[parent], [child]: value } };
                }
                return { ...s, [field]: value };
            }
            return s;
        }));
    };

    const addNewStep = (index: number) => {
        const newStep: JourneyStep = {
            id: `step_${Date.now()}`,
            title: "",
            type: "investigation",
            goal: "",
            enabled: true,
            system_instruction: "",
            activation: { type: "sequential", keywords: [], match_type: "any", exclude_keywords: [] },
            psychology: { tone: "professional" }
        };
        const newList = [...steps];
        newList.splice(index + 1, 0, newStep);
        setSteps(newList);
        setSelectedStepId(newStep.id);
    };

    const deleteStep = (id: string) => {
        if (steps.length <= 1) return toast.error("You must have at least one step.");
        const newSteps = steps.filter(s => s.id !== id);
        setSteps(newSteps);
        setSelectedStepId(newSteps[0].id);
    };

    if (loading) {
        return <div className="flex bg-muted/5 h-64 rounded-xl border border-dashed items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        The Flow Architect <span className="text-primary text-xs border border-primary/30 bg-primary/10 px-2 py-0.5 rounded-full">BETA</span>
                    </h2>
                    <p className="text-sm text-muted-foreground">Configure your AI's <strong>Decision Power (Mission & Strategy)</strong>. Control the flow.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className={cn("flex items-center space-x-2 bg-muted/20 px-4 py-2 rounded-lg border", !isEditing && "opacity-60 pointer-events-none")}>
                        <Switch
                            id="journey-mode"
                            checked={journeyEnabled}
                            onCheckedChange={setJourneyEnabled}
                            disabled={!isEditing}
                        />
                        <Label htmlFor="journey-mode" className="text-sm font-medium">
                            {journeyEnabled ? "Active 🟢" : "Paused ⚪"}
                        </Label>
                    </div>

                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2 border-primary/50 text-foreground hover:bg-primary/5">
                            <Briefcase className="w-4 h-4" /> Edit Strategy
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setIsEditing(false)} variant="ghost" className="text-muted-foreground">
                                Cancel
                            </Button>
                            <Button onClick={async () => { await saveConfig(); setIsEditing(false); }} disabled={saving} className="gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* 📍 LEFT PANEL: VISUAL TIMELINE MAP */}
                <Card className="w-full lg:w-[35%] flex flex-col border-neutral-200 dark:border-neutral-800 bg-muted/5">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Mission Flow (Decision Timeline)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="relative pl-4 border-l-2 border-dashed border-muted-foreground/20 space-y-6">

                            {/* Start Node */}
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 z-10" />

                            <div className="space-y-6">
                                <Reorder.Group axis="y" values={steps} onReorder={isEditing ? setSteps : () => { }} className="space-y-6">
                                    {steps.map((step, index) => (
                                        <Reorder.Item key={step.id} value={step} dragListener={isEditing} className="relative group list-none">
                                            {/* Timeline Connector Dot */}
                                            <div className={`absolute -left-[22.7px] top-7 w-3 h-3 rounded-full border-2 transition-colors duration-200 z-10 ${selectedStepId === step.id ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                                                } ${!step.enabled ? "bg-neutral-500 border-neutral-500 opacity-50" : ""}`} />

                                            {/* Step Card */}
                                            <div
                                                onClick={() => setSelectedStepId(step.id)}
                                                className={cn(
                                                    "cursor-pointer rounded-lg border p-3 text-sm transition-all hover:shadow-md relative bg-card",
                                                    selectedStepId === step.id
                                                        ? "border-primary ring-1 ring-primary/20 shadow-sm"
                                                        : "border-border hover:border-primary/50",
                                                    !step.enabled && "opacity-60 grayscale"
                                                )}
                                            >
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex items-center gap-2 font-semibold min-w-0 flex-1">
                                                        {isEditing && (
                                                            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground/50 shrink-0">
                                                                <GripVertical className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                        <span className={cn("break-words line-clamp-2", !step.enabled && "line-through text-muted-foreground")}>
                                                            {index + 1}. {step.title || "Untitled Step"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Switch
                                                            checked={step.enabled}
                                                            onCheckedChange={(val) => updateStep("enabled", val)}
                                                            className="scale-75"
                                                            onClick={(e) => e.stopPropagation()}
                                                            disabled={!isEditing}
                                                        />

                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 line-clamp-1 pl-6">
                                                    {STEP_TYPES.find(t => t.value === step.type)?.label}
                                                </div>

                                                {/* Action: Add Step After */}
                                                {isEditing && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-muted border hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addNewStep(index);
                                                        }}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Arrow Down */}
                                            {index < steps.length - 1 && (
                                                <div className="flex justify-center py-2 text-muted-foreground/30">
                                                    <ArrowDown className="w-4 h-4" />
                                                </div>
                                            )}
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>

                                {/* Empty State / Quick Add for Zero Steps */}
                                {steps.length === 0 && isEditing && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 cursor-pointer hover:bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20 transition-all"
                                        onClick={() => addNewStep(-1)}
                                    >
                                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Start Your Journey</p>
                                            <p className="text-xs text-muted-foreground">Click to add the first step</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* End Node */}
                            <div className="relative pt-4">
                                <div className="absolute -left-[21px] top-6 w-3 h-3 rounded-full bg-red-500/50 border-2 border-red-500" />
                                <div className="flex items-center gap-2 text-xs text-muted-foreground ml-1">
                                    <Flag className="w-3 h-3" /> Conversation Ends
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 🛠️ RIGHT PANEL: STAGE EDITOR */}
                <Card className="flex-1 flex flex-col border-blue-100 dark:border-blue-900/20 shadow-lg">
                    <CardHeader className="border-b bg-muted/5 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={activeStep?.enabled || false}
                                        onCheckedChange={(val) => updateStep("enabled", val)}
                                        disabled={!isEditing || !activeStep}
                                    />
                                    <CardTitle className={cn("text-xl flex items-center gap-2", !activeStep?.enabled && "text-muted-foreground")}>
                                        {activeStep?.title || "Untitled Step"}
                                        {!activeStep?.enabled && <Badge variant="destructive" className="text-xs">DISABLED</Badge>}
                                    </CardTitle>
                                </div>
                                <CardDescription className="flex items-center gap-1 mt-1 pl-12">
                                    <Magnet className="w-3 h-3 text-amber-500" />
                                    Activates: <span className="font-mono text-xs">{activeStep?.activation.type === 'sequential' ? "After Previous Step" : "On Smart Trigger"}</span>
                                </CardDescription>
                            </div>
                            {isEditing && activeStep && (
                                <Button variant="ghost" size="sm" onClick={() => deleteStep(activeStep.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    {!activeStep ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                            <Briefcase className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a step from the Mission Flow to edit.</p>
                        </div>
                    ) : (
                        <CardContent className={cn("p-6 space-y-8", (!activeStep.enabled || !isEditing) && "opacity-90")}>

                            {/* 1. IDENTITY SECTION */}
                            <div className={cn("space-y-4", !isEditing && "pointer-events-none")}>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <UserCircle2 className="w-4 h-4" /> Stage Identity
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Step Title (Internal Name)</label>
                                        <Input
                                            value={activeStep.title}
                                            onChange={(e) => updateStep("title", e.target.value)}
                                            placeholder="e.g. Closing Phase"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Step Type (Business Goal)</label>
                                        <Select
                                            value={activeStep.type}
                                            onValueChange={(val) => updateStep("type", val)}
                                            disabled={!isEditing}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {STEP_TYPES.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* 2. ADVANCED ACTIVATION TRIGGERS (Smart Jump) */}
                            <div className={cn("space-y-4 p-5 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10", !isEditing && "pointer-events-none opacity-80")}>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-500 flex items-center gap-2">
                                    <Magnet className="w-4 h-4" /> Activation Logic (The Magnet)
                                </h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">When to Activate?</label>
                                        <Select
                                            value={activeStep.activation.type}
                                            onValueChange={(val) => updateStep("activation.type", val)}
                                            disabled={!isEditing}
                                        >
                                            <SelectTrigger className="bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sequential">⬇️ Sequential (Default Flow)</SelectItem>
                                                <SelectItem value="keyword">🔤 Keyword Jump (Precise Control)</SelectItem>
                                                <SelectItem value="intent">🧠 Intent Jump (AI Guessing)</SelectItem>
                                                <SelectItem value="fallback">🛑 Fallback (Confusion Handler)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Keyword Logic Advanced */}
                                    {activeStep.activation.type === 'keyword' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="col-span-2 space-y-2">
                                                    <label className="text-sm font-medium text-emerald-600">✅ Trigger Keywords</label>
                                                    <Input
                                                        value={activeStep.activation.keywords?.join(", ") || ""}
                                                        onChange={(e) => updateStep("activation.keywords", e.target.value.split(',').map(s => s.trim()))}
                                                        placeholder="e.g. price, cost, buy"
                                                        className="border-emerald-200 focus-visible:ring-emerald-400"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Match Type</label>
                                                    <Select
                                                        value={activeStep.activation.match_type || 'any'}
                                                        onValueChange={(val) => updateStep("activation.match_type", val)}
                                                        disabled={!isEditing}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="any">Any Word (Broad)</SelectItem>
                                                            <SelectItem value="all">All Words (Strict)</SelectItem>
                                                            <SelectItem value="exact">Exact Phrase</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-red-500">❌ Negative Keywords (Ignore if present)</label>
                                                <Input
                                                    value={activeStep.activation.exclude_keywords?.join(", ") || ""}
                                                    onChange={(e) => updateStep("activation.exclude_keywords", e.target.value.split(',').map(s => s.trim()))}
                                                    placeholder="e.g. free, no money"
                                                    className="border-red-200 focus-visible:ring-red-400"
                                                    disabled={!isEditing}
                                                />
                                                <p className="text-xs text-muted-foreground">Example: Trigger on "Price" BUT ignore if they say "Free Price".</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Intent Logic Advanced */}
                                    {activeStep.activation.type === 'intent' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium flex justify-between">
                                                    AI Confidence Threshold
                                                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                                        {(activeStep.activation.confidence || 0.7) * 100}%
                                                    </span>
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-muted-foreground">Loose</span>
                                                    <Slider
                                                        value={[(activeStep.activation.confidence || 0.7) * 100]}
                                                        max={100}
                                                        min={10}
                                                        step={5}
                                                        onValueChange={(val) => updateStep("activation.confidence", val[0] / 100)}
                                                        className="flex-1"
                                                        disabled={!isEditing}
                                                    />
                                                    <span className="text-xs text-muted-foreground">Strict</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Higher = AI waits until it is VERY sure about user intent.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. INSTRUCTION & GOAL */}
                            <div className={cn("space-y-4", !isEditing && "pointer-events-none")}>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> AI Instructions
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex justify-between items-center">
                                        <span className="flex items-center gap-2">System Instruction <Zap className="w-3 h-3 text-amber-500" /></span>
                                        <span className="text-xs text-muted-foreground font-normal">Exact rule injected into AI</span>
                                    </label>
                                    <Textarea
                                        value={activeStep.system_instruction}
                                        onChange={(e) => updateStep("system_instruction", e.target.value)}
                                        className="font-mono text-sm bg-muted/10 min-h-[100px]"
                                        placeholder={STEP_TYPES.find(t => t.value === activeStep.type)?.defaultPrompt || "Enter the precise prompt instruction here..."}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>



                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}

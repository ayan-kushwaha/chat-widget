"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Info, Pencil, Save, X, Sparkles, Trash2, Plus, AlertTriangle, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { botConfigService } from "@/services/bot-config.service";
import { useOrg } from "@/context/OrgContext";

export function PersonalityTab() {
    const { activeOrgId } = useOrg();
    const [personalityLoading, setPersonalityLoading] = useState(false);
    const [savingPersonality, setSavingPersonality] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // --- STATE: PERSONALITY TAB ---
    const [personality, setPersonality] = useState({
        name: "AI Assistant",
        tone: "Professional",
        language: "Auto-Detect",
        responseLength: "medium",
        goal: "To assist visitors politely, answer their queries from the Knowledge Base, and guide them towards booking a service or contacting support.",
        objectives: ["Lead Generation", "Customer Support", "Service Booking"],
        rules: [
            "Always prioritize Knowledge Base. Never invent prices.",
            "If answer is missing, ask for the user's email to follow up.",
            "Do not discuss politics or religion."
        ],
        closingLine: "Let me know if you need more help!",
        useEmojis: true,
        exampleTraining: [
            {
                userMessage: "What are your working hours?",
                goodResponse: "We're open Monday to Friday, 9 AM to 6 PM. How can I assist you today? 😊",
                badResponse: ""
            },
            {
                userMessage: "Do you offer refunds?",
                goodResponse: "Yes! We offer a 30-day money-back guarantee if you're not satisfied. Would you like to know more about our refund process?",
                badResponse: ""
            }
        ] as Array<{ userMessage: string; goodResponse: string; badResponse: string }>,
        bannedWords: ["stupid", "idiot", "hate"] as string[],
        handoffTriggers: {
            enabled: false,
            keywords: [] as string[],
            escalationMessage: "Let me connect you to a human expert."
        },
        // Enterprise Features
        safetySettings: {
            profanity_filter: true,
            negative_prompts: ["Competitors", "Politics", "Religion"] as string[],
            censor_sensitive_pii: true,
            strict_mode: true,
            jailbreak_protection: true,
            anti_hallucination: true
        },
        fallbackSettings: {
            strategy: 'static_message' as 'default_ai' | 'static_message' | 'handoff',
            custom_message: "I apologize, I don't have that information right now. Could you leave your email or phone number? My human colleague will update you shortly."
        },
        temperature: 0.5
    });

    const fetchPersonality = async () => {
        setPersonalityLoading(true);
        try {
            // Using 'default_bot' for now
            const apiConfig = await botConfigService.getBotConfig('default_bot');
            if (apiConfig && apiConfig.personalityConfig) {
                // Verify if object is not empty before setting, or merge with default?
                // For now, if keys exist, use it.
                if (Object.keys(apiConfig.personalityConfig).length > 0) {
                    setPersonality(prev => ({
                        ...prev,
                        ...apiConfig.personalityConfig
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch personality config", error);
            toast.error("Failed to load personality configuration");
        } finally {
            setPersonalityLoading(false);
        }
    };

    const savePersonality = async () => {
        setSavingPersonality(true);
        try {
            await botConfigService.saveBotConfig('default_bot', {
                personalityConfig: personality,
                orgId: activeOrgId || 'default-org'
            });
            toast.success("Personality configuration saved successfully!");
        } catch (error) {
            console.error("Failed to save personality config", error);
            toast.error("Failed to save personality configuration");
        } finally {
            setSavingPersonality(false);
        }
    };

    useEffect(() => {
        fetchPersonality();
    }, []);

    if (personalityLoading) {
        return <div className="flex bg-muted/5 h-64 rounded-xl border border-dashed items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header with Edit Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">AI Personality</h2>
                    <p className="text-sm text-muted-foreground">Configure how your AI thinks and behaves</p>
                </div>
                <div className="flex gap-3">
                    {isEditMode ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditMode(false);
                                    fetchPersonality(); // Revert changes
                                }}
                                className="gap-2 h-10"
                            >
                                <X className="w-4 h-4" /> Cancel
                            </Button>
                            <Button
                                onClick={async () => {
                                    await savePersonality();
                                    setIsEditMode(false);
                                }}
                                disabled={savingPersonality}
                                className="gap-2 h-10"
                            >
                                {savingPersonality ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setIsEditMode(true)}
                            className="gap-2"
                        >
                            <Pencil className="w-4 h-4" /> Edit
                        </Button>
                    )}
                </div>
            </div>

            {/* Top Row: Identity & Response Settings */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* LEFT: Identity & Motivation */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Identity & Motivation</CardTitle>
                                <CardDescription>Who is your AI and what drives it?</CardDescription>
                            </div>
                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                </HoverCardTrigger>
                                <HoverCardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold">Identity Profile</p>
                                        <p className="text-xs text-muted-foreground">Configure your AI's name, tone, and goals. This shapes how your AI introduces itself and communicates with users.</p>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bot Name</label>
                            <Input value={personality.name} onChange={(e) => setPersonality({ ...personality, name: e.target.value })} disabled={!isEditMode} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tone</label>
                            <Select value={personality.tone} onValueChange={(val) => setPersonality({ ...personality, tone: val })} disabled={!isEditMode}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Professional">Professional</SelectItem>
                                    <SelectItem value="Friendly">Friendly</SelectItem>
                                    <SelectItem value="Funny">Funny</SelectItem>
                                    <SelectItem value="Empathetic">Empathetic</SelectItem>
                                    <SelectItem value="Witty">Witty</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Primary Goal / Motivation</label>
                            <Textarea
                                value={personality.goal}
                                onChange={(e) => setPersonality({ ...personality, goal: e.target.value })}
                                placeholder="e.g. Sell shoes and collect emails"
                                className="min-h-[80px]"
                                disabled={!isEditMode}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="text-sm font-medium">Key Objectives</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {(personality.objectives || []).map((obj, i) => (
                                    <Badge key={i} variant="secondary" className="gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100">
                                        {obj}
                                        <X className="w-3 h-3 cursor-pointer" onClick={() => {
                                            const newObjs = [...(personality.objectives || [])];
                                            newObjs.splice(i, 1);
                                            setPersonality({ ...personality, objectives: newObjs });
                                        }} />
                                    </Badge>
                                ))}
                            </div>
                            <Input
                                placeholder="Add objective (e.g. Booking) and press Enter"
                                disabled={!isEditMode}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val) {
                                            setPersonality({ ...personality, objectives: [...(personality.objectives || []), val] });
                                            (e.target as HTMLInputElement).value = "";
                                        }
                                    }
                                }}
                            />
                            <p className="text-xs text-muted-foreground">Specific outcomes the AI should aim for.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* RIGHT: Response Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Response Settings</CardTitle>
                                <CardDescription>Control length and style.</CardDescription>
                            </div>
                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                </HoverCardTrigger>
                                <HoverCardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold">Response Settings</p>
                                        <p className="text-xs text-muted-foreground">
                                            <b>Auto:</b> AI decides length.<br />
                                            <b>Manual:</b> Set specific length.<br />
                                            <b>Emojis:</b> Add friendly touch.
                                        </p>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Auto-Detect Toggle */}
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Auto-Detect Length ✨</label>
                                <p className="text-xs text-muted-foreground">AI decides best length based on context.</p>
                            </div>
                            <Switch
                                checked={personality.responseLength === 'auto'}
                                onCheckedChange={(c) => setPersonality({ ...personality, responseLength: c ? 'auto' : 'medium' })}
                                disabled={!isEditMode}
                            />
                        </div>

                        {/* Slider (Hidden if Auto) */}
                        {personality.responseLength !== 'auto' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between text-sm">
                                    <span className={personality.responseLength === 'short' ? 'font-bold text-primary' : 'text-muted-foreground'}>Short</span>
                                    <span className={personality.responseLength === 'medium' ? 'font-bold text-primary' : 'text-muted-foreground'}>Medium</span>
                                    <span className={personality.responseLength === 'detailed' ? 'font-bold text-primary' : 'text-muted-foreground'}>Detailed</span>
                                </div>
                                <Slider
                                    value={[personality.responseLength === 'short' ? 0 : personality.responseLength === 'medium' ? 50 : 100]}
                                    onValueChange={(val) => {
                                        const newLength = val[0] < 33 ? 'short' : val[0] < 67 ? 'medium' : 'detailed';
                                        setPersonality({ ...personality, responseLength: newLength });
                                    }}
                                    max={100}
                                    step={1}
                                    disabled={!isEditMode}
                                />
                            </div>
                        )}


                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium">Creativity (Temperature)</label>
                                    <HoverCard>
                                        <HoverCardTrigger asChild>
                                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                        </HoverCardTrigger>
                                        <HoverCardContent>
                                            <div className="space-y-2">
                                                <p className="text-sm font-semibold">What is Temperature?</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Temperature controls how creative or predictable the AI's responses are:<br /><br />
                                                    <b>0.0 - 0.3 (Strict):</b> Very predictable, factual, robotic.<br />
                                                    <b>0.4 - 0.6 (Balanced):</b> ✅ Recommended. Natural + accurate.<br />
                                                    <b>0.7 - 1.0 (Creative):</b> ⚠️ More creative but may hallucinate (make up facts).<br /><br />
                                                    <b>Recommendation:</b> Keep at 0.5 for reliable, conversational responses.
                                                </p>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">{personality.temperature}</span>
                            </div>
                            <Slider
                                value={[personality.temperature * 100]}
                                onValueChange={(val) => setPersonality({ ...personality, temperature: val[0] / 100 })}
                                max={100}
                                step={1}
                                disabled={!isEditMode}
                                className="my-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Strict (0.0)</span>
                                <span>Balanced (0.5)</span>
                                <span>Creative (1.0)</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                            <div className="space-y-0.5 mt-2">
                                <label className="text-sm font-medium">Use Emojis</label>
                                <p className="text-xs text-muted-foreground">Make responses friendly.</p>
                            </div>
                            <Switch
                                checked={personality.useEmojis}
                                onCheckedChange={(val) => setPersonality({ ...personality, useEmojis: val })}
                                disabled={!isEditMode}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Row: Iron Rules & Banned Words */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-red-100 dark:border-red-900/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    Iron Rules & Constraints
                                </CardTitle>
                                <CardDescription>Strict guidelines and banned words.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Rules List */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Strict Rules</label>
                            <div className="space-y-2">
                                <div className=" flex flex-wrap gap-2">
                                    {(personality.rules || []).map((rule, i) => (
                                        <span key={i} className="flex  w-fit items-start gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-md text-sm">
                                            <span className="font-mono text-red-500 mt-0.5">{i + 1}.</span>
                                            <span className="flex-1 break-words leading-relaxed">{rule}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 -mt-1" onClick={() => {
                                                const newRules = [...(personality.rules || [])];
                                                newRules.splice(i, 1);
                                                setPersonality({ ...personality, rules: newRules });
                                            }} disabled={!isEditMode}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </span>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Add a strict rule (e.g. Never discuss politics) and press Enter"
                                    disabled={!isEditMode}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value.trim();
                                            if (val) {
                                                setPersonality({ ...personality, rules: [...personality.rules, val] });
                                                (e.target as HTMLInputElement).value = "";
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Banned Words (Tags) */}
                        <div className="space-y-3 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <label className="text-sm font-medium text-red-500">Banned Words</label>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {personality.bannedWords?.map((word, i) => (
                                    <Badge key={i} variant="destructive" className="gap-1 px-3 py-1">
                                        {word}
                                        {isEditMode && (
                                            <X className="w-3 h-3 cursor-pointer hover:text-white/80" onClick={() => {
                                                const newWords = [...(personality.bannedWords || [])];
                                                newWords.splice(i, 1);
                                                setPersonality({ ...personality, bannedWords: newWords });
                                            }} />
                                        )}
                                    </Badge>
                                ))}
                            </div>
                            <Input
                                placeholder="Type a word to ban and press Enter..."
                                disabled={!isEditMode}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val) {
                                            const currentWords = personality.bannedWords || [];
                                            if (!currentWords.includes(val)) {
                                                setPersonality({ ...personality, bannedWords: [...currentWords, val] });
                                            }
                                            (e.target as HTMLInputElement).value = "";
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* NEW: Security & Guardrails */}
                <Card className="border-blue-100 dark:border-blue-900/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    Security & Guardrails 🛡️
                                </CardTitle>
                                <CardDescription>Built-in safeguards to keep conversations accurate, focused, and professional.</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Enterprise</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 1. Business Scope */}
                            <div className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:shadow-md hover:border-blue-500/30">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 w-fit rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40">
                                            <Info className="w-5 h-5" />
                                        </div>
                                        <Switch
                                            checked={personality.safetySettings?.strict_mode !== false}
                                            onCheckedChange={(c) => setPersonality({
                                                ...personality,
                                                safetySettings: { ...personality.safetySettings, strict_mode: c }
                                            })}
                                            disabled={!isEditMode}
                                        />
                                    </div>
                                    <h4 className="font-semibold text-base mb-1">Business-Focused AI</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Keeps conversations aligned with your business goals. Ignores irrelevant topics.
                                    </p>
                                </div>
                            </div>

                            {/* 2. Anti-Hallucination */}
                            <div className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:shadow-md hover:border-emerald-500/30">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 w-fit rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <Switch
                                            checked={personality.safetySettings?.anti_hallucination !== false}
                                            onCheckedChange={(c) => setPersonality({
                                                ...personality,
                                                safetySettings: { ...personality.safetySettings, anti_hallucination: c }
                                            })}
                                            disabled={!isEditMode}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-base">Verified Answers Only</h4>
                                        <Badge variant="secondary" className="text-[10px] h-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Rec.</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        The AI responds only using your approved data. Zero guessing.
                                    </p>
                                </div>
                            </div>

                            {/* 3. Protection Layer */}
                            <div className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:shadow-md hover:border-orange-500/30">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 w-fit rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 transition-colors group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <Switch
                                            checked={personality.safetySettings?.jailbreak_protection !== false}
                                            onCheckedChange={(c) => setPersonality({
                                                ...personality,
                                                safetySettings: { ...personality.safetySettings, jailbreak_protection: c }
                                            })}
                                            disabled={!isEditMode}
                                        />
                                    </div>
                                    <h4 className="font-semibold text-base mb-1">Smart Protection Layer</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Advanced shield that ensures the AI always follows your rules and boundaries.
                                    </p>
                                </div>
                            </div>

                            {/* 4. Privacy */}
                            <div className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:shadow-md hover:border-purple-500/30">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 w-fit rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 transition-colors group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40">
                                            <Loader2 className="w-5 h-5" />
                                        </div>
                                        <Switch
                                            checked={personality.safetySettings?.censor_sensitive_pii !== false}
                                            onCheckedChange={(c) => setPersonality({
                                                ...personality,
                                                safetySettings: { ...personality.safetySettings, censor_sensitive_pii: c }
                                            })}
                                            disabled={!isEditMode}
                                        />
                                    </div>
                                    <h4 className="font-semibold text-base mb-1">Privacy-First Responses</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Automatically keeps personal customer information private.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Safety & Fallback Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Safety & Restrictions */}
                <Card className="border-orange-100 dark:border-orange-900/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    Safety & Restrictions 🛡️
                                </CardTitle>
                                <CardDescription>Guardrails for your AI.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Profanity Filter</label>
                                <p className="text-xs text-muted-foreground">Block offensive language.</p>
                            </div>
                            <Switch
                                checked={personality.safetySettings?.profanity_filter}
                                onCheckedChange={(c) => setPersonality({
                                    ...personality,
                                    safetySettings: { ...personality.safetySettings, profanity_filter: c }
                                })}
                                disabled={!isEditMode}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="text-sm font-medium">Negative Prompts (Never Discuss)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {(personality.safetySettings?.negative_prompts || []).map((prompt, i) => (
                                    <Badge key={i} variant="outline" className="gap-1 px-3 py-1 border-orange-200 bg-orange-50 text-orange-700">
                                        {prompt}
                                        {isEditMode && (
                                            <X className="w-3 h-3 cursor-pointer" onClick={() => {
                                                const newPrompts = [...(personality.safetySettings?.negative_prompts || [])];
                                                newPrompts.splice(i, 1);
                                                setPersonality({
                                                    ...personality,
                                                    safetySettings: { ...personality.safetySettings, negative_prompts: newPrompts }
                                                });
                                            }} />
                                        )}
                                    </Badge>
                                ))}
                            </div>
                            <Input
                                placeholder="Add topic (e.g. Competitors) and press Enter"
                                disabled={!isEditMode}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val) {
                                            setPersonality({
                                                ...personality,
                                                safetySettings: {
                                                    ...personality.safetySettings,
                                                    negative_prompts: [...(personality.safetySettings?.negative_prompts || []), val]
                                                }
                                            });
                                            (e.target as HTMLInputElement).value = "";
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Fallback Logic */}
                <Card className="border-purple-100 dark:border-purple-900/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-purple-500" />
                                    Fallback Logic 🤷
                                </CardTitle>
                                <CardDescription>What to do when no answer is found.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">When answer is not found:</label>
                            <Select
                                value={personality.fallbackSettings?.strategy || 'default_ai'}
                                onValueChange={(val: any) => setPersonality({
                                    ...personality,
                                    fallbackSettings: { ...personality.fallbackSettings, strategy: val }
                                })}
                                disabled={!isEditMode}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select strategy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default_ai">Use General AI Knowledge</SelectItem>
                                    <SelectItem value="static_message">Say "I don't know" (Strict)</SelectItem>
                                    <SelectItem value="handoff">Connect to Human</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {personality.fallbackSettings?.strategy !== 'default_ai' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium">Custom Fallback Message</label>
                                <Textarea
                                    value={personality.fallbackSettings?.custom_message}
                                    onChange={(e) => setPersonality({
                                        ...personality,
                                        fallbackSettings: { ...personality.fallbackSettings, custom_message: e.target.value }
                                    })}
                                    placeholder="I'm sorry, I couldn't find that info..."
                                    className="min-h-[80px]"
                                    disabled={!isEditMode}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Style Guide (Full Width) */}
            <Card className="bg-blue-50/50 dark:bg-blue-900/5">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="mb-2">
                            <CardTitle className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 text-blue-500 " />
                                Style Guide (Few-Shot Learning)
                            </CardTitle>
                            <CardDescription>Teach by example. The AI mimics this style.</CardDescription>
                        </div>
                        <HoverCard>
                            <HoverCardTrigger asChild>
                                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </HoverCardTrigger>
                            <HoverCardContent>
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold">Few-Shot Learning</p>
                                    <p className="text-xs text-muted-foreground">Provide examples of User questions and ideal AI responses. This is the most effective way to train style.</p>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        {personality.exampleTraining?.map((ex, i) => (
                            <div key={i} className="p-5 bg-background border rounded-lg space-y-4 relative group shadow-sm hover:shadow-md transition-shadow">
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                        const newEx = [...(personality.exampleTraining || [])];
                                        newEx.splice(i, 1);
                                        setPersonality({ ...personality, exampleTraining: newEx });
                                    }} disabled={!isEditMode}>
                                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</span>
                                    <p className="text-sm">{ex.userMessage}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Response</span>
                                    <p className="text-sm">{ex.goodResponse}</p>
                                </div>
                            </div>
                        ))}

                        {isEditMode && (
                            <div className="p-4 border border-dashed rounded-lg space-y-3 bg-background/50 flex flex-col justify-center">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Add New Example</p>
                                <Input id="new-ex-user" placeholder="User says..." className="mb-2" />
                                <Textarea id="new-ex-ai" placeholder="AI replies..." className="min-h-[80px] mb-2" />
                                <Button size="sm" variant="outline" className="w-full" onClick={() => {
                                    const userEl = document.getElementById('new-ex-user') as HTMLInputElement;
                                    const aiEl = document.getElementById('new-ex-ai') as HTMLTextAreaElement;
                                    if (userEl.value && aiEl.value) {
                                        setPersonality({
                                            ...personality,
                                            exampleTraining: [...(personality.exampleTraining || []), {
                                                userMessage: userEl.value,
                                                goodResponse: aiEl.value,
                                                badResponse: "" // Optional
                                            }]
                                        });
                                        userEl.value = "";
                                        aiEl.value = "";
                                    }
                                }}>
                                    <Plus className="w-3 h-3 mr-2" /> Add Example
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

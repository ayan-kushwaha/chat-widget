"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
    Plus,
    Trash2,
    Settings2,
    Save,
    Wand2,
    ArrowLeft,
    X,
    ChevronDown,
    ChevronRight,
    Sparkles,
    Pencil
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { leadsAPI } from "@/lib/api";
import { SortableFieldItem } from "@/components/leads/SortableFieldItem";

// --- Types ---

type FieldType =
    | 'text' | 'number' | 'email' | 'phone' | 'date' | 'daterange'
    | 'dropdown' | 'multiselect' | 'radio' | 'checkbox'
    | 'file' | 'image' | 'rating' | 'slider' | 'tags' | 'rich_text';

type TriggerLogic = 'immediate' | 'smart' | 'event' | 'after_reply';

interface LeadField {
    id: string;
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
    options?: string[];
    placeholder?: string;
    ai_generated?: boolean;
    trigger_logic: TriggerLogic;
}

export default function FormBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const formId = params.id as string;

    // --- State ---
    const [formName, setFormName] = useState("Untitled Form");
    const [fields, setFields] = useState<LeadField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // AI State
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);

    // UI State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [optionInput, setOptionInput] = useState("");

    // Derived State
    const selectedField = fields.find(f => f.id === selectedFieldId);

    // --- Effects ---
    useEffect(() => {
        const fetchForm = async () => {
            try {
                const response = await leadsAPI.getFormById(formId);
                const form = response.data;
                if (form) {
                    setFormName(form.name);
                    setFields(form.fields);
                    if (form.fields.length > 0) setSelectedFieldId(form.fields[0].id);
                }
            } catch (error) {
                console.error("Failed to load form:", error);
                toast({ title: "Error", description: "Failed to load form data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        if (formId) fetchForm();
    }, [formId]);

    // --- DnD Sensors ---
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --- Handlers ---

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setFields((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addField = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newField: LeadField = {
            id: newId,
            key: `field_${fields.length + 1}`,
            label: 'New Question?',
            type: 'text',
            required: false,
            trigger_logic: 'smart'
        };
        setFields([...fields, newField]);
        setSelectedFieldId(newId);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const updateField = (id: string, updates: Partial<LeadField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    // Option Tag Handlers
    const addOption = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && optionInput.trim() && selectedField) {
            e.preventDefault();
            const currentOptions = selectedField.options || [];
            if (!currentOptions.includes(optionInput.trim())) {
                updateField(selectedField.id, { options: [...currentOptions, optionInput.trim()] });
            }
            setOptionInput("");
        }
    };

    const removeOption = (optionToRemove: string) => {
        if (selectedField) {
            const currentOptions = selectedField.options || [];
            updateField(selectedField.id, { options: currentOptions.filter(o => o !== optionToRemove) });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = {
                name: formName,
                fields: fields,
                trigger_intent: ["general"],
                settings: { submit_text: "Submit" }
            };
            await leadsAPI.updateForm(formId, formData);
            toast({ title: "Success", description: "Form saved successfully." });
            router.push('/dashboard/communication/forms');
        } catch (error) {
            console.error("Failed to save:", error);
            toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const generateQuestion = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);

        // Mock AI Generation Logic
        await new Promise(resolve => setTimeout(resolve, 1500));

        const newId = Math.random().toString(36).substr(2, 9);
        let generatedField: LeadField = {
            id: newId,
            key: aiPrompt.toLowerCase().replace(/\s+/g, '_').slice(0, 20),
            label: `What is your ${aiPrompt}?`,
            type: 'text',
            required: false,
            trigger_logic: 'smart',
            ai_generated: true
        };

        // Simple keyword matching for demo
        const p = aiPrompt.toLowerCase();
        if (p.includes('email')) { generatedField.type = 'email'; generatedField.label = "What is your email address?"; }
        else if (p.includes('phone')) { generatedField.type = 'phone'; generatedField.label = "Can I have your phone number?"; }
        else if (p.includes('budget')) { generatedField.type = 'number'; generatedField.label = "What is your estimated budget?"; }
        else if (p.includes('date') || p.includes('when')) { generatedField.type = 'date'; generatedField.label = "When would you like to start?"; }
        else if (p.includes('file') || p.includes('upload')) { generatedField.type = 'file'; generatedField.label = "Please upload your document."; }

        setFields([...fields, generatedField]);
        setSelectedFieldId(newId);
        setAiPrompt("");
        setIsGenerating(false);
        setIsAiOpen(false); // Close modal
        toast({ title: "AI Generated", description: `Added field for "${aiPrompt}"` });
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading Builder...</div>;

    return (
        <div className="h-[calc(100dvh-8rem)] flex flex-col gap-4 bg-neutral-50/50 dark:bg-neutral-950/50 overflow-hidden">
            {/* Header */}
            <div className="flex-none pb-3 sticky top-0 z-50 flex items-center justify-between  border-b bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/communication/forms')} className="hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 group">
                            <Input
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="text-xl font-bold border-none shadow-none px-2 h-auto  bg-transparent min-w-[200px]"
                            />
                            <Pencil className="h-3.5 w-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground px-0.5">Form ID: {formId}</p>
                    </div>
                </div>
                <div className="flex  items-center gap-3">
                    <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shadow-sm">
                                <Sparkles className="h-4 w-4" />
                                AI Builder
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Wand2 className="h-5 w-5 text-blue-500" />
                                    AI Form Assistant
                                </DialogTitle>
                                <DialogDescription>
                                    Describe a field or a set of questions you want to add.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Textarea
                                    placeholder="e.g., 'Ask the user for their monthly budget and timeline for the project.'"
                                    className="min-h-[100px] resize-none"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button onClick={generateQuestion} disabled={isGenerating || !aiPrompt.trim()} className="w-full sm:w-auto">
                                        {isGenerating ? "Generating..." : "Generate Fields"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px] shadow-sm">
                        {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Form</>}
                    </Button>
                </div>
            </div>

            {/* 2-Panel Layout */}
            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden min-h-0 max-w-[1600px] mx-auto w-full ">

                {/* LEFT PANEL: Field List */}
                <Card className="col-span-4 flex flex-col overflow-hidden border-neutral-200 dark:border-neutral-800 shadow-sm h-full bg-white dark:bg-neutral-950">
                    <CardHeader className="p-3 border-b  bg-neutral-50/50 dark:bg-neutral-900/30 flex-none">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold">Form Structure</CardTitle>
                                <CardDescription className="text-[10px]">Drag to reorder</CardDescription>
                            </div>
                            <Button size="sm" variant="ghost" onClick={addField} className="h-7 w-7 p-0 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        <div className="pt-3 mr-3">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={fields.map(f => f.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {fields.map((field) => (
                                        <SortableFieldItem
                                            key={field.id}
                                            id={field.id}
                                            field={field}
                                            isSelected={selectedFieldId === field.id}
                                            onSelect={setSelectedFieldId}
                                            onDelete={removeField}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                            {fields.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                    <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                                        <Plus className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        No fields yet. Click + to add one.
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* RIGHT PANEL: Configuration */}
                <Card className="col-span-8 border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-full bg-white dark:bg-neutral-950 overflow-hidden">
                    {selectedField ? (
                        <>
                            <CardHeader className="pb-3 border-b px-6 py-4 flex-none">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">Field Settings</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                                        onClick={() => removeField(selectedField.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                                    </Button>
                                </div>
                            </CardHeader>

                            <ScrollArea className="flex-1 h-full">
                                <div className="pt-3  max-w-2xl mx-auto space-y-8">

                                    {/* 1. Basic Info */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">Question Label</Label>
                                            <Input
                                                value={selectedField.label}
                                                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                                className="text-lg font-medium h-12"
                                                placeholder="e.g. What is your email?"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-muted-foreground">Input Type</Label>
                                                <Select
                                                    value={selectedField.type}
                                                    onValueChange={(v: FieldType) => updateField(selectedField.id, { type: v })}
                                                >
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[300px]">
                                                        <SelectItem value="text">Short Text</SelectItem>
                                                        <SelectItem value="rich_text">Long Text / Paragraph</SelectItem>
                                                        <SelectItem value="number">Number</SelectItem>
                                                        <SelectItem value="email">Email Address</SelectItem>
                                                        <SelectItem value="phone">Phone Number</SelectItem>
                                                        <SelectItem value="date">Date Picker</SelectItem>
                                                        <SelectSeparator />
                                                        <SelectItem value="dropdown">Dropdown Select</SelectItem>
                                                        <SelectItem value="multiselect">Multi-Select</SelectItem>
                                                        <SelectItem value="radio">Radio Buttons (One Select)</SelectItem>
                                                        <SelectItem value="checkbox">Checkbox Group</SelectItem>
                                                        <SelectSeparator />
                                                        <SelectItem value="file">File Upload</SelectItem>
                                                        <SelectItem value="rating">Star Rating</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-muted-foreground">Required?</Label>
                                                <div className="flex items-center h-10 px-3 border rounded-md bg-neutral-50 dark:bg-neutral-900/50 justify-between">
                                                    <span className="text-sm">Mandatory Field</span>
                                                    <Switch
                                                        checked={selectedField.required}
                                                        onCheckedChange={(c) => updateField(selectedField.id, { required: c })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* 2. Options (Conditional) */}
                                    {['dropdown', 'multiselect', 'radio', 'checkbox'].includes(selectedField.type) && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                    Options <span className="text-neutral-400 font-normal ml-1">(Type & Enter)</span>
                                                </Label>
                                                <Badge variant="outline" className="text-[10px] font-normal text-neutral-500">
                                                    {selectedField.options?.length || 0} items
                                                </Badge>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex flex-wrap gap-2 p-2 min-h-[42px] rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm items-center">
                                                    {selectedField.options?.map((option, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="secondary"
                                                            className="pl-2 pr-1 py-1 flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-800 transition-colors h-7"
                                                        >
                                                            {option}
                                                            <button
                                                                onClick={() => removeOption(option)}
                                                                className="hover:bg-blue-200/50 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors ml-1"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                    <Input
                                                        className="flex-1 border-none shadow-none focus-visible:ring-0 min-w-[120px] h-7 p-0 text-sm bg-transparent placeholder:text-neutral-400"
                                                        placeholder={selectedField.options?.length === 0 ? "Type an option & press Enter..." : "Add more..."}
                                                        value={optionInput}
                                                        onChange={(e) => setOptionInput(e.target.value)}
                                                        onKeyDown={addOption}
                                                    />
                                                </div>
                                                <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[9px] font-mono">↵</span>
                                                    Press Enter to add option
                                                </p>
                                            </div>
                                            <Separator className="my-6" />
                                        </div>
                                    )}

                                    {/* 3. Advanced Settings (Collapsible) */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                            className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            Advanced Configuration
                                        </button>

                                        {showAdvanced && (
                                            <div className="grid gap-5 p-4 border rounded-lg bg-neutral-50/50 dark:bg-neutral-900/30 animate-in slide-in-from-top-2 fade-in duration-200">
                                                <div className="space-y-2">
                                                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">System Key</Label>
                                                    <Input
                                                        value={selectedField.key}
                                                        onChange={(e) => updateField(selectedField.id, { key: e.target.value })}
                                                        className="font-mono text-xs bg-white dark:bg-neutral-950"
                                                        placeholder="e.g. user_email"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">Unique identifier for this field in the database.</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Trigger Logic</Label>
                                                    <Select
                                                        value={selectedField.trigger_logic}
                                                        onValueChange={(v: TriggerLogic) => updateField(selectedField.id, { trigger_logic: v })}
                                                    >
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="smart">✨ Smart (AI Decides)</SelectItem>
                                                            <SelectItem value="immediate">⚡ Immediate (Start)</SelectItem>
                                                            <SelectItem value="event">🖱️ Event Based</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </ScrollArea>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center bg-neutral-50/30 dark:bg-neutral-900/10">
                            <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                <Settings2 className="h-8 w-8 opacity-20" />
                            </div>
                            <h3 className="font-medium text-lg text-neutral-900 dark:text-white">No Field Selected</h3>
                            <p className="max-w-xs mt-2 text-sm">Select a field from the left panel to configure its properties.</p>
                        </div>
                    )}
                </Card>

            </div>
        </div>
    );
}

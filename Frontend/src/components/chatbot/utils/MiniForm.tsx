"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { leadsAPI } from "@/lib/api";

interface MiniFormProps {
    content?: string; // Support string content parsing
    form?: any;
    orgId?: string;
    initialData?: Record<string, any>;
    onSubmitSuccess?: () => void;
    onDataSubmitted?: (data: any) => void;
}

export const MiniForm: React.FC<MiniFormProps> = ({ content, form: propForm, orgId: propOrgId, initialData, onSubmitSuccess, onDataSubmitted }) => {
    // Parse content if provided
    let parsedForm = propForm;
    let parsedOrgId = propOrgId;

    if (content && content.includes('[FORM:')) {
        try {
            const jsonStr = content.match(/\[FORM: (.*?)\]/)?.[1];
            if (jsonStr) {
                const data = JSON.parse(jsonStr);
                parsedForm = data.form;
                parsedOrgId = data.orgId || propOrgId;
            }
        } catch (e) {
            console.error("Failed to parse form content", e);
        }
    }

    const form = parsedForm;
    const orgId = parsedOrgId || "default";

    const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isReviewMode, setIsReviewMode] = useState(false);

    // Check for completeness on load or data change
    const hasInitialized = React.useRef(false);

    // Check for completeness ONLY ON LOAD (Prevent auto-locking while editing)
    React.useEffect(() => {
        if (form && form.fields && !hasInitialized.current) {
            const requiredFields = form.fields.filter((f: any) => f.required);
            const isComplete = requiredFields.every((f: any) => formData[f.key] && formData[f.key].toString().trim() !== '');
            const hasValues = Object.values(formData).some(val => val && val.toString().trim() !== '');

            // Only show review mode if ALL required fields are filled AND we have some values.
            // This effectively means "Edit Mode" or "Pre-filled Mode".
            if (isComplete && hasValues && !isSubmitted) {
                setIsReviewMode(true);
            }
            hasInitialized.current = true;
        }
    }, [form]); // Only run when form definition loads/changes

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Basic Validation
        const missingFields = form.fields.filter((f: any) => f.required && !formData[f.key]);
        if (missingFields.length > 0) {
            setError(`Please fill in required fields: ${missingFields.map((f: any) => f.label).join(", ")}`);
            setIsSubmitting(false);
            return;
        }

        try {
            await leadsAPI.submitLead({
                orgId,
                formId: form._id,
                data: formData,
                source: 'chat_widget'
            });
            setIsSubmitted(true);
            if (onSubmitSuccess) onSubmitSuccess();
            if (onDataSubmitted) onDataSubmitted(formData);
        } catch (err) {
            console.error("Form submission failed:", err);
            setError("Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="space-y-3 animate-in fade-in zoom-in duration-500">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Details Sent! We'll be in touch.</span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={() => setIsSubmitted(false)}
                >
                    Edit Information
                </Button>
            </div>
        );
    }


    if (isReviewMode) {
        return (
            <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden mt-2 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                    <h4 className="font-semibold text-sm text-blue-900">Confirm Details</h4>
                    <button onClick={() => setIsReviewMode(false)} className="text-xs text-blue-600 hover:underline">Edit</button>
                </div>
                <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-500 mb-2">I have prepared this for you based on our chat:</p>
                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {form.fields.map((field: any) => (
                            <div key={field.key} className="flex justify-between text-sm">
                                <span className="text-slate-500">{field.label}:</span>
                                <span className="font-medium text-slate-800">{formData[field.key] || '-'}</span>
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-md hover:shadow-lg">
                        {isSubmitting ? "Sending..." : "Confirm & Send"}
                        {!isSubmitting && <Send className="ml-2 h-3 w-3" />}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden mt-2 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100">
                <h4 className="font-semibold text-sm text-blue-900">{form.name}</h4>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {form.fields.map((field: any) => (
                    <div key={field.id} className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>

                        {/* Text / Email / Phone / Number */}
                        {['text', 'email', 'phone', 'number', 'date'].includes(field.type) && (
                            <Input
                                type={field.type === 'phone' ? 'tel' : field.type}
                                placeholder={field.placeholder}
                                value={formData[field.key] || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                className="h-8 text-sm bg-white text-gray-900 border-gray-200 placeholder:text-gray-400 focus-visible:ring-blue-500"
                            />
                        )}

                        {/* Rich Text */}
                        {field.type === 'rich_text' && (
                            <Textarea
                                placeholder={field.placeholder}
                                value={formData[field.key] || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                className="min-h-[60px] text-sm bg-white text-gray-900 border-gray-200 placeholder:text-gray-400 focus-visible:ring-blue-500"
                            />
                        )}

                        {/* Dropdown */}
                        {field.type === 'dropdown' && (
                            <Select onValueChange={(val) => handleChange(field.key, val)}>
                                <SelectTrigger className="h-8 text-sm bg-white text-gray-900 border-gray-200 focus:ring-blue-500">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200">
                                    {field.options?.map((opt: string) => (
                                        <SelectItem key={opt} value={opt} className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Radio */}
                        {field.type === 'radio' && (
                            <RadioGroup onValueChange={(val) => handleChange(field.key, val)} className="flex flex-col gap-1">
                                {field.options?.map((opt: string) => (
                                    <div key={opt} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt} id={`${field.id}-${opt}`} className="border-gray-300 text-blue-600" />
                                        <Label htmlFor={`${field.id}-${opt}`} className="text-xs font-normal text-gray-700">{opt}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}

                        {/* Checkbox (Multi) */}
                        {field.type === 'checkbox' && (
                            <div className="flex flex-col gap-1">
                                {field.options?.map((opt: string) => (
                                    <div key={opt} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`${field.id}-${opt}`}
                                            className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
                                            onCheckedChange={(checked) => {
                                                const current = formData[field.key] || [];
                                                if (checked) handleChange(field.key, [...current, opt]);
                                                else handleChange(field.key, current.filter((v: string) => v !== opt));
                                            }}
                                        />
                                        <Label htmlFor={`${field.id}-${opt}`} className="text-xs font-normal text-gray-700">{opt}</Label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Star Rating */}
                        {field.type === 'rating' && (
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleChange(field.key, star)}
                                        className={`p-1 transition-all ${(formData[field.key] || 0) >= star
                                            ? 'text-yellow-400 scale-110'
                                            : 'text-gray-300 hover:text-yellow-200'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        )}

                    </div>
                ))}

                {error && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                        <AlertCircle className="h-3 w-3" />
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Sending..." : (form.settings?.submit_button_text || "Submit")}
                </Button>
            </form>
        </div>
    );
};

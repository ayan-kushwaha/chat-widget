"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, ChevronRight, ChevronLeft, FileText, HelpCircle, Info, Book, Settings, Shield, Star, Heart, Zap, Target, Search, Folder, Bot, Scissors, Link, Activity, BarChart, PieChart, Home, Menu, Smile, Tag, Bookmark, Flag, Wifi, Database, Cpu } from 'lucide-react';

// Icon Map (Matching Designer)
const ICON_MAP: Record<string, any> = {
    file: FileText, help: HelpCircle, info: Info, book: Book, settings: Settings,
    shield: Shield, star: Star, heart: Heart, zap: Zap, target: Target,
    search: Search, folder: Folder, bot: Bot, cut: Scissors, link: Link,
    activity: Activity, chart: BarChart, pie: PieChart, home: Home, menu: Menu,
    smile: Smile, tag: Tag, bookmark: Bookmark, flag: Flag, wifi: Wifi,
    database: Database, cpu: Cpu
};

interface FormField {
    id: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    rows?: number;
}

interface FormSchema {
    formId: string;
    fields: FormField[];
    submitEndpoint: string;
    successMessage: string;
}

interface FormItemConfig {
    id: string;
    templateId: string;
    title: string;
    description: string;
    icon: string;
    enabled: boolean;
}

interface FormViewProps {
    formId: string;
    onNavigate?: (view: string) => void;
}

// Mock form schemas (Templates)
const FORM_TEMPLATES: Record<string, Partial<FormSchema>> = {
    'contact_form': {
        fields: [
            { id: 'name', type: 'text', label: 'Full Name', required: true, placeholder: 'John Doe' },
            { id: 'email', type: 'email', label: 'Email', required: true, placeholder: 'john@example.com' },
            { id: 'message', type: 'textarea', label: 'Message', required: true, rows: 4, placeholder: 'How can we help?' }
        ]
    },
    'support_ticket': {
        fields: [
            { id: 'email', type: 'email', label: 'Email Address', required: true },
            { id: 'issue', type: 'select', label: 'Issue Type', required: true, options: ['Technical Issue', 'Billing', 'Account', 'Other'] },
            { id: 'description', type: 'textarea', label: 'Problem Description', required: true, rows: 5 }
        ]
    },
    'feedback_survey': {
        fields: [
            { id: 'rating', type: 'select', label: 'Experience Rating', required: true, options: ['Excellent', 'Good', 'Average', 'Poor'] },
            { id: 'comments', type: 'textarea', label: 'Comments', required: false, rows: 3 },
            { id: 'email', type: 'email', label: 'Start a conversation? (Optional)', required: false }
        ]
    },
    'quote_request': {
        fields: [
            { id: 'name', type: 'text', label: 'Name', required: true },
            { id: 'company', type: 'text', label: 'Company', required: false },
            { id: 'budget', type: 'select', label: 'Budget Range', required: true, options: ['<$1000', '$1k-5k', '$5k+'] },
            { id: 'details', type: 'textarea', label: 'Project Details', required: true, rows: 4 }
        ]
    },
    'newsletter': {
        fields: [
            { id: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'you@company.com' },
            { id: 'interests', type: 'select', label: 'Interests', required: false, options: ['Product Updates', 'Sales', 'Engineering'] }
        ]
    }
};

import defaultData from "@/app/dashboard/ai-studio/bots/tabs/page-designers/default-data.json";

export const FormView: React.FC<FormViewProps> = ({ formId, onNavigate }) => {
    const [pageConfig, setPageConfig] = useState<{ pageTitle: string, description: string } | null>(null);
    const [availableForms, setAvailableForms] = useState<FormItemConfig[]>([]);

    // local navigation state within the view
    const [activeFormItem, setActiveFormItem] = useState<FormItemConfig | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadConfig = () => {
            // Load "Form Page" config from localStorage
            const savedConfig = localStorage.getItem('cluaiz-form-page-config');
            if (savedConfig) {
                try {
                    const parsed = JSON.parse(savedConfig);
                    setPageConfig({
                        pageTitle: parsed.pageTitle || defaultData.form.pageTitle,
                        description: parsed.description || defaultData.form.description
                    });

                    if (parsed.items && Array.isArray(parsed.items)) {
                        setAvailableForms(parsed.items.filter((i: any) => i.enabled !== false));
                    }
                } catch (e) {
                    console.error('Error parsing form config', e);
                    setPageConfig({ pageTitle: defaultData.form.pageTitle, description: defaultData.form.description });
                    setAvailableForms(defaultData.form.items as unknown as FormItemConfig[]);
                }
            } else {
                // Fallback / Default
                setPageConfig({ pageTitle: defaultData.form.pageTitle, description: defaultData.form.description });
                setAvailableForms(defaultData.form.items as unknown as FormItemConfig[]);
            }
            setIsLoading(false);
        };

        // If formId is passed specifically (deep link), try to find it in the config or template
        // For now, we assume 'formId' passed to this component is just the generic route ID unless specific
        // Since we changed the architecture, we'll start at the list view unless logic forces otherwise.

        setTimeout(loadConfig, 500);
    }, [formId]);

    const handleFormSelect = (item: FormItemConfig) => {
        setActiveFormItem(item);
        setIsSuccess(false);
        setFormData({});
    };

    const handleBackToList = () => {
        setActiveFormItem(null);
        setIsSuccess(false);
    }

    const handleInputChange = (fieldId: string, value: string) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeFormItem) return;

        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Form submitted:', { formId: activeFormItem.id, data: formData });
            setIsSuccess(true);
            setFormData({});
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    // --- VIEW 1: FORM LIST (MENU) ---
    if (!activeFormItem) {
        return (
            <div className="h-full overflow-y-auto p-6 animate-fadeIn no-scrollbar">
                <div className="max-w-lg mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                            {pageConfig?.pageTitle}
                        </h2>
                        {pageConfig?.description && (
                            <p className="text-slate-600 dark:text-slate-400">
                                {pageConfig.description}
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        {availableForms.map((item) => {
                            const IconCmp = ICON_MAP[item.icon] || FileText;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleFormSelect(item)}
                                    className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-4 transition-all shadow-sm hover:shadow-md flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <IconCmp className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800 dark:text-white mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                            {item.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW 2: ACTIVE FORM ---
    const activeTemplate = FORM_TEMPLATES[activeFormItem.templateId] || FORM_TEMPLATES['contact_form']!;

    if (isSuccess) {
        return (
            <div className="h-full flex items-center justify-center p-6 animate-fadeIn">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                        Sent Successfully!
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        We've received your {activeFormItem.title}. We'll be in touch soon.
                    </p>
                    <div className="flex justify-center gap-3">
                        <Button onClick={() => setIsSuccess(false)} variant="outline">
                            Send Another
                        </Button>
                        <Button onClick={handleBackToList}>
                            Back to Forms
                        </Button>
                    </div>
                </div>

            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 animate-fadeIn no-scrollbar">
            <div className="max-w-lg mx-auto">
                <button
                    onClick={handleBackToList}
                    className="flex items-center text-sm text-slate-500 hover:text-blue-500 mb-4 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                </button>

                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            {(() => {
                                const Icon = ICON_MAP[activeFormItem.icon] || FileText;
                                return <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
                            })()}
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                            {activeFormItem.title}
                        </h2>
                    </div>
                    {activeFormItem.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm ml-1">
                            {activeFormItem.description}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeTemplate.fields?.map(field => (
                        <div key={field.id}>
                            <Label className="text-slate-700 dark:text-slate-300 mb-1.5 block text-sm font-medium">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    required={field.required}
                                    rows={field.rows || 3}
                                    placeholder={field.placeholder}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-sm"
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    required={field.required}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                >
                                    <option value="">Select option</option>
                                    {field.options?.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            ) : (
                                <Input
                                    type={field.type}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
                                />
                            )}
                        </div>
                    ))}

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all mt-6"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Submit Form'
                        )}
                    </Button>
                </form>
            </div>

        </div>
    );
};

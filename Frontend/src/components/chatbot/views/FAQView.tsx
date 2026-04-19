"use client";

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

interface FAQItem {
    id?: string;
    question: string;
    answer: string;
    sourceId?: string;
}

interface FAQCategory {
    id: string;
    name: string;
    items: FAQItem[];
}

interface FAQViewProps {
    onNavigate: (view: string, data?: any) => void;
    categories?: FAQCategory[];
}

import defaultData from "@/app/dashboard/ai-studio/bots/tabs/page-designers/default-data.json";

export const FAQView: React.FC<FAQViewProps> = ({
    onNavigate,
    categories: propCategories
}) => {
    const [config, setConfig] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        const saved = localStorage.getItem('cluaiz-faq-config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setConfig(parsed);
            } catch (e) {
                console.error('Failed to load FAQ config', e);
                setConfig(defaultData.faq);
            }
        } else {
            setConfig(defaultData.faq);
        }
    }, []);

    // Derive display items
    const displayItems = React.useMemo(() => {
        if (config && config.items) {
            return config.items;
        }
        return propCategories ? propCategories.flatMap(c => c.items) : defaultData.faq.items;
    }, [config, propCategories]);

    const toggleItem = (id: string | number) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(String(id))) {
            newExpanded.delete(String(id));
        } else {
            newExpanded.add(String(id));
        }
        setExpandedItems(newExpanded);
    };

    const filteredItems = displayItems.filter((item: any) =>
        searchQuery === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const title = config?.pageTitle || "Help Center";
    const description = config?.description || "Browse our frequently asked questions to find quick answers.";

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-950">
            {/* Header */}
            <div className="p-6 pb-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {description}
                </p>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search for answers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* FAQ List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 no-scrollbar">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-3 opacity-50">🔍</div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">No results found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredItems.map((item: any, idx: number) => {
                            const itemId = item.id || idx;
                            const isExpanded = expandedItems.has(String(itemId));

                            return (
                                <div
                                    key={itemId}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all hover:border-blue-500/30 dark:hover:border-blue-500/30 group"
                                >
                                    <button
                                        onClick={() => toggleItem(itemId)}
                                        className="w-full flex items-start gap-4 p-4 text-left transition-colors"
                                    >
                                        <div className={`mt-1 p-2 rounded-lg transition-colors ${isExpanded ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                            <MessageCircle size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-semibold text-base pr-4 transition-colors ${isExpanded ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                                                    {item.question}
                                                </h3>
                                                {isExpanded ? (
                                                    <ChevronUp size={18} className="text-slate-400 flex-shrink-0 mt-1" />
                                                ) : (
                                                    <ChevronDown size={18} className="text-slate-400 flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                            {isExpanded && (
                                                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed animate-fadeIn">
                                                    {item.answer}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Still Need Help Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <div className="text-center mb-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Still need help?
                    </p>
                </div>
                <button
                    onClick={() => onNavigate('chat', { initialMessage: 'I need help' })}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                    <MessageCircle size={18} />
                    Chat with Support
                </button>
            </div>
        </div>
    );
};

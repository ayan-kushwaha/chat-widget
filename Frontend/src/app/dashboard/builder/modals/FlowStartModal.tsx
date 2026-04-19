import React, { useState } from 'react';
import { INTEGRATION_APPS, IntegrationApp } from '../apps_registry';
import { Search, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlowStartModalProps {
    isOpen: boolean;
    onSelect: (appId: string) => void;
    onClose: () => void;
}

export const FlowStartModal: React.FC<FlowStartModalProps> = ({ isOpen, onSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    if (!isOpen) return null;

    // Filter apps based on search and category
    const filteredApps = INTEGRATION_APPS.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', 'core', 'communication', 'ecommerce', 'social', 'crm', 'productivity', 'payment', 'data'];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Zap className="text-yellow-400 fill-yellow-400" size={24} />
                                Select Flow Trigger
                            </h2>
                            <p className="text-slate-400 mt-1">
                                Every automation starts with a single trigger. Choose the **Source App** that will start this flow.
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search apps (e.g. WhatsApp, Shopify)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 text-white rounded-lg pl-10 pr-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[50%]">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${selectedCategory === cat
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* App Grid */}
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-slate-950/30">
                        {filteredApps.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => onSelect(app.id)}
                                className="group relative flex flex-col items-center p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all text-center"
                            >
                                <div
                                    className="p-3 rounded-lg mb-3 mb-2 transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: `${app.color}20` }}
                                >
                                    <app.icon size={28} style={{ color: app.color }} />
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                    {app.name}
                                </h3>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-tight">
                                    {app.description}
                                </p>
                            </button>
                        ))}

                        {filteredApps.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-400">
                                <p>No apps found matching "{searchTerm}"</p>
                            </div>
                        )}
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

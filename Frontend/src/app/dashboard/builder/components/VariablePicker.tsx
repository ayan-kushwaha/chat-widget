import React, { useState, useMemo } from 'react';
import { Search, Database, ArrowRight, Zap, PlayCircle, Layers, MousePointer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for the variables
export interface VariableOption {
    label: string;
    value: string; // The syntax to insert e.g. {{trigger.email}}
    type?: string;
}

export interface VariableGroup {
    sourceName: string;
    sourceId: string;
    icon?: any;
    variables: VariableOption[];
}

interface VariablePickerProps {
    availableVariables: VariableGroup[];
    onSelect: (variable: string) => void;
    onClose: () => void;
}

export const VariablePicker: React.FC<VariablePickerProps> = ({ availableVariables, onSelect, onClose }) => {
    const [search, setSearch] = useState('');

    const filteredGroups = useMemo(() => {
        if (!search) return availableVariables;

        return availableVariables.map(group => ({
            ...group,
            variables: group.variables.filter(v =>
                v.label.toLowerCase().includes(search.toLowerCase()) ||
                v.value.toLowerCase().includes(search.toLowerCase())
            )
        })).filter(group => group.variables.length > 0);
    }, [availableVariables, search]);

    return (
        <div className="absolute z-50 mt-2 w-72 bg-[#0f111a] border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-96 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Search */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2">
                    <Database size={14} className="text-indigo-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Insert Variable</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-slate-500" size={12} />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Search data points..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 placeholder-slate-600 focus:outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                {filteredGroups.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                        <p className="text-[10px]">No variables found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredGroups.map((group) => (
                            <div key={group.sourceId}>
                                <div className="flex items-center gap-2 px-2 mb-1.5 opacity-80">
                                    {group.icon ? <group.icon size={12} className="text-indigo-400" /> : <Zap size={12} className="text-indigo-400" />}
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[180px]">
                                        {group.sourceName}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {group.variables.map((variable) => (
                                        <button
                                            key={variable.value}
                                            onClick={() => {
                                                onSelect(variable.value);
                                                onClose();
                                            }}
                                            className="w-full text-left flex items-center justify-between group md:px-2 py-1.5 rounded-md hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                                        >
                                            <span className="text-xs text-slate-300 group-hover:text-white truncate">
                                                {variable.label}
                                            </span>
                                            <code className="text-[9px] text-slate-600 group-hover:text-indigo-400 font-mono hidden group-hover:block bg-slate-900 px-1 rounded">
                                                {variable.value}
                                            </code>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-slate-800 bg-slate-900/50 text-center">
                <p className="text-[9px] text-slate-500">
                    Variables are dynamically replaced at runtime.
                </p>
            </div>
        </div>
    );
};

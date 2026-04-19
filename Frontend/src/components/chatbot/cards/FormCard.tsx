"use client";

import React from 'react';
import { FileText, ArrowRight, Shield } from 'lucide-react';

interface FormCardProps {
    title: string;
    fields: { label: string; type: string }[];
}

export const FormCard: React.FC<FormCardProps> = ({ title, fields }) => {
    return (
        <div className="bg-[#1e293b] border border-pink-500/30 rounded-2xl overflow-hidden max-w-[280px] shadow-lg group">
            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                        <FileText size={20} className="text-pink-400" />
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 leading-tight">{title}</h3>
                <p className="text-xs text-zinc-400 mb-4">Please fill out the following details:</p>

                {/* Field Preview */}
                <div className="space-y-2 mb-4 bg-black/20 p-3 rounded-lg border border-white/5">
                    {fields.slice(0, 3).map((field, i) => (
                        <div key={i} className="flex items-center gap-2 text-zinc-500 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-pink-500/50" />
                            <span className="font-medium">{field.label}</span>
                        </div>
                    ))}
                    {fields.length > 3 && (
                        <div className="text-[10px] text-zinc-600 pl-3.5 pt-1">
                            + {fields.length - 3} more fields
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <Shield size={10} /> Secure Form
                    </div>
                    <button className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-pink-600/20">
                        Fill Now <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

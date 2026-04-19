import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface ChipsInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    label?: string;
}

export const ChipsInput = ({ value = [], onChange, placeholder = "Type and press Enter...", label }: ChipsInputProps) => {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const trimmed = inputValue.trim().replace(',', '');
            if (trimmed && !value.includes(trimmed)) {
                onChange([...value, trimmed]);
                setInputValue("");
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            // Remove last item on backspace if input is empty
            onChange(value.slice(0, -1));
        }
    };

    const removeChip = (indexToRemove: number) => {
        onChange(value.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="w-full">
            {label && (
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                    {label}
                </label>
            )}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all flex flex-wrap gap-2 min-h-[42px]">
                {value.map((chip, index) => (
                    <span key={index} className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs font-medium border border-indigo-500/30 animate-in fade-in zoom-in-95 duration-200">
                        {chip}
                        <button
                            type="button"
                            onClick={() => removeChip(index)}
                            className="hover:bg-indigo-500/40 rounded-full p-0.5 transition-colors"
                        >
                            <X size={10} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    className="bg-transparent border-none outline-none text-white placeholder-slate-600 flex-1 min-w-[80px]"
                    placeholder={value.length === 0 ? placeholder : ""}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">Press <code>Enter</code> or <code>,</code> to add.</p>
        </div>
    );
};

"use client";
import { useState } from "react";
import { useMotionTemplate, useMotionValue, motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, searchPlaceholder, disabled }) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const radius = 100;
    const [visible, setVisible] = useState(false);
    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const selectedLabel = options.find(opt => opt.value === value)?.label || value;
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                <motion.div
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                              ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
                              #3b82f6,
                              transparent 80%
                            )
                        `,
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setVisible(true)}
                    onMouseLeave={() => setVisible(false)}
                    className="group/input relative rounded-lg p-[2px] transition duration-300 inline-block w-full cursor-pointer"
                >
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-neutral-100 px-3 py-2 text-sm text-neutral-900 shadow-input transition duration-400 font-normal text-left justify-between",
                            "bg-gray-50 dark:bg-[#0e0e0e] dark:border-white/5 dark:text-white dark:placeholder:text-neutral-500",
                            "focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-blue-500",
                            "group-hover/input:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
                            "hover:bg-gray-50 dark:hover:bg-[#0e0e0e]"
                        )}
                        disabled={disabled}
                    >
                        {value ? (
                            <span className="truncate">{selectedLabel}</span>
                        ) : (
                            <span className="text-neutral-400 dark:text-neutral-500">{placeholder}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </motion.div>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-xl z-[60] overflow-hidden border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" align="start">
                <div className="flex flex-col max-h-[250px] bg-white dark:bg-zinc-900 text-neutral-900 dark:text-slate-200">
                    <div className="p-2 border-b border-neutral-100 dark:border-zinc-800">
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="h-8 text-xs bg-neutral-100 dark:bg-zinc-800 border-none"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (filteredOptions.length === 0 && searchValue.trim()) {
                                        onChange(searchValue);
                                        setOpen(false);
                                    }
                                }
                            }}
                        />
                    </div>
                    <ScrollArea
                        className="h-[200px] pointer-events-auto"
                        onWheel={(e) => e.stopPropagation()}
                    >
                        <div className="p-1">
                            {filteredOptions.length === 0 ? (
                                <div className="p-2 text-xs text-slate-500 text-center">
                                    No results.
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-1 w-full justify-start h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 text-xs font-semibold px-2"
                                        onClick={() => {
                                            onChange(searchValue);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full border border-blue-500/50 flex items-center justify-center text-[10px]">+</span>
                                            Add "{searchValue}"
                                        </div>
                                    </Button>
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer transition-colors",
                                            "hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-900 dark:hover:text-white dark:text-slate-400",
                                            value === option.value ? "bg-neutral-100 dark:bg-zinc-800 font-medium" : ""
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-3 w-3 flex-shrink-0",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate">{option.label}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
};

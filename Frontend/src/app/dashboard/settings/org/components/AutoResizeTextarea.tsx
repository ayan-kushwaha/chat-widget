"use client";
import { useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function AutoResizeTextarea({
    value,
    onChange,
    placeholder,
    className,
    disabled,
    rows = 1,
    maxLength
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    rows?: number;
    maxLength?: number;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
                "w-full resize-none overflow-hidden ",
                className
            )}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
        />
    );
}

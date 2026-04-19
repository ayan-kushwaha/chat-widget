"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function OTPInput({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const otpArray = value.split("").concat(Array(6).fill("")).slice(0, 6);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return;

        const newOtp = [...otpArray];
        newOtp[index] = val.slice(-1);
        const combined = newOtp.join("");
        onChange(combined);

        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !otpArray[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
        if (pastedData.every(char => /^\d$/.test(char))) {
            onChange(pastedData.join(""));
            inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
        }
    };

    return (
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {Array(6).fill(0).map((_, i) => (
                <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otpArray[i]}
                    onChange={e => handleInput(e, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    disabled={disabled}
                    className={cn(
                        "w-9 h-11 text-center text-lg font-bold rounded-lg border bg-white dark:bg-zinc-900 transition-all duration-200",
                        "border-neutral-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none",
                        "disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 dark:text-white"
                    )}
                />
            ))}
        </div>
    );
}

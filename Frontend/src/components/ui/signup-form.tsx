"use client";
import React from "react";
import { Label } from "./label";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import ShinyButton from "./shiny-button";
import { Loader2 } from "lucide-react";

export function SignupFormDemo({
    onSubmit,
    fields,
    submitText = "Sign up",
    footerText,
    loading = false,
    googleButton,
    forgotPasswordLink,
}: {
    onSubmit: (e: React.FormEvent) => void;
    fields: Array<{
        label: string;
        placeholder: string;
        type: string;
        id: string;
        value: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }>;
    submitText?: string;
    footerText?: React.ReactNode;
    loading?: boolean;
    googleButton?: React.ReactNode;
    forgotPasswordLink?: React.ReactNode;
}) {
    return (
        <div
            className="
    mx-auto w-full max-w-md 
    rounded-2xl border border-white/10
    bg-white/0 dark:bg-white/0
    p-4 md:p-8
    shadow-[0_8px_32px_rgba(0,0,0,0.1)]
    backdrop-blur-md
    backdrop-saturate-150
  "        >

            <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
                Welcome to Cluaiz
            </h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
                {submitText.includes("Sign up") ? "Create your account" : "Sign in to continue"}
            </p>

            <form className="my-8" onSubmit={onSubmit}>
                {fields.map((field) => (
                    <LabelInputContainer key={field.id} className="mb-4">
                        <Label htmlFor={field.id}>{field.label}</Label>
                        <Input
                            id={field.id}
                            placeholder={field.placeholder}
                            type={field.type}
                            value={field.value}
                            onChange={field.onChange}
                            isPassword={field.type === "password"}
                        />
                    </LabelInputContainer>
                ))}

                {forgotPasswordLink && (
                    <div className="flex justify-end mb-4">
                        {forgotPasswordLink}
                    </div>
                )}

                <ShinyButton
                    type="submit"
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Please wait...</span>
                        </div>
                    ) : (
                        submitText
                    )}
                </ShinyButton>

                {googleButton && (
                    <>
                        <div className="my-4 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
                        {googleButton}
                    </>
                )}

                {footerText && (
                    <>
                        <div className="my-6 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
                        <div className="text-center text-sm text-neutral-400">
                            {footerText}
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}

const LabelInputContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("flex w-full flex-col space-y-2", className)}>
            {children}
        </div>
    );
};

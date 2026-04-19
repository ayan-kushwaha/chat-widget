import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, EyeOff, Lock, Mail, Trash2, Plus, Check, Loader2, X } from "lucide-react";
import { OTPInput } from "../OTPInput";

interface ProfileAccountEditProps {
    user: any;
    isEditing: boolean;
    onUserChange: (field: string, value: any) => Promise<void>;
}

export function ProfileAccountEdit({ user, isEditing, onUserChange }: ProfileAccountEditProps) {
    // Primary Password State
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [showCurrentPasswordPrim, setShowCurrentPasswordPrim] = useState(false);
    const [showNewPasswordPrim, setShowNewPasswordPrim] = useState(false);
    const [showConfirmPasswordPrim, setShowConfirmPasswordPrim] = useState(false);
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [savingPrimPass, setSavingPrimPass] = useState(false);

    // Secondary Email/Password State
    const [showSecondaryPasswordFields, setShowSecondaryPasswordFields] = useState(false);
    const [showCurrentPasswordSec, setShowCurrentPasswordSec] = useState(false);
    const [showNewPasswordSec, setShowNewPasswordSec] = useState(false);
    const [showConfirmPasswordSec, setShowConfirmPasswordSec] = useState(false);
    const [secondaryPassDraft, setSecondaryPassDraft] = useState({ current: "", new: "", confirm: "", otp: "" });
    const [savingSecPass, setSavingSecPass] = useState(false);

    const [secPassResetMode, setSecPassResetMode] = useState(false);
    const [sendingSecOtp, setSendingSecOtp] = useState(false);

    // Link Secondary Email State
    const [showEmailLink, setShowEmailLink] = useState(false);
    const [linkEmail, setLinkEmail] = useState("");
    const [linkOtp, setLinkOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [linking, setLinking] = useState(false);

    if (!user) return null;

    return (
        <div className="px-6 sm:px-8 pb-4 mx-2">
            <div className="rounded-xl border border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.03] p-4">
                {/* Google Account row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {user.hasGoogle ? (
                            <Avatar className="h-10 w-10 border-2 border-blue-300 dark:border-blue-400/40 shadow-sm shrink-0">
                                <AvatarImage src={user.avatar} className="object-cover" referrerPolicy="no-referrer" />
                                <AvatarFallback className="bg-neutral-200 dark:bg-neutral-800 text-sm font-bold">
                                    {user.name?.charAt(0)?.toUpperCase() || "G"}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 opacity-40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{user.name || "Owner"}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                        </div>
                    </div>
                    {user.hasGoogle ? (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/25">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                Linked with Google
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-neutral-400 italic">No Google Account</span>
                    )}
                </div>

                {/* Secondary Linked Email */}
                {user.secondaryEmail?.email && (
                    <div className="flex flex-col gap-3 pt-3 mt-3 border-t border-neutral-200 dark:border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4 text-neutral-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">Secondary Email</p>
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{user.secondaryEmail.email}</p>
                                </div>
                            </div>
                            {isEditing && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-3 text-[10px] font-bold tracking-tight border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all active:scale-95 flex items-center gap-1.5"
                                    onClick={() => {
                                        if (confirm("Are you sure you want to delete this secondary email connection?")) {
                                            onUserChange?.("unlinkEmail", user.secondaryEmail?.email);
                                        }
                                    }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                </Button>
                            )}
                        </div>

                        {/* Secondary Password Section (Unified UI) */}
                        {isEditing && user.secondaryEmail && (
                            <div className="mt-4 p-3 rounded-lg bg-neutral-100/50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-3.5 h-3.5 text-blue-500" />
                                        <div>
                                            <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Secondary Security</p>
                                            <p className="text-[9px] text-neutral-500">
                                                {user.secondaryEmail.hasPassword ? "Change secondary password" : "Set a secondary password"}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant={showSecondaryPasswordFields ? "secondary" : "outline"}
                                        size="sm"
                                        className="h-7 px-2.5 text-[10px] font-bold"
                                        onClick={() => {
                                            setShowSecondaryPasswordFields(!showSecondaryPasswordFields);
                                            setSecondaryPassDraft({ current: "", new: "", confirm: "", otp: "" });
                                        }}
                                    >
                                        {showSecondaryPasswordFields ? "Cancel" : (user.secondaryEmail.hasPassword ? "Change Password" : "Set Password")}
                                    </Button>
                                </div>

                                {showSecondaryPasswordFields && (
                                    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-white/10 animate-in fade-in slide-in-from-top-1">
                                        {user.secondaryEmail.hasPassword && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">Current Password</Label>
                                                {secPassResetMode ? (
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter 6-digit OTP"
                                                        value={secondaryPassDraft.otp}
                                                        onChange={e => setSecondaryPassDraft({ ...secondaryPassDraft, otp: e.target.value })}
                                                        maxLength={6}
                                                    />
                                                ) : (
                                                    <div className="relative group/pass">
                                                        <Input
                                                            type={showCurrentPasswordSec ? "text" : "password"}
                                                            placeholder="Enter your current password"
                                                            className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 pr-10 focus:ring-2 focus:ring-blue-500/20 w-full"
                                                            value={secondaryPassDraft.current}
                                                            onChange={e => setSecondaryPassDraft({ ...secondaryPassDraft, current: e.target.value })}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCurrentPasswordSec(!showCurrentPasswordSec)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                                        >
                                                            {showCurrentPasswordSec ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">New Password</Label>
                                            <div className="relative group/pass">
                                                <Input
                                                    type={showNewPasswordSec ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 pr-10"
                                                    value={secondaryPassDraft.new}
                                                    onChange={e => setSecondaryPassDraft({ ...secondaryPassDraft, new: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPasswordSec(!showNewPasswordSec)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                                >
                                                    {showNewPasswordSec ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">Confirm Password</Label>
                                            <div className="relative group/pass">
                                                <Input
                                                    type={showConfirmPasswordSec ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 pr-10"
                                                    value={secondaryPassDraft.confirm}
                                                    onChange={e => setSecondaryPassDraft({ ...secondaryPassDraft, confirm: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPasswordSec(!showConfirmPasswordSec)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                                >
                                                    {showConfirmPasswordSec ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center gap-2 mt-2">
                                            {user.secondaryEmail.hasPassword && !secPassResetMode && (
                                                <button
                                                    type="button"
                                                    disabled={sendingSecOtp}
                                                    onClick={async () => {
                                                        setSendingSecOtp(true);
                                                        try {
                                                            await onUserChange?.("sendSecondaryResetOtp", null);
                                                            setSecPassResetMode(true);
                                                            setSecondaryPassDraft(s => ({ ...s, current: "", otp: "" })); // Clear current password and otp
                                                        } finally {
                                                            setSendingSecOtp(false);
                                                        }
                                                    }}
                                                    className="text-[10px] text-blue-500 hover:text-blue-400 font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    {sendingSecOtp ? "Sending OTP..." : "Forgot password? Get OTP via Email"}
                                                </button>
                                            )}
                                            {secPassResetMode && (
                                                <span className="text-[10px] text-neutral-500 mr-auto">OTP sent to {user.secondaryEmail.email}</span>
                                            )}
                                            <Button
                                                size="sm"
                                                className="h-10 text-xs font-bold px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 rounded-lg active:scale-95 transition-all ml-auto"
                                                disabled={
                                                    savingSecPass ||
                                                    !secondaryPassDraft.new ||
                                                    secondaryPassDraft.new.length < 6 ||
                                                    secondaryPassDraft.new !== secondaryPassDraft.confirm ||
                                                    (secPassResetMode ? secondaryPassDraft.otp.length !== 6 : false)
                                                }
                                                onClick={async () => {
                                                    setSavingSecPass(true);
                                                    try {
                                                        if (secPassResetMode) {
                                                            await onUserChange?.("resetSecondaryWithOtp", {
                                                                otp: secondaryPassDraft.otp,
                                                                new: secondaryPassDraft.new
                                                            });
                                                        } else {
                                                            await onUserChange?.("setSecondaryPassword", {
                                                                current: secondaryPassDraft.current,
                                                                new: secondaryPassDraft.new
                                                            });
                                                        }
                                                        setSecondaryPassDraft({ current: "", new: "", confirm: "", otp: "" });
                                                        setSecPassResetMode(false);
                                                        setShowSecondaryPasswordFields(false);
                                                        setShowCurrentPasswordSec(false);
                                                    } catch (e) { } finally {
                                                        setSavingSecPass(false);
                                                    }
                                                }}
                                            >
                                                {savingSecPass ? "Saving..." : "Update Password"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {!showSecondaryPasswordFields && (
                                    <p className="mt-1.5 text-[9px] text-neutral-400 italic">Login directly using <span className="text-neutral-300 font-medium">{user.secondaryEmail.email}</span></p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Add Secondary Email Form - Limited to 1 email */}
                {isEditing && !user.secondaryEmail && (
                    <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-white/5 space-y-3">
                        {!showEmailLink ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 w-full justify-start gap-2.5 rounded-lg border border-dashed border-blue-200 dark:border-blue-500/20"
                                onClick={() => setShowEmailLink(true)}
                            >
                                <Plus className="w-4 h-4" />
                                Link a Secondary Account (Login via OTP)
                            </Button>
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg p-3 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Link Secondary Email</p>
                                    <button
                                        onClick={() => { setShowEmailLink(false); setOtpSent(false); setLinkEmail(""); setLinkOtp(""); }}
                                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {!otpSent ? (
                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-1.5">
                                            <Label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold ml-1">Secondary Email Address</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. personal@email.com"
                                                    type="email"
                                                    className="h-10 flex-1 w-[320px] text-sm bg-neutral-50 dark:bg-zinc-800/50 border-neutral-200 dark:border-zinc-800 transition-all focus:ring-2 focus:ring-blue-500/20"
                                                    value={linkEmail}
                                                    onChange={(e) => setLinkEmail(e.target.value)}
                                                />
                                                <Button
                                                    size="sm"
                                                    className="h-10 px-4 mt-[1px] bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20"
                                                    disabled={!linkEmail.includes("@") || linking}
                                                    onClick={async () => {
                                                        setLinking(true);
                                                        try {
                                                            await onUserChange?.("sendLinkOtp", linkEmail);
                                                            setOtpSent(true);
                                                        } finally {
                                                            setLinking(false);
                                                        }
                                                    }}
                                                >
                                                    {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 py-2">
                                        <div className="text-center space-y-1">
                                            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">Verification Required</p>
                                            <p className="text-[11px] text-neutral-500">We've sent a 6-digit code to <span className="text-blue-500 font-semibold">{linkEmail}</span></p>
                                        </div>

                                        <OTPInput
                                            value={linkOtp}
                                            onChange={setLinkOtp}
                                            disabled={linking}
                                        />

                                        <div className="flex flex-col gap-2 pt-2">
                                            <Button
                                                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-lg shadow-green-500/20"
                                                disabled={linkOtp.length < 6 || linking}
                                                onClick={async () => {
                                                    setLinking(true);
                                                    try {
                                                        await onUserChange?.("verifyLinkOtp", { email: linkEmail, otp: linkOtp });
                                                        setShowEmailLink(false);
                                                        setOtpSent(false);
                                                        setLinkEmail("");
                                                        setLinkOtp("");
                                                    } finally {
                                                        setLinking(false);
                                                    }
                                                }}
                                            >
                                                {linking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                                {linking ? "Verifying..." : "Verify & Link Account"}
                                            </Button>

                                            <button
                                                onClick={() => setOtpSent(false)}
                                                className="text-[11px] text-neutral-500 hover:text-blue-500 transition-colors py-1"
                                            >
                                                Didn't receive code? <span className="font-semibold underline">Edit email or Resend</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 🔐 Password Section — Edit Mode Only */}
            {isEditing && (
                <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-white/5">
                    <div className="rounded-xl border border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-neutral-500" />
                                <div>
                                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Primary Password</p>
                                    <p className="text-xs text-neutral-500">
                                        {user.hasPassword ? "Change your master password" : "Set a master password"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={showPasswordFields ? "secondary" : "outline"}
                                size="sm"
                                className="h-8 text-xs font-medium"
                                onClick={() => {
                                    setShowPasswordFields(!showPasswordFields);
                                    if (!showPasswordFields) {
                                        setPasswords({ current: "", new: "", confirm: "" });
                                    }
                                }}
                            >
                                {showPasswordFields ? "Cancel" : (user.hasPassword ? "Change Password" : "Set Password")}
                            </Button>
                        </div>
                        {showPasswordFields && (
                            <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-white/10 animate-in fade-in slide-in-from-top-1">
                                {user.hasPassword && (
                                    <div className="space-y-1.5 w-full">
                                        <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">Current Password</Label>
                                        <div className="relative group/pass">
                                            <Input
                                                type={showCurrentPasswordPrim ? "text" : "password"}
                                                placeholder="Enter your current password"
                                                className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 pr-10 focus:ring-2 focus:ring-blue-500/20 w-full"
                                                value={passwords.current}
                                                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPasswordPrim(!showCurrentPasswordPrim)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                            >
                                                {showCurrentPasswordPrim ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1.5 w-full">
                                    <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">New Password</Label>
                                    <div className="relative group/pass">
                                        <Input
                                            type={showNewPasswordPrim ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 w-full pr-10"
                                            value={passwords.new}
                                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPasswordPrim(!showNewPasswordPrim)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                        >
                                            {showNewPasswordPrim ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5 w-full">
                                    <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">Confirm Password</Label>
                                    <div className="relative group/pass">
                                        <Input
                                            type={showConfirmPasswordPrim ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 w-full pr-10"
                                            value={passwords.confirm}
                                            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPasswordPrim(!showConfirmPasswordPrim)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                        >
                                            {showConfirmPasswordPrim ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button
                                        size="sm"
                                        className="h-10 text-xs font-bold px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 rounded-lg active:scale-95 transition-all"
                                        disabled={
                                            savingPrimPass ||
                                            !passwords.new ||
                                            passwords.new.length < 6 ||
                                            passwords.new !== passwords.confirm
                                        }
                                        onClick={async () => {
                                            setSavingPrimPass(true);
                                            try {
                                                await onUserChange?.("setPrimaryPassword", passwords);
                                                setShowPasswordFields(false);
                                                setShowCurrentPasswordPrim(false);
                                            } catch (e) {
                                                // error shown by parent
                                            } finally {
                                                setSavingPrimPass(false);
                                            }
                                        }}
                                    >
                                        {savingPrimPass ? "Saving..." : (user.hasPassword ? "Update Password" : "Set Password")}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

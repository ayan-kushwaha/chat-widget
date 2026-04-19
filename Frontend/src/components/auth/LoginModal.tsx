'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { SignupFormDemo } from '@/components/ui/signup-form';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register as registerApi } from '@/api/auth.api';

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    skipRefresh?: boolean;  // Skip router.refresh (for billing context)
}

export function LoginModal({ open, onOpenChange, onSuccess, skipRefresh = false }: LoginModalProps) {
    const [view, setView] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast.error('All fields are required');
            return;
        }

        if (view === 'register') {
            if (password !== confirmPassword) {
                toast.error('Passwords do not match');
                return;
            }
            if (password.length < 6) {
                toast.error('Password must be at least 6 characters');
                return;
            }
        }

        setLoading(true);

        try {
            if (view === 'register') {
                // Register User
                await registerApi(email, password);
                toast.success('Account created! Logging in...');
            }

            // Auto-Login (for both flows)
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error(view === 'register' ? 'Auto-login failed. Please sign in.' : 'Invalid credentials');
                if (view === 'register') setView('login');
            } else {
                toast.success(view === 'register' ? 'Welcome to Cluaiz!' : 'Login successful!');
                if (!skipRefresh) {
                    router.refresh();  // Only refresh if not in billing context
                }
                onSuccess();
                onOpenChange(false);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Something went wrong';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        await signIn('google', { callbackUrl: window.location.href });
    };

    const fields = [
        {
            label: 'Email Address',
            placeholder: 'you@example.com',
            type: 'email',
            id: 'modal-email',
            value: email,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
        },
        {
            label: 'Password',
            placeholder: '••••••••',
            type: 'password',
            id: 'modal-password',
            value: password,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
        },
    ];

    if (view === 'register') {
        fields.push({
            label: 'Confirm Password',
            placeholder: '••••••••',
            type: 'password',
            id: 'modal-confirm-password',
            value: confirmPassword,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value),
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* [&>button]:hidden hides the default DialogClose button */}
            <DialogContent className="sm:max-w-[480px] z-[999999] p-0 bg-transparent border-0 shadow-none overflow-hidden [&>button]:hidden">
                <DialogTitle className="sr-only">{view === 'login' ? 'Sign In' : 'Create Account'}</DialogTitle>
                <div className="relative">
                    {/* Custom Close Button - Positioned exactly where desired */}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute right-6 top-6 z-50 p-2 rounded-full bg-neutral-900/50 hover:bg-neutral-900/80 text-neutral-400 hover:text-white transition-all backdrop-blur-sm border border-white/10"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Reusing existing SignupFormDemo UI */}
                    <SignupFormDemo
                        onSubmit={handleSubmit}
                        fields={fields}
                        submitText={loading ? (view === 'login' ? "Signing in..." : "Creating Account...") : (view === 'login' ? "Sign in" : "Sign up")}
                        loading={loading}
                        footerText={
                            <div className="text-center text-sm text-neutral-400 mt-4">
                                {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    type="button"
                                    className="font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                                    onClick={() => setView(view === 'login' ? 'register' : 'login')}
                                >
                                    {view === 'login' ? "Sign up" : "Sign in"}
                                </button>
                            </div>
                        }
                        googleButton={
                            <button
                                onClick={handleGoogleSignIn}
                                type="button"
                                disabled={googleLoading || loading}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-black"
                            >
                                {googleLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        <span className="text-neutral-700 dark:text-neutral-300 font-medium">{view === 'login' ? "Sign in with Google" : "Sign up with Google"}</span>
                                    </>
                                )}
                            </button>
                        }
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

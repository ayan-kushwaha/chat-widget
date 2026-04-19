'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { register as registerApi } from '@/api/auth.api';
import Link from 'next/link';
import { SignupFormDemo } from '@/components/ui/signup-form';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesText } from '@/components/ui/sparkles-text';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BackgroundLines } from '@/components/ui/BackgroundLines/background-lines';
import { cn } from "@/lib/utils";
import { ShootingStars } from '@/components/ui/ShootingStarsBackground/shooting-stars';
import { StarsBackground } from '@/components/ui/ShootingStarsBackground/stars-background';
import { ArrowLeft, Loader2 } from 'lucide-react';
// import { Pointer } from '@/components/ui/pointer';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }
        if (!email.trim()) {
            toast.error('Email is required');
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await registerApi(email, password);

            // Auto login after registration to set session cookie
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error('Account created, but auto-login failed. Please sign in.');
                router.push('/login');
            } else {
                toast.success('Account created!');
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        await signIn('google', { callbackUrl: '/dashboard' });
    };

    const step1Fields = [
        {
            label: 'Full Name',
            placeholder: 'John Doe',
            type: 'text',
            id: 'name',
            value: name,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
        },
        {
            label: 'Email Address',
            placeholder: 'you@example.com',
            type: 'email',
            id: 'email',
            value: email,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
        },
    ];

    const step2Fields = [
        {
            label: 'Password',
            placeholder: '••••••••',
            type: 'password',
            id: 'password',
            value: password,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
        },
        {
            label: 'Confirm Password',
            placeholder: '••••••••',
            type: 'password',
            id: 'confirmPassword',
            value: confirmPassword,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value),
        },
    ];

    return (
        <>
            <BackgroundLines
                className={cn(
                    "bg-white dark:bg-neutral-950",
                    "absolute inset-0",
                    "[background-size:40px_40px]",
                    "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
                    "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
                )}
            >
                {/* <Pointer /> */}
                <ShootingStars />
                <StarsBackground />
                <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md"
                    >
                        <div className="mb-6 text-center">
                            <SparklesText className="text-3xl font-bold text-neutral-900 dark:text-white">
                                Join Cluaiz
                            </SparklesText>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <SignupFormDemo
                                        onSubmit={handleNext}
                                        fields={step1Fields}
                                        submitText="Next"
                                        loading={false}
                                        footerText={
                                            <>
                                                Already have an account?{' '}
                                                <Link href="/login" className="font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                                                    Sign in
                                                </Link>
                                            </>
                                        }
                                        googleButton={
                                            <button
                                                onClick={handleGoogleSignIn}
                                                type="button"
                                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                            >
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                                <span className="text-neutral-700 dark:text-neutral-300 font-medium">Sign up with Google</span>
                                            </button>
                                        }
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <SignupFormDemo
                                        onSubmit={handleSubmit}
                                        fields={step2Fields}
                                        submitText={loading ? "Creating account..." : "Sign up"}
                                        loading={loading}
                                        footerText={
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(1)}
                                                    className="font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                                                >
                                                    ← Back
                                                </button>
                                            </>
                                        }
                                        googleButton={
                                            <button
                                                onClick={handleGoogleSignIn}
                                                type="button"
                                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                            >
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                                <span className="text-neutral-700 dark:text-neutral-300 font-medium">Sign up with Google</span>
                                            </button>
                                        }
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                <div className="fixed top-6 left-6 z-[100]">
                    <Link href="/" className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </Link>
                </div>

                <div className="fixed bottom-6 right-6 z-[100]">
                    <ThemeToggle />
                </div>
            </BackgroundLines>
        </>
    );
}

'use client';

import { useState } from 'react';
import { forgotPassword } from '@/api/auth.api';
import Link from 'next/link';
import { SignupFormDemo } from '@/components/ui/signup-form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SparklesText } from '@/components/ui/sparkles-text';
import { BackgroundLines } from '@/components/ui/BackgroundLines/background-lines';
import { cn } from '@/lib/utils';
import { ShootingStars } from '@/components/ui/ShootingStarsBackground/shooting-stars';
import { StarsBackground } from '@/components/ui/ShootingStarsBackground/stars-background';
import { Pointer } from '@/components/ui/pointer';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error('Email is required');
            return;
        }

        setLoading(true);

        try {
            await forgotPassword(email);
            setSubmitted(true);
            toast.success('Reset link sent to your email');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        {
            label: 'Email Address',
            placeholder: 'you@example.com',
            type: 'email',
            id: 'email',
            value: email,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
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
                <Pointer />
                <ShootingStars />
                <StarsBackground />
                <div className=" z-10 flex min-h-screen items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md "
                    >
                        <div className="mb-6 text-center">
                            <SparklesText className="text-3xl font-bold text-neutral-900 dark:text-white">
                                Forgot Password
                            </SparklesText>
                            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                                Enter your email to receive a reset link
                            </p>
                        </div>

                        {submitted ? (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Check your email</h3>
                                <p className="text-green-700 dark:text-green-300 mb-4">
                                    We have sent a password reset link to <strong>{email}</strong>
                                </p>
                                <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                    Back to Login
                                </Link>
                            </div>
                        ) : (
                            <SignupFormDemo
                                onSubmit={handleSubmit}
                                fields={fields}
                                submitText={loading ? "Sending..." : "Send Reset Link"}
                                loading={loading}
                                footerText={
                                    <>
                                        Remember your password?{' '}
                                        <Link href="/login" className="font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                                            Sign in
                                        </Link>
                                    </>
                                }
                            />
                        )}
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
            </BackgroundLines >
        </>
    );
}

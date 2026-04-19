'use client';

import { useState } from 'react';
import { resetPassword } from '@/api/auth.api';
import { useRouter } from 'next/navigation';
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

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
            await resetPassword(params.token, password);
            toast.success('Password reset successfully!');
            router.push('/login');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        {
            label: 'New Password',
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
                                Reset Password
                            </SparklesText>
                            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                                Create a new password for your account
                            </p>
                        </div>

                        <SignupFormDemo
                            onSubmit={handleSubmit}
                            fields={fields}
                            submitText={loading ? "Resetting..." : "Reset Password"}
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
                    </motion.div>
                </div>

                <div className="fixed bottom-6 right-6 z-[100]">
                    <ThemeToggle />
                </div>
            </BackgroundLines >
        </>
    );
}

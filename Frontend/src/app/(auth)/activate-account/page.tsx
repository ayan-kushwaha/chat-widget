'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SparklesText } from '@/components/ui/sparkles-text';
import { BackgroundLines } from '@/components/ui/BackgroundLines/background-lines';
import { cn } from '@/lib/utils';
import { ShootingStars } from '@/components/ui/ShootingStarsBackground/shooting-stars';
import { StarsBackground } from '@/components/ui/ShootingStarsBackground/stars-background';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';

export default function ActivateAccountPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            toast.error('Invalid activation link');
            router.push('/login');
        }
    }, [token, router]);

    const handleActivate = async (e: React.FormEvent) => {
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
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'}/team/activate-account`,
                { token, password }
            );

            if (response.data.success) {
                toast.success('Account activated successfully! Please login.');
                router.push('/login');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to activate account');
        } finally {
            setLoading(false);
        }
    };

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
                <ShootingStars />
                <StarsBackground />
                <div className="relative z-20 flex min-h-screen items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-30 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl border border-neutral-200 dark:border-neutral-800"
                    >
                        <div className="mb-6 text-center">
                            <SparklesText className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                                Activate Account
                            </SparklesText>
                            <p className="text-neutral-600 dark:text-neutral-400 mt-4 text-lg">
                                Set your password to activate your account
                            </p>
                        </div>

                        <form onSubmit={handleActivate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="relative z-50 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                            >
                                {loading ? 'Activating...' : 'Activate Account'}
                            </button>
                        </form>
                    </motion.div>
                </div>

                <div className="fixed bottom-6 right-6 z-[100]">
                    <ThemeToggle />
                </div>
            </BackgroundLines>
        </>
    );
}

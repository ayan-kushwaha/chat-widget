'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SparklesText } from '@/components/ui/sparkles-text';
import { BackgroundLines } from '@/components/ui/BackgroundLines/background-lines';
import { cn } from '@/lib/utils';
import { ShootingStars } from '@/components/ui/ShootingStarsBackground/shooting-stars';
import { StarsBackground } from '@/components/ui/ShootingStarsBackground/stars-background';
// import { Pointer } from '@/components/ui/pointer';

export default function ReactivatePage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const handleReactivate = async () => {
        if (!session) return;

        setLoading(true);
        try {
            const token = (session as any).accessToken;
            const orgId = (session as any).orgId;

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'}/auth/reactivate-account`,
                { orgId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success('Account reactivated! Redirecting...');

            // Force reload session to clear is_deleted flag? 
            // Actually, the token still has is_deleted=true until refreshed.
            // We might need to sign out and sign in, or refresh the session.
            // For now, let's try redirecting to dashboard. 
            // Middleware checks token.is_deleted.
            // If we don't refresh token, middleware will still block.
            // So we probably need to logout and ask user to login again?
            // Or use update() from useSession?

            // Let's try to just redirect first. If middleware blocks, we logout.
            // Actually, the backend updated the DB. But the token is a JWT.
            // The JWT payload is immutable.
            // So we MUST refresh the token or re-login.

            await signOut({ redirect: false });
            toast.info('Please login again to access your account.');
            router.push('/login');

        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reactivate account');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    if (status === 'loading') return null;

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
                <div className="relative z-20 flex min-h-screen items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-30 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl border border-neutral-200 dark:border-neutral-800"
                    >
                        <div className="mb-6 text-center">
                            <SparklesText className="text-3xl font-bold text-red-600 dark:text-red-500">
                                Account Deleted
                            </SparklesText>
                            <p className="text-neutral-600 dark:text-neutral-400 mt-4 text-lg">
                                Your account is scheduled for deletion.
                            </p>
                            <p className="text-neutral-500 dark:text-neutral-500 mt-2 text-sm">
                                You have 30 days to restore it before it's permanently removed.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 mt-8 relative z-40">
                            <button
                                onClick={handleReactivate}
                                disabled={loading}
                                className="relative z-50 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading ? 'Restoring...' : 'Yes, Restore Account'}
                            </button>

                            <button
                                onClick={handleLogout}
                                disabled={loading}
                                className="relative z-50 w-full py-3 px-4 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg font-medium transition-colors cursor-pointer"
                            >
                                No, Logout
                            </button>
                        </div>
                    </motion.div>
                </div>

                <div className="fixed bottom-6 right-6 z-[100]">
                    <ThemeToggle />
                </div>
            </BackgroundLines >
        </>
    );
}

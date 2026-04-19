'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
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
import { ArrowLeft, Loader2 } from 'lucide-react';
// import { Pointer } from '@/components/ui/pointer';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error('Email is required');
            return;
        }

        if (!password.trim()) {
            toast.error('Password is required');
            return;
        }

        setEmailLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error('Invalid credentials');
            } else {
                toast.success('Welcome back!');
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err: any) {
            toast.error('Something went wrong');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        await signIn('google', { callbackUrl: '/dashboard' });
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
        {
            label: 'Password',
            placeholder: '••••••••',
            type: 'password',
            id: 'password',
            value: password,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
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
                <div className=" z-10 flex min-h-screen items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md "
                    >
                        <div className="mb-6 text-center">
                            <SparklesText className="text-3xl font-bold text-neutral-900 dark:text-white">
                                Login Cluaiz
                            </SparklesText>
                        </div>
                        <SignupFormDemo
                            onSubmit={handleSubmit}
                            fields={fields}
                            submitText={emailLoading ? "Signing in..." : "Sign in"}
                            loading={emailLoading}
                            footerText={
                                <>
                                    Don't have an account?{' '}
                                    <Link href="/register" className="font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                                        Sign up
                                    </Link>
                                </>
                            }
                            forgotPasswordLink={
                                <Link href="/forgot-password" className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                    Forgot password?
                                </Link>
                            }
                            googleButton={
                                <button
                                    onClick={handleGoogleSignIn}
                                    type="button"
                                    disabled={googleLoading || emailLoading}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            <span className="text-neutral-700 dark:text-neutral-300 font-medium">Sign in with Google</span>
                                        </>
                                    )}
                                </button>
                            }
                        />
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

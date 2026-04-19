"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { legalAPI, LegalPage } from '@/api/legal.api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LegalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [page, setPage] = useState<LegalPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!slug) return;

        const fetchPage = async () => {
            try {
                const res = await legalAPI.getBySlug(slug);
                if (res.success) {
                    setPage(res.page);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Failed to fetch page", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
                <h1 className="text-4xl font-bold">404</h1>
                <p className="text-slate-400">Legal Document Not Found</p>
                <Link href="/legal">
                    <Button variant="outline">Back to Legal Center</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-24 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Back Link */}
                <Link href="/legal" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Legal Center
                </Link>

                {/* Header */}
                <div className="mb-12 border-b border-slate-800 pb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        {page.title}
                    </h1>
                    <div className="flex items-center text-slate-500 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Last Updated: {new Date(page.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>

                {/* Content - Prose ensures Typography styling */}
                <article className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-indigo-400 prose-strong:text-white hover:prose-a:text-indigo-300">
                    <div dangerouslySetInnerHTML={{ __html: page.content }} />
                </article>

            </div>
        </div>
    );
}

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { legalAPI } from '@/api/legal.api';
import { RichTextEditor } from '@/components/shared/editor/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateLegalPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'legal' | 'blog' | 'help'>('legal');

    // SEO State
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDesc, setSeoDesc] = useState('');

    const handleSave = async () => {
        if (!title || !content) {
            toast.error("Please fill title and content");
            return;
        }

        setLoading(true);
        try {
            await legalAPI.create({
                title,
                slug: slug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                content,
                category,
                seo: {
                    title: seoTitle || title,
                    description: seoDesc,
                    keywords: []
                }
            });
            toast.success("Page Created Successfully! 🎉");
            // Redirect to list (we haven't built list yet, so maybe just home or stay)
            // router.push('/admin/legal'); 
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create page");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2 hover:bg-slate-900 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                Create New Page
                            </h1>
                            <p className="text-slate-500 text-sm">Add a new legal document, blog post, or help article.</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Publish Page
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Editor Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <Label>Page Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Privacy Policy"
                                className="text-lg font-medium bg-slate-950/50 border-slate-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Content</Label>
                            <RichTextEditor
                                content={content}
                                onChange={setContent}
                                placeholder="Write your content here... Type '/' for commands."
                                className="min-h-[500px]"
                            />
                        </div>
                    </div>

                    {/* Sidebar Options */}
                    <div className="space-y-6">

                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 space-y-4">
                            <h3 className="font-semibold text-slate-300">Publishing Settings</h3>

                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="legal">Legal Document ⚖️</SelectItem>
                                        <SelectItem value="blog">Blog Post ✍️</SelectItem>
                                        <SelectItem value="help">Help Article ❓</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Custom Slug (URL)</Label>
                                <Input
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="privacy-policy"
                                    className="bg-slate-900 border-slate-800 text-sm font-mono"
                                />
                                <p className="text-xs text-slate-500">cluaiz.com/legal/{slug || '...'}</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 space-y-4">
                            <h3 className="font-semibold text-slate-300">SEO Metadata</h3>

                            <div className="space-y-2">
                                <Label>Meta Title</Label>
                                <Input
                                    value={seoTitle}
                                    onChange={(e) => setSeoTitle(e.target.value)}
                                    placeholder="Same as page "
                                    className="bg-slate-900 border-slate-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Meta Description</Label>
                                <Input
                                    value={seoDesc}
                                    onChange={(e) => setSeoDesc(e.target.value)}
                                    placeholder="Short summary for Google..."
                                    className="bg-slate-900 border-slate-800"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

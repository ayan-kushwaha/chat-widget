import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { getPostBySlug, BLOG_POSTS, BLOG_CATEGORIES } from "@/data/blog";
import { getBreadcrumbSchema, getArticleSchema, JSONLDScript } from "@/lib/json-ld";
import { Clock, Calendar, User } from "lucide-react";

// Generate all blog pages at build time
export async function generateStaticParams() {
    return BLOG_POSTS.map((post) => ({
        category: post.category,
        slug: post.slug,
    }));
}

// Dynamic metadata
export async function generateMetadata({
    params,
}: {
    params: { category: string; slug: string };
}): Promise<Metadata> {
    const post = getPostBySlug(params.category, params.slug);

    if (!post) {
        return {
            title: "Post Not Found | Cluaiz",
        };
    }

    return {
        title: `${post.title} | Cluaiz Blog`,
        description: post.excerpt,
    };
}

export default function BlogPostPage({
    params,
}: {
    params: { category: string; slug: string };
}) {
    const post = getPostBySlug(params.category, params.slug);

    if (!post) {
        notFound();
    }

    const category = (BLOG_CATEGORIES as any)[params.category];

    // Breadcrumbs
    const breadcrumbs = [
        { name: "Blog", url: "/blog" },
        { name: category.name, url: `/blog#${params.category}` },
        { name: post.title, url: `/blog/${params.category}/${params.slug}` },
    ];

    // JSON-LD
    const breadcrumbSchema = getBreadcrumbSchema(breadcrumbs);
    const articleSchema = getArticleSchema({
        title: post.title,
        description: post.excerpt,
        author: post.author,
        publishedDate: post.publishedDate,
        image: post.coverImage || "/blog-og.png",
        url: `/blog/${params.category}/${params.slug}`,
    });

    return (
        <>
            <JSONLDScript data={breadcrumbSchema} />
            <JSONLDScript data={articleSchema} />

            <main className="min-h-screen bg-slate-950 text-white">
                <Navbar />

                {/* Breadcrumbs */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                    <Breadcrumbs items={breadcrumbs} />
                </div>

                {/* Article */}
                <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Header */}
                    <header className="mb-12">
                        <div className="flex items-center space-x-2 mb-4">
                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium">
                                {category.name}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            {post.title}
                        </h1>

                        <p className="text-xl text-slate-400 mb-6">
                            {post.excerpt}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-slate-500">
                            <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{post.author}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{post.publishedDate}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>{post.readTime} min read</span>
                            </div>
                        </div>
                    </header>

                    {/* Content Placeholder */}
                    <div className="prose prose-invert prose-indigo max-w-none">
                        <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                            <p className="text-slate-400 mb-2">Article coming soon</p>
                            <p className="text-sm text-slate-500">
                                This article is being written. Check back later for the full content.
                            </p>
                        </div>

                        {/* Tags */}
                        <div className="mt-12 pt-8 border-t border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-400 mb-3">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </article>

                <Footer />
            </main>
        </>
    );
}

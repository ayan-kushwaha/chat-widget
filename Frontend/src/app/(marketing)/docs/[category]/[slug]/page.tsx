import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { getDocBySlug, DOCS, DOC_CATEGORIES } from "@/data/docs";
import { getBreadcrumbSchema, getArticleSchema, JSONLDScript } from "@/lib/json-ld";
import { Clock, Calendar } from "lucide-react";

// Generate all doc pages at build time
export async function generateStaticParams() {
    return DOCS.map((doc) => ({
        category: doc.category,
        slug: doc.slug,
    }));
}

// Dynamic metadata
export async function generateMetadata({
    params,
}: {
    params: { category: string; slug: string };
}): Promise<Metadata> {
    const doc = getDocBySlug(params.category, params.slug);

    if (!doc) {
        return {
            title: "Doc Not Found | Cluaiz",
        };
    }

    return {
        title: `${doc.title} | Cluaiz Docs`,
        description: doc.description,
    };
}

export default function DocPage({
    params,
}: {
    params: { category: string; slug: string };
}) {
    const doc = getDocBySlug(params.category, params.slug);

    if (!doc) {
        notFound();
    }

    const category = (DOC_CATEGORIES as any)[params.category];

    // Breadcrumbs
    const breadcrumbs = [
        { name: "Docs", url: "/docs" },
        { name: category.name, url: `/docs#${params.category}` },
        { name: doc.title, url: `/docs/${params.category}/${params.slug}` },
    ];

    // JSON-LD
    const breadcrumbSchema = getBreadcrumbSchema(breadcrumbs);
    const articleSchema = getArticleSchema({
        title: doc.title,
        description: doc.description,
        author: "Cluaiz Team",
        publishedDate: doc.lastUpdated,
        image: "/docs-og.png",
        url: `/docs/${params.category}/${params.slug}`,
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
                            {doc.title}
                        </h1>

                        <p className="text-xl text-slate-400 mb-6">
                            {doc.description}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-slate-500">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>{doc.readTime} min read</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>Updated {doc.lastUpdated}</span>
                            </div>
                        </div>
                    </header>

                    {/* Content Placeholder */}
                    <div className="prose prose-invert prose-indigo max-w-none">
                        <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                            <p className="text-slate-400 mb-2">Content coming soon</p>
                            <p className="text-sm text-slate-500">
                                This article is under development. Check back later for the full guide.
                            </p>
                        </div>

                        {/* Tags */}
                        <div className="mt-12 pt-8 border-t border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-400 mb-3">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {doc.tags.map((tag) => (
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

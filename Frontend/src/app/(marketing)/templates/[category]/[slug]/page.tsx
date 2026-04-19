import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { generateTemplateMetadata } from "@/lib/seo-config";
import { getTemplateBySlug, TEMPLATES, TEMPLATE_CATEGORIES, getRelatedTemplates } from "@/data/templates";
import { getBreadcrumbSchema, getProductSchema, JSONLDScript } from "@/lib/json-ld";
import { CheckCircle2, ArrowRight } from "lucide-react";

// Generate all template pages at build time
export async function generateStaticParams() {
    return TEMPLATES.map((template) => ({
        category: template.category,
        slug: template.slug,
    }));
}

// Dynamic metadata
export async function generateMetadata({
    params,
}: {
    params: { category: string; slug: string };
}): Promise<Metadata> {
    const template = getTemplateBySlug(params.category, params.slug);

    if (!template) {
        return {
            title: "Template Not Found | Cluaiz",
        };
    }

    return generateTemplateMetadata(
        params.category as any,
        params.slug
    ) as any;
}

export default function TemplatePage({
    params,
}: {
    params: { category: string; slug: string };
}) {
    const template = getTemplateBySlug(params.category, params.slug);

    if (!template) {
        notFound();
    }

    // Fix indexing type error
    const category = (TEMPLATE_CATEGORIES as any)[params.category];
    const relatedTemplates = getRelatedTemplates(template.id);

    // Breadcrumbs
    const breadcrumbs = [
        { name: "Templates", url: "/templates" },
        { name: category.name, url: `/templates/${params.category}` },
        { name: template.title, url: `/templates/${params.category}/${params.slug}` },
    ];

    // JSON-LD
    const breadcrumbSchema = getBreadcrumbSchema(breadcrumbs);
    const productSchema = getProductSchema({
        name: template.title,
        description: template.description,
        image: "/templates-og.png",
        url: `/templates/${params.category}/${params.slug}`,
    });

    return (
        <>
            <JSONLDScript data={breadcrumbSchema} />
            <JSONLDScript data={productSchema} />

            <main className="min-h-screen bg-slate-950 text-white">
                <Navbar />

                {/* Breadcrumbs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                    <Breadcrumbs items={breadcrumbs} />
                </div>

                {/* Hero */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center space-x-3 mb-4">
                        <span className="text-5xl">{template.icon}</span>
                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium">
                            {category.name}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        {template.title}
                    </h1>

                    <p className="text-xl text-slate-400 max-w-3xl mb-8">
                        {template.description}
                    </p>

                    <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition">
                        Use This Template →
                    </button>
                </section>

                {/* Features */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h2 className="text-2xl font-bold mb-6">Key Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {template.features.map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-start space-x-3 p-4 rounded-lg bg-slate-900/50 border border-slate-800"
                            >
                                <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-300">{feature}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Conversation Flow */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h2 className="text-2xl font-bold mb-6">Conversation Flow</h2>
                    <div className="space-y-4">
                        {template.flowSteps.map((step, index) => (
                            <div
                                key={index}
                                className="flex items-start space-x-4 p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20"
                            >
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </span>
                                <span className="text-slate-300 pt-1">{step}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Use Cases */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h2 className="text-2xl font-bold mb-6">Perfect For</h2>
                    <div className="flex flex-wrap gap-3">
                        {template.useCases.map((useCase, index) => (
                            <span
                                key={index}
                                className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                            >
                                {useCase}
                            </span>
                        ))}
                    </div>
                </section>

                {/* Related Templates */}
                {relatedTemplates.length > 0 && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <h2 className="text-2xl font-bold mb-6">Related Templates</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedTemplates.map((related: any) => (
                                <Link
                                    key={related.id}
                                    href={`/templates/${related.category}/${related.slug}`}
                                    className="group p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all"
                                >
                                    <div className="text-3xl mb-3">{related.icon}</div>
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition">
                                        {related.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm">
                                        {related.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* CTA */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                        <p className="text-lg mb-6 opacity-90">
                            Use this template for your business in just 2 minutes
                        </p>
                        <button className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-slate-100 transition inline-flex items-center space-x-2">
                            <span>Use This Template</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </section>

                <Footer />
            </main>
        </>
    );
}

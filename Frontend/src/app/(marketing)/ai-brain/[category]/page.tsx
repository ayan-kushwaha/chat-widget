import React from "react";
import { Metadata } from "next";
import { ProductCategoryView } from "@/components/marketing/ProductCategoryView";
import { getCategoryTitle, getCategoryDesc } from "@/data/categories";

interface PageProps {
    params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category } = await params;
    return {
        title: `${getCategoryTitle("brain", category)} | Cluaiz`,
        description: getCategoryDesc("brain", category),
        alternates: {
            canonical: `https://cluaiz.com/ai-brain/${category}`,
        }
    };
}

export default async function BrainCategoryPage({ params }: PageProps) {
    const { category } = await params;
    return <ProductCategoryView sectionId="brain" categorySlug={category} />;
}

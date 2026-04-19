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
        title: `${getCategoryTitle("automation", category)} | Cluaiz`,
        description: getCategoryDesc("automation", category),
        alternates: {
            canonical: `https://cluaiz.com/automation/${category}`,
        }
    };
}

export default async function AutomationCategoryPage({ params }: PageProps) {
    const { category } = await params;
    return <ProductCategoryView sectionId="automation" categorySlug={category} />;
}

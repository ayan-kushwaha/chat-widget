import React from "react";
import { Metadata } from "next";
import { ProductCategoryView } from "@/components/marketing/ProductCategoryView";
import { getCategoryTitle, getCategoryDesc } from "@/data/categories";

interface PageProps {
    params: Promise<{ category: string }>;
}

// Dynamic SEO Metadata for CATEGORY pages
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category } = await params;

    return {
        title: `${getCategoryTitle("website", category)} | Cluaiz`,
        description: getCategoryDesc("website", category),
        alternates: {
            canonical: `https://cluaiz.com/website/${category}`,
        }
    };
}

export default async function WebsiteCategoryPage({ params }: PageProps) {
    const { category } = await params;
    return <ProductCategoryView sectionId="website" categorySlug={category} />;
}

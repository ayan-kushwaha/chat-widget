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
        title: `${getCategoryTitle("tools", category)} | Cluaiz`,
        description: getCategoryDesc("tools", category),
        alternates: {
            canonical: `https://cluaiz.com/tools/${category}`,
        }
    };
}

export default async function ToolsCategoryPage({ params }: PageProps) {
    const { category } = await params;
    return <ProductCategoryView sectionId="tools" categorySlug={category} />;
}

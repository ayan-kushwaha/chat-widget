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
        title: `${getCategoryTitle("templates", category)} | Cluaiz`,
        description: getCategoryDesc("templates", category),
        alternates: {
            canonical: `https://cluaiz.com/templates/${category}`,
        }
    };
}

export default async function TemplatesCategoryPage({ params }: PageProps) {
    const { category } = await params;
    return <ProductCategoryView sectionId="templates" categorySlug={category} />;
}

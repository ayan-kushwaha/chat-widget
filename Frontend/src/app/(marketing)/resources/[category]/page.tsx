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
        title: `${getCategoryTitle("resources", category)} | Cluaiz`,
        description: getCategoryDesc("resources", category),
        alternates: {
            canonical: `https://cluaiz.com/resources/${category}`,
        }
    };
}

export default async function ResourcesCategoryPage({ params }: PageProps) {
    const { category } = await params;
    return <ProductCategoryView sectionId="resources" categorySlug={category} />;
}

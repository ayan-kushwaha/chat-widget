import React from "react";
import { Metadata } from "next";
import { ProductCategoryView } from "@/components/marketing/ProductCategoryView";

export const metadata: Metadata = {
    title: "Cluaiz Free Tools | SEO, Extraction & Analysis",
    description: "Use our collection of free AI tools for business. Competitor analysis, SEO checking, and lead extraction.",
    alternates: {
        canonical: "https://cluaiz.com/tools",
    }
};

export default function ToolsPage() {
    return <ProductCategoryView sectionId="tools" />;
}

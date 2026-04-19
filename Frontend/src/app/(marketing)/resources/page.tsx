import React from "react";
import { Metadata } from "next";
import { ProductCategoryView } from "@/components/marketing/ProductCategoryView";

export const metadata: Metadata = {
    title: "Cluaiz Resources | Blogs, Docs & Guides",
    description: "Learn how to use Cluaiz effectively. Access our latest blogs, documentation, and learning resources.",
    alternates: {
        canonical: "https://cluaiz.com/resources",
    }
};

export default function ResourcesPage() {
    return <ProductCategoryView sectionId="resources" />;
}

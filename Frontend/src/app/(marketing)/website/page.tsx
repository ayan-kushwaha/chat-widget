import React from "react";
import { Metadata } from "next";
import { ProductCategoryView } from "@/components/marketing/ProductCategoryView";

// SEO Metadata for the HUB page
export const metadata: Metadata = {
    title: "Cluaiz Website Solutions | AI Builders, Chatbots & SEO",
    description: "The complete toolkit to build, manage, and grow your online presence with AI. Explore Website Builders, Agents, and Optimization tools.",
    alternates: {
        canonical: "https://cluaiz.com/website",
    }
};

export default function WebsitePage() {
    return <ProductCategoryView sectionId="website" />;
}

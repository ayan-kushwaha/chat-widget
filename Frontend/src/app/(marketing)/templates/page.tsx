import React from "react";
import { Metadata } from "next";
import { ProductCategoryView } from "@/components/marketing/ProductCategoryView";

export const metadata: Metadata = {
    title: "Cluaiz Templates | Pre-built AI Agent Flows",
    description: "Start faster with our library of pre-built templates for booking, lead generation, support, and more.",
    alternates: {
        canonical: "https://cluaiz.com/templates",
    }
};

export default function TemplatesPage() {
    return <ProductCategoryView sectionId="templates" />;
}

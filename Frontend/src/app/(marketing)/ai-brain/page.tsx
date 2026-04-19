import React from "react";
import { Metadata } from "next";
import { ProductCategoryView } from "@/components/marketing/ProductCategoryView";

export const metadata: Metadata = {
    title: "Cluaiz AI Brain | Custom Knowledge Base & RAG",
    description: "Train your AI agents with your own business data. Upload PDFs, connect websites, and create a custom knowledge base.",
    alternates: {
        canonical: "https://cluaiz.com/ai-brain",
    }
};

export default function BrainPage() {
    return <ProductCategoryView sectionId="brain" />;
}

import React from "react";
import { Metadata } from "next";
import { ProductCategoryView } from "@/components/marketing/ProductCategoryView";

export const metadata: Metadata = {
    title: "Cluaiz Automation Suite | WhatsApp AI & GMB Tools",
    description: "Automate your business workflows with our AI Suite. WhatsApp Bots, Google Maps Management, and Lead Extraction tools.",
    alternates: {
        canonical: "https://cluaiz.com/automation",
    }
};

export default function AutomationPage() {
    return <ProductCategoryView sectionId="automation" />;
}

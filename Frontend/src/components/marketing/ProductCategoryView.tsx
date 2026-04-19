"use client";

import React from "react";
import { ProductHub } from "@/components/marketing/ProductHub";
import { PRODUCTS_DATA } from "@/data/products";
import { CATEGORY_FILTERS } from "@/data/categories";
import { notFound } from "next/navigation";

interface ProductCategoryViewProps {
    sectionId: string;
    categorySlug?: string;
}

export function ProductCategoryView({ sectionId, categorySlug }: ProductCategoryViewProps) {
    const data = PRODUCTS_DATA[sectionId];

    if (!data) return notFound();

    let itemsToDisplay = data.items;
    let pageTitle = data.title;
    let pageDesc = "";
    let activeSidebar = `/${sectionId}`;

    // If Category Filtering is Active
    if (categorySlug) {
        const filters = CATEGORY_FILTERS[sectionId];
        const keywords = filters ? filters[categorySlug] : null;

        if (!keywords) {
            // If random slug passed that isn't in our filter map
            return notFound();
        }

        // Filter items
        itemsToDisplay = data.items.filter(item =>
            keywords.some(k => item.name.toLowerCase().includes(k) || item.desc.toLowerCase().includes(k))
        );

        // Update Title/Meta for the view
        const currentSubCat = data.subCategories.find(sub => sub.href.endsWith(categorySlug));
        pageTitle = currentSubCat ? currentSubCat.name : `${categorySlug} Tools`;
        pageDesc = `Browse our specialized collection of ${categorySlug.replace("-", " ")} tools.`;
        activeSidebar = `/${sectionId}/${categorySlug}`;
    }

    return (
        <ProductHub
            title={pageTitle}
            description={pageDesc || `All-in-one ${data.title} for your business.`}
            items={itemsToDisplay}
            sidebarItems={data.subCategories}
            activeSidebarItem={activeSidebar}
        />
    );
}

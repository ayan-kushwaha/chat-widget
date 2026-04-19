/**
 * JSON-LD Schema Generators
 * Generates structured data for better SEO
 */

import React from "react";
import { SITE_CONFIG } from "./seo-config";

/**
 * Organization Schema
 * Add to root layout for site-wide organization info
 */
export function getOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        logo: `${SITE_CONFIG.url}/logo.png`,
        description: SITE_CONFIG.description,
        sameAs: [
            "https://twitter.com/cluaiz",
            "https://linkedin.com/company/cluaiz",
            "https://github.com/cluaiz",
        ],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Support",
            email: "support@cluaiz.com",
            availableLanguage: ["English", "Hindi"],
        },
    };
}

/**
 * Breadcrumb Schema
 * Shows breadcrumb trail in Google search results
 */
export function getBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: `${SITE_CONFIG.url}${crumb.url}`,
        })),
    };
}

/**
 * Article Schema
 * For blog posts
 */
export function getArticleSchema(article: {
    title: string;
    description: string;
    author: string;
    publishedDate: string;
    modifiedDate?: string;
    image: string;
    url: string;
}) {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.description,
        image: `${SITE_CONFIG.url}${article.image}`,
        datePublished: article.publishedDate,
        dateModified: article.modifiedDate || article.publishedDate,
        author: {
            "@type": "Person",
            name: article.author,
        },
        publisher: {
            "@type": "Organization",
            name: SITE_CONFIG.name,
            logo: {
                "@type": "ImageObject",
                url: `${SITE_CONFIG.url}/logo.png`,
            },
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${SITE_CONFIG.url}${article.url}`,
        },
    };
}

/**
 * Product Schema
 * For product/feature pages
 */
export function getProductSchema(product: {
    name: string;
    description: string;
    image: string;
    url: string;
}) {
    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: product.name,
        description: product.description,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description: "Free during public beta",
        },
        image: `${SITE_CONFIG.url}${product.image}`,
        url: `${SITE_CONFIG.url}${product.url}`,
        provider: {
            "@type": "Organization",
            name: SITE_CONFIG.name,
        },
    };
}

/**
 * FAQ Schema
 * For FAQ sections
 */
export function getFAQSchema(faqs: Array<{ question: string; answer: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    };
}

/**
 * WebPage Schema
 * For general content pages
 */
export function getWebPageSchema(page: {
    title: string;
    description: string;
    url: string;
}) {
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: `${SITE_CONFIG.url}${page.url}`,
        publisher: {
            "@type": "Organization",
            name: SITE_CONFIG.name,
        },
    };
}

/**
 * Helper to inject JSON-LD into page
 */
export function JSONLDScript({ data }: { data: object }) {
    return (
        <script
            type= "application/ld+json"
    dangerouslySetInnerHTML = {{ __html: JSON.stringify(data) }
}
        />
    );
}

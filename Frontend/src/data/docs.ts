/**
 * Documentation Data Structure
 * SEO-optimized with category → list → detail flow
 */

export interface DocArticle {
    id: string;
    category: string;
    slug: string;
    title: string;
    description: string;
    content?: string; // Will come from API/MDX later
    readTime: number; // in minutes
    lastUpdated: string;
    tags: string[];
}

export const DOC_CATEGORIES = {
    "getting-started": {
        id: "getting-started",
        name: "Getting Started",
        description: "Quick start guides and installation instructions",
        icon: "🚀",
    },
    website: {
        id: "website",
        name: "Website Tools",
        description: "Documentation for AI website builder, chatbot, and SEO tools",
        icon: "🌐",
    },
    automation: {
        id: "automation",
        name: "Automation",
        description: "WhatsApp, Google Maps, CRM integration guides",
        icon: "🤖",
    },
    brain: {
        id: "brain",
        name: "AI Brain",
        description: "AI training, RAG system, and memory management",
        icon: "🧠",
    },
    templates: {
        id: "templates",
        name: "Templates",
        description: "Guide to using and customizing chatbot templates",
        icon: "🎨",
    },
    api: {
        id: "api",
        name: "API Reference",
        description: "Complete API documentation and examples",
        icon: "📡",
    },
};

export const DOCS: DocArticle[] = [
    // Getting Started
    {
        id: "getting-started-quickstart",
        category: "getting-started",
        slug: "quickstart",
        title: "Quick Start Guide",
        description: "Get started with Cluaiz in 2 minutes. Create your first AI chatbot.",
        readTime: 3,
        lastUpdated: "2024-12-26",
        tags: ["beginner", "setup", "quick"],
    },
    {
        id: "getting-started-installation",
        category: "getting-started",
        slug: "installation",
        title: "Installation & Setup",
        description: "Step-by-step installation guide for Cluaiz chatbot on your website.",
        readTime: 5,
        lastUpdated: "2024-12-26",
        tags: ["installation", "setup"],
    },
    {
        id: "getting-started-first-chatbot",
        category: "getting-started",
        slug: "first-chatbot",
        title: "Create Your First Chatbot",
        description: "Build your first AI chatbot from scratch in minutes.",
        readTime: 7,
        lastUpdated: "2024-12-26",
        tags: ["tutorial", "chatbot"],
    },

    // Website Tools
    {
        id: "website-builder-guide",
        category: "website",
        slug: "builder-guide",
        title: "AI Website Builder Guide",
        description: "Complete guide to using the AI website builder. Create websites instantly.",
        readTime: 8,
        lastUpdated: "2024-12-26",
        tags: ["website", "builder", "tutorial"],
    },
    {
        id: "website-chatbot-setup",
        category: "website",
        slug: "chatbot-setup",
        title: "Chatbot Installation Guide",
        description: "Install AI chatbot on your website. Copy-paste script integration.",
        readTime: 10,
        lastUpdated: "2024-12-26",
        tags: ["chatbot", "installation", "integration"],
    },
    {
        id: "website-customization",
        category: "website",
        slug: "customization",
        title: "Customize Your Chatbot",
        description: "Customize colors, position, messages, and behavior of your chatbot.",
        readTime: 12,
        lastUpdated: "2024-12-26",
        tags: ["customization", "design"],
    },
    {
        id: "website-seo-settings",
        category: "website",
        slug: "seo-settings",
        title: "SEO Configuration",
        description: "Configure SEO settings, meta tags, and structured data.",
        readTime: 8,
        lastUpdated: "2024-12-26",
        tags: ["seo", "optimization"],
    },

    // Automation
    {
        id: "automation-whatsapp-api",
        category: "automation",
        slug: "whatsapp-api",
        title: "WhatsApp Integration",
        description: "Connect WhatsApp Business API to Cluaiz for automated messaging.",
        readTime: 15,
        lastUpdated: "2024-12-26",
        tags: ["whatsapp", "api", "integration"],
    },
    {
        id: "automation-gmb-setup",
        category: "automation",
        slug: "gmb-setup",
        title: "Google My Business Setup",
        description: "Configure Google Maps automation and review management.",
        readTime: 10,
        lastUpdated: "2024-12-26",
        tags: ["google maps", "gmb", "reviews"],
    },
    {
        id: "automation-webhooks",
        category: "automation",
        slug: "webhooks",
        title: "Webhooks Configuration",
        description: "Set up webhooks for real-time integrations and notifications.",
        readTime: 12,
        lastUpdated: "2024-12-26",
        tags: ["webhooks", "integration"],
    },

    // AI Brain
    {
        id: "brain-data-training",
        category: "brain",
        slug: "data-training",
        title: "Training Your AI",
        description: "Upload PDFs, websites, docs to train your AI brain.",
        readTime: 10,
        lastUpdated: "2024-12-26",
        tags: ["training", "ai", "knowledge"],
    },
    {
        id: "brain-custom-prompts",
        category: "brain",
        slug: "custom-prompts",
        title: "Custom AI Prompts",
        description: "Customize AI personality and response style with system prompts.",
        readTime: 8,
        lastUpdated: "2024-12-26",
        tags: ["prompts", "customization"],
    },
    {
        id: "brain-rag-config",
        category: "brain",
        slug: "rag-config",
        title: "RAG System Configuration",
        description: "Configure vector search and retrieval settings for optimal accuracy.",
        readTime: 15,
        lastUpdated: "2024-12-26",
        tags: ["rag", "vector search", "advanced"],
    },

    // Templates
    {
        id: "templates-choosing",
        category: "templates",
        slug: "choosing",
        title: "Choosing the Right Template",
        description: "Guide to selecting the perfect chatbot template for your business.",
        readTime: 5,
        lastUpdated: "2024-12-26",
        tags: ["templates", "guide"],
    },
    {
        id: "templates-customizing",
        category: "templates",
        slug: "customizing",
        title: "Customizing Templates",
        description: "How to customize template flows, messages, and behavior.",
        readTime: 12,
        lastUpdated: "2024-12-26",
        tags: ["templates", "customization"],
    },

    // API
    {
        id: "api-authentication",
        category: "api",
        slug: "authentication",
        title: "API Authentication",
        description: "Learn how to authenticate API requests with API keys and tokens.",
        readTime: 8,
        lastUpdated: "2024-12-26",
        tags: ["api", "authentication", "security"],
    },
    {
        id: "api-chatbot",
        category: "api",
        slug: "chatbot",
        title: "Chatbot API",
        description: "Complete chatbot API reference with endpoints and examples.",
        readTime: 20,
        lastUpdated: "2024-12-26",
        tags: ["api", "chatbot", "reference"],
    },
    {
        id: "api-webhooks",
        category: "api",
        slug: "webhooks",
        title: "Webhooks API",
        description: "Webhooks API documentation for real-time event notifications.",
        readTime: 15,
        lastUpdated: "2024-12-26",
        tags: ["api", "webhooks"],
    },
];

/**
 * Get docs by category
 */
export function getDocsByCategory(category: string) {
    return DOCS.filter((doc) => doc.category === category);
}

/**
 * Get doc by slug
 */
export function getDocBySlug(category: string, slug: string) {
    return DOCS.find((doc) => doc.category === category && doc.slug === slug);
}

/**
 * Search docs
 */
export function searchDocs(query: string) {
    const lowerQuery = query.toLowerCase();
    return DOCS.filter(
        (doc) =>
            doc.title.toLowerCase().includes(lowerQuery) ||
            doc.description.toLowerCase().includes(lowerQuery) ||
            doc.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
}

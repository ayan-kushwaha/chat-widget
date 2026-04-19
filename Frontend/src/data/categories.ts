// Category Keywords Mapping for Filtering
// This maps a URL slug (e.g., "builders") to keywords to search for in items
export const CATEGORY_FILTERS: Record<string, Record<string, string[]>> = {
    website: {
        "builders": ["builder"],
        "agents": ["chat", "agent"],
        "optimization": ["seo", "rank"]
    },
    automation: {
        "messaging": ["whatsapp", "chat", "sms"],
        "gmb": ["google", "map", "review"],
        "extraction": ["extract", "lead", "scrap"]
    },
    brain: {
        "knowledge-base": ["brain", "rag", "train", "knowledge"],
        "management": ["crm", "manage", "lead"]
    },
    resources: {
        "learning": ["doc", "guide", "blog", "tutorial"],
        "assets": ["template", "tool", "calculator"]
    },
    templates: {
        "booking": ["booking", "appointment", "schedule"],
        "lead-gen": ["lead", "generation", "capture"],
        "support": ["support", "faq", "customer"],
        "orders": ["order", "catalog", "store"],
        "info": ["info", "portfolio", "showcase"]
    },
    tools: {
        "analysis": ["analyze", "check", "seo", "audit"],
        "extraction": ["extract", "scrape", "email", "phone"],
        "content": ["content", "write", "generate", "headline"]
    }
};

// SEO Metadata Helpers
export const getCategoryTitle = (sectionId: string, categorySlug: string): string => {
    // Basic title generation logic
    const titles: Record<string, string> = {
        website: `Best AI Website Tools for ${categorySlug}`,
        automation: `Top Automation Tools for ${categorySlug}`,
        brain: `AI Intelligence for ${categorySlug}`,
        resources: `${categorySlug} Resources`,
        templates: `Best AI Templates for ${categorySlug}`,
        tools: `Free AI Tools for ${categorySlug}`
    };
    return titles[sectionId] || `${categorySlug} Tools`;
};

export const getCategoryDesc = (sectionId: string, categorySlug: string): string => {
    return `Explore the best AI tools for ${categorySlug.replace("-", " ")} on Cluaiz. Boost your productivity today.`;
};

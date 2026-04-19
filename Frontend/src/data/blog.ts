/**
 * Blog Data Structure
 * SEO-optimized with category → list → detail flow
 */

export interface BlogPost {
    id: string;
    category: string;
    slug: string;
    title: string;
    excerpt: string;
    content?: string; // Will come from API/MDX later
    author: string;
    publishedDate: string;
    coverImage?: string;
    readTime: number; // in minutes
    tags: string[];
}

export const BLOG_CATEGORIES = {
    marketing: {
        id: "marketing",
        name: "AI & Marketing",
        description: "AI marketing strategies, chatbot tips, and conversion optimization",
        icon: "📈",
    },
    "local-business": {
        id: "local-business",
        name: "Local Business",
        description: "Google Maps SEO, local automation, and small business growth",
        icon: "🏪",
    },
    updates: {
        id: "updates",
        name: "Product Updates",
        description: "Latest features, releases, and platform updates",
        icon: "🚀",
    },
    "case-studies": {
        id: "case-studies",
        name: "Case Studies",
        description: "Real success stories from Cluaiz customers",
        icon: "💼",
    },
    tutorials: {
        id: "tutorials",
        name: "Tutorials",
        description: "Step-by-step guides and how-to articles",
        icon: "📚",
    },
};

export const BLOG_POSTS: BlogPost[] = [
    // Marketing
    {
        id: "chatbot-double-sales",
        category: "marketing",
        slug: "how-ai-chatbots-double-sales",
        title: "How AI Chatbots Double Your Sales (Real Data)",
        excerpt: "We analyzed 100+ businesses using AI chatbots. Here's how they increased sales by 2x in 3 months.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-20",
        readTime: 8,
        tags: ["sales", "chatbot", "conversion"],
    },
    {
        id: "lead-automation-guide",
        category: "marketing",
        slug: "lead-automation-complete-guide",
        title: "Lead Automation: Complete Guide for 2025",
        excerpt: "Automate lead capture, qualification, and nurturing with AI. Stop losing 80% of your leads.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-18",
        readTime: 12,
        tags: ["leads", "automation", "guide"],
    },
    {
        id: "conversion-tips",
        category: "marketing",
        slug: "10-conversion-optimization-tips",
        title: "10 Conversion Optimization Tips That Actually Work",
        excerpt: "Tested on 500+ websites. These simple changes increased conversions by 40%+.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-15",
        readTime: 10,
        tags: ["conversion", "optimization", "tips"],
    },

    // Local Business
    {
        id: "gmaps-seo-guide",
        category: "local-business",
        slug: "google-maps-seo-guide",
        title: "Google Maps SEO: Rank #1 Locally in 30 Days",
        excerpt: "Complete guide to dominating Google Maps results. Get more customers from local search.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-22",
        readTime: 15,
        tags: ["google maps", "seo", "local"],
    },
    {
        id: "whatsapp-automation",
        category: "local-business",
        slug: "whatsapp-automation-for-businesses",
        title: "WhatsApp Automation for Local Businesses",
        excerpt: "How local stores use WhatsApp automation to serve 10x more customers without hiring.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-19",
        readTime: 10,
        tags: ["whatsapp", "automation", "local"],
    },
    {
        id: "review-management",
        category: "local-business",
        slug: "managing-customer-reviews",
        title: "Managing Customer Reviews: Complete System",
        excerpt: "Turn negative reviews into leads. Automate review requests. Build 5-star reputation.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-16",
        readTime: 8,
        tags: ["reviews", "reputation", "automation"],
    },

    // Updates
    {
        id: "ai-builder-launch",
        category: "updates",
        slug: "ai-website-builder-is-live",
        title: "AI Website Builder is Now Live!",
        excerpt: "Create complete websites in seconds with AI. No coding, no templates, just describe your business.",
        author: "Cluaiz Team",
        publishedDate: "2024-12-25",
        readTime: 5,
        tags: ["product", "launch", "website builder"],
    },
    {
        id: "new-templates",
        category: "updates",
        slug: "5-new-templates-added",
        title: "5 New Chatbot Templates Added",
        excerpt: "Insurance quotes, education enrollment, hotel inquiries, pharmacy orders, and bakery pre-orders.",
        author: "Cluaiz Team",
        publishedDate: "2024-12-23",
        readTime: 3,
        tags: ["templates", "update"],
    },
    {
        id: "whatsapp-integration",
        category: "updates",
        slug: "whatsapp-integration-launched",
        title: "WhatsApp Integration Launched",
        excerpt: "Connect your WhatsApp Business API to Cluaiz. Automate customer conversations on WhatsApp.",
        author: "Cluaiz Team",
        publishedDate: "2024-12-21",
        readTime: 5,
        tags: ["whatsapp", "integration", "launch"],
    },

    // Case Studies
    {
        id: "gym-success-story",
        category: "case-studies",
        slug: "how-xyz-gym-got-100-leads",
        title: "How XYZ Gym Got 100 Trial Bookings in 30 Days",
        excerpt: "From 0 to 100 trial bookings using Cluaiz gym booking template. Complete breakdown.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-24",
        readTime: 12,
        tags: ["case study", "gym", "success"],
    },
    {
        id: "restaurant-automation",
        category: "case-studies",
        slug: "restaurant-automation-success",
        title: "Restaurant Automation: 5x More Orders",
        excerpt: "How a local restaurant automated ordering and increased orders by 500% without hiring.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-17",
        readTime: 10,
        tags: ["case study", "restaurant", "automation"],
    },
    {
        id: "ecommerce-support",
        category: "case-studies",
        slug: "ecommerce-support-bot-results",
        title: "E-commerce Support Bot: 80% Cost Savings",
        excerpt: "How an online store cut support costs by 80% with AI chatbot. Real numbers inside.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-14",
        readTime: 8,
        tags: ["case study", "ecommerce", "support"],
    },

    // Tutorials
    {
        id: "complete-setup-guide",
        category: "tutorials",
        slug: "complete-setup-guide-beginners",
        title: "Complete Setup Guide for Beginners",
        excerpt: "Step-by-step tutorial: From signup to your first live chatbot. For absolute beginners.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-26",
        readTime: 20,
        tags: ["tutorial", "beginner", "setup"],
    },
    {
        id: "advanced-automation",
        category: "tutorials",
        slug: "advanced-automation-flows",
        title: "Advanced Automation Flows",
        excerpt: "Build complex automation workflows. Webhooks, CRM sync, multi-step forms.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-13",
        readTime: 25,
        tags: ["tutorial", "advanced", "automation"],
    },
    {
        id: "customizing-ai-agent",
        category: "tutorials",
        slug: "customizing-your-ai-agent",
        title: "Customizing Your AI Agent",
        excerpt: "Complete guide to customizing AI personality, responses, and behavior.",
        author: "Aryan Kumar",
        publishedDate: "2024-12-11",
        readTime: 15,
        tags: ["tutorial", "customization", "ai"],
    },
];

/**
 * Get blog posts by category
 */
export function getPostsByCategory(category: string) {
    return BLOG_POSTS.filter((post) => post.category === category);
}

/**
 * Get blog post by slug
 */
export function getPostBySlug(category: string, slug: string) {
    return BLOG_POSTS.find((post) => post.category === category && post.slug === slug);
}

/**
 * Get latest blog posts
 */
export function getLatestPosts(limit = 5) {
    return [...BLOG_POSTS]
        .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
        .slice(0, limit);
}

/**
 * Search blog posts
 */
export function searchBlogPosts(query: string) {
    const lowerQuery = query.toLowerCase();
    return BLOG_POSTS.filter(
        (post) =>
            post.title.toLowerCase().includes(lowerQuery) ||
            post.excerpt.toLowerCase().includes(lowerQuery) ||
            post.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
}

import {
    Sparkles, MessageSquare, Target, Zap, Brain, Calendar, ShoppingCart, FileText, LayoutGrid, LayoutTemplate, Wrench, Search, Database, Globe, Phone, Mail
} from "lucide-react";

export interface ProductItem {
    name: string;
    href: string;
    icon: any;
    desc: string;
}

export interface ProductSection {
    id: string;
    title: string;
    icon: string; // Emoji or string representation
    items: ProductItem[];
    subCategories: { name: string; href: string; icon?: any; count?: number }[];
}

export const TEMPLATES_DATA = [
    { name: "Booking & Appointments", href: "/templates/booking", icon: Calendar, desc: "Streamline scheduling with AI agents." },
    { name: "Lead Generation", href: "/templates/lead-gen", icon: Target, desc: "Capture and qualify leads 24/7." },
    { name: "Support & FAQ", href: "/templates/support", icon: MessageSquare, desc: "Automate customer support queries." },
    { name: "Orders & Catalog", href: "/templates/orders", icon: ShoppingCart, desc: "Manage orders and product catalogs." },
    { name: "Info & Portfolio", href: "/templates/info", icon: FileText, desc: "Showcase your work and services." },
];

export const TOOLS_DATA = [
    { name: "Competitor Analyzer", desc: "Analyze your competitors' strategy instantly.", href: "#", icon: Search, category: "analysis" },
    { name: "SEO Checker", desc: "Get a full SEO audit of your site.", href: "#", icon: Globe, category: "analysis" },
    { name: "Lead Extractor", desc: "Extract valid leads from any website.", href: "#", icon: Database, category: "extraction" },
    { name: "Email Validator", desc: "Verify email lists cleaning.", href: "#", icon: Mail, category: "extraction" },
    { name: "Phone Scraper", desc: "Find phone numbers from domains.", href: "#", icon: Phone, category: "extraction" },
    { name: "Headline Generator", desc: "Generate catchy headlines for ads.", href: "#", icon: FileText, category: "content" },
];

export const PRODUCTS_DATA: Record<string, ProductSection> = {
    website: {
        id: "website",
        title: "Website Solutions",
        icon: "🌐",
        items: [
            { name: "AI Website Builder", href: "/website/builders", icon: Sparkles, desc: "Create websites instantly with AI" },
            { name: "AI Chat Agent", href: "/website/agents", icon: MessageSquare, desc: "24/7 customer support & sales" },
            { name: "SEO Optimizer", href: "/website/optimization", icon: Target, desc: "Rank #1 on Google automatically" },
        ],
        subCategories: [
            { name: "All Tools", href: "/website", icon: LayoutGrid },
            { name: "Builders", href: "/website/builders", icon: Sparkles },
            { name: "Agents", href: "/website/agents", icon: MessageSquare },
            { name: "Optimization", href: "/website/optimization", icon: Target },
        ]
    },
    automation: {
        id: "automation",
        title: "Automation Suite",
        icon: "⚡",
        items: [
            { name: "WhatsApp AI", href: "/automation/messaging", icon: Zap, desc: "Automate WhatsApp business chats" },
            { name: "Google Maps Manager", href: "/automation/gmb", icon: Target, desc: "GMB automation & reviews" },
            { name: "Lead Extractor", href: "/automation/extraction", icon: Brain, desc: "Extract leads from Google Maps" },
        ],
        subCategories: [
            { name: "All Tools", href: "/automation", icon: LayoutGrid },
            { name: "Messaging", href: "/automation/messaging", icon: Zap },
            { name: "GMB Tools", href: "/automation/gmb", icon: Target },
            { name: "Extraction", href: "/automation/extraction", icon: Brain },
        ]
    },
    brain: {
        id: "brain",
        title: "AI Intelligence",
        icon: "🧠",
        items: [
            { name: "AI Brain (RAG)", href: "/ai-brain/knowledge-base", icon: Brain, desc: "Train AI on your business data" },
            { name: "CRM Integration", href: "/ai-brain/management", icon: Target, desc: "Manage AI-generated leads" },
        ],
        subCategories: [
            { name: "All Intelligence", href: "/ai-brain", icon: LayoutGrid },
            { name: "Knowledge Base", href: "/ai-brain/knowledge-base", icon: Brain },
            { name: "Management", href: "/ai-brain/management", icon: Target },
        ]
    },
    resources: {
        id: "resources",
        title: "Resources",
        icon: "📚",
        items: [
            { name: "Documentation", href: "/docs", icon: FileText, desc: "Complete guides & API reference" },
            { name: "Blog", href: "/blog", icon: MessageSquare, desc: "Latest insights & tutorials" },
            { name: "Templates", href: "/templates", icon: LayoutTemplate, desc: "Pre-built flows & prompts" },
            { name: "Free Tools", href: "/tools", icon: Zap, desc: "Calculators & utility tools" },
        ],
        subCategories: [
            { name: "All Resources", href: "/resources", icon: LayoutGrid },
            { name: "Learning", href: "/resources/learning", icon: FileText },
            { name: "Assets", href: "/resources/assets", icon: LayoutTemplate },
        ]
    },
    templates: {
        id: "templates",
        title: "Templates Library",
        icon: "📋",
        items: TEMPLATES_DATA.map(t => ({ ...t, desc: t.desc || "Ready to use template." })), // Ensure matching type
        subCategories: [
            { name: "All Templates", href: "/templates", icon: LayoutGrid },
            { name: "Booking", href: "/templates/booking", icon: Calendar },
            { name: "Lead Gen", href: "/templates/lead-gen", icon: Target },
            { name: "Support", href: "/templates/support", icon: MessageSquare },
            { name: "Orders", href: "/templates/orders", icon: ShoppingCart },
            { name: "Info", href: "/templates/info", icon: FileText },
        ]
    },
    tools: {
        id: "tools",
        title: "Free Tools",
        icon: "🛠️",
        items: TOOLS_DATA.map(t => ({ ...t, desc: t.desc || "Free utility tool." })), // Ensure matching type
        subCategories: [
            { name: "All Tools", href: "/tools", icon: LayoutGrid },
            { name: "Analysis", href: "/tools/analysis", icon: Search },
            { name: "Extraction", href: "/tools/extraction", icon: Database },
            { name: "Content", href: "/tools/content", icon: FileText },
        ]
    }
};

import {
    BrainCircuit,
    MessageSquareText,
    MousePointerClick,
    Zap,
    ShieldCheck,
    BarChart3,
    Users,
    Clock,
    Activity,
    Globe,
    Lock,
    Smartphone
} from "lucide-react";

export const MARKETING_CONTENT = {
    hero: {
        badge: "🚀 Public Beta: AI Autopilot Live",
        title: "Your Business is Leaking Money While You Sleep.",
        subtitle: "Every missed chat is a lost sale. Cluaiz stops the bleeding by hiring an autonomous AI employee that captures leads, answers questions, and sells for you—24/7.",
        points: [
            "🔥 Stop losing leads at 2 AM",
            "⚡ Instant answers, zero wait time",
            "💰 Cut support costs by 80%",
            "🧠 Learns your business instantly",
            "🚀 Setup in 2 minutes"
        ],
        ctaPrimary: "Hire Your AI Agent Now",
        ctaSecondary: "See The Transformation"
    },
    hybridBrain: {
        title: "The Only AI With Two Brains Working for You.",
        gemini: {
            name: "Gemini (Smart Brain)",
            features: ["✔ Complex logic", "✔ Long answers", "✔ High reasoning"]
        },
        ollama: {
            name: "Ollama (Fast Brain)",
            features: ["✔ Local", "✔ Blazing fast", "✔ Private"]
        },
        conclusion: "Cluaiz decides which brain to use → giving you speed + accuracy + lower cost."
    },
    personality: {
        title: "Talks Like a Human, Sells Like a Pro",
        sections: [
            {
                title: "Human-like Communication",
                features: ["Real typing animation", "Emoji-friendly", "Tone adapts to user", "Multi-language (auto-detect)"]
            },
            {
                title: "Sales Intelligence",
                features: ["Reads intent", "Shows lead form at perfect moment", "Auto-prefill (name, email, phone)"]
            },
            {
                title: "Trust & Consistency",
                features: ["Follows your brand tone", "Never forgets context", "Never says the wrong thing"]
            }
        ]
    },
    analytics: {
        heading: "See Exactly What’s Happening",
        subHeading: "Your AI employee reports everything:",
        metrics: [
            { label: "Visitors", value: "24/7" },
            { label: "Conversations", value: "100%" },
            { label: "Leads", value: "Auto-Captured" },
            { label: "Countries", value: "Global" },
            { label: "Peak hours", value: "Tracked" },
            { label: "Device breakdown", value: "Mobile/Desktop" }
        ]
    },
    setup: {
        title: "2-Minute Setup",
        steps: [
            {
                title: "Add Website",
                description: "Paste your URL. Cluaiz reads your pages, PDFs, blogs."
            },
            {
                title: "Train AI (Automatic)",
                description: "Your knowledge → Vectorized → AI-ready."
            },
            {
                title: "Copy 1 Line Script",
                description: "No coding. No editing. No errors."
            },
            {
                title: "Go Live",
                description: "Your website gets an AI employee instantly."
            }
        ]
    },
    aiAssistantPage: {
        title: "No Website? Still Sell.",
        description: "You get a public Cluaiz link like: cluaiz.com/yourbusiness",
        useCases: ["Instagram bio", "Facebook page", "WhatsApp status", "Google Business", "QR codes"],
        footer: "Your AI → becomes your entire online presence."
    },
    features: [
        {
            title: "AI Chat Widget",
            description: "Modern, fast, and beautiful.",
            icon: MessageSquareText,
        },
        {
            title: "Lead Automation",
            description: "Smart forms, prefill data, 0% lead loss.",
            icon: MousePointerClick,
        },
        {
            title: "Form Error Fixing",
            description: "Wrong email/phone automatically corrected.",
            icon: ShieldCheck,
        },
        {
            title: "Knowledge Engine",
            description: "Website + PDFs + Docs → AI learns everything.",
            icon: BrainCircuit,
        },
        {
            title: "Multilingual",
            description: "Hindi, English, Hinglish, Marathi, Bengali — auto detect.",
            icon: Globe,
        },
        {
            title: "Public Stats Widget",
            description: "Show “24/7 Active” badge on your website.",
            icon: Activity,
        },
        {
            title: "Live Preview",
            description: "Customize colors, message, bot style.",
            icon: Smartphone,
        },
        {
            title: "Role System",
            description: "Owner • Admin • Viewer",
            icon: Users,
        },
        {
            title: "Export to CSV",
            description: "Download all leads anytime.",
            icon: BarChart3,
        }
    ],
    reliability: {
        title: "Built With Production-Grade Reliability",
        features: [
            "Queue → Worker → No crashes",
            "Rate limiting → No DDOS",
            "Vector Search → 99% accuracy",
            "Shadow DOM → No CSS break",
            "API cooldown manager",
            "Daily/weekly reports",
            "1-year chat storage"
        ]
    },
    roadmap: {
        title: "Coming Soon",
        items: [
            "WhatsApp automation",
            "Voice AI",
            "Shopify plugin",
            "Social media auto-replies",
            "n8n-style no-code workflows",
            "AI competitor spy",
            "Content suggestions",
            "CRM automations (HubSpot, Zoho)"
        ]
    },
    pricing: {
        planName: "Pro (Beta)",
        description: "Everything you need to scale your business with AI.",
        price: "$0",
        subPrice: "Free during Public Beta",
        features: [
            "Unlimited AI Chatbots",
            "Unlimited Tokens",
            "Unlimited Websites",
            "Advanced Analytics",
            "Priority Support",
            "Remove 'Powered by Cluaiz'"
        ]
    },
    privacy: {
        heading: "Your Data is Yours. Period.",
        content: "We don't sell your data. We don't train on your data without permission. Your business secrets stay secret. Cluaiz is built with enterprise-grade security from day one."
    },
    footer: {
        tagline: "Start Free — Launch Your AI Employee in 2 Minutes.",
        benefits: ["⚡ No credit card", "⚡ No coding", "⚡ No waiting"]
    }
};

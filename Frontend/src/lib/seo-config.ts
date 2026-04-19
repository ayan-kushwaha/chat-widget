/**
 * Master SEO Config for Cluaiz
 * Centralized SEO metadata for all 105+ pages
 * Auto-generates title, description, keywords, Open Graph, Twitter cards
 */

export const SITE_CONFIG = {
    name: "Cluaiz",
    url: "https://cluaiz.com",
    description: "Launch Your AI Employee in 2 Minutes. Stop losing leads with 24/7 AI chatbots, automation, and smart business tools.",
    keywords: ["AI chatbot", "business automation", "lead generation", "WhatsApp automation", "Google Maps automation"],
    author: "Cluaiz Inc",
    creator: "@cluaiz",
    ogImage: "/og-image.png",
    twitterHandle: "@cluaiz",
};

/**
 * Page-specific SEO metadata
 * Dynamic templates use this to generate metadata
 */
export const PAGE_METADATA = {
    // Marketing Pages
    home: {
        title: "Cluaiz - AI Employee for Your Business | 24/7 Automation",
        description: "Stop losing leads while you sleep. Cluaiz AI chatbot captures leads, answers questions, and sells for you 24/7. Setup in 2 minutes. Free during beta.",
        keywords: ["AI chatbot", "business automation", "lead capture", "24/7 support"],
        ogType: "website",
    },

    pricing: {
        title: "Pricing - Free During Public Beta | Cluaiz",
        description: "Unlimited AI chatbots, unlimited tokens, unlimited websites. Everything free during public beta. No credit card required.",
        keywords: ["pricing", "free AI chatbot", "beta pricing"],
    },

    about: {
        title: "About Us - Building the Future of AI Workforce | Cluaiz",
        description: "Democratizing AI for small businesses. Cluaiz brings enterprise-grade AI to every business. Privacy-first, human-centric.",
        keywords: ["about cluaiz", "AI company", "business AI"],
    },

    contact: {
        title: "Contact Us - Get in Touch | Cluaiz",
        description: "Have questions? Want to partner with us? Reach out to the Cluaiz team.",
        keywords: ["contact", "support", "partnership"],
    },

    // Product Pages
    website: {
        parent: {
            title: "Website Solutions - AI Builder, Chatbot & More | Cluaiz",
            description: "AI-powered website tools: instant website builder, smart chatbot, competitor researcher, and SEO automation.",
            keywords: ["AI website builder", "chatbot", "website tools"],
        },
        builder: {
            title: "AI Website Builder - Create Stunning Sites in Seconds | Cluaiz",
            description: "One prompt, complete website. AI-powered website builder creates professional sites instantly. No coding needed.",
            keywords: ["AI website builder", "instant website", "no code website"],
        },
        chatbot: {
            title: "AI Chat Agent - 24/7 Customer Support Automation | Cluaiz",
            description: "Smart AI chatbot for your website. Instant answers, lead capture, multi-language support. Setup in 2 minutes.",
            keywords: ["AI chatbot", "customer support automation", "lead capture"],
        },
        researcher: {
            title: "AI Competitor Researcher - Analyze Any Website | Cluaiz",
            description: "Scan competitor websites, extract strategies, identify gaps. AI-powered competitive intelligence tool.",
            keywords: ["competitor analysis", "AI researcher", "competitive intelligence"],
        },
        seo: {
            title: "SEO Tools - Auto-Optimize Your Website | Cluaiz",
            description: "Automated SEO optimization. Meta tags, structured data, performance optimization built-in.",
            keywords: ["SEO tools", "website optimization", "SEO automation"],
        },
    },

    automation: {
        parent: {
            title: "Automation Suite - WhatsApp, Maps & CRM | Cluaiz",
            description: "Business automation tools: WhatsApp AI, Google Maps manager, lead extractor, CRM integrations.",
            keywords: ["business automation", "WhatsApp automation", "CRM integration"],
        },
        whatsapp: {
            title: "WhatsApp AI Agent - Automate Customer Communication | Cluaiz",
            description: "AI-powered WhatsApp automation. Auto-reply, lead capture, order taking. Connect your WhatsApp Business API.",
            keywords: ["WhatsApp automation", "WhatsApp chatbot", "WhatsApp AI"],
        },
        googleMaps: {
            title: "Google Maps Manager - GMB Automation & Reviews | Cluaiz",
            description: "Automate Google Maps reviews, manage GMB profile, track competitors. All-in-one Maps management.",
            keywords: ["Google Maps automation", "GMB manager", "review automation"],
        },
        leadExtractor: {
            title: "Lead Extractor - Extract Leads from Google Maps | Cluaiz",
            description: "Extract business leads from Google Maps. Get phone numbers, emails, addresses automatically.",
            keywords: ["lead extraction", "Google Maps scraper", "lead generation"],
        },
        crm: {
            title: "CRM Integrations - HubSpot, Zoho & More | Cluaiz",
            description: "Connect Cluaiz with your CRM. Auto-sync leads to HubSpot, Zoho, Salesforce.",
            keywords: ["CRM integration", "HubSpot", "Zoho CRM"],
        },
    },

    aiBrain: {
        parent: {
            title: "AI Brain - Custom Knowledge Base & Training | Cluaiz",
            description: "Train your AI on website content, PDFs, docs. RAG-powered knowledge base with AI memory.",
            keywords: ["AI training", "knowledge base", "RAG system"],
        },
        training: {
            title: "AI Training - Teach Your AI Instantly | Cluaiz",
            description: "Upload PDFs, paste URLs, add documents. AI learns your business in seconds.",
            keywords: ["AI training", "knowledge upload", "AI learning"],
        },
        rag: {
            title: "RAG System - Advanced AI Retrieval | Cluaiz",
            description: "Vector search powered knowledge retrieval. 99% accuracy with hybrid brain architecture.",
            keywords: ["RAG", "vector search", "AI retrieval"],
        },
        memory: {
            title: "AI Memory - Long-term Learning System | Cluaiz",
            description: "AI that remembers every conversation. Auto-learning from customer interactions.",
            keywords: ["AI memory", "conversation history", "learning AI"],
        },
    },

    // Template Categories
    templates: {
        parent: {
            title: "AI Chatbot Templates - Ready-to-Use Flows | Cluaiz",
            description: "25+ pre-built AI chatbot templates for booking, leads, support, orders. Launch in minutes.",
            keywords: ["chatbot templates", "AI templates", "pre-built chatbots"],
        },

        // Booking Category
        booking: {
            parent: {
                title: "Booking & Appointment Templates | Cluaiz",
                description: "AI chatbot templates for appointments: gym trials, doctor bookings, salon slots, consultations.",
                keywords: ["appointment booking", "booking chatbot", "scheduling AI"],
            },
            gym: {
                title: "Gym Trial Booking AI Chatbot Template | Cluaiz",
                description: "Auto-book gym trial sessions. Smart slot selection, fitness goal capture, calendar sync.",
                keywords: ["gym booking chatbot", "fitness trial", "gym automation"],
            },
            doctor: {
                title: "Doctor Appointment Booking Chatbot | Cluaiz",
                description: "Healthcare appointment scheduling AI. Patient info collection, slot management, reminders.",
                keywords: ["doctor booking", "healthcare chatbot", "appointment automation"],
            },
            salon: {
                title: "Hair Salon Booking AI Chatbot | Cluaiz",
                description: "Beauty salon appointment booking. Service selection, stylist preference, auto-reminders.",
                keywords: ["salon booking", "beauty appointment", "salon chatbot"],
            },
            yoga: {
                title: "Yoga Studio Booking Chatbot | Cluaiz",
                description: "Yoga class booking automation. Class type selection, instructor preference, package deals.",
                keywords: ["yoga booking", "studio chatbot", "class scheduling"],
            },
            lawFirm: {
                title: "Legal Consultation Booking AI | Cluaiz",
                description: "Law firm consultation scheduling. Case type screening, lawyer matching, confidential.",
                keywords: ["legal consultation", "lawyer booking", "law firm chatbot"],
            },
            consultant: {
                title: "Business Consultant Booking Chatbot | Cluaiz",
                description: "Professional consultation scheduling. Service type, expertise matching, calendar integration.",
                keywords: ["consultant booking", "business consultation", "professional scheduling"],
            },
        },

        // Lead Gen Category
        leadGen: {
            parent: {
                title: "Lead Generation Chatbot Templates | Cluaiz",
                description: "AI chatbots that qualify and capture leads: real estate, agencies, design, immigration.",
                keywords: ["lead generation", "lead qualification", "sales chatbot"],
            },
            realEstate: {
                title: "Real Estate Lead Generation Chatbot | Cluaiz",
                description: "Qualify property buyers/sellers. Budget screening, location preference, auto-CRM sync.",
                keywords: ["real estate chatbot", "property leads", "realtor automation"],
            },
            digitalAgency: {
                title: "Digital Agency Lead Capture Chatbot | Cluaiz",
                description: "Agency lead qualification. Service needs, budget range, project timeline capture.",
                keywords: ["agency chatbot", "marketing leads", "digital agency automation"],
            },
            interiorDesign: {
                title: "Interior Design Quote Chatbot | Cluaiz",
                description: "Interior design inquiry handling. Style preference, budget, room details collection.",
                keywords: ["interior design chatbot", "design quotes", "home design leads"],
            },
            immigration: {
                title: "Immigration Consultation Chatbot | Cluaiz",
                description: "Visa consultation lead capture. Country preference, visa type, documentation screening.",
                keywords: ["immigration chatbot", "visa consultation", "immigration leads"],
            },
            insurance: {
                title: "Insurance Quote Chatbot | Cluaiz",
                description: "Insurance lead generation. Coverage type, premium range, policy comparison.",
                keywords: ["insurance chatbot", "policy quotes", "insurance leads"],
            },
            education: {
                title: "Course Enrollment Chatbot | Cluaiz",
                description: "Education lead capture. Course interest, background check, enrollment assistance.",
                keywords: ["education chatbot", "course enrollment", "student leads"],
            },
        },

        // Support Category
        support: {
            parent: {
                title: "Support & FAQ Chatbot Templates | Cluaiz",
                description: "Customer support AI chatbots: e-commerce, SaaS, schools, hotels, retail.",
                keywords: ["support chatbot", "FAQ automation", "customer service AI"],
            },
            ecommerce: {
                title: "E-commerce Support Chatbot | Cluaiz",
                description: "Online store support AI. Order tracking, returns, product info, 24/7 assistance.",
                keywords: ["ecommerce chatbot", "store support", "shopping assistant"],
            },
            saas: {
                title: "SaaS Product Support Chatbot | Cluaiz",
                description: "Software support automation. Feature guidance, troubleshooting, ticket creation.",
                keywords: ["SaaS chatbot", "product support", "software help"],
            },
            school: {
                title: "School Information Chatbot | Cluaiz",
                description: "School inquiry handling. Admission info, fee structure, program details.",
                keywords: ["school chatbot", "education support", "admission chatbot"],
            },
            hotel: {
                title: "Hotel Inquiry Chatbot | Cluaiz",
                description: "Hotel booking assistance. Room availability, amenities, pricing, reservations.",
                keywords: ["hotel chatbot", "booking assistant", "hospitality AI"],
            },
            retail: {
                title: "Retail Store Support Chatbot | Cluaiz",
                description: "Retail customer service. Product availability, store hours, location info.",
                keywords: ["retail chatbot", "store support", "retail automation"],
            },
        },

        // Orders Category
        orders: {
            parent: {
                title: "Order & Catalog Chatbot Templates | Cluaiz",
                description: "Product catalog and ordering chatbots: restaurants, bakeries, groceries, pharmacies.",
                keywords: ["order chatbot", "menu bot", "catalog automation"],
            },
            restaurant: {
                title: "Restaurant Menu Ordering Chatbot | Cluaiz",
                description: "Food ordering automation. Menu browsing, customization, delivery/pickup.",
                keywords: ["restaurant chatbot", "food ordering", "menu bot"],
            },
            cakeShop: {
                title: "Custom Cake Order Chatbot | Cluaiz",
                description: "Cake shop ordering. Custom designs, flavors, sizes, delivery scheduling.",
                keywords: ["cake chatbot", "bakery orders", "custom cake"],
            },
            grocery: {
                title: "Local Grocery Catalog Chatbot | Cluaiz",
                description: "Grocery store product catalog. Item selection, pricing, home delivery.",
                keywords: ["grocery chatbot", "store catalog", "grocery ordering"],
            },
            pharmacy: {
                title: "Medicine Ordering Chatbot | Cluaiz",
                description: "Pharmacy order automation. Medicine search, prescription upload, delivery.",
                keywords: ["pharmacy chatbot", "medicine ordering", "prescription bot"],
            },
            bakery: {
                title: "Bakery Pre-Order Chatbot | Cluaiz",
                description: "Bakery pre-ordering. Special orders, pickup scheduling, menu browsing.",
                keywords: ["bakery chatbot", "pre-order bot", "bakery automation"],
            },
        },

        // Info Category
        info: {
            parent: {
                title: "Info & Portfolio Chatbot Templates | Cluaiz",
                description: "Information and portfolio chatbots: personal brands, startups, NGOs, artists.",
                keywords: ["info chatbot", "portfolio bot", "brand assistant"],
            },
            personalBrand: {
                title: "Personal Branding Chatbot | Cluaiz",
                description: "Personal brand assistant. Bio, services, contact, social links.",
                keywords: ["personal brand", "portfolio chatbot", "freelancer bot"],
            },
            startup: {
                title: "Startup Pitch Chatbot | Cluaiz",
                description: "Startup information agent. Product demo, pitch deck, investor info.",
                keywords: ["startup chatbot", "pitch bot", "startup assistant"],
            },
            ngo: {
                title: "NGO Information Chatbot | Cluaiz",
                description: "Non-profit information. Causes, donation, volunteer signup, impact stories.",
                keywords: ["NGO chatbot", "nonprofit bot", "charity assistant"],
            },
        },
    },

    // Documentation
    docs: {
        parent: {
            title: "Documentation - Guides & Tutorials | Cluaiz",
            description: "Complete documentation for Cluaiz: setup guides, API reference, tutorials.",
            keywords: ["cluaiz docs", "documentation", "tutorials"],
        },
    },

    // Blog
    blog: {
        parent: {
            title: "Blog - AI Marketing & Business Automation | Cluaiz",
            description: "Latest insights on AI chatbots, automation, local business growth, and product updates.",
            keywords: ["AI blog", "chatbot tips", "automation guide"],
        },
    },

    // Tools
    tools: {
        parent: {
            title: "Free AI Tools - Website Analysis & More | Cluaiz",
            description: "Free business tools: competitor analyzer, lead extractor, SEO checker, chatbot tester.",
            keywords: ["free AI tools", "business tools", "website analyzer"],
        },
    },
};

/**
 * Generate dynamic metadata for any page
 */
export function generatePageMetadata(
    pageKey: string,
    customData?: {
        title?: string;
        description?: string;
        keywords?: string[];
    }
) {
    const baseMetadata = (PAGE_METADATA as any)[pageKey] || {};

    const title = customData?.title || baseMetadata.title || SITE_CONFIG.name;
    const description = customData?.description || baseMetadata.description || SITE_CONFIG.description;
    const keywords = customData?.keywords || baseMetadata.keywords || SITE_CONFIG.keywords;

    return {
        title,
        description,
        keywords: keywords.join(", "),
        authors: [{ name: SITE_CONFIG.author }],
        creator: SITE_CONFIG.creator,
        openGraph: {
            title,
            description,
            url: SITE_CONFIG.url,
            siteName: SITE_CONFIG.name,
            images: [
                {
                    url: SITE_CONFIG.ogImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            locale: "en_US",
            type: baseMetadata.ogType || "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            creator: SITE_CONFIG.twitterHandle,
            images: [SITE_CONFIG.ogImage],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
    };
}

/**
 * Template metadata generator
 * Auto-creates SEO for template pages
 */
export function generateTemplateMetadata(
    category: "booking" | "leadGen" | "support" | "orders" | "info",
    slug: string
) {
    const categoryData = PAGE_METADATA.templates[category];
    const templateData = (categoryData as any)?.[slug];

    if (!templateData) {
        return generatePageMetadata("templates.parent");
    }

    return generatePageMetadata("custom", templateData);
}

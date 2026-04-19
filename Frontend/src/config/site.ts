export const siteConfig = {
    name: "Cluaiz",
    description: "AI Chatbot Platform with RAG and Hybrid Model Routing",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ogImage: "/og-image.png",
    links: {
        twitter: "https://twitter.com/cluaiz",
        github: "https://github.com/cluaiz",
    },
};

export const navigation = {
    main: [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Pricing", href: "/pricing" },
        { name: "Contact", href: "/contact" },
    ],
    dashboard: [
        { name: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
        { name: "Sites", href: "/dashboard/sites", icon: "Globe" },
        { name: "Analytics", href: "/dashboard/analytics", icon: "BarChart3" },
        { name: "Leads", href: "/dashboard/leads", icon: "Users" },
        { name: "Settings", href: "/dashboard/settings", icon: "Settings" },
    ],
};

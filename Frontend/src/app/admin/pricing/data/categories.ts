export const FEATURE_CATEGORIES = {
    // 🧠 AI & Core
    ai_core: {
        label: "🧠 AI Model LLM",
        color: "text-violet-500",
        bg: "bg-violet-100 dark:bg-violet-900/20",
        border: "border-violet-200 dark:border-violet-800"
    },

    // 🌐 Web & Core
    core: {
        label: "🌐 Web",
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800"
    },

    // 💬 Communication
    communication: {
        label: "💬 Communication",
        color: "text-emerald-500",
        bg: "bg-emerald-100 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800"
    },

    // 🛒 E-Commerce
    ecommerce: {
        label: "🛒 E-Commerce",
        color: "text-orange-500",
        bg: "bg-orange-100 dark:bg-orange-900/20",
        border: "border-orange-200 dark:border-orange-800"
    },

    // 📱 Social
    social: {
        label: "📱 Social",
        color: "text-pink-500",
        bg: "bg-pink-100 dark:bg-pink-900/20",
        border: "border-pink-200 dark:border-pink-800"
    },

    // 👥 CRM
    crm: {
        label: "👥 CRM",
        color: "text-cyan-500",
        bg: "bg-cyan-100 dark:bg-cyan-900/20",
        border: "border-cyan-200 dark:border-cyan-800"
    },

    // 📈 Productivity
    productivity: {
        label: "📈 Productivity",
        color: "text-indigo-500",
        bg: "bg-indigo-100 dark:bg-indigo-900/20",
        border: "border-indigo-200 dark:border-indigo-800"
    },

    // 💳 Payment
    payment: {
        label: "💳 Payment",
        color: "text-green-500",
        bg: "bg-green-100 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800"
    },

    // 🗄️ Data
    data: {
        label: "🗄️ Data",
        color: "text-slate-500",
        bg: "bg-slate-100 dark:bg-slate-900/20",
        border: "border-slate-200 dark:border-slate-800"
    },

    // 📊 Tools
    tools: {
        label: "📊 Tools & Utilities",
        color: "text-amber-500",
        bg: "bg-amber-100 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800"
    },

    // ⚡ Automation
    automation: {
        label: "⚡ Automation",
        color: "text-yellow-500",
        bg: "bg-yellow-100 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-800"
    },

    // 💼 Business
    business: {
        label: "💼 Business",
        color: "text-rose-500",
        bg: "bg-rose-100 dark:bg-rose-900/20",
        border: "border-rose-200 dark:border-rose-800"
    },

    // Default Fallback
    default: {
        label: "📦 Other",
        color: "text-zinc-500",
        bg: "bg-zinc-100 dark:bg-zinc-900/20",
        border: "border-zinc-200 dark:border-zinc-800"
    }
} as const;

export type CategoryKey = keyof typeof FEATURE_CATEGORIES;

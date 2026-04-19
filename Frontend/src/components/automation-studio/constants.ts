import {
    Zap,
    Brain,
    Send,
    MessageSquare,
    Mail,
    Globe,
    ShoppingCart,
    Database
} from "lucide-react";

export const NODE_CATEGORIES = [
    {
        id: "triggers",
        label: "Triggers",
        icon: Zap,
        color: "#10b981",
        nodes: [
            {
                id: "gmail-trigger",
                name: "Gmail",
                subtitle: "New Email",
                icon: "📧",
                color: "#EA4335",
                type: "trigger",
                scopes: ["https://mail.google.com/"],
                events: ["New Email", "Starred Email"]
            },
            {
                id: "whatsapp-trigger",
                name: "WhatsApp",
                subtitle: "New Message",
                icon: "💬",
                color: "#25D366",
                type: "trigger",
                scopes: ["whatsapp_business_messaging"],
                events: ["New Message", "Order Received"]
            },
            {
                id: "youtube-trigger",
                name: "YouTube",
                subtitle: "New Comment",
                icon: "📺",
                color: "#FF0000",
                type: "trigger",
                scopes: ["youtube.force-ssl"],
                events: ["New Comment", "New Subscriber"]
            },
            {
                id: "instagram-trigger",
                name: "Instagram",
                subtitle: "New DM",
                icon: "📷",
                color: "#E4405F",
                type: "trigger",
                scopes: ["instagram_manage_messages"],
                events: ["New DM", "New Comment"]
            },
            {
                id: "cluaiz-bot-trigger",
                name: "Cluaiz Bot",
                subtitle: "Chat Event",
                icon: "🤖",
                color: "#6366f1",
                type: "trigger",
                scopes: ["native"],
                events: ["Chat Started", "Chat Ended", "Lead Captured", "User Frustrated"]
            },
            {
                id: "time-trigger",
                name: "Schedule",
                subtitle: "Time-based",
                icon: "⏰",
                color: "#8b5cf6",
                type: "trigger",
                scopes: ["native"],
                events: ["Every Day at 9 AM", "Every Hour", "Custom Cron"]
            },
            {
                id: "webhook-trigger",
                name: "Webhook",
                subtitle: "Catch Hook",
                icon: "🔗",
                color: "#0ea5e9",
                type: "trigger",
                scopes: ["native"],
                events: ["POST Request", "GET Request"]
            },
        ],
    },
    {
        id: "logic",
        label: "Logic & AI",
        icon: Brain,
        color: "#9333ea",
        nodes: [
            {
                id: "if-else",
                name: "If/Else",
                subtitle: "Condition",
                icon: "🔀",
                color: "#f59e0b",
                type: "logic",
                conditions: ["Contains", "Equals", "Greater Than", "Regex Match"]
            },
            {
                id: "filter",
                name: "Filter",
                subtitle: "Data Filter",
                icon: "🔍",
                color: "#06b6d4",
                type: "logic",
                conditions: ["Only Hot Leads", "Score > 80", "Custom Filter"]
            },
            {
                id: "wait",
                name: "Wait",
                subtitle: "Delay",
                icon: "⏸️",
                color: "#84cc16",
                type: "logic",
                options: ["1 Hour", "1 Day", "Custom Duration"]
            },
            {
                id: "ai-brain",
                name: "AI Brain",
                subtitle: "Intelligence",
                icon: "🧠",
                color: "#9333ea",
                type: "logic",
                capabilities: ["Analyze Sentiment", "Summarize", "Categorize", "Generate Reply", "Extract Data"]
            },
            {
                id: "switch",
                name: "Switch",
                subtitle: "Multi-path",
                icon: "🎯",
                color: "#ec4899",
                type: "logic",
                options: ["Case 1", "Case 2", "Case 3", "Default"]
            },
        ],
    },
    {
        id: "actions",
        label: "Actions",
        icon: Send,
        color: "#3b82f6",
        nodes: [
            {
                id: "gmail-action",
                name: "Gmail",
                subtitle: "Email Actions",
                icon: "📧",
                color: "#EA4335",
                type: "action",
                scopes: ["https://mail.google.com/"],
                actions: ["Send Email", "Create Draft", "Delete Email", "Add Label", "Mark as Read"]
            },
            {
                id: "whatsapp-action",
                name: "WhatsApp",
                subtitle: "Send Message",
                icon: "💬",
                color: "#25D366",
                type: "action",
                scopes: ["whatsapp_business_messaging"],
                actions: ["Send Message", "Send Template", "Send Media"]
            },
            {
                id: "youtube-action",
                name: "YouTube",
                subtitle: "Comment Actions",
                icon: "📺",
                color: "#FF0000",
                type: "action",
                scopes: ["youtube.force-ssl"],
                actions: ["Reply to Comment", "Delete Comment", "Like Comment", "Pin Comment"]
            },
            {
                id: "instagram-action",
                name: "Instagram",
                subtitle: "Social Actions",
                icon: "📷",
                color: "#E4405F",
                type: "action",
                scopes: ["instagram_manage_comments", "pages_messaging"],
                actions: ["Reply to DM", "Hide Comment", "Post to Feed"]
            },
            {
                id: "sheets-action",
                name: "Google Sheets",
                subtitle: "Add Row",
                icon: "📊",
                color: "#0F9D58",
                type: "action",
                scopes: ["spreadsheets"],
                actions: ["Add Row", "Update Row", "Find Row"]
            },
            {
                id: "crm-action",
                name: "CRM",
                subtitle: "Update Contact",
                icon: "👤",
                color: "#0ea5e9",
                type: "action",
                scopes: ["native"],
                actions: ["Create Contact", "Update Contact", "Add Note"]
            },
            {
                id: "cluaiz-bot-action",
                name: "Cluaiz Bot",
                subtitle: "Bot Actions",
                icon: "🤖",
                color: "#6366f1",
                type: "action",
                scopes: ["native"],
                actions: ["Update Memory", "Trigger Popup", "Send Notification"]
            },
        ],
    },
];

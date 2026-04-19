
import { TimelineEntry } from "@/api/timeline.api";

export const MOCK_TIMELINE: TimelineEntry[] = [
    {
        id: "tl_1",
        title: "Daily Digest: March 18",
        date: "2024-03-18T23:59:00Z",
        type: "daily",
        summary: "Today's conversations focused heavily on API limits and pricing upgrades. Users are reacting positively to the new 'Vision' feature but reporting slow response times during peak hours.",
        metrics: {
            chats: 142,
            sentiment: "Positive",
            topTopics: ["API Limits", "Vision Feature", "Latency", "Pricing"]
        },
        comparison_data: {
            previous_chats: 112,
            previous_sentiment: "Neutral",
            chat_change: 26.8,
            sentiment_shift: "improved"
        },
        daily_stats: {
            sentiment_breakdown: { positive: 85, neutral: 42, negative: 15 },
            total_inquiries: 112,
            leads_captured: 18
        },
        top_learnings: [
            { text: "Enterprise Plan supports On-Premise Docker deployment for enhanced security", source: "Chat #1024", confidence: 98 },
            { text: "User prefers dark mode for all dashboards and analytics views", source: "Chat #1025", confidence: 95 },
            { text: "Pricing queries increased by 40% on weekends, suggesting B2B usage patterns", source: "Analytics", confidence: 88 },
            { text: "Most common upgrade path is from Free to Pro, skipping Basic tier", source: "Conversion Data", confidence: 92 },
            { text: "Users requesting API rate limit visibility in dashboard", source: "Feature Request", confidence: 87 }
        ],
        events: [
            {
                id: "evt_1",
                time: "10:42 AM",
                type: "fact",
                channel: "web",
                title: "Docker Support Verification",
                content: "User 'alex_corp' initiated a detailed inquiry regarding the Enterprise Plan's security architecture. Specifically, they needed confirmation on whether On-Premise Docker deployment is supported for their private cloud infrastructure. The AI confirmed support, provided the link to the Docker implementation guide, and explained the licensing model for single-tenant instances. User expressed satisfaction with the security isolation features.",
                source_id: "Chat #1024",
                sentiment: "Positive",
                topic: "Pricing",
                user_id: "alex_corp",
                user_type: "customer",
                duration: "18m 20s"
            },
            {
                id: "evt_2",
                time: "01:15 PM",
                type: "friction",
                channel: "whatsapp",
                title: "Cancellation Flow Friction",
                content: "Customer 'sarah_m' reported significant difficulty locating the 'Cancel Subscription' option within the settings menu. She navigated through 'Billing' > 'Invoices' but could not find the cancellation toggle. The AI had to guide her to the 'Account Management' sub-tab. User expressed frustration, stating 'This pattern feels like a dark pattern designed to hide the exit.' Recommended UI review for the settings navigation hierarchy.",
                source_id: "Chat #1098",
                sentiment: "Negative",
                topic: "UX/UI",
                user_id: "sarah_m",
                user_type: "customer",
                duration: "6m 45s"
            },
            {
                id: "evt_3",
                time: "02:30 PM",
                type: "insight",
                channel: "instagram",
                title: "Dark Mode Feature Request",
                content: "Lead 'mike_davids' from a marketing agency spent 15 minutes exploring the analytics demo. He specifically asked if the dashboard supports a 'Dark Mode' toggle, citing that his team works late hours and prefers low-light interfaces. He compared our UI to Competitor X, noting that their dark mode is a key selling point. This signal correlates with 3 other similar requests this week.",
                source_id: "Chat #1112",
                sentiment: "Neutral",
                topic: "Feature Request",
                user_id: "mike_davids",
                user_type: "lead",
                leadId: "LEAD-9002", // Added Lead ID
                duration: "15m 00s"
            },
            {
                id: "evt_4",
                time: "04:30 PM",
                type: "gap",
                channel: "web",
                title: "Missed Reseller Opportunity",
                content: "Visitor asked detailed questions about a 'Reseller Program' or 'White Label' option. They wanted to know about margin splits, co-branding capabilities, and API limits for sub-accounts. The AI was unable to provide specific details as the Knowledge Base lacks a 'Reseller' section. User left the chat without converting, marking a missed high-value opportunity.",
                source_id: "Chat #1150",
                sentiment: "Negative",
                topic: "Sales",
                user_id: "unknown_visitor",
                user_type: "visitor",
                duration: "4m 10s"
            },
            {
                id: "evt_5",
                time: "05:15 PM",
                type: "fact",
                channel: "email",
                title: "Pro Tier Pricing Update",
                content: "System admin broadcasted an update confirmation: The pricing tier for 'Pro' has been officially adjusted to $49/mo. All logic relating to the old $39/mo price point has been deprecated. Knowledge base articles regarding 'Pricing' have been auto-updated to reflect this change.",
                source_id: "Admin Update",
                sentiment: "Neutral",
                topic: "Admin",
                user_id: "system",
                user_type: "customer",
                duration: "0s"
            }
        ]
    },
    {
        id: "tl_2",
        title: "Weekly Strategic Report (Week 11)",
        date: "2024-03-17T09:00:00Z",
        type: "weekly",
        summary: "Over the past week, we observed a 15% increase in inquiries regarding 'Enterprise' security features. It is recommended to update the FAQ with SOC2 compliance details to address this gap. Customer satisfaction remains high at 4.6/5 stars.",
        metrics: {
            chats: 850,
            sentiment: "Positive",
            topTopics: ["Security", "SOC2", "Enterprise", "Compliance", "GDPR"]
        },
        top_learnings: [
            { text: "Security section needs SOC2 compliance update with certification timeline", source: "User Feedback", confidence: 99 },
            { text: "Competitor 'ChatBotX' launched similar Vision feature at 20% lower price", source: "Market Analysis", confidence: 85 },
            { text: "Enterprise customers prefer annual billing for budget planning", source: "Sales Team", confidence: 94 },
            { text: "GDPR compliance documentation is most requested enterprise resource", source: "Support Tickets", confidence: 91 }
        ],
        weekly_analysis: {
            trends: [
                { topic: "Pricing", volume: 450, change: 40, sentiment: "Negative" },
                { topic: "Security", volume: 320, change: 15, sentiment: "Positive" },
                { topic: "Integrations", volume: 210, change: -10, sentiment: "Neutral" }
            ],
            gaps: [
                { query: "Reseller Program", count: 15, impact: "High" },
                { query: "iOS Widget Config", count: 8, impact: "Medium" }
            ],
            activity_graph: [45, 62, 58, 70, 85, 40, 35] // M T W T F S S
        }
    },
    {
        id: "tl_3",
        title: "Daily Digest: March 17",
        date: "2024-03-17T23:59:00Z",
        type: "daily",
        summary: "Quiet day. Most queries were routine password resets and login issues. No major anomalies detected. Support team handled all tickets within 2-hour SLA.",
        metrics: {
            chats: 89,
            sentiment: "Neutral",
            topTopics: ["Login", "Password Reset", "Authentication"]
        },
        top_learnings: [
            { text: "Password reset emails occasionally land in spam folders for Gmail users", source: "Support Tickets", confidence: 89 },
            { text: "SSO integration requests increased from healthcare sector", source: "Feature Requests", confidence: 82 }
        ],
        daily_stats: {
            sentiment_breakdown: { positive: 45, neutral: 35, negative: 9 },
            total_inquiries: 89,
            leads_captured: 12
        },
        events: [
            { id: "evt_6", time: "09:15 AM", duration: "0s", type: "fact", content: "Backend latency spike correlated with high volume of image uploads.", source_id: "System Log", sentiment: "Negative", topic: "Performance", user_id: "system", user_type: "customer" },
            { id: "evt_7", time: "11:00 AM", duration: "12m", type: "friction", content: "Two users reported password reset emails going to spam.", source_id: "Ticket #404", sentiment: "Negative", topic: "Support", user_id: "tech_support", user_type: "customer" }
        ]
    },
    {
        id: "tl_4",
        title: "Daily Digest: March 16",
        date: "2024-03-16T23:59:00Z",
        type: "daily",
        summary: "Spike in questions about 'Team Collaboration' features. Users are asking how to invite members. Consider making the 'Invite' button more prominent. High engagement detected.",
        metrics: {
            chats: 112,
            sentiment: "Positive",
            topTopics: ["Team", "Invites", "Collaboration", "Permissions"]
        },
        daily_stats: {
            sentiment_breakdown: { positive: 70, neutral: 30, negative: 12 },
            total_inquiries: 112,
            leads_captured: 24
        },
        top_learnings: [
            { text: "Users want granular role-based permissions for team members", source: "Feature Requests", confidence: 93 },
            { text: "Invite link expiration time of 24h is too short for enterprise teams", source: "Feedback", confidence: 88 },
            { text: "Slack integration is the top requested channel for team notifications", source: "Integrations", confidence: 86 }
        ]
    },
    {
        id: "tl_monthly_1",
        title: "Monthly Strategic Report: March 2024",
        date: "2024-03-31T23:59:00Z",
        type: "monthly",
        summary: "March showed strong growth in Enterprise adoption. The new 'Vision' feature drove a 20% increase in pro-tier upgrades. However, support load increased due to API complexity.",
        metrics: {
            chats: 3420,
            sentiment: "Positive",
            topTopics: ["Enterprise", "Vision", "API", "Upgrades", "Support"]
        },
        top_learnings: [
            { text: "Enterprise users are willing to pay % premium for dedicated support", source: "Sales Data", confidence: 97 },
            { text: "Webhook integration priority for SaaS customers automating workflows", source: "Enterprise Feedback", confidence: 96 },
            { text: "Custom branding removes 'Powered by' drives 18% more Pro conversions", source: "A/B Testing", confidence: 94 },
            { text: "Mobile-first users have 40% higher engagement than desktop-only users", source: "Behavioral Analytics", confidence: 91 }
        ],
        monthly_analysis: {
            roi_metrics: {
                total_chats: 3420,
                human_handover: 180, // Low number = good
                automation_rate: 94.7,
                saved_hours: 850
            },
            voice_of_customer: [
                {
                    category: "Feature Request",
                    type: "gap",
                    title: "On-Premise Demand Surge",
                    insight: "60% of enterprise leads explicitly requested On-Premise Deployment options. This recurring request suggests a significant market segment we are currently missing. The primary driver is data sovereignty and compliance requirements for healthcare and fintech sectors.",
                    impact: "Revenue Opportunity"
                },
                {
                    category: "Performance",
                    type: "insight",
                    title: "CDN Upgrade Impact",
                    insight: "Latency complaints dropped by 50% immediately following the CDN upgrade. User sessions are now 15% longer on average, indicating that faster load times are directly correlating with higher engagement and reduced bounce rates.",
                    impact: "Retention Boost"
                }
            ]
        }
    },
    {
        id: "tl_yearly_1",
        title: "Annual Annual Report: 2023",
        date: "2023-12-31T23:59:00Z",
        type: "yearly",
        summary: "2023 was a year of foundational growth. AI handled 45,000+ chats, reducing support costs by 65%. Key product shift: Users prioritized 'Security' over 'Speed'.",
        metrics: {
            chats: 45200,
            sentiment: "Positive",
            topTopics: ["Security", "Automation", "Pricing", "API"]
        },
        annual_analysis: {
            growth_metrics: {
                total_conversations: "45.2K",
                yoy_growth: 140, // %
                cost_savings: "$120,000"
            },
            strategic_shifts: [
                { from: "Manual Support", to: "AI Automation", magnitude: "High" },
                { from: "Basic Queries", to: "Complex Workflows", magnitude: "Medium" }
            ],
            top_revenue_drivers: [
                { source: "Enterprise Plan", value: "High Interest" },
                { source: "API Usage", value: "Scaling Fast" }
            ]
        }
    }
];

export const MOCK_ANALYTICS = {
    totalMemories: 1240,
    queries_resolved: 4500,
    conflicts_detected: 12,
    autoResolutionRate: 98,
    storage_used: "4.2MB"
};

export const MOCK_INSIGHTS = [
    {
        _id: "ins_1",
        content: "User preference for 'Dark Mode' is increasing.",
        confidence_score: 95, // Updated to match interface (was confidence)
        type: "pattern", // Added missing required type
        created_at: "2024-03-20T10:00:00Z", // Updated from timestamp
        question: "What UI theme do users prefer?",
        frequency: 12
    },
    {
        _id: "ins_2",
        content: "Frequent queries about 'API Limits' suggest need for better documentation.",
        confidence_score: 88,
        type: "knowledge_gap",
        created_at: "2024-03-19T14:30:00Z",
        question: "Why are API limits confusing?",
        frequency: 8
    },
    {
        _id: "ins_3",
        content: "Users confuse 'Add Member' with 'Invite Link'. Request clearer UI.",
        confidence_score: 92,
        type: "fact",
        created_at: "2024-03-21T09:15:00Z",
        question: "How to add team members?",
        frequency: 15
    },
    {
        _id: "ins_4",
        content: "Mobile users reporting 3s+ delay on login screen.",
        confidence_score: 89,
        type: "pattern",
        created_at: "2024-03-21T11:45:00Z",
        question: "Why is login slow?",
        frequency: 7
    }
];

export const MOCK_MEMORIES = [
    {
        _id: "mem_1",
        content: "User 'AlphaCorp' requires ISO 27001 compliance documentation for all contracts > $50k.",
        category: "business_rule",
        tags: ["compliance", "contracts", "enterprise"],
        updatedAt: "2024-03-20T10:00:00Z"
    },
    {
        _id: "mem_2",
        content: "Preferred contact method for 'Sarah Jones' is email, not phone.",
        category: "user_preference",
        tags: ["contact", "preferences"],
        updatedAt: "2024-03-19T14:30:00Z"
    },
    {
        _id: "mem_3",
        content: "The 'Vision' feature is currently in beta and should be pitched as 'Experimental'.",
        category: "brand_fact",
        tags: ["product", "beta", "messaging"],
        updatedAt: "2024-03-18T09:15:00Z"
    },
    {
        _id: "mem_4",
        content: "Discount code 'WELCOME20' is valid for new signups until April 30th.",
        category: "business_rule",
        tags: ["marketing", "discounts"],
        updatedAt: "2024-03-15T11:00:00Z"
    }
];

export const MOCK_ARCHIVED_WEEKS = [
    {
        id: "week_42",
        label: "Week 42 (Oct 14 - Oct 20)",
        date: "2024-10-20T23:59:00Z",
        type: 'weekly',
        title: "Week 42: The Pricing Pushback",
        summary: "High friction detected around the new Pro Plan pricing. Users are confused about the feature limits.",
        metrics: { chats: 3200, sentiment: "Negative", topTopics: ["Pricing", "Limits", "Downgrade"] },
        weekly_analysis: {
            trends: [
                { topic: "Pricing", volume: 1250, change: 120, sentiment: "Negative" },
                { topic: "Feature Limits", volume: 890, change: 85, sentiment: "Negative" },
                { topic: "Support", volume: 450, change: 10, sentiment: "Neutral" }
            ],
            gaps: [
                { query: "Downgrade Process", count: 45, impact: "High" },
                { query: "grandfathering", count: 28, impact: "Medium" }
            ],
            activity_graph: [450, 620, 580, 750, 890, 410, 380] // Mon-Sun
        }
    },
    {
        id: "week_41",
        label: "Week 41 (Oct 07 - Oct 13)",
        date: "2024-10-13T23:59:00Z",
        type: 'weekly',
        title: "Week 41: Steady Growth",
        summary: "Routine week with steady growth. No major incidents. Sentiment is stable.",
        metrics: { chats: 2800, sentiment: "Positive", topTopics: ["Login", "API", "Docs"] },
        weekly_analysis: {
            trends: [
                { topic: "Login", volume: 800, change: 5, sentiment: "Neutral" },
                { topic: "API Key", volume: 650, change: 12, sentiment: "Positive" },
                { topic: "Documentation", volume: 400, change: -5, sentiment: "Positive" }
            ],
            gaps: [
                { query: "SSO Config", count: 12, impact: "Low" }
            ],
            activity_graph: [400, 420, 450, 480, 500, 200, 180] // Mon-Sun
        }
    },
    {
        id: "week_40",
        label: "Week 40 (Sep 30 - Oct 06)",
        date: "2024-10-06T23:59:00Z",
        type: 'weekly',
        title: "Week 40: The Outage Recovery",
        summary: "Recovery from the Sep 29th outage. Users seeking SLAs and credit refunds.",
        metrics: { chats: 3500, sentiment: "Neutral", topTopics: ["SLA", "Refund", "Uptime"] },
        weekly_analysis: {
            trends: [
                { topic: "SLA", volume: 1100, change: 200, sentiment: "Negative" },
                { topic: "Refunds", volume: 900, change: 150, sentiment: "Neutral" },
                { topic: "Uptime", volume: 600, change: 40, sentiment: "Positive" }
            ],
            gaps: [
                { query: "Credit Request", count: 88, impact: "High" }
            ],
            activity_graph: [550, 800, 700, 600, 450, 200, 150] // Mon-Sun
        }
    }
];

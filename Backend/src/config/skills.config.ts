/**
 * 🛠️ AI SKILLS CONFIGURATION & BILLING MAP
 * Is file me `agents-data.ts` ki har skill ka billing category assigned hai.
 */

import { ActivityType } from '../models/ActivityLog.js';

export interface SkillBillingConfig {
    category: ActivityType;
    description: string;
}

export const SKILL_BILLING_MAP: Record<string, SkillBillingConfig> = {
    // --- WEBSITE CHAT WIDGET SKILLS ---
    "Page Teleporter": { category: ActivityType.SKILL_NAVIGATION, description: "Directing user to specific pages" },
    "Product Catalog Search": { category: ActivityType.SKILL_ANALYSIS, description: "Searching inventory via AI" },
    "Order Tracking": { category: ActivityType.SKILL_AUTOMATION, description: "Real-time order status check" },
    "Refund & Returns Processing": { category: ActivityType.SKILL_AUTOMATION, description: "Automated refund evaluation" },
    "Action Discovery Engine": { category: ActivityType.SKILL_ANALYSIS, description: "Learning website structure" },
    "De-escalator & Conflict Resolution": { category: ActivityType.SKILL_ANALYSIS, description: "Emotional state tracking" },
    "Human-in-the-Loop Gateway": { category: ActivityType.SKILL_NAVIGATION, description: "Escalating to human" },
    "Lead Qualifier": { category: ActivityType.SKILL_OUTREACH, description: "Qualifying and saving leads" },
    "Upsell Engine": { category: ActivityType.SKILL_OUTREACH, description: "Proactive product suggestions" },
    "Live Inventory Check": { category: ActivityType.SKILL_AUTOMATION, description: "Verifying warehouse stock" },
    "Ambiguity & Context Probing": { category: ActivityType.SKILL_ANALYSIS, description: "Extracting missing info" },
    "Chit-Chat Pivot": { category: ActivityType.SKILL_ANALYSIS, description: "Handling banter" },

    // --- WHATSAPP MANAGER SKILLS ---
    "WA Cart Recovery": { category: ActivityType.SKILL_OUTREACH, description: "Abandoned cart follow-ups" },
    "Conversational Commerce": { category: ActivityType.SKILL_OUTREACH, description: "Sales conversations on WA" },

    // --- EXECUTIVE PA SKILLS ---
    "Voice-to-Task Pipeline": { category: ActivityType.SKILL_AUTOMATION, description: "Voice transcription to Jira/Trello" },
    "Context & Briefing": { category: ActivityType.SKILL_ANALYSIS, description: "Morning executive summary" },
    "Meeting Negotiator": { category: ActivityType.SKILL_OUTREACH, description: "Scheduling meeting via email" },
    "Operations Auditing": { category: ActivityType.SKILL_ANALYSIS, description: "Monitoring business health" },

    // --- MARKETING HEAD SKILLS ---
    "Sentiment Analyzer": { category: ActivityType.SKILL_ANALYSIS, description: "Decoding customer emotion" },
    "Campaign Analysis": { category: ActivityType.SKILL_ANALYSIS, description: "Translating ROI data" },
    "Social Pulse Sentinel": { category: ActivityType.SKILL_OUTREACH, description: "PR disaster alerting" },
    "Brand Storyteller": { category: ActivityType.SKILL_OUTREACH, description: "Generating marketing copy" }
};

/**
 * Helper to get billing category for a skill name
 */
export const getSkillCategory = (skillName: string): ActivityType => {
    return SKILL_BILLING_MAP[skillName]?.category || ActivityType.SKILL_AUTOMATION;
};

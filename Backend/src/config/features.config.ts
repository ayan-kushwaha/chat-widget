// Feature Configuration System
// This file defines ALL features in the system with their metadata
// Ported from Frontend to Backend for Server-Side Validation

export enum FeatureType {
    BOOLEAN = 'boolean',    // On/Off features
    NUMERIC = 'numeric',    // Quota-based limits
    ENUM = 'enum'          // Multiple choice options
}

export interface FeatureDefinition {
    id: string;
    type: FeatureType;
    label: string;
    description: string;
    category: string;
    defaultValue: any;
    unit?: string;         // For numeric: "sites", "files", "MB"
    options?: string[];    // For enum: ["daily", "weekly", "manual"]
    icon?: string;         // Lucide icon name
}

export const FEATURES_REGISTRY: Record<string, FeatureDefinition> = {
    // 🌐 Web Scanning Features
    'max_websites': {
        id: 'max_websites',
        type: FeatureType.NUMERIC,
        label: 'Live Websites',
        description: 'Max simultaneous domains you can add',
        category: 'web_scanning',
        defaultValue: 1,
        unit: 'sites',
        icon: 'Globe'
    },
    'max_website_pages': {
        id: 'max_website_pages',
        type: FeatureType.NUMERIC,
        label: 'Pages Per Website',
        description: 'Max pages you can add per website (Crawling is token-based)',
        category: 'web_scanning',
        defaultValue: 5,
        unit: 'pages',
        icon: 'FileSearch'
    },

    // 📂 Knowledge Base Features
    'max_files': {
        id: 'max_files',
        type: FeatureType.NUMERIC,
        label: 'File Uploads',
        description: 'Monthly AI knowledge documents',
        category: 'knowledge',
        defaultValue: 2,
        unit: 'files',
        icon: 'FileText'
    },
    'max_manual_qa': {
        id: 'max_manual_qa',
        type: FeatureType.NUMERIC,
        label: 'Manual Q&A',
        description: 'Custom Q&A pairs for brain training',
        category: 'knowledge',
        defaultValue: 5,
        unit: 'pairs',
        icon: 'MessageSquarePlus'
    },

    // 📝 Forms & Leads
    'max_forms': {
        id: 'max_forms',
        type: FeatureType.NUMERIC,
        label: 'Smart Forms',
        description: 'Active lead generation forms',
        category: 'leads',
        defaultValue: 0,
        unit: 'forms',
        icon: 'FormInput'
    },

    // 🎨 Branding & UI
    'remove_branding': {
        id: 'remove_branding',
        type: FeatureType.BOOLEAN,
        label: 'Remove Branding',
        description: 'Hide "Powered by Cluaiz" badge',
        category: 'branding',
        defaultValue: false,
        icon: 'Sparkles'
    },

    // 🤖 AI Features
    'auto_learning_frequency': {
        id: 'auto_learning_frequency',
        type: FeatureType.ENUM,
        label: 'Auto Learning Frequency',
        description: 'How often AI analyzes conversations and learns automatically',
        category: 'ai',
        defaultValue: 'weekly',
        options: ['weekly', 'alternate_days', 'daily'],
        icon: 'CalendarClock'
    },

    // 👥 Team & Collaboration
    'max_team_seats': {
        id: 'max_team_seats',
        type: FeatureType.NUMERIC,
        label: 'Team Seats',
        description: 'Collaborative workspace access',
        category: 'team',
        defaultValue: 1,
        unit: 'users',
        icon: 'Users'
    },

    // 💾 Storage & Data
    'brain_capacity_mb': {
        id: 'brain_capacity_mb',
        type: FeatureType.NUMERIC,
        label: 'Neural Context',
        description: 'Combined capacity for PDFs, Docs, Websites, Api, and Q&A training.',
        category: 'storage',
        defaultValue: 5,
        unit: 'Million Tokens',
        icon: 'Database'
    },
    'data_retention_days': {
        id: 'data_retention_days',
        type: FeatureType.NUMERIC,
        label: 'Data Retention',
        description: 'Days before auto-deletion of old data',
        category: 'storage',
        defaultValue: 14,
        unit: 'days',
        icon: 'Archive'
    },

    // 🔄 Rollover & Billing
    'rollover_percentage': {
        id: 'rollover_percentage',
        type: FeatureType.NUMERIC,
        label: 'Token Rollover',
        description: 'Percentage of unused tokens carried forward',
        category: 'billing',
        defaultValue: 0,
        unit: '%',
        icon: 'RefreshCw'
    },
    'rollover_validity_days': {
        id: 'rollover_validity_days',
        type: FeatureType.NUMERIC,
        label: 'Rollover Validity',
        description: 'Days rollover tokens remain valid',
        category: 'billing',
        defaultValue: 0,
        unit: 'days',
        icon: 'CalendarClock'
    }
};

// Helper: Get all features by category
export function getFeaturesByCategory(category: string): FeatureDefinition[] {
    return Object.values(FEATURES_REGISTRY).filter(f => f.category === category);
}

// Helper: Get all categories
export function getAllCategories(): string[] {
    const categories = new Set(Object.values(FEATURES_REGISTRY).map(f => f.category));
    return Array.from(categories);
}

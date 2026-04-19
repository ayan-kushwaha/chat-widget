
// ----------------------------------------------------------------------
// 🌍 SHARED FEATURE CONFIGURATION
// Central Source of Truth for Limits & Feature IDs
// ----------------------------------------------------------------------

export const STANDARD_LIMITS = [
    { id: 'max_websites', type: 'numeric', label: 'Live Websites', description: 'Max simultaneous domains you can add', unit: 'sites', icon: 'Globe' },
    { id: 'max_website_pages', type: 'numeric', label: 'Pages Per Website', description: 'Max pages scan of all sites', unit: 'pages', icon: 'Files' },
    { id: 'max_files', type: 'numeric', label: 'File Uploads', description: 'Monthly AI knowledge documents', unit: 'files', icon: 'FileText' },
    { id: 'max_manual_qa', type: 'numeric', label: 'Manual Q&A', description: 'Custom Training Pairs', unit: 'pairs', icon: 'MessageSquare' },
    { id: 'max_forms', type: 'numeric', label: 'Smart Forms', description: 'Lead Gen Forms', unit: 'forms', icon: 'FormInput' },
    { id: 'max_team_seats', type: 'numeric', label: 'Team Seats', description: 'Collaborative workspace access', unit: 'users', icon: 'Users' },
    { id: 'brain_capacity_mb', type: 'numeric', label: 'Neural Context', description: 'Combined AI Knowledge Capacity', unit: 'MB', icon: 'Database' },
    { id: 'data_retention_days', type: 'numeric', label: 'Data Retention', description: 'Auto-deletion policy', unit: 'days', icon: 'Archive' },
    { id: 'rollover_percentage', type: 'numeric', label: 'Rollover', description: 'Unused tokens carried forward', unit: '%', icon: 'RefreshCw' },
    { id: 'rollover_validity_days', type: 'numeric', label: 'Rollover Validity', description: 'Rollover expiry duration', unit: 'days', icon: 'CalendarClock' },
    { id: 'remove_branding', type: 'boolean', label: 'Remove Branding', description: 'Hide "Powered by Cluaiz" badge', icon: 'Sparkles' }
];

// Map Rich DB IDs to Standard Permission Keys
export const ID_MAPPING: Record<string, string> = {
    '_cluaiz_ai_brain': 'brain_capacity_mb',
    'smart_forms': 'max_forms',
    '_ai_memory_studio': 'auto_learning_frequency',
    '_cluaiz_chatbot_ai': 'max_manual_qa',
    'analytics_suite': 'data_retention_days'
};

// Filter Lists
export const KNOWN_LIMIT_IDS = ['max_websites', 'max_files', 'max_team_seats', 'brain_capacity_mb', 'data_retention_days', 'rollover_percentage', 'rollover_validity_days', 'remove_branding'];

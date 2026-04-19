
import { MessageSquare, Mail, Database, Globe, Smartphone, User, FileText, Zap, Share2, Layers, Sheet, Calculator } from 'lucide-react';

// --- DEFINITIONS ---

export type AppCategory = 'communication' | 'productivity' | 'crm' | 'ai' | 'utilities' | 'social';

export interface IntegrationField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'boolean' | 'json' | 'date';
    options?: { label: string; value: string }[];
    required?: boolean;
    placeholder?: string;
    description?: string;
    defaultValue?: any;
}

export interface IntegrationAction {
    id: string;
    name: string;
    description: string;
    fields: IntegrationField[];
    outputVariables?: { key: string; label: string }[]; // What this action returns
}

export interface IntegrationTrigger {
    id: string;
    name: string;
    description: string;
    fields?: IntegrationField[]; // Configuration needed for the trigger (e.g., "Watch specific folder")
    outputVariables?: { key: string; label: string }[]; // Data available when trigger fires
}

export interface IntegrationApp {
    id: string;
    name: string;
    description: string;
    icon: any; // Lucide Icon component
    color: string;
    category: AppCategory;
    isBeta?: boolean;
    triggers: IntegrationTrigger[];
    actions: IntegrationAction[];
}

// --- REGISTRY ---

export const INTEGRATION_REGISTRY: Record<string, IntegrationApp> = {
    // 1. WHATSAPP
    'whatsapp': {
        id: 'whatsapp',
        name: 'WhatsApp',
        description: 'Automate messages via official Cloud API.',
        icon: MessageSquare,
        color: '#25D366',
        category: 'communication',
        triggers: [
            {
                id: 'wa_message_received',
                name: 'Message Received',
                description: 'Triggers on incoming message.',
                outputVariables: [
                    { key: 'sender_phone', label: 'Sender Phone' },
                    { key: 'message_text', label: 'Message Text' },
                    { key: 'sender_name', label: 'Sender Name' }
                ]
            }
        ],
        actions: [
            {
                id: 'wa_send_template',
                name: 'Send Template',
                description: 'Send approved template message.',
                fields: [
                    { key: 'phone_number', label: 'Phone Number', type: 'text', required: true, placeholder: 'e.g. {{sender_phone}}' },
                    { key: 'template_name', label: 'Template Name', type: 'text', required: true },
                    { key: 'language', label: 'Language Code', type: 'text', defaultValue: 'en_US' },
                    { key: 'variables', label: 'Body Variables (JSON)', type: 'json', placeholder: '["Name", "1234"]' }
                ]
            },
            {
                id: 'wa_send_text',
                name: 'Send Text Reply',
                description: 'Send free text (24h window).',
                fields: [
                    { key: 'phone_number', label: 'Phone Number', type: 'text', required: true },
                    { key: 'message', label: 'Message Body', type: 'text', required: true }
                ]
            }
        ]
    },

    // 2. EMAIL
    'email': {
        id: 'email',
        name: 'Email Service',
        description: 'SMTP or API based email sending.',
        icon: Mail,
        color: '#EA4335',
        category: 'communication',
        triggers: [
            {
                id: 'email_received',
                name: 'Email Received',
                description: 'Triggers on new email (via Webhook).',
                outputVariables: [
                    { key: 'subject', label: 'Subject' },
                    { key: 'from_email', label: 'From Address' },
                    { key: 'body_text', label: 'Body Text' }
                ]
            }
        ],
        actions: [
            {
                id: 'send_email',
                name: 'Send Email',
                description: 'Send an outbound email.',
                fields: [
                    { key: 'to', label: 'Recipient', type: 'text', required: true },
                    { key: 'subject', label: 'Subject', type: 'text', required: true },
                    { key: 'body', label: 'HTML Body', type: 'text', required: true }
                ]
            }
        ]
    },

    // 3. GOOGLE SHEETS (Productivity Example)
    'google_sheets': {
        id: 'google_sheets',
        name: 'Google Sheets',
        description: 'Read and write to spreadsheets.',
        icon: Sheet,
        color: '#34A853',
        category: 'productivity',
        triggers: [
            {
                id: 'sheet_row_added',
                name: 'New Row Added',
                description: 'Triggers when a new row is added.',
                fields: [
                    { key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'text', required: true },
                    { key: 'worksheet_id', label: 'Worksheet / Tab', type: 'text', required: true }
                ],
                outputVariables: [
                    { key: 'row_number', label: 'Row Index' },
                    { key: 'row_data', label: 'Row Data (JSON)' }
                ]
            }
        ],
        actions: [
            {
                id: 'add_row',
                name: 'Add Row',
                description: 'Append data to a sheet.',
                fields: [
                    { key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'text', required: true },
                    { key: 'worksheet_id', label: 'Worksheet', type: 'text', required: true },
                    { key: 'values', label: 'Row Values (JSON Array)', type: 'json', required: true, placeholder: '["Value1", "Value2"]' }
                ]
            }
        ]
    },

    // 4. CLUAIZ MEMORY (Internal Tools)
    'cluaiz_core': {
        id: 'cluaiz_core',
        name: 'Cluaiz Core',
        description: 'Internal system actions.',
        icon: Zap,
        color: '#8b5cf6',
        category: 'utilities',
        triggers: [],
        actions: [
            {
                id: 'update_memory',
                name: 'Update User Memory',
                description: 'Save data to user profile.',
                fields: [
                    { key: 'user_id', label: 'User ID', type: 'text', required: true },
                    { key: 'key', label: 'Memory Key', type: 'text', required: true },
                    { key: 'value', label: 'Memory Value', type: 'text', required: true }
                ]
            }
        ]
    },

    // 5. WEBHOOK (Universal)
    'webhook': {
        id: 'webhook',
        name: 'Webhook / API',
        description: 'Connect with any external service.',
        icon: Globe,
        color: '#0ea5e9',
        category: 'utilities',
        triggers: [
            {
                id: 'webhook_received',
                name: 'Webhook Event',
                description: 'Trigger flow via POST request.',
                outputVariables: [{ key: 'body', label: 'Body (JSON)' }]
            }
        ],
        actions: [
            {
                id: 'http_request',
                name: 'HTTP Request',
                description: 'Call an external API.',
                fields: [
                    { key: 'url', label: 'URL', type: 'text', required: true },
                    {
                        key: 'method',
                        label: 'Method',
                        type: 'select',
                        options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }, { label: 'PUT', value: 'PUT' }]
                    },
                    { key: 'body', label: 'Body (JSON)', type: 'json' }
                ]
            }
        ]
    },

    // 6. SOCIAL DM (Instagram/Messenger)
    'social_dm': {
        id: 'social_dm',
        name: 'Social DM Automation',
        description: 'Automate Instagram & Messenger DMs.',
        icon: Share2,
        color: '#E1306C',
        category: 'social',
        triggers: [
            {
                id: 'ig_keyword',
                name: 'Instagram Keyword',
                description: 'Triggers when user DMs a keyword.',
                fields: [
                    { key: 'keyword', label: 'Keyword to Match', type: 'text', required: true }
                ]
            }
        ],
        actions: [
            {
                id: 'send_dm',
                name: 'Send DM Reply',
                description: 'Reply to the user via DM.',
                fields: [
                    { key: 'message', label: 'Message', type: 'text', required: true }
                ]
            }
        ]
    }
};

export const getAvailableApps = () => Object.values(INTEGRATION_REGISTRY);

export const getAppsByCategory = (category: AppCategory | 'all') => {
    const apps = getAvailableApps();
    if (category === 'all') return apps;
    return apps.filter(app => app.category === category);
};

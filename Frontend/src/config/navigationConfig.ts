
import {
    LayoutDashboard,
    BarChart3,
    PieChart,
    Activity,
    BrainCircuit,
    Bot,
    Database,
    LineChart,
    MessagesSquare,
    Inbox,
    Users,
    Workflow,
    History,
    Settings,
    CreditCard,
    Shield,
    Globe,
    FileText,
    Store,
    Plus,
    LayoutGrid,
    Code,
    Palette,
    Share2,
    MessageSquare,
    ListFilter,
    Network
} from "lucide-react";

export type NavigationModule = 'COMMAND' | 'AI_STUDIO' | 'BOT_STUDIO' | 'COMMUNICATION' | 'ORGANIZATION' | 'MARKETPLACE' | 'WORKFORCE';

export interface SubMenuItem {
    label: string;
    href: string;
    icon?: any;
    badge?: string;
    permission?: string;
}

export interface NavigationConfigItem {
    id: NavigationModule;
    label: string;
    icon: any;
    path: string; // Default path when clicking the rail item
    items: {
        label: string;
        items: SubMenuItem[];
    }[];
}

export const navigationConfig: NavigationConfigItem[] = [
    {
        id: 'COMMAND',
        label: 'Command Center',
        icon: LayoutDashboard,
        path: '/dashboard',
        items: [
            {
                label: 'Overview',
                items: [
                    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                    { label: 'Activity Logs', href: '/dashboard/activity', icon: Activity },
                ]
            },
            {
                label: 'Intelligence',
                items: [
                    { label: 'Chat Insights', href: '/dashboard/insights/reports', icon: PieChart, badge: 'New' },
                    { label: 'Performance', href: '/dashboard/insights/performance', icon: LineChart },
                ]
            }
        ]
    },
    {
        id: 'AI_STUDIO',
        label: 'AI Agent Studio',
        icon: BrainCircuit,
        path: '/dashboard/ai-studio/brain',
        items: [
            {
                label: 'Knowledge',
                items: [
                    { label: 'Dashboard', href: '/dashboard/ai-studio/dashboard', icon: LayoutDashboard },
                    { label: 'Brain (Knowledge Base)', href: '/dashboard/ai-studio/brain', icon: BrainCircuit },
                    { label: 'Memory (Long-term)', href: '/dashboard/ai-studio/memory', icon: Database },
                    { label: 'Neural Map', href: '/dashboard/ai-studio/neural-map', icon: Network, badge: 'Alpha' }
                ]
            },
            {
                label: 'Personality',
                items: [
                    { label: 'Behavior & Tone', href: '/dashboard/ai-studio/behavior', icon: Bot },
                    { label: 'Instructions', href: '/dashboard/ai-studio/instructions', icon: FileText },
                ]
            },

        ]
    },
    {
        id: 'BOT_STUDIO',
        label: 'Chatbot Studio',
        icon: Bot,
        path: '/dashboard/ai-studio/bots?tab=install',
        items: [
            {
                label: 'Configuration',
                items: [
                    { label: 'Install', href: '/dashboard/ai-studio/bots?tab=install', icon: Code },
                    { label: 'Design', href: '/dashboard/ai-studio/bots?tab=design', icon: Palette },
                    { label: 'Pages', href: '/dashboard/ai-studio/bots?tab=chatwindow', icon: MessageSquare },
                    { label: 'Share', href: '/dashboard/ai-studio/bots?tab=share', icon: Share2 },
                ]
            },
            {
                label: 'Monitoring',
                items: [
                    { label: 'Analytics', href: '/dashboard/ai-studio/bots?tab=analytics', icon: BarChart3 },
                    { label: 'Advanced', href: '/dashboard/ai-studio/bots?tab=advanced', icon: Settings },
                ]
            }
        ]
    },
    {
        id: 'COMMUNICATION',
        label: 'Communication',
        icon: MessagesSquare,
        path: '/dashboard/communication/logs',
        items: [
            {
                label: 'Channels',
                items: [
                    { label: 'Unified Inbox', href: '/dashboard/communication/inbox', icon: Inbox },
                    { label: 'Live Chat Logs', href: '/dashboard/communication/logs', icon: History },
                ]
            },
            {
                label: 'Workflow',
                items: [
                    { label: 'Contacts (CRM)', href: '/dashboard/communication/contacts', icon: Users },
                    { label: 'Automation Flows', href: '/dashboard/communication/flows', icon: Workflow },
                ]
            }
        ]
    },
    {
        id: 'MARKETPLACE',
        label: 'App Store',
        icon: Store,
        path: '/dashboard/marketplace',
        items: [
            {
                label: 'Explore',
                items: [
                    { label: 'All Apps', href: '/dashboard/marketplace', icon: Store },
                    { label: 'Installed', href: '/dashboard/marketplace/installed', icon: Bot },
                ]
            }
        ]
    },
    {
        id: 'ORGANIZATION',
        label: 'Organization',
        icon: Settings,
        path: '/dashboard/settings/org',
        items: [
            {
                label: 'Settings',
                items: [
                    { label: 'General Settings', href: '/dashboard/settings/org', icon: Settings },
                    { label: 'Team & Roles', href: '/dashboard/settings/team', icon: Users },
                    { label: 'Security', href: '/dashboard/settings/security', icon: Shield },
                ]
            },
            {
                label: 'Billing',
                items: [
                    { label: 'Subscription', href: '/dashboard/settings/billing', icon: CreditCard },
                    { label: 'Usage & Limits', href: '/dashboard/settings/usage', icon: Activity },
                ]
            }
        ]
    },
    {
        id: 'WORKFORCE',
        label: 'Workforce',
        icon: Users,
        path: '/dashboard/workforce',
        items: [
            {
                label: 'Strategic workforce',
                items: [
                    { label: 'Intelligence', href: '/dashboard/workforce', icon: LayoutDashboard },
                    { label: 'Fleet Ops', href: '/dashboard/workforce/fleet', icon: ListFilter },
                    { label: 'Marketplace', href: '/dashboard/workforce/hire', icon: Store },
                ]
            },
            {
                label: 'Deployment',
                items: [
                    { label: 'Active Teams', href: '/dashboard/workforce/teams', icon: Users },
                    { label: 'Performance', href: '/dashboard/workforce/performance', icon: Activity },
                ]
            }
        ]
    }
];

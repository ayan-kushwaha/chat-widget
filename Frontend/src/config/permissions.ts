export const ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
    VIEWER: 'viewer'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const PERMISSIONS = {
    // ============================================
    // 1. DASHBOARD
    // ============================================
    VIEW_DASHBOARD: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.VIEWER],
    VIEW_REVENUE: [ROLES.OWNER, ROLES.ADMIN], // Only Admin sees revenue
    VIEW_ALL_STATS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.VIEWER],
    VIEW_OWN_STATS: [ROLES.EMPLOYEE], // Employee sees only their stats

    // ============================================
    // 2. INBOX (CHATS)
    // ============================================
    VIEW_INBOX: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE], // Viewer CANNOT see inbox
    VIEW_ALL_CHATS: [ROLES.OWNER, ROLES.ADMIN], // Admin sees all chats
    VIEW_TEAM_CHATS: [ROLES.MANAGER], // Manager sees team chats
    VIEW_ASSIGNED_CHATS: [ROLES.EMPLOYEE], // Employee sees only assigned chats
    REPLY_CHAT: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],

    // ============================================
    // 3. LEADS (CRM)
    // ============================================
    VIEW_LEADS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE], // Viewer removed
    EDIT_LEADS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    DELETE_LEADS: [ROLES.OWNER, ROLES.ADMIN], // Manager cannot delete
    EXPORT_LEADS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    EDIT_LEAD_STATUS: [ROLES.EMPLOYEE], // Employee can only change status

    // ============================================
    // 4. BOT STUDIO (AI Training)
    // ============================================
    VIEW_BOT_STUDIO: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER], // Viewer removed
    CREATE_BOT: [ROLES.OWNER, ROLES.ADMIN], // Only Admin can create
    DELETE_BOT: [ROLES.OWNER, ROLES.ADMIN], // Only Admin can delete
    TRAIN_BOT: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER], // Manager can train
    UPDATE_BOT: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],

    // ============================================
    // 5. AUTOMATION FLOWS
    // ============================================
    VIEW_FLOWS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER], // Viewer removed
    CREATE_FLOW: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    EDIT_FLOW: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    DELETE_FLOW: [ROLES.OWNER, ROLES.ADMIN], // Admin can delete directly
    DELETE_FLOW_WITH_APPROVAL: [ROLES.MANAGER], // Manager needs approval

    // ============================================
    // 6. TEAM MANAGEMENT
    // ============================================
    VIEW_TEAM: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.VIEWER],
    INVITE_MEMBER: [ROLES.OWNER, ROLES.ADMIN],
    REMOVE_MEMBER: [ROLES.OWNER, ROLES.ADMIN],
    CHANGE_ROLES: [ROLES.OWNER, ROLES.ADMIN],

    // ============================================
    // 7. BILLING & PLANS
    // ============================================
    MANAGE_BILLING: [ROLES.OWNER, ROLES.ADMIN],
    VIEW_BILLING: [ROLES.OWNER, ROLES.ADMIN],

    // ============================================
    // 8. API KEYS
    // ============================================
    VIEW_API_KEYS: [ROLES.OWNER, ROLES.ADMIN],
    REGENERATE_API_KEYS: [ROLES.OWNER, ROLES.ADMIN],

    // ============================================
    // 9. SETTINGS
    // ============================================
    VIEW_SETTINGS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER], // Viewer removed
    MANAGE_SETTINGS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    DELETE_ORG: [ROLES.OWNER, ROLES.ADMIN],

    // ============================================
    // 10. INSIGHTS & ANALYTICS
    // ============================================
    VIEW_INSIGHTS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.VIEWER],
    VIEW_REPORTS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.VIEWER],

    // ============================================
    // 11. GROWTH & TOOLS
    // ============================================
    VIEW_GROWTH_TOOLS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER], // Viewer removed
    USE_GROWTH_TOOLS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],

    // ============================================
    // 12. AI STUDIO (General)
    // ============================================
    VIEW_AI_STUDIO: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER], // Viewer removed

    // ============================================
    // 13. AGENTS
    // ============================================
    VIEW_AGENTS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER], // Viewer removed
    MANAGE_AGENTS: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLE_HIERARCHY = {
    [ROLES.OWNER]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.MANAGER]: 3,
    [ROLES.EMPLOYEE]: 2,
    [ROLES.VIEWER]: 1
} as const;

// Helper to check if a role is read-only
export const isReadOnlyRole = (role: Role): boolean => {
    return role === ROLES.VIEWER;
};

// Helper to check if a role can manage team
export const canManageTeam = (role: Role): boolean => {
    return role === ROLES.OWNER || role === ROLES.ADMIN;
};

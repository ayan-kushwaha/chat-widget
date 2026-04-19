import { useSession } from "next-auth/react";
import { ROLES, PERMISSIONS, ROLE_HIERARCHY, Role, Permission } from "@/config/permissions";
import { calculatePermissions } from "@/utils/permissionCalculator";
import { useOrg } from "@/context/OrgContext";
import { useSystemConfig } from './useSystemConfig';

interface User {
    id: string;
    role: Role;
    plan?: string; // Assuming plan is part of user session or fetched
}

export const useRBAC = () => {
    const { data: session } = useSession();
    const { userRoleInActiveOrg } = useOrg();
    const { config } = useSystemConfig();
    const planTiers = config?.planTiers || [];

    // Use the role from the active organization context.
    // CRITICAL: Do NOT fallback to session.role, as it may be stale (e.g., Owner role from a different org).
    // If the org context is not ready, default to VIEWER for safety.
    const userRole = (userRoleInActiveOrg || ROLES.VIEWER).toLowerCase() as Role;
    const userId = (session?.user as any)?.id;

    // TODO: Get actual plan from session or API. Defaulting to 'PRO' for now as requested.
    const currentPlan = (session?.user as any)?.plan || 'PRO';

    const can = (permission: Permission): boolean => {
        const allowedRoles = PERMISSIONS[permission] as readonly Role[];
        return allowedRoles.includes(userRole);
    };

    const canActOnMember = (
        targetMemberId: string,
        targetMemberRole: string,
        action: 'remove' | 'changeRole'
    ): boolean => {
        if (!userId) return false;
        if (targetMemberId === userId) {
            return false; // cannot act on self
        }

        const targetRole = targetMemberRole.toLowerCase() as Role;
        const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
        const userLevel = ROLE_HIERARCHY[userRole] || 0;

        // User must be strictly higher in hierarchy
        if (userLevel <= targetLevel) {
            return false;
        }

        return true;
    };

    const canAssignRole = (roleToAssign: string): boolean => {
        const role = roleToAssign.toLowerCase() as Role;

        // Only owner can assign owner role
        if (role === ROLES.OWNER) {
            return userRole === ROLES.OWNER;
        }

        // Owner can assign any non-owner role
        if (userRole === ROLES.OWNER) {
            return true;
        }

        // Admin can assign any role except owner
        // Note: We already checked if role === OWNER above, so if we are here, role is NOT OWNER.
        if (userRole === ROLES.ADMIN) {
            return true;
        }

        return false;
    };



    const checkPlanLimits = (currentTeamSize: number, roleToAssign?: string): { allowed: boolean; reason?: string } => {
        // Use default token amount for now (500k) since we don't have token balance in session context yet.
        // In a real scenario, fetch this from the User context or API.
        const permissions = calculatePermissions(500000, planTiers);
        const maxSeats = permissions.permissions['max_team_seats'] || 1;

        // Check team size limit
        if (currentTeamSize >= maxSeats) {
            return {
                allowed: false,
                reason: `Plan limit reached. Your ${permissions.planName} plan allows only ${maxSeats} members. Upgrade to add more.`
            };
        }

        // Roles are generally available all plans in the new model, unless specifically restricted.
        // For now, we assume all roles are allowed if the seat limit is not breached.
        return { allowed: true };
    };

    return {
        can,
        canActOnMember,
        canAssignRole,
        checkPlanLimits,
        userRole,
        userId,
        currentPlan
    };
};

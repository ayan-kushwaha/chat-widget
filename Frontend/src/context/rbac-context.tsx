"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Role = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

interface RBACContextType {
    role: Role;
    setRole: (role: Role) => void; // For dev/testing purposes
    can: (permission: string) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

// Define permissions for each role
const PERMISSIONS: Record<Role, string[]> = {
    OWNER: ["*"], // Access to everything
    ADMIN: [
        "view:dashboard",
        "view:ai-studio",
        "view:communication",
        "view:agents",
        "view:growth",
        "view:insights",
        "view:settings",
        "manage:users",
        "manage:content",
    ],
    EDITOR: [
        "view:dashboard",
        "view:ai-studio",
        "view:communication",
        "view:agents",
        "view:growth",
        "manage:content",
    ],
    VIEWER: [
        "view:dashboard",
        "view:insights",
    ],
};

export function RBACProvider({ children }: { children: React.ReactNode }) {
    // Default to OWNER for now, but this would come from your auth system
    const [role, setRole] = useState<Role>("OWNER");

    const can = (permission: string) => {
        const userPermissions = PERMISSIONS[role];
        if (userPermissions.includes("*")) return true;
        return userPermissions.includes(permission);
    };

    return (
        <RBACContext.Provider value={{ role, setRole, can }}>
            {children}
        </RBACContext.Provider>
    );
}

export function useRBAC() {
    const context = useContext(RBACContext);
    if (context === undefined) {
        throw new Error("useRBAC must be used within a RBACProvider");
    }
    return context;
}

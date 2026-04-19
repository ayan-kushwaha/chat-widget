"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/hooks/useRBAC";
import { Permission } from "@/config/permissions";

interface PermissionGuardProps {
    children: React.ReactNode;
    permission: Permission;
    fallbackPath?: string;
    showAccessDenied?: boolean;
}

export function PermissionGuard({
    children,
    permission,
    fallbackPath = "/dashboard",
    showAccessDenied = false,
}: PermissionGuardProps) {
    const router = useRouter();
    const { can } = useRBAC();

    useEffect(() => {
        if (!can(permission)) {
            if (!showAccessDenied) {
                router.replace(fallbackPath);
            }
        }
    }, [can, permission, fallbackPath, showAccessDenied, router]);

    // If user doesn't have permission
    if (!can(permission)) {
        if (showAccessDenied) {
            return (
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                            Access Denied
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                            You don't have permission to access this page.
                        </p>
                        <button
                            onClick={() => router.push(fallbackPath)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            );
        }
        // Return null while redirecting
        return null;
    }

    return <>{children}</>;
}

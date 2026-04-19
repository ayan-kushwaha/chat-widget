"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import axiosInstance from '@/api/axiosInstance';

interface Organization {
    id: string; // Virtual ID
    _id?: string; // MongoDB ID
    name: string;
    plan: string;
    role: string;
    isActive: boolean;
    userName?: string;
    userEmail?: string;
    userImage?: string;
    industry?: string;
    installed_templates?: string[];
    available_ribbons?: string[]; // 🎀 Persistent Ribbon Pool
    billing_info?: {
        company_name?: string;
        address_line1?: string;
        address_line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
        phone?: string;
        tax_id?: string;
    };
    access_control?: {
        mode: 'guest' | 'strict'; // 'strict' = Gatekeeper (Login/Form), 'guest' = Direct
    };
}

interface OrgContextType {
    activeOrgId: string | null;
    activeOrgName: string | null;
    activeOrg: Organization | null; // Complete active org object
    userRoleInActiveOrg: string | null;
    userProfileInActiveOrg: { name?: string; email?: string; image?: string } | null;
    organizations: Organization[];
    isLoading: boolean;
    switchOrg: (orgId: string) => void;
    refreshOrgs: (isBackground?: boolean) => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider = ({ children }: { children: ReactNode }) => {
    const { data: session, status } = useSession();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load active org from local storage on mount
    useEffect(() => {
        const storedOrgId = localStorage.getItem('activeOrgId');
        if (storedOrgId) {
            setActiveOrgId(storedOrgId);
        }
    }, []);

    const fetchOrganizations = async (isBackground = false) => {
        if (status !== 'authenticated') return;

        try {
            if (!isBackground) setIsLoading(true);
            const response = await axiosInstance.get('/organizations');
            if (response.data.success) {
                setOrganizations(response.data.organizations);

                // If no active org is set (or invalid), set default
                if (!activeOrgId || !response.data.organizations.find((o: Organization) => o.id === activeOrgId)) {
                    // Prefer the one where user is owner, or just the first one
                    const defaultOrg = response.data.organizations[0];
                    if (defaultOrg) {
                        setActiveOrgId(defaultOrg.id);
                        localStorage.setItem('activeOrgId', defaultOrg.id);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch organizations", error);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchOrganizations();
        }
    }, [status]);

    const switchOrg = (orgId: string) => {
        const org = organizations.find(o => o.id === orgId);
        if (org) {
            setActiveOrgId(org.id);
            localStorage.setItem('activeOrgId', org.id);
            // Force reload to ensure all components and API calls use the new org ID
            // Using location.href assignment forces a reload from server/cache
            window.location.href = window.location.href;
        }
    };

    const activeOrg = organizations.find(o => o.id === activeOrgId);

    return (
        <OrgContext.Provider value={{
            activeOrgId,
            activeOrgName: activeOrg?.name || null,
            activeOrg: activeOrg || null,
            userRoleInActiveOrg: activeOrg?.role || null,
            userProfileInActiveOrg: activeOrg ? { name: activeOrg.userName, email: activeOrg.userEmail, image: activeOrg.userImage } : null,
            organizations,
            isLoading,
            switchOrg,
            refreshOrgs: fetchOrganizations
        }}>
            {children}
        </OrgContext.Provider>
    );
};

export const useOrg = () => {
    const context = useContext(OrgContext);
    if (context === undefined) {
        throw new Error('useOrg must be used within an OrgProvider');
    }
    return context;
};

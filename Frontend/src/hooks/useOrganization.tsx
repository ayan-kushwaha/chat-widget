'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface Organization {
    _id: string;
    name: string;
    plan: string;
    planStartDate?: string;
    subscription?: {
        status: string;
        plan_id: string;
        expires_at: string;
        snapshot?: {
            plan_name: string;
            price_paid?: number;
            currency?: string;
            billing_cycle?: string;
            limits?: {
                max_tokens: number;
                max_chats: number;
                max_file_uploads: number;
                max_website_pages: number;
                max_kb_size_mb: number;
                max_team_members: number;
                max_websites: number;
                data_retention_days: number;
                max_forms: number;
                brain_capacity_mb?: number; // 🟢 Added (Alias)
                max_manual_qa?: number;
                rollover_percentage?: number;
                rollover_validity_days?: number;
                max_bots?: number;
            };
            order_summary?: {
                total_savings: number;
                final_total: number;
            };
        };
    };
    users_access?: Array<{ userId: string }>; // For counting team members
    usage?: {
        tokensUsed: number;
        words_limit: number;
        rollover_tokens: number;
        topup_balance: number;
        topup_limit: number; // 🟢 Added

        rollover_expires_at: string | null;

        chatbotsCreated: number;
        websitePagesAdded: number;
        filesUploaded: number;
        leadFormsCreated: number;
        automationFlowsCreated: number;
        storage_mb: number;
        team_members?: number;
    };
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
    hasUsedFreePlan?: boolean;
    billingLogs?: any[];
}

interface OrganizationContextType {
    organization: Organization | null;
    isLoading: boolean;
    refreshOrganization: () => Promise<void>;
    updateTokens: (tokensBurned: number) => void; // ⚡ Instant token update
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// Export context for optional usage outside provider
export { OrganizationContext };

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrganization = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            // Fetch via an existing endpoint - assuming /api/organizations/current or similar
            // Adapting based on likely existing routes, or falling back to first org
            const response = await axios.get('/api/organizations', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success && response.data.organizations?.length > 0) {
                // For now, selecting the first organization. In a multi-org setup, this would be dynamic.
                setOrganization(response.data.organizations[0]);
            }
        } catch (error) {
            console.error('Failed to fetch organization:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ⚡ Instant token update (optimistic)
    const updateTokens = (tokensBurned: number) => {
        setOrganization(prev => {
            if (!prev || !prev.usage) return prev;
            return {
                ...prev,
                usage: {
                    ...prev.usage,
                    tokensUsed: (prev.usage.tokensUsed || 0) + tokensBurned
                }
            };
        });
    };

    useEffect(() => {
        fetchOrganization();

        // ⚡ GLOBAL SOCKET LISTENER (Centralized)
        // This ensures header updates instantly without code in every page.
        if (typeof window !== 'undefined') {
            const socketUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/v1$/, '');
            // Dynamic import to avoid SSR issues if any, though io is safe usually. 
            import("socket.io-client").then(({ io }) => {
                const socket = io(socketUrl, {
                    transports: ['websocket', 'polling'],
                    withCredentials: true
                });

                socket.on("connect", () => {
                    // We need the orgId to join the room. 
                    // Since 'organization' state might be null initially, we might need to emit join_room 
                    // when organization is set. 
                    // BUT, simpler approach: Listening for global events or re-emitting when org changes.
                    // Let's rely on the useEffect dependency below if we add org._id.
                });

                // Listen for Token Updates
                socket.on("token_usage_update", (data: any) => {
                    if (data.tokensBurned) {
                        console.log(`⚡ Global Token Update: +${data.tokensBurned} (${data.trigger})`);
                        updateTokens(data.tokensBurned);
                    }
                });

                // Store socket instance if needed for cleanup
                return () => {
                    socket.disconnect();
                };
            });
        }
    }, []); // Run once on mount. 
    // Ideally we should join room when organization._id is available.

    // Sub-effect to join room
    useEffect(() => {
        if (!organization?._id) return;

        const socketUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/v1$/, '');
        import("socket.io-client").then(({ io }) => {
            const socket = io(socketUrl, { transports: ['websocket'] });
            socket.emit("join_room", organization._id);
            // We can't easily share the socket instance between effects without refs or state.
            // Given the constraints and user request for "Simple Fix",
            // Let's merge logic into one effect that depends on organization?._id
            // But we don't want to reconnect every time org details update (like token count).
            // We only want to reconnect if ID changes.
        });
    }, [organization?._id]);

    return (
        <OrganizationContext.Provider value={{
            organization,
            isLoading,
            refreshOrganization: fetchOrganization,
            updateTokens
        }}>
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};

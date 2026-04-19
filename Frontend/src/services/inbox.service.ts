import axiosInstance from '@/api/axiosInstance';

const API_URL = '/v1'; // axiosInstance already has the base URL

export const InboxService = {
    // 1. Get All Active Chats for Org
    getActiveChats: async (orgId: string, searchQuery?: string, startDate?: string, endDate?: string, status?: string) => {
        try {
            const response = await axiosInstance.get(`/chats`, {
                params: {
                    organizationId: orgId,
                    status: status,
                    searchQuery: searchQuery,
                    startDate,
                    endDate
                },
                withCredentials: true
            });
            // Controller returns { success: true, chats: [] }
            return response.data.chats || [];
        } catch (error) {
            console.error("InboxService Error:", error);
            return [];
        }
    },

    // 2. Human Agent Joins a Chat
    joinChat: async (orgId: string, chatId: string, agentId: string) => {
        // This is mainly done via Socket 'agent_join', but we can have a fallback API
        return true;
    },

    // 3. Mark as Resolved
    resolveChat: async (orgId: string, chatId: string) => {
        try {
            await axiosInstance.put(`/chats/${chatId}`, {
                organizationId: orgId,
                status: 'resolved'
            }, {
                withCredentials: true
            });
            return true;
        } catch (error) {
            return false;
        }
    },

    // 3b. Archive Chat
    archiveChat: async (orgId: string, chatId: string) => {
        try {
            await axiosInstance.put(`/chats/${chatId}`, {
                organizationId: orgId,
                status: 'archived'
            }, {
                withCredentials: true
            });
            return true;
        } catch (error) {
            return false;
        }
    },

    // 3c. Unarchive Chat
    unarchiveChat: async (orgId: string, chatId: string) => {
        try {
            await axiosInstance.put(`/chats/${chatId}`, {
                organizationId: orgId,
                status: 'active'
            }, {
                withCredentials: true
            });
            return true;
        } catch (error) {
            return false;
        }
    },

    // 4. Toggle Pin Chat
    togglePin: async (orgId: string, chatId: string) => {
        try {
            const response = await axiosInstance.patch(`/chats/${chatId}/pin`, {}, {
                params: { organizationId: orgId },
                withCredentials: true
            });
            // Return true if pinned state is returned (or success)
            return response.data.success;
        } catch (error) {
            console.error("InboxService Error [togglePin]:", error);
            return false;
        }
    },

    // 4b. Toggle Favourite Chat
    toggleFavourite: async (orgId: string, chatId: string) => {
        try {
            const response = await axiosInstance.patch(`/chats/${chatId}/favourite`, {}, {
                params: { organizationId: orgId },
                withCredentials: true
            });
            return response.data.success;
        } catch (error) {
            console.error("InboxService Error [toggleFavourite]:", error);
            return false;
        }
    },

    // 5. Mark as Unread
    markUnread: async (orgId: string, chatId: string) => {
        try {
            const response = await axiosInstance.patch(`/chats/${chatId}/unread`, {}, {
                params: { organizationId: orgId },
                withCredentials: true
            });
            return response.data.success;
        } catch (error) {
            console.error("InboxService Error [markUnread]:", error);
            return false;
        }
    },

    // 6. Get Weekly Statuses
    getStatuses: async (orgId: string) => {
        try {
            const response = await axiosInstance.get(`/status`, {
                params: { organizationId: orgId },
                withCredentials: true
            });
            return response.data.statuses || [];
        } catch (error) {
            console.error("InboxService Error [getStatuses]:", error);
            return [];
        }
    },

    // 7. Post Weekly Status
    postStatus: async (orgId: string, data: { type: 'text' | 'image' | 'video', content: string, caption?: string }) => {
        try {
            const response = await axiosInstance.post(`/status`, {
                organizationId: orgId,
                ...data
            });
            return response.data.success;
        } catch (error) {
            console.error("InboxService Error [postStatus]:", error);
            return false;
        }
    },
    // 8. Get Neural Logs (AI Memory)
    getNeuralLogs: async (orgId: string) => {
        try {
            const response = await axiosInstance.get(`/learning-memories`, {
                params: { organizationId: orgId },
                withCredentials: true
            });
            return response.data.memories || [];
        } catch (error) {
            console.error("InboxService Error [getNeuralLogs]:", error);
            return [];
        }
    },

    // 9. Get all unique activity dates for an organization
    getActiveDates: async (orgId: string, timezone?: string) => {
        try {
            const response = await axiosInstance.get(`/chats/active-dates`, {
                params: {
                    organizationId: orgId,
                    timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                withCredentials: true
            });
            return response.data.dates || [];
        } catch (error) {
            console.error("InboxService Error [getActiveDates]:", error);
            return [];
        }
    },
    // 10. Update any conversation metadata (labels, etc)
    updateChatMetadata: async (orgId: string, chatId: string, updates: any) => {
        try {
            const response = await axiosInstance.put(`/chats/${chatId}`, {
                organizationId: orgId,
                ...updates
            });
            return response.data.success;
        } catch (error) {
            console.error("InboxService Error [updateChatMetadata]:", error);
            return false;
        }
    },
    // 11. Custom Chat Actions (E.g. soft delete by business)
    deleteChat: async (orgId: string, chatId: string, requestedBy: 'user' | 'business' | 'admin' = 'business') => {
        try {
            const response = await axiosInstance.delete(`/chats/${chatId}`, {
                params: { organizationId: orgId },
                data: { requestedBy }, // Body for DELETE request
                withCredentials: true
            });
            return response.data.success;
        } catch (error) {
            console.error("InboxService Error [deleteChat]:", error);
            return false;
        }
    },
    // 12. Delete Tag Globally
    deleteTagGlobally: async (orgId: string, tagName: string) => {
        try {
            const response = await axiosInstance.delete(`/chats/tags/${encodeURIComponent(tagName)}`, {
                params: { organizationId: orgId },
                withCredentials: true
            });
            return response.data.success;
        } catch (error) {
            console.error("InboxService Error [deleteTagGlobally]:", error);
            return false;
        }
    },
    // 13. Update Global Ribbon Pool (Max 30)
    updateRibbonPool: async (orgId: string, ribbons: string[]) => {
        try {
            const response = await axiosInstance.patch(`/organizations/ribbons`, {
                ribbons
            }, {
                headers: { 'x-org-id': orgId }
            });
            return response.data.success;
        } catch (error) {
            console.error("InboxService Error [updateRibbonPool]:", error);
            return false;
        }
    }
};

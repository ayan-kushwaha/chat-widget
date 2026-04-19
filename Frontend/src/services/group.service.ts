import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export interface Group {
    _id: string;
    organizationId: string;
    name: string;
    description?: string;
    emoji: string;
    members: string[]; // Conversation IDs
    isSmart: boolean;
    aiIntent?: string;
    aiTags?: string[];
    isPrivate?: boolean;
    onlyAdminsCanPost?: boolean;
    requiresApproval?: boolean;
    hideMemberList?: boolean;
    ephemeralSignals?: boolean;
    ephemeralDuration?: string;
    createdAt: string;
    updatedAt: string;
    isArchived?: boolean;
}

export const GroupService = {
    /**
     * Create a new business group
     */
    async createGroup(orgId: string, data: any) {
        const response = await axios.post(`${API_URL}/groups`, {
            ...data,
            organizationId: orgId
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },

    /**
     * Get all groups for an organization
     */
    async getGroups(orgId: string) {
        const response = await axios.get(`${API_URL}/groups`, {
            params: { organizationId: orgId },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },

    /**
     * Update group metadata
     */
    async updateGroup(groupId: string, data: any) {
        const response = await axios.put(`${API_URL}/groups/${groupId}`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },

    /**
     * Archive or Unarchive a group
     */
    async archiveGroup(groupId: string, isArchived: boolean) {
        return this.updateGroup(groupId, { isArchived });
    },

    /**
     * Add or remove members from a group
     */
    async manageMembers(groupId: string, memberIds: string[], action: 'add' | 'remove') {
        const response = await axios.put(`${API_URL}/groups/${groupId}/members`, {
            memberIds,
            action
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },

    /**
     * Delete a group
     */
    async deleteGroup(groupId: string) {
        const response = await axios.delete(`${API_URL}/groups/${groupId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }
};

export default GroupService;

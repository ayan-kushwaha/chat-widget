import axiosInstance from './axiosInstance';

export interface User {
    _id: string;
    organizationId: string;
    userId: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar: string | null;
    ipAddress: string | null;
    location: {
        country: string | null;
        city: string | null;
        region: string | null;
        coordinates: {
            lat: number;
            lng: number;
        } | null;
    } | null;
    device: {
        type: string;
        os: string | null;
        browser: string | null;
    };
    timezone: string;
    language: string;
    stats: {
        totalChats: number;
        totalMessages: number;
        totalLeads: number;
        averageSentiment: string;
        sentimentBreakdown: {
            positive: number;
            negative: number;
            neutral: number;
        };
        riskScore: number;
        lastChannel: string;
        channels: string[];
    };
    recentChats: Array<{
        chatId: string;
        chatIdString: string;
        type: string;
        channel: string;
        topic: string;
        summary: string;
        sentiment: string;
        tags: string[];
        duration: string;
        messageCount: number;
        timestamp: string;
    }>;
    firstSeen: string;
    lastActive: string;
    createdAt: string;
    updatedAt: string;
}

export interface GetUsersParams {
    organizationId: string;
    search?: string;
    channel?: string;
    sentiment?: string;
    isLead?: boolean;
    page?: number;
    limit?: number;
}

export interface GetUsersResponse {
    success: boolean;
    users: User[];
    total: number;
    page: number;
    totalPages: number;
}

/**
 * Get all users with filters
 */
export const getUsers = async (params: GetUsersParams): Promise<GetUsersResponse> => {
    const response = await axiosInstance.get('/users', { params });
    return response.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string, organizationId: string): Promise<{ success: boolean; user: User; stats: User['stats'] }> => {
    const response = await axiosInstance.get(`/users/${userId}`, {
        params: { organizationId }
    });
    return response.data;
};

/**
 * Get all chats for a user
 */
export const getUserChats = async (userId: string, organizationId: string, page = 1, limit = 25) => {
    const response = await axiosInstance.get(`/users/${userId}/chats`, {
        params: { organizationId, page, limit }
    });
    return response.data;
};

/**
 * Update user info
 */
export const updateUser = async (userId: string, updates: Partial<User>) => {
    const response = await axiosInstance.put(`/users/${userId}`, updates);
    return response.data;
};

/**
 * Delete user (cascade)
 */
export const deleteUser = async (userId: string, organizationId: string) => {
    const response = await axiosInstance.delete(`/users/${userId}`, {
        params: { organizationId }
    });
    return response.data;
};

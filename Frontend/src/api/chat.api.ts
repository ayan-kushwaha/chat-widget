import axiosInstance from './axiosInstance';

export interface Chat {
    _id: string;
    organizationId: string;
    userId: string;
    type: 'chat' | 'lead';
    chatId: string;
    channel: string;
    channelMetadata: {
        source: string;
        externalId: string | null;
        threadId: string | null;
    };
    topic: string;
    summary: string;
    fullTranscript: string;
    tags: string[];
    sentiment: 'Positive' | 'Negative' | 'Neutral';
    sentimentScore: number;
    intent: string;
    events: Array<{
        type: 'friction' | 'insight' | 'gap' | 'lead';
        title: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        timestamp: string;
        resolved: boolean;
        metadata: any;
    }>;
    messageCount: number;
    duration: string;
    durationSeconds: number;
    status: 'active' | 'resolved' | 'spam' | 'archived';
    isSpam: boolean;
    spamReason: string | null;
    leadInfo: {
        score: number;
        status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
        priority: 'low' | 'medium' | 'high';
        assignedTo: string | null;
        company: string | null;
        dealValue: number | null;
        convertedFromChatId: string | null;
        lastContactedAt: string | null;
        notes: string | null;
    } | null;
    startedAt: string;
    endedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface GetChatsParams {
    organizationId: string;
    userId?: string;
    type?: 'chat' | 'lead';
    channel?: string;
    sentiment?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export interface GetChatsResponse {
    success: boolean;
    chats: Chat[];
    total: number;
    page: number;
    totalPages: number;
    stats: {
        positive?: number;
        negative?: number;
        neutral?: number;
    };
}

/**
 * Get all chats with filters
 */
export const getChats = async (params: GetChatsParams): Promise<GetChatsResponse> => {
    const response = await axiosInstance.get('/chats', { params });
    return response.data;
};

/**
 * Get chat by ID
 */
export const getChatById = async (chatId: string, organizationId: string): Promise<{ success: boolean; chat: Chat }> => {
    const response = await axiosInstance.get(`/chats/${chatId}`, {
        params: { organizationId }
    });
    return response.data;
};

/**
 * Create new chat
 */
export const createChat = async (chatData: Partial<Chat>): Promise<{ success: boolean; chat: Chat }> => {
    const response = await axiosInstance.post('/chats', chatData);
    return response.data;
};

/**
 * Update chat
 */
export const updateChat = async (chatId: string, updates: Partial<Chat>): Promise<{ success: boolean; chat: Chat }> => {
    const response = await axiosInstance.put(`/chats/${chatId}`, updates);
    return response.data;
};

/**
 * Delete chat (cascade)
 */
export const deleteChat = async (chatId: string, organizationId: string) => {
    const response = await axiosInstance.delete(`/chats/${chatId}`, {
        params: { organizationId }
    });
    return response.data;
};

/**
 * Block/mark chat as spam
 */
export const blockChat = async (chatId: string, organizationId: string, spamReason?: string) => {
    const response = await axiosInstance.post(`/chats/${chatId}/block`, {
        organizationId,
        spamReason
    });
    return response.data;
};

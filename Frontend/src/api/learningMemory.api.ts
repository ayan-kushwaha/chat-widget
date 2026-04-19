import axiosInstance from './axiosInstance';

export interface LearningMemory {
    _id: string;
    organizationId: string;
    type: 'pattern' | 'fact' | 'rule' | 'gap';
    category: string;
    title: string;
    content: string;
    confidence: number;
    source: 'chat_analysis' | 'user_behavior' | 'manual';
    sourceChatIds: string[];
    sourceUserIds: string[];
    status: 'pending' | 'approved' | 'rejected' | 'merged';
    approvedBy: string | null;
    approvedAt: string | null;
    isDuplicate: boolean;
    duplicateOf: string | null;
    mergedWith: string[];
    expiresAt: string | null;
    isPermanent: boolean;
    generatedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface GetMemoriesParams {
    organizationId: string;
    status?: 'pending' | 'approved' | 'rejected' | 'merged';
    type?: 'pattern' | 'fact' | 'rule' | 'gap';
    isPermanent?: boolean;
    page?: number;
    limit?: number;
}

export interface GetMemoriesResponse {
    success: boolean;
    memories: LearningMemory[];
    total: number;
    page: number;
    totalPages: number;
}

/**
 * Get all memories with filters
 */
export const getMemories = async (params: GetMemoriesParams): Promise<GetMemoriesResponse> => {
    const response = await axiosInstance.get('/learning-memories', { params });
    return response.data;
};

/**
 * Get memory by ID
 */
export const getMemoryById = async (id: string, organizationId: string): Promise<{ success: boolean; memory: LearningMemory }> => {
    const response = await axiosInstance.get(`/learning-memories/${id}`, {
        params: { organizationId }
    });
    return response.data;
};

/**
 * Approve pending memory
 */
export const approveMemory = async (id: string, organizationId: string, approvedBy: string): Promise<{ success: boolean; memory: LearningMemory }> => {
    const response = await axiosInstance.post(`/learning-memories/${id}/approve`, {
        organizationId,
        approvedBy
    });
    return response.data;
};

/**
 * Reject pending memory
 */
export const rejectMemory = async (id: string, organizationId: string): Promise<{ success: boolean; memory: LearningMemory }> => {
    const response = await axiosInstance.post(`/learning-memories/${id}/reject`, {
        organizationId
    });
    return response.data;
};

/**
 * Update memory
 */
export const updateMemory = async (id: string, updates: Partial<LearningMemory>): Promise<{ success: boolean; memory: LearningMemory }> => {
    const response = await axiosInstance.put(`/learning-memories/${id}`, updates);
    return response.data;
};

/**
 * Merge duplicate memories
 */
export const mergeMemories = async (id: string, organizationId: string, duplicateIds: string[]): Promise<{ success: boolean; memory: LearningMemory; mergedCount: number }> => {
    const response = await axiosInstance.post(`/learning-memories/${id}/merge`, {
        organizationId,
        duplicateIds
    });
    return response.data;
};

/**
 * Delete memory
 */
export const deleteMemory = async (id: string, organizationId: string) => {
    const response = await axiosInstance.delete(`/learning-memories/${id}`, {
        params: { organizationId }
    });
    return response.data;
};

/**
 * Trigger missed learning analysis manually
 */
export const triggerMissedLearning = async (organizationId: string, dateFrom?: string, dateTo?: string): Promise<{ success: boolean; triggered: number }> => {
    const response = await axiosInstance.post(`/memory/${organizationId}/trigger-learning`, {
        dateFrom,
        dateTo
    });
    return response.data;
};

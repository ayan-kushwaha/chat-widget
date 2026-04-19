import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Memory {
    _id: string; // Restored
    content: string;
    category?: string; // V3 Smart Folder Category
    source?: string; // V3 Source Type
    tags?: string[];
    rich_metadata?: {
        source_type?: string;
        last_updated?: string;
        created_at?: string;
        category?: string;
    };
    expires_at?: string; // V3 Temporary Memory
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Fetch long-term memories (knowledge vectors)
 */
export const getLongTermMemory = async (orgId: string, params?: { limit?: number; skip?: number; source_type?: string }) => {
    const response = await axios.get(`${API_URL}/v1/memory/${orgId}/long-term`, { params });
    return response.data;
};

/**
 * Search memories by keyword
 */
export const searchMemories = async (orgId: string, query: string, limit = 20) => {
    const response = await axios.post(`${API_URL}/v1/memory/${orgId}/search`, {
        query,
        limit
    });
    return response.data.results || [];
};

/**
 * Delete a memory
 */
export const deleteMemory = async (orgId: string, memoryId: string) => {
    const response = await axios.delete(`${API_URL}/v1/memory/${orgId}/${memoryId}`);
    return response.data;
};

/**
 * Edit a memory
 */
export const editMemory = async (orgId: string, memoryId: string, data: { content?: string; keywords?: string[] }) => {
    const response = await axios.put(`${API_URL}/v1/memory/${orgId}/${memoryId}`, data);
    return response.data;
};

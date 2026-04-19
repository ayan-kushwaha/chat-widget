import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Insight {
    _id: string;
    type: 'fact' | 'preference' | 'rule' | 'pattern';
    content?: string; // Unified display content
    question?: string;
    ai_proposed_answer?: string;
    pattern_description?: string;
    confidence_score: number;
    frequency?: number;
    confidence: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    source_link?: string; // New: V3 Link to source
    context?: string; // New: V3 Context for editing
    expires_at?: string; // New: V3 Expiry logic
    source?: string; // New: Source of the insight
}

/**
 * Fetch all pending insights for an organization
 */
export const getPendingInsights = async (orgId: string): Promise<Insight[]> => {
    const response = await axios.get(`${API_URL}/v1/insights/${orgId}`);
    return response.data.insights || [];
};

/**
 * Approve an insight and convert it to knowledge
 */
/**
 * Approve an insight and convert it to knowledge
 */
export const approveInsight = async (orgId: string, insightId: string, answer: string, expiry?: string) => {
    const response = await axios.post(`${API_URL}/v1/insights/${orgId}/approve`, {
        insightId,
        answer,
        expiry // 'forever', 'year', 'month', 'week'
    });
    return response.data;
};

/**
 * Edit an insight
 */
export const editInsight = async (orgId: string, insightId: string, data: { ai_proposed_answer?: string; question?: string }) => {
    const response = await axios.put(`${API_URL}/v1/insights/${orgId}/${insightId}`, data);
    return response.data;
};

/**
 * Reject/delete an insight
 */
export const rejectInsight = async (orgId: string, insightId: string, blacklist: boolean = false) => {
    // Passing data in DELETE request usually requires 'data' property in config, or use POST if backend prefers
    const response = await axios.delete(`${API_URL}/v1/insights/${orgId}/${insightId}`, {
        data: { blacklist }
    });
    return response.data;
};

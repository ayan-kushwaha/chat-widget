import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface AnalyticsData {
    totalMemories: number;
    memoryGrowth: string; // e.g. "+12%"
    knowledgeGapsFilled: number;
    gapsThisWeek: number;
    patternDetectionRate: string; // e.g. "High"
    autoResolutionRate: number; // Changed to number for Progress bar (e.g. 68)
    totalChats: number;
    conflicts_detected: number; // Added for V3
    queries_resolved: number; // Added for V3
    learningVelocity: Array<{ date: string; count: number }>;
    topTopics: Array<{ topic: string; count: number }>;
}

/**
 * Fetch real-time analytics for an organization
 */
export const getAnalytics = async (orgId: string, timeRange = '30'): Promise<AnalyticsData> => {
    const response = await axios.get(`${API_URL}/v1/analytics/${orgId}`, {
        params: { timeRange }
    });
    return response.data.analytics;
};

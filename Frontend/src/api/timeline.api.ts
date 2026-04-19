import axiosInstance from './axiosInstance';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface TimelineEntry {
    id: string;
    title: string;
    date: string;
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    summary: string;
    metrics: {
        chats: number;
        sentiment: string;
        topTopics: string[];
    };
    comparison_data?: {
        previous_chats: number;
        previous_sentiment: string;
        chat_change: number;
        sentiment_shift: 'improved' | 'declined' | 'stable';
    };
    events?: Array<{
        id: string;
        time: string;
        type: 'fact' | 'friction' | 'gap' | 'insight';
        channel?: 'web' | 'whatsapp' | 'instagram' | 'email';
        title?: string; // Short summary/headline
        content: string;
        source_id: string;
        sentiment?: 'Positive' | 'Negative' | 'Neutral';
        topic?: string;
        user_id?: string;
        user_type?: 'lead' | 'customer' | 'visitor';
        leadId?: string;
        duration?: string;
    }>;
    daily_stats?: {
        sentiment_breakdown: { positive: number; neutral: number; negative: number };
        total_inquiries: number;
        leads_captured: number; // Form fills
    };
    weekly_analysis?: {
        trends: Array<{ topic: string, volume: number, change: number, sentiment: string }>;
        gaps: Array<{ query: string, count: number, impact: string }>;
        activity_graph: number[];
    };
    monthly_analysis?: {
        roi_metrics: {
            total_chats: number;
            human_handover: number;
            automation_rate: number;
            saved_hours: number;
        };
        voice_of_customer: Array<{
            category: string;
            type: 'gap' | 'friction' | 'insight' | 'trend';
            title: string;
            insight: string;
            impact: string
        }>;
    };
    annual_analysis?: {
        growth_metrics: {
            total_conversations: string;
            yoy_growth: number;
            cost_savings: string;
        };
        strategic_shifts: Array<{ from: string, to: string, magnitude: string }>;
        top_revenue_drivers: Array<{ source: string, value: string }>;
    };
    top_learnings?: Array<{
        text: string;
        source: string;
        confidence: number;
    }>;
}

/**
 * Fetch timeline entries (audit log, daily digests)
 */
export const getTimeline = async (orgId: string, limit = '20'): Promise<TimelineEntry[]> => {
    // Assuming axiosInstance base URL is already configured e.g. /v1
    // and timeline route is /v1/timeline/:orgId
    // If axiosInstance base URL is http://localhost:4000/v1
    // We should call /timeline/:orgId

    // However, looking at other APIs:
    // chat.api.ts calls '/chats' -> http://localhost:4000/v1/chats
    // So here we should call '/timeline/:orgId' -> http://localhost:4000/v1/timeline/:orgId
    const response = await axiosInstance.get(`/timeline/${orgId}`, {
        params: { limit }
    });
    return response.data.timeline;
};

/**
 * Delete a specific timeline entry
 */
export const deleteTimelineEntry = async (orgId: string, entryId: string) => {
    const response = await axiosInstance.delete(`/timeline/${orgId}/${entryId}`);
    return response.data;
};

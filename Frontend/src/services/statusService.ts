import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const BASE_URL = API_BASE.endsWith('/v1') ? API_BASE : `${API_BASE}/v1`;

export interface StatusData {
    organizationId: string;
    type: 'text' | 'image';
    content: string;
    caption?: string;
    styling?: {
        fontFamily?: string;
        backgroundColor?: string;
        textColor?: string;
        stickerStyle?: 'pill' | 'card' | 'minimal' | 'hidden';
        stickerPosition?: { x: number; y: number };
        backgroundBlur?: number;
        backgroundOpacity?: number;
    };
    music?: {
        title: string;
        artist: string;
        coverUrl: string;
        previewUrl: string;
        trimStart?: number;
        trimDuration?: number;
    };
    musicVolume?: number;
    startTime?: Date;
    endTime: Date;
}

export interface Status {
    _id: string;
    organizationId: string;
    type: 'text' | 'image';
    content: string;
    caption?: string;
    styling?: {
        fontFamily?: string;
        backgroundColor?: string;
        textColor?: string;
        stickerStyle?: 'pill' | 'card' | 'minimal' | 'hidden';
        stickerPosition?: { x: number; y: number };
        backgroundBlur?: number;
        backgroundOpacity?: number;
    };
    music?: {
        title: string;
        artist: string;
        coverUrl: string;
        previewUrl: string;
        trimStart?: number;
        trimDuration?: number;
    };
    musicVolume?: number;
    views: string[];
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    updatedAt: Date;
}

export const statusService = {
    /**
     * Create a new status
     */
    async createStatus(data: StatusData): Promise<Status> {
        // Debugging URL
        const url = `${BASE_URL}/status`;
        console.log('🚀 Creating Status:', url, data);

        try {
            const response = await axios.post(url, data);
            return response.data.status;
        } catch (error: any) {
            console.error('❌ Status Create Failed:', error.response?.status, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get active statuses for an organization
     */
    async getActiveStatuses(organizationId: string): Promise<Status[]> {
        const response = await axios.get(`${BASE_URL}/status`, {
            params: { organizationId }
        });
        return response.data.statuses || response.data; // Handle both formats
    },

    /**
     * Record a view for a status
     */
    async recordView(statusId: string, userId: string): Promise<void> {
        await axios.post(`${BASE_URL}/status/${statusId}/view`, { userId });
    },

    /**
     * Delete a status
     */
    async deleteStatus(statusId: string, organizationId: string): Promise<void> {
        await axios.delete(`${BASE_URL}/status/${statusId}`, {
            params: { organizationId }
        });
    }
};

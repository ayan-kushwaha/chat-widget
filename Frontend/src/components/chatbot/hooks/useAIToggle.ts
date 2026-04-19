import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface AIToggleState {
    aiEnabledByAdmin: boolean;
    aiEnabledByUser: boolean;
    aiActive: boolean;
}

export const useAIToggle = (chatId: string | undefined, viewMode: 'dashboard' | 'widget') => {
    const [aiState, setAiState] = useState<AIToggleState>({
        aiEnabledByAdmin: true,
        aiEnabledByUser: true,
        aiActive: true
    });
    const [loading, setLoading] = useState(false);

    // Fetch current AI status
    useEffect(() => {
        if (!chatId) return;

        const fetchStatus = async () => {
            try {
                const response = await api.get(`/chats/${chatId}/ai-status`);
                setAiState(response.data);
            } catch (error) {
                console.error('❌ Failed to fetch AI status:', error);
            }
        };

        fetchStatus();
    }, [chatId]);

    // Auto-reset user toggle on mount (widget only)
    useEffect(() => {
        if (!chatId || viewMode !== 'widget') return;

        const resetUserToggle = async () => {
            try {
                await api.post(`/chats/${chatId}/ai-reset-user`);
                setAiState(prev => ({ ...prev, aiEnabledByUser: true }));
            } catch (error) {
                console.error('❌ Failed to reset user AI toggle:', error);
            }
        };

        resetUserToggle();
    }, [chatId, viewMode]);

    // Admin toggle
    const toggleAdmin = async (enabled: boolean) => {
        if (!chatId) return;
        setLoading(true);
        try {
            const response = await api.patch(`/chats/${chatId}/ai-toggle/admin`, { enabled });
            setAiState(response.data);
        } catch (error) {
            console.error('❌ Failed to toggle admin AI:', error);
        } finally {
            setLoading(false);
        }
    };

    // User toggle
    const toggleUser = async (enabled: boolean) => {
        if (!chatId) return;
        setLoading(true);
        try {
            const response = await api.patch(`/chats/${chatId}/ai-toggle/user`, { enabled });
            setAiState(response.data);
        } catch (error) {
            console.error('❌ Failed to toggle user AI:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        ...aiState,
        loading,
        toggleAdmin,
        toggleUser
    };
};

export interface Conversation {
    _id: string;
    organizationId: string;
    userId: string;
    userName?: string;
    userAvatar?: string;
    userLocation?: string;
    userEmail?: string;
    userPhone?: string;
    userMobile?: string;
    ai_generated_title: string;
    summary: string;
    status: 'active' | 'resolved' | 'archived';
    mode: 'ai' | 'human' | 'handoff';
    chatId?: string;
    channel?: string;
    last_message_at: string | Date;
    last_message_preview?: string;
    last_message_sender?: 'user' | 'agent' | 'ai'; // ✨ NEW: Who sent the last message
    last_message_status?: 'sent' | 'delivered' | 'read'; // ✨ NEW: WhatsApp-style status
    unreadCount?: number;
    unread_count?: number; // Backend compatibility
    is_pinned?: boolean;
    is_favourite?: boolean;
    isGroup?: boolean;
    assignedTo?: string | null;
    tags?: string[];
    hasActiveStatus?: boolean; // 📸 Status indicator
    updatedAt?: string | Date;
    matchCount?: number; // 🔍 New: Results found in this chat
}

export interface Message {
    _id: string;
    organizationId: string;
    conversationId: string;
    sender: 'user' | 'agent' | 'ai' | 'system' | 'bot';
    senderName?: string;
    type: 'text' | 'image' | 'audio' | 'call_log' | 'form_submission' | 'booking_card' | 'booking_request' | 'booking_confirmation' | 'note' | 'system_alert';
    content: string;
    metadata?: any;
    is_starred: boolean;
    isDeleted?: boolean;
    deletedFor?: string[];
    createdAt: string | Date;
}

export interface ThinkingStep {
    id: string;
    message: string;
    status: 'live' | 'done';
    data?: Record<string, unknown>;
}

export interface ChatMessage {
    id: string;
    _id?: string; // 🔍 New: Original Mongo ID (for robust linking)
    originalId?: string; // 🔍 New: Original Client ID (if different)
    indexId?: never; // 🚫 Removed: Legacy Index-based IDs cause drift/targeting errors.
    sender: 'user' | 'agent' | 'ai' | 'system' | 'bot';
    senderName?: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'call_log' | 'form_submission' | 'booking_card' | 'note' | 'system_alert' | 'poll' | 'product' | 'booking_request' | 'booking_confirmation' | 'offer' | 'location' | 'form_request' | 'quick_reply' | 'document' | 'thinking_wrapper';
    content: string;
    metadata?: any;
    createdAt: Date;
    replyTo?: {
        id: string | number;
        sender: string;
        content: string;
    };
    reactions?: Record<string, number>;
    userReaction?: string;
    isDeleted?: boolean;
    deletedFor?: string[];
    chatId?: string; // 🆔 Added for scroll tracking
}

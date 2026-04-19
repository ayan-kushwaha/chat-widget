export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface Site {
    _id: string;
    name: string;
    url: string;
    domains: string[];
    crawlFrequency: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    timestamp?: Date;
}

export interface Lead {
    _id: string;
    siteId: string;
    visitorId: string;
    summary?: string;
    intent?: string;
    chatTranscript: ChatMessage[];
    createdAt: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

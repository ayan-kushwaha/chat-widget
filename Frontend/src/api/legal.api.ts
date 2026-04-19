import axiosInstance from "./axiosInstance";

// Types
export interface LegalPage {
    _id: string;
    title: string;
    slug: string;
    content: string;
    category: 'legal' | 'blog' | 'help';
    seo: {
        title: string;
        description: string;
        keywords: string[];
    };
    updatedAt: string;
}

export const legalAPI = {
    // Public
    getAll: async (category?: string) => {
        const query = category ? `?category=${category}` : '';
        const response = await axiosInstance.get(`/legal${query}`);
        return response.data;
    },

    getBySlug: async (slug: string) => {
        const response = await axiosInstance.get(`/legal/${slug}`);
        return response.data;
    },

    // Admin
    create: async (data: Partial<LegalPage>) => {
        const response = await axiosInstance.post('/legal', data);
        return response.data;
    },

    update: async (id: string, data: Partial<LegalPage>) => {
        const response = await axiosInstance.put(`/legal/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await axiosInstance.delete(`/legal/${id}`);
        return response.data;
    }
};

import api from "@/lib/api";

export const featuresAPI = {
    getAll: () => api.get('/features'),
    create: (data: any) => api.post('/features', data),
    update: (id: string, data: any) => api.patch(`/features/${id}`, data),
    delete: (id: string) => api.delete(`/features/${id}`),
    checkUsage: (id: string) => api.get(`/features/${id}/usage`),
    archive: (id: string) => api.post(`/features/${id}/archive`),
};

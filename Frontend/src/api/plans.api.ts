import api from "@/lib/api";

export const plansAPI = {
    getAll: () => api.get('/plans'),
    getAllWithInactive: () => api.get('/plans?all=true'), // For Admin panel
    getOne: (id: string) => api.get(`/plans/${id}`),
    create: (data: any) => api.post('/plans', data),
    update: (id: string, data: any) => api.patch(`/plans/${id}`, data),
    delete: (id: string) => api.delete(`/plans/${id}`),
};

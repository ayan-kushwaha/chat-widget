import api from "@/lib/api";

export const couponsAPI = {
    getAll: () => api.get('/coupons'),
    create: (data: any) => api.post('/coupons', data),
    update: (id: string, data: any) => api.patch(`/coupons/${id}`, data),
    delete: (id: string) => api.delete(`/coupons/${id}`),
    validate: (code: string, cartTotal: number) => api.post('/coupons/validate', { code, cartTotal }),
};

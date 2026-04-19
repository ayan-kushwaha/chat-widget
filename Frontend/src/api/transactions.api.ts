import axiosInstance from './axiosInstance';

export interface Transaction {
    _id: string;
    organizationId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'success' | 'failed' | 'refunded';
    type: 'subscription_create' | 'subscription_renew' | 'topup' | 'manual_adjustment';
    planName?: string;
    interval?: 'month' | 'year' | 'one_time';
    invoiceUrl?: string;
    createdAt: string;
}

export const transactionsAPI = {
    getHistory: async (orgId: string, page = 1, limit = 10, type?: string, year?: string) => {
        const response = await axiosInstance.get(`/transactions/${orgId}`, {
            params: { page, limit, type, year }
        });
        return response.data;
    }
};

import api from "@/lib/api";

/**
 * Subscriptions API Client
 * Handles all subscription-related operations with snapshot support
 */

export const subscriptionsAPI = {
    /**
     * Create a new subscription with locked rates
     * @param data - organizationId and planData
     */
    create: (data: {
        organizationId: string;
        planData: {
            plan_id: string;
            name: string;
            price: number;
            billing_cycle: string;
            feature_ids: string[];
            limits: any;
        };
    }) => api.post('/subscriptions', data),

    /**
     * Get current subscription details
     * @param organizationId - Organization ID
     */
    get: (organizationId: string) => api.get(`/subscriptions/${organizationId}`),

    /**
     * Preview renewal pricing changes
     * @param organizationId - Organization ID
     * @param newPlanData - New plan details to compare
     */
    getRenewalPreview: (organizationId: string, newPlanData: any) =>
        api.post(`/subscriptions/${organizationId}/renewal-preview`, { newPlanData }),

    /**
     * Confirm subscription renewal (creates new snapshot)
     * @param organizationId - Organization ID
     * @param planData - New plan configuration
     */
    renew: (organizationId: string, planData: any) =>
        api.post(`/subscriptions/${organizationId}/renew`, {
            planData,
            confirmed: true
        }),
};

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    transformResponse: [
        (data) => {
            if (typeof data === 'string') {
                try {
                    if (!data.trim()) return {};
                    return JSON.parse(data);
                } catch (e) {
                    return data;
                }
            }
            return data;
        },
    ],
});

// Add token and org ID to requests
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const activeOrgId = localStorage.getItem('activeOrgId');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (activeOrgId) {
            config.headers['x-org-id'] = activeOrgId;
        }
    }
    return config;
});

// Handle 401 errors and empty responses
api.interceptors.response.use(
    (response) => {
        // Handle empty responses to prevent JSON parse errors
        if (response.data === "" || response.data === null || response.data === undefined) {
            response.data = {};
        }
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// API functions
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (email: string, password: string, name: string) =>
        api.post('/auth/register', { email, password, name }),
};

export const sitesAPI = {
    getAll: () => api.get('/sites'),
    create: (data: any) => api.post('/sites', data),
    update: (id: string, data: any) => api.put(`/sites/${id}`, data),
    delete: (id: string) => api.delete(`/sites/${id}`),
};

export const knowledgeAPI = {
    addManualText: (siteId: string, text: string, title?: string) =>
        api.post(`/knowledge/${siteId}/manual-text`, { text, title }),
    chat: (siteId: string, query: string, history: any[]) =>
        api.post(`/knowledge/${siteId}/chat`, { query, history }),
    analyze: (siteId: string, history: any[], visitorId: string) =>
        api.post(`/knowledge/${siteId}/analyze`, { history, visitorId }),
    getChatHistory: (orgId: string) => api.get(`/knowledge/${orgId}/history`),
    getBrainAnalytics: (orgId: string) => api.get(`/knowledge/${orgId}/analytics`),
    getOverview: (orgId: string) => api.get(`/knowledge/${orgId}/overview`),
    getPersonality: (orgId: string) => api.get(`/knowledge/${orgId}/personality`),
};

export const leadsAPI = {
    // Forms
    getForms: () => api.get('/leads/forms'),
    getFormById: (id: string) => api.get(`/leads/forms/${id}`),
    createForm: (data: any) => api.post('/leads/forms', data),
    updateForm: (id: string, data: any) => api.put(`/leads/forms/${id}`, data),
    deleteForm: (id: string) => api.delete(`/leads/forms/${id}`),

    // Leads
    getLeads: (params?: { formId?: string; status?: string; sort?: string }) =>
        api.get('/leads', { params }),
    submitLead: (data: any) => api.post('/leads', data),
    updateLead: (id: string, data: any) => api.put(`/leads/${id}`, data),
};

export const flowsAPI = {
    save: (data: any) => api.post('/flows/save', data),
    list: (params?: any) => api.get('/flows/list', { params }),
    getById: (id: string, params?: any) => api.get(`/flows/${id}`, { params }),
    delete: (id: string, params?: any) => api.delete(`/flows/${id}`, { params }),
};

export const workforceAPI = {
    getMyTeam: () => api.get('/workforce/my-team'),
    getByAgentId: (agentId: string) => api.get(`/workforce/by-agent/${agentId}`),
    getEstimate: (data: { agent_id: string; user_country?: string }) =>
        api.post('/workforce/estimate', data),
    startDeployment: (data: {
        agent_id: string;
        model_key: string;
        name: string;
        role: string;
        department: string;
        avatar_url?: string;
        protocol: any;
        knowledge_sources: any[];
    }) => api.post('/workforce/start-deployment', data),
    getStatus: (jobId: string) => api.get(`/workforce/status/${jobId}`),
    getCards: (agentId: string) => api.get(`/workforce/cards/${agentId}`),
    synthesize: (dossier: any) => api.post('/workforce/synthesize', { dossier }),
    saveProtocol: (data: { agent_id: string; protocol: any; name: string; role: string }) =>
        api.post('/workforce/save-protocol', data),
};

export const widgetAPI = {
    // Get all active deployments for an organization (last 10 minutes)
    getDeployments: (orgId: string) => api.get(`/widget/deployments/${orgId}`),

    // Get all deployments including inactive ones
    getAllDeployments: (orgId: string) => api.get(`/widget/deployments/${orgId}/all`),
};

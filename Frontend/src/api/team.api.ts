import axiosInstance from './axiosInstance';

export const getTeamMembers = async (token?: string) => {
    const headers: any = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await axiosInstance.get('/team/members', { headers });
    return response.data;
};

export const addTeamMember = async (email: string, role: string, name?: string, token?: string) => {
    const headers: any = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await axiosInstance.post('/team/add-member', { email, role, name }, { headers });
    return response.data;
};

export const updateMemberRole = async (userId: string, role: string, token?: string) => {
    const headers: any = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await axiosInstance.put('/team/update-role', { userId, role }, { headers });
    return response.data;
};

export const removeMember = async (userId: string, token?: string) => {
    const headers: any = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await axiosInstance.delete('/team/remove-member', {
        headers,
        data: { userId }
    });
    return response.data;
};

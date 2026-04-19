import axiosInstance from './axiosInstance';

export const login = async (email: string, password: string) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    return response.data;
};

export const register = async (email: string, password: string) => {
    const response = await axiosInstance.post('/auth/register', { email, password });
    return response.data;
};

export const getMe = async (token?: string) => {
    const headers: any = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await axiosInstance.get('/auth/me', { headers });
    return response.data;
};

export const forgotPassword = async (email: string) => {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (token: string, password: string) => {
    const response = await axiosInstance.post('/auth/reset-password', { token, newPassword: password });
    return response.data;
};

export const deleteAccount = async (userId: string, orgId: string) => {
    const response = await axiosInstance.post('/auth/delete-account', { userId, orgId });
    return response.data;
};

export const reactivateAccount = async (orgId: string) => {
    const response = await axiosInstance.post('/auth/reactivate-account', { orgId });
    return response.data;
};

export const sendLinkEmailOtp = async (email: string) => {
    const response = await axiosInstance.post('/auth/send-link-otp', { email });
    return response.data;
};

export const verifyLinkEmailOtp = async (email: string, otp: string) => {
    const response = await axiosInstance.post('/auth/verify-link-otp', { email, otp });
    return response.data;
};

export const unlinkEmailAccount = async () => {
    const response = await axiosInstance.delete('/auth/unlink-email');
    return response.data;
};

export const setSecondaryPassword = async (password: string, currentPassword?: string) => {
    const response = await axiosInstance.post('/auth/set-secondary-password', { password, currentPassword });
    return response.data;
};
export const changePassword = async (password: string, currentPassword: string) => {
    const response = await axiosInstance.post('/auth/change-password', { password, currentPassword });
    return response.data;
};

export const sendSecondaryPasswordResetOtp = async () => {
    const response = await axiosInstance.post('/auth/send-secondary-password-reset-otp');
    return response.data;
};

export const resetSecondaryPasswordWithOtp = async (otp: string, newPassword: string) => {
    const response = await axiosInstance.post('/auth/reset-secondary-password-with-otp', { otp, newPassword });
    return response.data;
};

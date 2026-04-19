import axiosInstance from './axiosInstance';

export const getOrg = async () => {
    const response = await axiosInstance.get('/organizations');
    return response.data;
};

export const updateOrgSettings = async (data: any) => {
    const response = await axiosInstance.patch('/organizations/settings', data);
    return response.data;
};

export const updateUserName = async (orgId: string, userId: string, name: string) => {
    const response = await axiosInstance.put('/organizations/update-user-name', { orgId, userId, name });
    return response.data;
};

export const generateKnowledgeStrategy = async () => {
    const response = await axiosInstance.post('/organizations/generate-knowledge-strategy');
    return response.data;
};

/**
 * Upload cropped org image (logo/banner) to MinIO and get back a permanent URL.
 * @param dataUrl - base64 data URL from crop canvas
 * @param assetType - 'logo' | 'banner'
 */
export const uploadOrgAsset = async (dataUrl: string, assetType: 'logo' | 'banner'): Promise<string> => {
    // Convert base64 dataUrl to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `${assetType}.webp`, { type: 'image/webp' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assetType', assetType);

    const response = await axiosInstance.post('/organizations/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (!response.data?.url) throw new Error("Upload failed — no URL returned");
    return response.data.url;
};

export const listSites = async () => {
    const response = await axiosInstance.get('/sites');
    return response.data;
};

export const createSite = async (domain: string, crawl_schedule: string) => {
    const response = await axiosInstance.post('/sites', { domain, crawl_schedule });
    return response.data;
};

export const updateSite = async (id: string, data: any) => {
    const response = await axiosInstance.put(`/sites/${id}`, data);
    return response.data;
};

export const deleteSite = async (id: string) => {
    const response = await axiosInstance.delete(`/sites/${id}`);
    return response.data;
};

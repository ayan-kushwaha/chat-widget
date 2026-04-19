import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface UseFileHandlerProps {
    chatId: string;
    orgId?: string;
}

export const useFileHandler = ({ chatId, orgId: propOrgId }: UseFileHandlerProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [sendFileToAI, setSendFileToAI] = useState(true);

    // Helper: Validate ObjectId
    const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

    /**
     * Process Selected File (Validation + Preview)
     */
    const processFile = (file: File) => {
        if (file.size > 10 * 1024 * 1024) { // 10MB Limit
            toast.error("File size must be under 10MB");
            return;
        }
        setSelectedFile(file);

        const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/');
        setSendFileToAI(isMedia);

        // Create Preview URL for Images/Video
        if (isMedia) {
            const url = URL.createObjectURL(file);
            setFilePreviewUrl(url);
        } else {
            setFilePreviewUrl(null);
        }
    };

    /**
     * Handle File Selection from Input
     */
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) processFile(file);
    };

    /**
     * Upload File to Backend -> AI Engine
     */
    const handleFileUpload = async (): Promise<{ url: string; type: string; chatId?: string } | null> => {
        if (!selectedFile) return null;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('chatId', chatId || ''); // Use existing chatId or empty string

            // 🛡️ Robust OrgId Resolution
            let finalOrgId = propOrgId || '';

            // Try fallback sources if prop is missing
            if (!finalOrgId || !isValidObjectId(finalOrgId)) {
                const urlId = window.location.pathname.split('/')[2];
                const storageId = localStorage.getItem('cluaiz_active_org_id') || '';

                if (urlId && isValidObjectId(urlId)) finalOrgId = urlId;
                else if (storageId && isValidObjectId(storageId)) finalOrgId = storageId;
            }

            formData.append('orgId', finalOrgId);

            // Import DeviceService dynamically if needed or just use it if available
            const { DeviceService } = await import('@/services/device.service');
            formData.append('deviceId', DeviceService.getDeviceId());

            formData.append('sendToAI', sendFileToAI ? 'true' : 'false');

            const isMedia = selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/') || selectedFile.type.startsWith('audio/');
            // Use /api/upload prefix which Next.js proxies to Backend
            const endpoint = isMedia ? '/api/upload/image' : '/api/upload/file';

            const response = await axios.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('✅ File uploaded:', response.data);

            if (response.data.success) {
                clearFile();
                return {
                    url: response.data.url,
                    type: isMedia ? (selectedFile.type.startsWith('image/') ? 'image' : selectedFile.type.startsWith('video/') ? 'video' : 'audio') : 'file',
                    chatId: response.data.chatId // Return resolved chatId
                };
            }

            // Fallback for non-success response, though the above block should handle success
            let type = 'document';
            if (selectedFile.type.startsWith('image/')) type = 'image';
            else if (selectedFile.type.startsWith('video/')) type = 'video';
            else if (selectedFile.type.startsWith('audio/')) type = 'audio';

            return { url: response.data.url, type };
        } catch (error: any) {
            console.error('❌ Upload failed:', error);
            const errorMessage = error.response?.data?.error || "File upload failed";
            toast.error(errorMessage);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Clear Selected File
     */
    const clearFile = () => {
        if (filePreviewUrl) {
            URL.revokeObjectURL(filePreviewUrl);
        }
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setSendFileToAI(true);
    };

    return {
        selectedFile,
        filePreviewUrl,
        isUploading,
        sendFileToAI,
        setSendFileToAI,
        handleFileSelect,
        handleFileUpload,
        clearFile,
        processFile, // Exposed for manual selection (InputGrid)
        setSelectedFile, // Exposed if needed for external clearing
        setFilePreviewUrl
    };
};

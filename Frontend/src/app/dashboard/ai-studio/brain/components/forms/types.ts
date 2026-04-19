// Shared types for AddSourceModal components

export interface BaseTabProps {
    loading: boolean;
    onSubmit: () => void;
    mode?: 'add' | 'edit';
    initialData?: any;
}

export interface WebsiteTabProps extends BaseTabProps {
    websiteUrl: string;
    setWebsiteUrl: (url: string) => void;
    websiteDescription: string;
    setWebsiteDescription: (desc: string) => void;
    websiteTags: string[];
    setWebsiteTags: (tags: string[]) => void;
    crawlFrequency: string;
    setCrawlFrequency: (freq: string) => void;
    discoveredUrls: string[];
    setDiscoveredUrls: (urls: string[]) => void;
    selectedUrls: string[];
    setSelectedUrls: (urls: string[]) => void;
}

export interface FileUploadTabProps extends BaseTabProps {
    file: File | null;
    setFile: (file: File | null) => void;
    fileDescription: string;
    setFileDescription: (desc: string) => void;
    fileTags: string[];
    setFileTags: (tags: string[]) => void;
}

export interface ApiSourceTabProps extends BaseTabProps {
    apiUrl: string;
    setApiUrl: (url: string) => void;
    apiDescription: string;
    setApiDescription: (desc: string) => void;
    apiTags: string[];
    setApiTags: (tags: string[]) => void;
    apiSyncMode: 'one-time' | 'real-time';
    setApiSyncMode: (mode: 'one-time' | 'real-time') => void;
    apiPreview: any;
    setApiPreview: (preview: any) => void;
}

export interface ManualEntryTabProps extends BaseTabProps {
    manualTitle: string;
    setManualTitle: (title: string) => void;
    manualContent: string;
    setManualContent: (content: string) => void;
    manualTags: string[];
    setManualTags: (tags: string[]) => void;
    manualPriority: string;
    setManualPriority: (priority: string) => void;
}

export interface TagManagerHook {
    handleAddTag: (
        tag: string,
        currentTags: string[],
        setTags: React.Dispatch<React.SetStateAction<string[]>>,
        setInput: React.Dispatch<React.SetStateAction<string>>
    ) => void;
    handleRemoveTag: (
        index: number,
        setter: React.Dispatch<React.SetStateAction<string[]>>
    ) => void;
}

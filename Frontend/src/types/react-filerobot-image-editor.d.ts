declare module 'react-filerobot-image-editor' {
    import { ComponentType } from 'react';

    export const TABS: {
        ADJUST: string;
        ANNOTATE: string;
        FILTERS: string;
        FINETUNE: string;
        RESIZE: string;
        WATERMARK: string;
    };

    export const TOOLS: {
        TEXT: string;
        IMAGE: string;
        RECT: string;
        ELLIPSE: string;
        POLYGON: string;
        PEN: string;
        LINE: string;
        ARROW: string;
    };

    interface FilerobotImageEditorProps {
        source: string;
        onSave?: (editedImageObject: any, designState?: any) => void;
        onClose?: () => void;
        annotationsCommon?: Record<string, any>;
        Text?: Record<string, any>;
        Rotate?: Record<string, any>;
        tabsIds?: string[];
        defaultTabId?: string;
        defaultToolId?: string;
        savingPixelRatio?: number;
        previewPixelRatio?: number;
        theme?: Record<string, any>;
        [key: string]: any;
    }

    const FilerobotImageEditor: ComponentType<FilerobotImageEditorProps>;
    export default FilerobotImageEditor;
}

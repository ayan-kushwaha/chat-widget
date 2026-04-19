import React from 'react';
import FilerobotImageEditor, {
    TABS,
    TOOLS,
} from 'react-filerobot-image-editor';

interface LazyEditorProps {
    imageUrl: string;
    onSave: (editedImageObject: any) => void;
    onClose: () => void;
}

const LazyFilerobotEditor: React.FC<LazyEditorProps> = ({ imageUrl, onSave, onClose }) => {
    return (
        <FilerobotImageEditor
            source={imageUrl}
            onSave={(editedImageObject, designState) => {
                onSave(editedImageObject);
            }}
            onClose={onClose}
            annotationsCommon={{
                fill: '#10b981',
            }}
            Text={{ text: 'Double click to edit...' }}
            Rotate={{ angle: 90, componentType: 'slider' }}
            tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.FILTERS, TABS.FINETUNE, TABS.RESIZE, TABS.WATERMARK]}
            defaultTabId={TABS.ANNOTATE}
            defaultToolId={TOOLS.TEXT}
            savingPixelRatio={4}
            previewPixelRatio={2}
            theme={{
                palette: {
                    'bg-secondary': '#0b141a',
                    'bg-primary': '#000000',
                    'bg-active': '#1f2937',
                    'accent-primary': '#10b981',
                    'accent-primary-active': '#059669',
                    'accent-primary-hover': '#34d399',
                    'icons-primary': '#e5e7eb',
                    'icons-secondary': '#9ca3af',
                    'borders-secondary': '#1f2937',
                    'borders-primary': '#374151',
                    'txt-primary': '#ffffff',
                    'txt-secondary': '#d1d5db',
                    'txt-secondary-invert': '#ffffff',
                    'txt-primary-invert': '#ffffff'
                },
                typography: {
                    fontFamily: 'Inter, sans-serif'
                }
            }}
        />
    );
};

export default LazyFilerobotEditor;

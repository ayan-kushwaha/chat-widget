import { TagManagerHook } from '../types';

/**
 * Reusable hook for tag management across all tabs
 */
export const useTagManager = (): TagManagerHook => {
    const handleAddTag = (
        tag: string,
        currentTags: string[],
        setTags: React.Dispatch<React.SetStateAction<string[]>>,
        setInput: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const trimmed = tag.trim();
        if (trimmed && !currentTags.includes(trimmed)) {
            setTags(prev => [...prev, trimmed]);
            setInput("");
        }
    };

    const handleRemoveTag = (
        index: number,
        setter: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        setter((prev: string[]) => prev.filter((_, i) => i !== index));
    };

    return { handleAddTag, handleRemoveTag };
};

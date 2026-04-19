
import React from 'react';
import { X, ExternalLink, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface LinkPreviewProps {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    domain?: string;
    isLoading?: boolean;
    onRemove: () => void;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({
    url,
    title,
    description,
    image,
    siteName,
    domain,
    isLoading,
    onRemove
}) => {
    // Utility to decode HTML entities (e.g. &quot; -> ")
    const decodeHtml = (html: string) => {
        if (!html) return "";
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    const decodedTitle = decodeHtml(title || "");
    const decodedDescription = decodeHtml(description || "");
    const decodedSiteName = decodeHtml(siteName || domain || "");

    const [imgError, setImgError] = React.useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="mb-2 w-full max-w-md bg-[#0f1115] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative group"
        >
            {isLoading ? (
                <div className="flex items-center gap-3 p-3">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-zinc-800 rounded w-3/4 animate-pulse" />
                        <div className="h-2 bg-zinc-800 rounded w-1/2 animate-pulse" />
                    </div>
                </div>
            ) : (
                <a href={url} target="_blank" rel="noreferrer" className="block group-hover:bg-white/5 transition-colors">
                    <div className="flex bg-[#121212]">
                        {image && !imgError && (
                            <div className="relative w-32 min-w-[120px] bg-black">
                                <img
                                    src={image}
                                    alt={decodedTitle}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    onError={() => setImgError(true)}
                                />
                            </div>
                        )}
                        <div className="p-3 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
                                    {decodedSiteName}
                                </span>
                            </div>
                            <h3 className="text-xs font-bold text-white leading-tight mb-1 truncate">
                                {decodedTitle || url}
                            </h3>
                            {decodedDescription && (
                                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                                    {decodedDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </a>
            )}

            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove();
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500/80 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
            >
                <X size={12} />
            </button>
        </motion.div>
    );
};

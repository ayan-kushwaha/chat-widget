
import React, { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface LinkPreviewData {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    domain?: string;
}

interface LinkPreviewMessageProps {
    data: LinkPreviewData;
}

export const LinkPreviewMessage: React.FC<LinkPreviewMessageProps> = ({ data }) => {
    const isVideo = data.siteName?.toLowerCase().includes('youtube') ||
        data.siteName?.toLowerCase().includes('vimeo') ||
        data.url.includes('youtube.com') ||
        data.url.includes('youtu.be');

    const [isPlaying, setIsPlaying] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Utility to decode HTML entities
    const decodeHtml = (html: string) => {
        if (!html) return "";
        if (typeof document === 'undefined') return html; // SSR safety
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    const decodedTitle = decodeHtml(data.title || "");
    const decodedDescription = decodeHtml(data.description || "");
    const decodedSiteName = decodeHtml(data.siteName || data.domain || "");

    const getEmbedUrl = (url: string) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('v=') ? url.split('v=')[1]?.split('&')[0] : url.split('/').pop();
            return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
        if (url.includes('vimeo.com')) {
            const videoId = url.split('/').pop();
            return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
        }
        return url;
    };

    return (
        <div className="mt-2 block max-w-[40vw]  bg-[#0f1115] border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all hover:border-emerald-500/30 group">
            {/* Media Section (Video or Image) */}
            <div className="relative w-full aspect-video bg-black">
                {isPlaying && isVideo ? (
                    <iframe
                        src={getEmbedUrl(data.url)}
                        className="w-full h-full absolute inset-0"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div
                        className="relative w-full h-full cursor-pointer"
                        onClick={(e) => {
                            if (isVideo) {
                                e.preventDefault();
                                setIsPlaying(true);
                            } else {
                                window.open(data.url, '_blank');
                            }
                        }}
                    >
                        {data.image && !imgError ? (
                            <img
                                src={data.image}
                                alt={decodedTitle}
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                <ExternalLink className="text-zinc-700" size={48} />
                            </div>
                        )}

                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20 shadow-xl">
                                    <Play size={28} className="text-white fill-current ml-1" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Metadata Section (Always Visible) */}
            <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="block p-4 bg-[#0f1115] hover:bg-[#161b22] transition-colors border-t border-white/5"
            >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                        {decodedSiteName && (
                            <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider shrink-0">
                                {decodedSiteName}
                            </span>
                        )}
                        {!decodedSiteName && data.domain && (
                            <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider shrink-0">
                                {data.domain}
                            </span>
                        )}
                    </div>
                    <ExternalLink size={12} className="text-zinc-600 group-hover:text-emerald-500 transition-colors shrink-0" />
                </div>

                <h3 className="text-sm font-bold text-white leading-snug mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {decodedTitle || data.url}
                </h3>

                {decodedDescription && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {decodedDescription}
                    </p>
                )}
            </a>
        </div>
    );
};

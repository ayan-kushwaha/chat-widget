import React, { useState } from 'react';
import { Music, ExternalLink, Video } from 'lucide-react';

export const MediaPreview = ({ url, className }: { url: string, className?: string }) => {
    const [error, setError] = useState(false);

    // Reset error when URL changes
    React.useEffect(() => {
        setError(false);
    }, [url]);

    if (!url) return null;

    // Helper to sanitize Google Drive links
    const getDrivePreviewUrl = (rawUrl: string) => {
        if (!rawUrl) return null;
        if (rawUrl.includes('drive.google.com')) {
            // Extract ID
            const idMatch = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (idMatch && idMatch[1]) {
                return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
            }
        }
        return null;
    };

    const drivePreviewUrl = getDrivePreviewUrl(url);
    const isDrive = !!drivePreviewUrl;

    // Standard detection for non-drive links
    const lowerUrl = url.toLowerCase();
    const isAudio = !isDrive && (lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.ogg'));
    const isVideo = !isDrive && (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm'));

    if (error) {
        return (
            <div className={`text-center text-xs text-red-300 bg-red-900/20 flex flex-col items-center justify-center gap-2 border border-red-500/20 rounded-lg p-3 ${className || 'h-32'}`}>
                <span>Broken Media Link 🚫</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-300 hover:text-blue-100 hover:underline flex items-center gap-1">
                    Open Link <ExternalLink size={10} />
                </a>
            </div>
        );
    }

    // GOOGLE DRIVE EMBED (Handles Audio & Video)
    if (isDrive && drivePreviewUrl) {
        return (
            <div className={`rounded-lg overflow-hidden border border-slate-700 bg-slate-900 relative ${className || 'h-40'}`}>
                <iframe
                    src={drivePreviewUrl}
                    className="w-full h-full"
                    allow="autoplay"
                    onError={() => setError(true)}
                />
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white backdrop-blur-sm pointer-events-none">DRIVE</div>
            </div>
        );
    }

    if (isAudio) {
        return (
            <div className={`rounded-lg overflow-hidden border border-slate-700 bg-slate-900 p-3 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 ${className}`}>
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Music size={16} />
                </div>
                <audio controls className="w-full h-8 mt-1 block" src={url} onError={() => setError(true)}>
                    Your browser does not support the audio tag.
                </audio>
                <div className="w-full flex justify-between px-1">
                    <p className="text-[9px] text-slate-500 truncate max-w-[80%] opacity-50">{url}</p>
                    <span className="text-[9px] text-indigo-400 bg-indigo-500/10 px-1 rounded">AUDIO</span>
                </div>
            </div>
        );
    }

    if (isVideo) {
        return (
            <div className={`rounded-lg overflow-hidden border border-slate-700 bg-black relative ${className}`}>
                <video controls className="w-full h-full object-contain" src={url} onError={() => setError(true)} />
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white backdrop-blur-sm">VIDEO</div>
            </div>
        );
    }

    // Default Image
    return (
        <div className={`rounded-lg overflow-hidden border border-slate-700 bg-slate-900 relative ${className || 'h-32'}`}>
            <img
                src={url}
                alt="Preview"
                className="w-full h-full object-cover opacity-90"
                onError={() => setError(true)}
            />
        </div>
    );
};

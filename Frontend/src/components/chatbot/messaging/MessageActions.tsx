import React, { useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface MessageActionsProps {
    text: string;
}

export const MessageActions: React.FC<MessageActionsProps> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {/* Like Button */}
            <button
                onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${feedback === 'like' ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'
                    }`}
                title="Helpful"
            >
                <ThumbsUp size={14} />
            </button>

            {/* Dislike Button */}
            <button
                onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${feedback === 'dislike' ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                    }`}
                title="Not helpful"
            >
                <ThumbsDown size={14} />
            </button>
        </div>
    );
};

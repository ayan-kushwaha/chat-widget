import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, BarChart3 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface PollCardProps {
    question: string;
    options: string[];
    allowMultiple: boolean;
    votes?: Record<string, number>;
    hasVoted?: boolean;
    userVote?: string[];
    onVote?: (selectedOptions: string[]) => void;
    isSender?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({
    question,
    options,
    allowMultiple,
    votes = {},
    hasVoted = false,
    userVote = [],
    onVote,
    isSender = false
}) => {
    // Determine initial selected indexes based on userVote strings
    // Warning: If duplicates exist in options, this initial state might pick the first match.
    // Ideally, backend should send indexes. For now, we map strings to indexes first time.
    const initialIndexes = userVote.map(v => options.indexOf(v)).filter(i => i !== -1);

    const [selectedIndexes, setSelectedIndexes] = useState<number[]>(initialIndexes);

    // Calculate total votes
    const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);

    const handleOptionClick = (index: number) => {
        if (hasVoted || isSender) return; // Sender cannot vote on their own poll here? Usually they can. User asked to hide submit button though.

        if (allowMultiple) {
            setSelectedIndexes(prev =>
                prev.includes(index)
                    ? prev.filter(i => i !== index)
                    : [...prev, index]
            );
        } else {
            setSelectedIndexes([index]);
        }
    };

    const handleVote = () => {
        if (selectedIndexes.length > 0 && onVote) {
            const selectedOptionStrings = selectedIndexes.map(i => options[i]);
            onVote(selectedOptionStrings);
        }
    };

    const getPercentage = (option: string) => {
        if (totalVotes === 0) return 0;
        return Math.round(((votes[option] || 0) / totalVotes) * 100);
    };

    return (
        <div className={cn(
            "rounded-2xl p-5 max-w-md backdrop-blur-md shadow-xl transition-all duration-500 border",
            "bg-white/80 dark:bg-[#18181b]/95 border-black/5 dark:border-white/10 text-[#1d1d1f] dark:text-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none"
        )}>
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                    isSender
                        ? "bg-black/5 dark:bg-white/10 text-black dark:text-white"
                        : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                )}>
                    <BarChart3 size={20} />
                </div>
                <div className="flex-1">
                    <h4 className={cn(
                        "font-bold text-lg leading-tight transition-colors",
                        "text-[#1d1d1f] dark:text-white"
                    )}>{question}</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 font-black uppercase tracking-widest">
                        {allowMultiple ? 'Multiple choices' : 'Single choice'} • {totalVotes} votes
                    </p>
                </div>
            </div>

            {/* Options */}
            <div className="space-y-2.5 mb-2">
                {options.map((option, index) => {
                    const percentage = getPercentage(option);
                    const isSelected = selectedIndexes.includes(index);
                    const voteCount = votes[option] || 0;

                    // Duplicate logic fix: map by Index
                    return (
                        <motion.button
                            key={index}
                            onClick={() => handleOptionClick(index)}
                            disabled={hasVoted || isSender}
                            whileHover={(!hasVoted && !isSender) ? { scale: 1.01 } : {}}
                            whileTap={(!hasVoted && !isSender) ? { scale: 0.99 } : {}}
                            className={cn(
                                "w-full text-left p-3 rounded-xl transition-all relative overflow-hidden group/poll-opt hover:bg-neutral-50 dark:hover:bg-white/5",
                                hasVoted || isSender
                                    ? "bg-neutral-50 dark:bg-zinc-800/40 cursor-default"
                                    : isSelected
                                        ? 'bg-emerald-500/20 border-2 border-emerald-500/50 shadow-inner'
                                        : "bg-neutral-50/50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 hover:border-emerald-500/30"
                            )}
                        >
                            {/* Progress Bar */}
                            {(hasVoted || isSender) && (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className={`absolute inset-0 opacity-20 ${isSender ? 'bg-white' : 'bg-gradient-to-r from-emerald-500 to-blue-500'}`}
                                />
                            )}

                            {/* Content */}
                            <div className="relative flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-5 h-5 flex items-center justify-center transition-all",
                                        allowMultiple ? 'rounded-md' : 'rounded-full',
                                        isSelected
                                            ? 'bg-emerald-500 border-none'
                                            : 'border-2 border-zinc-500/50'
                                    )}>
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                    <span className={cn(
                                        "text-sm font-bold transition-colors",
                                        "text-[#1d1d1f] dark:text-zinc-200"
                                    )}>{option}</span>
                                </div>

                                {/* Results View */}
                                {(hasVoted || isSender) && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-400">{voteCount}</span>
                                        <span className={`text-xs font-bold ${isSender ? 'text-white' : 'text-emerald-400'}`}>{percentage}%</span>
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Vote Button (Hidden for Sender) */}
            {!isSender && !hasVoted && (
                <div className="mt-4">
                    <motion.button
                        onClick={handleVote}
                        disabled={selectedIndexes.length === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg",
                            selectedIndexes.length > 0
                                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-emerald-500/20'
                                : "bg-neutral-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                        )}
                    >
                        {selectedIndexes.length > 0 ? 'Submit Protocol' : 'Select Command'}
                    </motion.button>
                </div>
            )}

            {/* Footer Status */}
            {hasVoted && !isSender && (
                <div className="mt-4 flex items-center justify-center gap-2 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">Vote Submitted</span>
                </div>
            )}
            {isSender && (
                <div className="mt-3 text-center">
                    <span className="text-xs text-zinc-500 italic">You created this poll • Live Results</span>
                </div>
            )}
        </div>
    );
};

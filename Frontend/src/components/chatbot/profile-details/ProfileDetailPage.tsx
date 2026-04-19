import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { IdentitySection } from './IdentitySection';
import { QuickActions } from './QuickActions';
import { InteractionHistory } from './InteractionHistory';
import { SecurityControl } from './SecurityControl';
import { AnimatePresence, motion } from 'framer-motion';
import { InputGrid } from '../utils/InputGrid';
import { SlotPicker } from '../pickers/SlotPicker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Conversation } from '../types';
import { format } from 'date-fns';

interface ProfileDetailPageProps {
    conversation: Conversation;
    onClose: () => void;
    onFilterRequest?: (type: string) => void;
}

export const ProfileDetailPage: React.FC<ProfileDetailPageProps> = ({ conversation, onClose, onFilterRequest }) => {
    // Scroll tracking for sticky effects
    const [scrolled, setScrolled] = useState(false);

    // Modal states
    const [showInputGrid, setShowInputGrid] = useState(false);
    const [showSlotPicker, setShowSlotPicker] = useState(false);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full w-full bg-white dark:bg-neutral-950 flex flex-col overflow-hidden relative font-sans z-50 shadow-2xl"
            >
                {/* 1. Initial State Close Button (Visible when not scrolled) */}
                <AnimatePresence>
                    {!scrolled && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-6 right-6 z-[110]"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-10 w-10 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-red-500 transition-all shadow-sm"
                            >
                                <X size={20} />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. Scroll-Triggered Header */}
                <QuickActions scrolled={scrolled} conversation={conversation} onClose={onClose} />

                {/* Main Scrollable Content */}
                <div
                    className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative"
                    onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 120)}
                >
                    <div className="w-full mx-auto pb-20 relative">

                        {/* 1. Identity Core (Clean List View) */}
                        <div className="pt-16 pb-8 px-4 flex justify-center w-full">
                            <IdentitySection
                                conversation={conversation}
                                onScheduleClick={() => setShowSlotPicker(true)}
                                onCallClick={() => toast.info("Calling functionality coming soon!")}
                            />
                        </div>

                        {/* 7-Pillar Content Grid */}
                        <div className="px-4 flex flex-col items-center gap-8 mt-6 w-full">


                            {/* 4. Time Machine */}
                            <div className="w-full ">
                                <InteractionHistory
                                    onNavigateToChat={(date) => {
                                        toast.success(`Traveling to ${format(date, 'MMM dd, yyyy')}...`);
                                        setTimeout(() => {
                                            onClose();
                                        }, 1000);
                                    }}
                                />
                            </div>

                            {/* 7. Security Control */}
                            <div className="w-full">
                                <SecurityControl conversation={conversation} />
                            </div>

                        </div>
                    </div>
                </div>

                {/* --- MODALS & PORTS --- */}
                <InputGrid
                    isOpen={showInputGrid}
                    onClose={() => setShowInputGrid(false)}
                    onSelect={(type) => {
                        if (type === 'booking') {
                            setShowSlotPicker(true);
                        }
                    }}
                />

                <SlotPicker
                    isOpen={showSlotPicker}
                    onClose={() => setShowSlotPicker(false)}
                    onSelect={(slot) => {
                        // Success flow as requested
                        toast.success(`Booking sequence complete! SMS sent to ${conversation.userMobile || conversation.userPhone || 'user'}.`);
                        setShowSlotPicker(false);

                        // Small delay then redirect to chat (by closing detail view)
                        setTimeout(() => {
                            onClose();
                        }, 1000);
                    }}
                />
            </motion.div>
        </AnimatePresence>
    );
};

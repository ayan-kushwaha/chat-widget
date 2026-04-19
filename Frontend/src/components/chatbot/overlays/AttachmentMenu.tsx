import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video } from 'lucide-react';

interface AttachmentMenuProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement>;
    onFileSelect: (file: File) => void; // Callback to parent
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ isOpen, onClose, triggerRef, onFileSelect }) => {
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 📍 Calculate Position
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.top - 160,
                left: rect.left
            });
        }
    }, [isOpen, triggerRef]);

    // 🖱️ Handle Outside Click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!isOpen) return;
            if (triggerRef.current && triggerRef.current.contains(event.target as Node)) {
                return;
            }
            const menuElement = document.getElementById('attachment-menu-portal');
            if (menuElement && !menuElement.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, triggerRef]);

    // 📤 Handle File Selection
    const handleFileSelect = (type: 'media' | 'file') => {
        const input = document.createElement('input');
        input.type = 'file';
        // Accept images, videos, and audio for "Photo & Video"
        input.accept = type === 'media' ? 'image/*,video/*,audio/*' : '.pdf,.doc,.docx';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                onFileSelect(file); // Pass to parent
                onClose(); // Close menu
            }
        };
        input.click();
    };

    if (!isMounted || typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    id="attachment-menu-portal"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        zIndex: 99999
                    }}
                    className="bg-[#1e1e1e]/90 backdrop-blur-xl border border-white/10 p-2 rounded-xl shadow-2xl min-w-[180px] overflow-hidden"
                >
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => handleFileSelect('media')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors w-full text-left group"
                        >
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                <Video size={16} />
                            </div>
                            Photo & Video
                        </button>
                        <button
                            onClick={() => handleFileSelect('file')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors w-full text-left group"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <div className="w-4 h-4 border-[1.5px] border-current rounded-sm flex items-center justify-center">
                                    <div className="w-2 h-[1.5px] bg-current rounded-full" />
                                </div>
                            </div>
                            Document
                        </button>
                        <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors w-full text-left group">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-8m0 0V4m0 8h8m-8 0H4" /></svg>
                            </div>
                            Poll
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

"use client";

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, Map as MapIcon, Check } from 'lucide-react';

interface LocationPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: any) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ isOpen, onClose, onSend }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [selectedLoc, setSelectedLoc] = useState<{ lat: number; lng: number; address: string } | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Mock Location Selection
    const handleMockSelect = () => {
        const mockLoc = {
            lat: 28.6139,
            lng: 77.2090,
            address: "Connaught Place, New Delhi, Delhi 110001"
        };
        setSelectedLoc(mockLoc);
    };

    const handleSend = () => {
        if (!selectedLoc) return;
        onSend({
            ...selectedLoc,
            type: 'location'
        });
        onClose();
        setSelectedLoc(null);
    };

    if (!isMounted || typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 flex items-center justify-center z-[10001] p-4"
                    >
                        <div className="bg-[#1a1f2e] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden flex flex-col h-[500px]">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 z-10 bg-[#1a1f2e]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                        <MapIcon size={20} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Share Location</h3>
                                        <p className="text-xs text-zinc-500">Pick a location to send</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Map Area (Mock) */}
                            <div className="flex-1 relative bg-zinc-800 overflow-hidden group cursor-crosshair" onClick={handleMockSelect}>
                                {/* Background Map Image Pattern */}
                                <div className="absolute inset-0 opacity-20" style={{
                                    backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}></div>

                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <p className="text-zinc-500 font-bold opacity-50 group-hover:opacity-100 transition-opacity">Click anywhere to drop pin</p>
                                </div>

                                {selectedLoc && (
                                    <motion.div
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                    >
                                        <MapPin size={48} className="text-orange-500 drop-shadow-2xl fill-orange-500/20" />
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 bg-[#1a1f2e] border-t border-white/10 space-y-3">
                                {selectedLoc ? (
                                    <div className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                                        <MapPin size={20} className="text-orange-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{selectedLoc.address}</p>
                                            <p className="text-xs text-zinc-500">{selectedLoc.lat.toFixed(4)}, {selectedLoc.lng.toFixed(4)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleMockSelect}
                                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-white/5 transition-colors"
                                    >
                                        <Navigation size={18} />
                                        Use Current Location
                                    </button>
                                )}

                                <button
                                    disabled={!selectedLoc}
                                    onClick={handleSend}
                                    className={`
                                        w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                        ${selectedLoc
                                            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
                                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed hidden'
                                        }
                                    `}
                                >
                                    Share Location
                                    <Check size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

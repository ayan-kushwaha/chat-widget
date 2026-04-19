import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkillManager } from './SkillManagerContext';
import { Settings, LayoutGrid, Palette, Bell, MessageSquare, ChevronLeft } from 'lucide-react';

export default function AppSettingsSkill() {
    const { activeSkill, setActiveSkill, menuStyle, setMenuStyle } = useSkillManager();
    const isVisible = activeSkill === 'app_settings';

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="absolute inset-0 flex flex-col bg-[#0c0c0e] rounded-[17%] z-[300] overflow-hidden pointer-events-auto shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] border-4 border-[#1a1a20]"
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => { e.preventDefault(); setActiveSkill('menu'); }}
            >
                {/* Header */}
                <div className="flex items-center px-1.5 py-1 bg-white/5 border-b border-white/10 shadow-sm z-10 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveSkill('menu'); }}
                        className="text-blue-400 hover:text-blue-300 p-0.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft size={6} />
                    </button>
                    <div className="flex-1 text-center font-bold text-white/90 text-[5px] tracking-wide pr-2">
                        Settings
                    </div>
                </div>

                {/* Settings List */}
                <div className="flex-1 overflow-y-auto w-full px-1.5 py-1 pb-4 space-y-1 relative no-scrollbar" style={{ scrollbarWidth: 'none' }}>

                    {/* Menu Style Setting */}
                    <div className="flex flex-col gap-0.5 p-1 bg-white/5 rounded-md border border-white/5 shadow-inner">
                        <div className="flex items-center gap-1 mb-0.5">
                            <div className="p-0.5 bg-indigo-500/20 rounded-[2px] text-indigo-400">
                                <LayoutGrid size={5} />
                            </div>
                            <span className="text-white/80 text-[4.5px] font-medium leading-none">Layout</span>
                        </div>
                        <div className="flex bg-[#111] rounded-[2px] p-[1px] border border-white/10">
                            <button
                                onClick={() => setMenuStyle('classic')}
                                className={`flex-1 py-0.5 text-[4px] rounded-[1px] transition-all leading-none ${menuStyle === 'classic' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                Ring
                            </button>
                            <button
                                onClick={() => setMenuStyle('modern')}
                                className={`flex-1 py-0.5 text-[4px] rounded-[1px] transition-all leading-none ${menuStyle === 'modern' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                Hex
                            </button>
                        </div>
                    </div>

                    {/* Theme Setting (Placeholder) */}
                    <button className="w-full flex items-center justify-between p-1 bg-white/5 hover:bg-white/10 rounded-md border border-white/5 transition-colors">
                        <div className="flex items-center gap-1">
                            <div className="p-0.5 bg-orange-500/20 rounded-[2px] text-orange-400">
                                <Palette size={5} />
                            </div>
                            <span className="text-white/80 text-[4.5px] font-medium leading-none">Color</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ring-[0.5px] ring-white/20"></div>
                    </button>

                    {/* Notifications (Placeholder) */}
                    <button className="w-full flex items-center justify-between p-1 bg-white/5 hover:bg-white/10 rounded-md border border-white/5 transition-colors">
                        <div className="flex items-center gap-1">
                            <div className="p-0.5 bg-red-500/20 rounded-[2px] text-red-400">
                                <Bell size={5} />
                            </div>
                            <span className="text-white/80 text-[4.5px] font-medium leading-none">Notifications</span>
                        </div>
                        <div className="w-3 h-[6px] bg-green-500 rounded-full flex items-center justify-end px-[1px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                            <div className="w-[4px] h-[4px] bg-white rounded-full shadow-sm"></div>
                        </div>
                    </button>

                    {/* Chat Settings (Placeholder) */}
                    <button className="w-full flex items-center justify-between p-1 bg-white/5 hover:bg-white/10 rounded-md border border-white/5 transition-colors">
                        <div className="flex items-center gap-1">
                            <div className="p-0.5 bg-green-500/20 rounded-[2px] text-green-400">
                                <MessageSquare size={5} />
                            </div>
                            <span className="text-white/80 text-[4.5px] font-medium leading-none">Chat</span>
                        </div>
                        <span className="text-gray-500 text-[4px] leading-none">Std ›</span>
                    </button>

                </div>
            </motion.div>
        </AnimatePresence>
    );
}

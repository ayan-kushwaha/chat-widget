import React from 'react';
import { Play, Edit, Copy, TrendingUp, Trash2, Unplug, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextMenuProps {
    x: number;
    y: number;
    nodeId: string;
    onClose: () => void;
    onAction: (action: string, nodeId: string) => void;
}

export const ContextMenu = ({ x, y, nodeId, onClose, onAction }: ContextMenuProps) => {

    // Prevent menu from going off-screen (basic bounds check could be added here if needed)

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="fixed z-50 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-lg overflow-hidden flex flex-col py-1 text-slate-200"
                style={{ top: y, left: x }}
                onClick={(e) => e.stopPropagation()} // Prevent click from closing immediately if handled upstream
            >
                {/* Header / ID */}
                <div className="px-3 py-2 border-b border-slate-800 text-[10px] text-slate-500 font-mono uppercase tracking-wider flex justify-between items-center">
                    <span>Node: {nodeId.substring(0, 8)}...</span>
                    <button onClick={onClose} className="hover:text-white"><X size={12} /></button>
                </div>

                {/* Actions */}
                <div className="p-1 space-y-0.5">
                    <MenuItem
                        icon={Play} label="Run Single Node"
                        onClick={() => onAction('run', nodeId)}
                        shortcut="Shift+R"
                        className="text-green-400 hover:bg-green-500/10 hover:text-green-300"
                    />

                    <div className="h-px bg-slate-800 my-1 mx-2"></div>

                    <MenuItem
                        icon={Edit} label="Edit Properties"
                        onClick={() => onAction('edit', nodeId)}
                    />
                    <MenuItem
                        icon={Copy} label="Duplicate"
                        onClick={() => onAction('duplicate', nodeId)}
                        shortcut="Ctrl+D"
                    />
                    <MenuItem
                        icon={Unplug} label="Disconnect All"
                        onClick={() => onAction('disconnect', nodeId)}
                    />

                    <div className="h-px bg-slate-800 my-1 mx-2"></div>

                    <MenuItem
                        icon={Trash2} label="Delete Node"
                        onClick={() => onAction('delete', nodeId)}
                        shortcut="Del"
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

const MenuItem = ({ icon: Icon, label, onClick, shortcut, className = "" }: any) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded hover:bg-slate-800 transition-colors ${className}`}
    >
        <div className="flex items-center gap-2">
            <Icon size={14} />
            <span>{label}</span>
        </div>
        {shortcut && <span className="text-[10px] text-slate-600 font-mono">{shortcut}</span>}
    </button>
);

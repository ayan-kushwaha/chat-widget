
import React, { useState } from 'react';
import { Plus, MoreVertical } from 'lucide-react';

interface SidebarHeaderProps {
    onOpenNewChat: () => void;
    onOpenSettings: () => void;
    onOpenCreateGroup?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
    onOpenNewChat,
    onOpenSettings,
    onOpenCreateGroup
}) => {

    return (
        <div className="space-y-4">
            <div className="flex p-2 pb-0 items-center justify-between">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Chats</h2>
                <div className="flex items-center gap-1">


                    <button
                        onClick={onOpenNewChat}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                    >
                        <Plus size={20} />
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                    >
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

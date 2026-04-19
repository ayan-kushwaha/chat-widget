"use client";

import React from 'react';
import { FileText, Download, File } from 'lucide-react';

interface DocumentCardProps {
    fileName: string;
    fileSize?: string;
    fileType?: string;
    url?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ fileName, fileSize = "Unknown Size", fileType = "PDF", url = "#" }) => {
    return (
        <div className="bg-[#1e293b] border border-zinc-700/50 rounded-xl overflow-hidden max-w-[280px] group shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <FileText size={20} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{fileName}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-medium">{fileType} • {fileSize}</p>
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Download size={18} />
                </a>
            </div>
        </div>
    );
};

"use client";

import React from "react";
import { Upload, FileText, X, CheckCircle2, ShieldCheck, Plus, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FileCanvasProps {
    file: File | null;
    onFileChange: (file: File | null) => void;
    existingSource?: any;
}

export function FileCanvas({ file, onFileChange, existingSource }: FileCanvasProps) {
    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return <FileText className="w-10 h-10 text-red-500" />;
            case 'docx': return <FileText className="w-10 h-10 text-blue-500" />;
            case 'csv':
            case 'json': return <Database className="w-10 h-10 text-amber-500" />;
            default: return <FileText className="w-10 h-10 text-emerald-500" />;
        }
    };

    const showPreview = file || existingSource;
    const fileName = file?.name || existingSource?.fileName || existingSource?.name || "Unknown File";
    const fileSize = file?.size || existingSource?.size || 0;

    return (
        <div className="w-full max-w-5xl mx-auto py-10 px-4">
            <div className="text-center space-y-6 mb-16">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Secure Knowledge Indexing
                </div>
                <h2 className="text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                    Feed your AI with <span className="text-emerald-500">Documents.</span>
                </h2>
                <p className="text-neutral-500 max-w-xl mx-auto text-sm leading-relaxed font-medium">
                    Upload your project files, research papers, or documentation. Cluiaz supports local context for better AI accuracy.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {!showPreview ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="relative group h-[450px]"
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
                            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                            accept=".pdf,.txt,.docx,.md,.csv,.json"
                        />
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="h-full border-[3px] border-dashed border-neutral-200 dark:border-neutral-800 rounded-[40px] flex flex-col items-center justify-center p-12 transition-all duration-500 group-hover:border-emerald-500/50 group-hover:bg-white/5 backdrop-blur-sm shadow-2xl group-hover:scale-[1.02] bg-white/50 dark:bg-neutral-900/50">
                            <div className="relative mb-10">
                                <motion.div
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="w-28 h-28 bg-white dark:bg-neutral-900 rounded-[32px] flex items-center justify-center shadow-2xl border border-neutral-100 dark:border-neutral-800 relative z-10"
                                >
                                    <Upload className="w-12 h-12 text-emerald-500" />
                                </motion.div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl z-20 border-4 border-white dark:border-neutral-900">
                                    <Plus className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black mb-3 text-neutral-900 dark:text-white">Drag & drop your files</h3>
                            <p className="text-neutral-400 text-sm max-w-sm text-center font-medium leading-relaxed">
                                PDF, DOCX, TXT, CSV, JSON & Markdown supported.<br />
                                <span className="text-emerald-500 font-bold mt-2 block">Max file size: 10MB</span>
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="relative group max-w-2xl mx-auto"
                    >
                        <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] opacity-40" />
                        <div className="relative p-10 rounded-[40px] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col items-center text-center space-y-8 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20" />

                            <div className="relative">
                                <div className="w-24 h-24 bg-emerald-500/10 rounded-[28px] flex items-center justify-center relative shadow-inner">
                                    {getFileIcon(fileName)}
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl ring-4 ring-white dark:ring-neutral-900"
                                >
                                    <CheckCircle2 className="w-6 h-6" />
                                </motion.div>
                            </div>

                            <div className="space-y-2 w-full">
                                <h3 className="text-3xl font-black text-neutral-900 dark:text-white truncate px-4">{fileName}</h3>
                                <div className="flex items-center justify-center gap-4">
                                    <Badge variant="outline" className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-500">
                                        {formatBytes(fileSize)}
                                    </Badge>
                                    <Badge variant="outline" className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-emerald-500/30 bg-emerald-500/5 text-emerald-500">
                                        {existingSource && !file ? "Currently Indexed" : "Validated"}
                                    </Badge>
                                </div>
                            </div>

                            <div className="pt-6 w-full flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        onFileChange(null);
                                        // Trigger a reload or UI state change to show dropzone
                                        const event = new CustomEvent('clear-existing-source');
                                        document.dispatchEvent(event);
                                    }}
                                    className="flex-1 h-14 rounded-2xl border-neutral-200 dark:border-neutral-800 hover:bg-red-500/5 hover:text-red-500 hover:border-red-500/50 transition-all font-black uppercase tracking-wider text-[11px]"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Change File
                                </Button>
                                <div className="flex-1 flex items-center justify-center bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                                        {existingSource && !file ? "Metadata Mode" : "Ready to Save"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-20 flex justify-center gap-12 border-t border-neutral-100 dark:border-neutral-800 pt-10 opacity-60 grayscale hover:grayscale-0 transition-all">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Cloud Storage</span>
                </div>
            </div>
        </div>
    );
}


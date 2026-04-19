import React from 'react';
import { FolderOpen, Image as ImageIcon, FileText, Music, Link as LinkIcon, DownloadCloud } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

interface VaultGalleryProps {
    onFilterRequest?: (type: string) => void;
}

export const VaultGallery: React.FC<VaultGalleryProps> = ({ onFilterRequest }) => {
    return (
        <div className="flex flex-col gap-6 w-full">
            <SectionHeader title="Shared Vault" icon={FolderOpen} />

            <div className="bg-zinc-900/40 dark:bg-black/20 border border-zinc-800/50 rounded-[2.5rem] p-4 md:p-6 relative overflow-hidden transition-all min-h-[400px]">
                <Tabs defaultValue="media" className="w-full h-full flex flex-col">
                    <TabsList className="bg-black/40 p-1 rounded-2xl border border-white/5 w-full flex mb-8">
                        <TabTrigger value="media" label="Media" icon={ImageIcon} />
                        <TabTrigger value="docs" label="Docs" icon={FileText} />
                        <TabTrigger value="audio" label="Audio" icon={Music} />
                        <TabTrigger value="links" label="Links" icon={LinkIcon} />
                    </TabsList>

                    <TabsContent value="media" className="mt-0 flex-1">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex gap-4 pb-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        key={i}
                                        onClick={() => onFilterRequest?.('media')}
                                        className="w-[180px] aspect-square bg-zinc-800 rounded-3xl overflow-hidden relative group cursor-pointer border border-white/5 shrink-0"
                                    >
                                        <img
                                            src={`https://picsum.photos/seed/vault-${i}/400`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">View in Chat</span>
                                        </div>
                                    </motion.div>
                                ))}
                                <ViewAllCard count={12} onClick={() => onFilterRequest?.('media')} />
                            </div>
                            <ScrollBar orientation="horizontal" className="h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="docs" className="mt-0 flex-1">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex gap-4 pb-4">
                                <DocCard name="Proposal.pdf" type="PDF" onClick={() => onFilterRequest?.('document')} />
                                <DocCard name="Invoice.pdf" type="PDF" onClick={() => onFilterRequest?.('document')} />
                                <DocCard name="Q4_Review.xlsx" type="XLS" onClick={() => onFilterRequest?.('document')} />
                                <ViewAllCard count={3} onClick={() => onFilterRequest?.('document')} />
                            </div>
                            <ScrollBar orientation="horizontal" className="h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="audio" className="mt-0 flex-1">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex gap-4 pb-4">
                                {[1, 2].map((i) => (
                                    <AudioCard key={i} name={`Recording_${i}.mp3`} onClick={() => onFilterRequest?.('audio')} />
                                ))}
                                <ViewAllCard count={2} onClick={() => onFilterRequest?.('audio')} />
                            </div>
                            <ScrollBar orientation="horizontal" className="h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="links" className="mt-0 flex-1">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex gap-4 pb-4">
                                <LinkCard name="GitHub Repository" url="github.com/cluaiz" onClick={() => onFilterRequest?.('links')} />
                                <LinkCard name="Project Portfolio" url="cluaiz.com/docs" onClick={() => onFilterRequest?.('links')} />
                                <LinkCard name="Figma Design" url="figma.com/file/..." onClick={() => onFilterRequest?.('links')} />
                                <ViewAllCard count={5} onClick={() => onFilterRequest?.('links')} />
                            </div>
                            <ScrollBar orientation="horizontal" className="h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

const SectionHeader = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-4 opacity-80 mt-12 mb-6 px-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3 italic">
            <Icon size={14} className="text-zinc-600" /> {title}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
);

const TabTrigger = ({ value, label, icon: Icon }: any) => (
    <TabsTrigger value={value} className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-emerald-500 data-[state=active]:text-black shadow-none transition-all py-2 gap-2">
        <Icon size={14} /> {label}
    </TabsTrigger>
);

const DocCard = ({ name, type, onClick }: any) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className="w-[180px] aspect-square bg-zinc-900/50 dark:bg-black/40 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group flex flex-col items-center justify-center gap-4 shrink-0 relative overflow-hidden"
    >
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-[10px] font-black text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black transition-all">
            {type}
        </div>
        <div className="text-center px-4">
            <div className="text-[11px] font-black text-white uppercase tracking-tight truncate w-full">{name}</div>
            <div className="text-[9px] text-zinc-600 font-black uppercase mt-1">Stored in Vault</div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
    </motion.div>
);

const AudioCard = ({ name, onClick }: any) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className="w-[180px] aspect-square bg-zinc-900/50 dark:bg-black/40 rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer group flex flex-col items-center justify-center gap-4 shrink-0"
    >
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black transition-all">
            <Music size={24} />
        </div>
        <div className="text-center px-4">
            <div className="text-[11px] font-black text-white uppercase tracking-tight truncate w-full">{name}</div>
            <div className="text-[9px] text-zinc-600 font-black uppercase mt-1">Audio Clip</div>
        </div>
    </motion.div>
);

const LinkCard = ({ name, url, onClick }: any) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className="w-[180px] aspect-square bg-zinc-900/50 dark:bg-black/40 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group flex flex-col items-center justify-center gap-4 shrink-0"
    >
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-black transition-all">
            <LinkIcon size={24} />
        </div>
        <div className="text-center px-4 w-full">
            <div className="text-[11px] font-black text-white uppercase tracking-tight truncate w-full">{name}</div>
            <div className="text-[9px] text-zinc-600 font-black uppercase mt-1 truncate w-full">{url}</div>
        </div>
    </motion.div>
);

const ViewAllCard = ({ count, onClick }: { count: number, onClick: () => void }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className="w-[180px] aspect-square bg-emerald-500/5 rounded-3xl border-2 border-dashed border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all cursor-pointer shrink-0 flex flex-col items-center justify-center gap-2 group"
    >
        <span className="text-2xl font-black text-emerald-500 group-hover:scale-110 transition-transform">+{count}</span>
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">View All</span>
    </motion.div>
);

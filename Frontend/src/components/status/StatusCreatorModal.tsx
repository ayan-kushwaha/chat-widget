"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Type, Image as ImageIcon, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusCreatorModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: StatusData) => void;
}

interface StatusData {
    type: 'text' | 'image';
    content: string;
    styling?: {
        fontFamily?: string;
        backgroundColor?: string;
        textColor?: string;
    };
    startTime: Date;
    endTime: Date;
}

export const StatusCreatorModal: React.FC<StatusCreatorModalProps> = ({ open, onClose, onSubmit }) => {
    const [activeTab, setActiveTab] = useState<'text' | 'image' | 'settings'>('text');
    const [statusType, setStatusType] = useState<'text' | 'image'>('text');

    // 🎨 Rich Text State
    const [fontFamily, setFontFamily] = useState('Inter');
    const [bgColor, setBgColor] = useState('#000000');
    const [textColor, setTextColor] = useState('#ffffff');

    // 📅 Scheduling State
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [endTime, setEndTime] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // +7 days

    // 🖼️ Image State
    const [imageUrl, setImageUrl] = useState('');

    // 🔥 TipTap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'What\'s happening in your business?'
            })
        ],
        content: '',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] p-4'
            }
        }
    });

    const handleSubmit = () => {
        const content = statusType === 'text'
            ? editor?.getText() || ''
            : imageUrl;

        onSubmit({
            type: statusType,
            content,
            styling: statusType === 'text' ? {
                fontFamily,
                backgroundColor: bgColor,
                textColor
            } : undefined,
            startTime,
            endTime
        });

        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] bg-[#0b141a] border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="text-emerald-500" size={24} />
                        Create Business Status
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 bg-white/5">
                        <TabsTrigger value="text" className="flex items-center gap-2">
                            <Type size={16} /> Rich Text
                        </TabsTrigger>
                        <TabsTrigger value="image" className="flex items-center gap-2">
                            <ImageIcon size={16} /> Media
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings size={16} /> Schedule
                        </TabsTrigger>
                    </TabsList>

                    {/* 📝 TAB 1: RICH TEXT EDITOR */}
                    <TabsContent value="text" className="flex-1 flex flex-col gap-4 mt-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs text-zinc-400 uppercase tracking-wider">Font</Label>
                                <Select value={fontFamily} onValueChange={setFontFamily}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Inter">Modern (Inter)</SelectItem>
                                        <SelectItem value="'Courier New'">Typewriter</SelectItem>
                                        <SelectItem value="Georgia">Serif</SelectItem>
                                        <SelectItem value="'Comic Sans MS'">Handwriting</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs text-zinc-400 uppercase tracking-wider">Background</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={bgColor}
                                        onChange={(e) => setBgColor(e.target.value)}
                                        className="w-16 h-10 cursor-pointer"
                                    />
                                    <Input
                                        value={bgColor}
                                        onChange={(e) => setBgColor(e.target.value)}
                                        className="flex-1 bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-zinc-400 uppercase tracking-wider">Text Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={textColor}
                                        onChange={(e) => setTextColor(e.target.value)}
                                        className="w-16 h-10 cursor-pointer"
                                    />
                                    <Input
                                        value={textColor}
                                        onChange={(e) => setTextColor(e.target.value)}
                                        className="flex-1 bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 🎨 LIVE PREVIEW */}
                        <div
                            className="flex-1 rounded-xl border border-white/10 overflow-hidden"
                            style={{
                                backgroundColor: bgColor,
                                fontFamily,
                                color: textColor
                            }}
                        >
                            <EditorContent editor={editor} />
                        </div>
                    </TabsContent>

                    {/* 🖼️ TAB 2: IMAGE UPLOAD */}
                    <TabsContent value="image" className="flex-1 flex flex-col gap-4 mt-4">
                        <div className="flex-1 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <ImageIcon size={48} className="mx-auto text-zinc-600" />
                                <div>
                                    <Label htmlFor="image-upload" className="text-sm text-zinc-400 cursor-pointer hover:text-white">
                                        Click to upload or drag & drop
                                    </Label>
                                    <Input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const url = URL.createObjectURL(file);
                                                setImageUrl(url);
                                                setStatusType('image');
                                            }
                                        }}
                                    />
                                </div>
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="max-w-md max-h-96 mx-auto rounded-lg"
                                    />
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ⚙️ TAB 3: SCHEDULING */}
                    <TabsContent value="settings" className="flex-1 flex flex-col gap-6 mt-4">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm text-zinc-300 mb-2 block">Start Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={startTime.toISOString().slice(0, 16)}
                                    onChange={(e) => setStartTime(new Date(e.target.value))}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>

                            <div>
                                <Label className="text-sm text-zinc-300 mb-2 block">End Time (Auto-delete)</Label>
                                <Input
                                    type="datetime-local"
                                    value={endTime.toISOString().slice(0, 16)}
                                    onChange={(e) => setEndTime(new Date(e.target.value))}
                                    className="bg-white/5 border-white/10"
                                />
                                <p className="text-xs text-zinc-500 mt-1">
                                    Status will automatically disappear after this time
                                </p>
                            </div>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                                <p className="text-sm text-emerald-400 font-medium">
                                    📅 Duration: {Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24))} days
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* 🚀 ACTION BUTTONS */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
                    >
                        Post Status
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

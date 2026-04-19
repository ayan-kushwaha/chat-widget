"use client";

import React from "react";
import { Plus, Globe, FileText, Type, UploadCloud, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AddKnowledgeDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Data Source
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Add Knowledge</DialogTitle>
                    <DialogDescription>
                        Train your AI with data from various sources.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="website" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="website">
                            <Globe className="mr-2 h-4 w-4" />
                            Website
                        </TabsTrigger>
                        <TabsTrigger value="file">
                            <FileText className="mr-2 h-4 w-4" />
                            File
                        </TabsTrigger>
                        <TabsTrigger value="text">
                            <Type className="mr-2 h-4 w-4" />
                            Text
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        <TabsContent value="website" className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="url">Website URL</Label>
                                <Input id="url" placeholder="https://example.com" />
                                <p className="text-xs text-neutral-500">
                                    We will crawl this website and extract text content.
                                </p>
                                <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/5 border border-blue-500/20 rounded-md text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                    <Activity className="h-3 w-3" />
                                    ESTIMATED BURN: 1x (approx. 200 tokens per page)
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="file" className="space-y-4">
                            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 py-10 dark:border-neutral-800 dark:bg-neutral-900/50">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                    <UploadCloud className="h-6 w-6" />
                                </div>
                                <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-white">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    PDF, TXT, DOCX up to 10MB
                                </p>
                                <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/5 border border-orange-500/20 rounded-md text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                                    <Activity className="h-3 w-3" />
                                    ESTIMATED BURN: 1x (approx. 500 tokens per MB)
                                </div>
                                <Input type="file" className="hidden" />
                            </div>
                        </TabsContent>

                        <TabsContent value="text" className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" placeholder="e.g. Return Policy" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea id="content" placeholder="Paste your text here..." className="min-h-[150px]" />
                                <div className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/5 border border-purple-500/20 rounded-md text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                                    <Activity className="h-3 w-3" />
                                    ESTIMATED BURN: 0.5x (Manual Training Reward)
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button type="submit" className="w-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                        Add Source
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

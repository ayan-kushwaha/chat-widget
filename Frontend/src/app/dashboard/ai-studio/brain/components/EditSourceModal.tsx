"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Import form components
import { WebsiteTab } from "./forms/WebsiteTab";
import { FileUploadTab } from "./forms/FileUploadTab";
import { ApiSourceTab } from "./forms/ApiSourceTab";
import { ManualEntryTab } from "./forms/ManualEntryTab";

interface EditSourceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData: any;
}

export function EditSourceModal({ open, onOpenChange, onSuccess, initialData }: EditSourceModalProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("website");

    useEffect(() => {
        if (open && initialData) {
            if (initialData.domain) {
                setActiveTab("website");
            } else if (initialData.title && initialData.content) {
                setActiveTab("manual");
            } else if (initialData.endpoint || (initialData.source === 'api')) {
                setActiveTab("api");
            } else {
                setActiveTab("file");
            }
        }
    }, [open, initialData]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
                onInteractOutside={(e) => {
                    // Prevent closing when clicking outside
                    e.preventDefault();
                }}
            >
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle>Edit Source</DialogTitle>
                    <DialogDescription>
                        Update your knowledge source details.
                    </DialogDescription>
                </DialogHeader>

                {/* Render the appropriate form for the source type */}
                <div className="flex flex-col flex-1 overflow-hidden p-6 pt-0">
                    {activeTab === "website" && (
                        <WebsiteTab
                            loading={loading}
                            onSuccess={onSuccess}
                            onOpenChange={onOpenChange}
                            mode="edit"
                            initialData={initialData}
                        />
                    )}

                    {activeTab === "file" && (
                        <FileUploadTab
                            loading={loading}
                            onSuccess={onSuccess}
                            onOpenChange={onOpenChange}
                            mode="edit"
                            initialData={initialData}
                        />
                    )}

                    {activeTab === "api" && (
                        <ApiSourceTab
                            loading={loading}
                            onSubmit={() => { }}
                            onSuccess={onSuccess}
                            onOpenChange={onOpenChange}
                            mode="edit"
                            initialData={initialData}
                        />
                    )}

                    {activeTab === "manual" && (
                        <ManualEntryTab
                            loading={loading}
                            onSuccess={onSuccess}
                            onOpenChange={onOpenChange}
                            mode="edit"
                            initialData={initialData}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

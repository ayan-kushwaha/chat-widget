import React from "react";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { CollapsibleSection } from "../shared/CollapsibleSection";
import { AutoResizeTextarea } from "../AutoResizeTextarea";

interface ProfileIdentityEditProps {
    org: {
        tagline?: string;
        businessDescription?: string;
    };
    isOpen: boolean;
    onToggle: (id: string) => void;
    onOrgChange: (field: string, value: string) => void;
}

export function ProfileIdentityEdit({
    org,
    isOpen,
    onToggle,
    onOrgChange,
}: ProfileIdentityEditProps) {
    return (
        <CollapsibleSection
            id="identity"
            title="Business Overview"
            icon={Building2}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <div className="grid sm:grid-cols-2 gap-4 pb-4 px-1">
                <div className="sm:col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Business Tagline</Label>
                        <span className="text-[10px] text-zinc-400">{(org.tagline || "").length}/140</span>
                    </div>
                    <AutoResizeTextarea
                        maxLength={140}
                        value={org.tagline || ""}
                        onChange={val => onOrgChange("tagline", val)}
                        placeholder="e.g. Revolutionizing AI workspace productivity"
                        className="min-h-[40px]"
                    />
                </div>
                <div className="sm:col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Company Overview</Label>
                        <span className="text-[10px] text-zinc-400">{(org.businessDescription || "").length}/1200</span>
                    </div>
                    <AutoResizeTextarea
                        maxLength={1200}
                        value={org.businessDescription || ""}
                        onChange={val => onOrgChange("businessDescription", val)}
                        placeholder="Briefly explain what your business does, who you serve, and the problem you solve. This helps our AI represent you better."
                        rows={4}
                        className="min-h-[100px] px-3 py-2 text-sm"
                    />
                </div>
            </div>
        </CollapsibleSection>
    );
}

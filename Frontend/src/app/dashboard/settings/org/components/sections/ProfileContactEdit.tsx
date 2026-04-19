import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Globe, Plus, Check, Trash2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "../shared/CollapsibleSection";
import {
    DropdownMenu as DropdownMenuUI,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SOCIAL_PLATFORMS, CONTACT_TYPES } from "../constants";

interface ProfileContactEditProps {
    org: {
        contactPhone?: string;
        contactEmail?: string;
        website?: string;
        contactChannels?: { id: string; type: string; value: string; enabled: boolean }[];
        socialLinks?: { id: string; platform: string; url: string; enabled: boolean }[];
    };
    isOpen: boolean;
    onToggle: (id: string) => void;
    onOrgChange: (field: string, value: any) => void;
}

export function ProfileContactEdit({ org, isOpen, onToggle, onOrgChange }: ProfileContactEditProps) {
    return (
        <CollapsibleSection
            id="contact"
            title="Contact Channels"
            icon={Phone}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <div className="space-y-6 pb-4">
                {/* Base Primary Contacts */}
                <div className="space-y-4 border-b border-neutral-100 dark:border-white/5 pb-6">
                    <Label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mb-2 block">Primary Channels</Label>

                    {/* Primary Phone */}
                    <div className="flex items-center gap-3 bg-[#0e0e0e]/40 p-3 rounded-[1.25rem] border border-neutral-100 dark:border-white/5 group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-500/10 border border-green-500/20">
                            <Phone className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 ml-1">Primary Phone</div>
                            <Input
                                value={org.contactPhone || ""}
                                onChange={e => onOrgChange("contactPhone", e.target.value)}
                                placeholder="+1 (555) 000-0000"
                                className="h-9 bg-[#0e0e0e]/40 dark:bg-zinc-900/40 text-sm border-white/5"
                            />
                        </div>
                    </div>

                    {/* Primary Email */}
                    <div className="flex items-center gap-3 bg-[#0e0e0e]/40 p-3 rounded-[1.25rem] border border-neutral-100 dark:border-white/5 group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/10 border border-blue-500/20">
                            <Mail className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 ml-1">Primary Email</div>
                            <Input
                                value={org.contactEmail || ""}
                                onChange={e => onOrgChange("contactEmail", e.target.value)}
                                placeholder="contact@business.com"
                                className="h-9 bg-[#0e0e0e]/40 dark:bg-zinc-900/40 text-sm border-white/5"
                            />
                        </div>
                    </div>

                    {/* Main Website */}
                    <div className="flex items-center gap-3 bg-[#0e0e0e]/40 p-3 rounded-[1.25rem] border border-neutral-100 dark:border-white/5 group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-500/10 border border-purple-500/20">
                            <Globe className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 ml-1">Main Website</div>
                            <Input
                                value={org.website || ""}
                                onChange={e => onOrgChange("website", e.target.value)}
                                placeholder="https://yourbusiness.com"
                                className="h-9 bg-[#0e0e0e]/40 dark:bg-zinc-900/40 text-sm border-white/5"
                            />
                        </div>
                    </div>
                </div>

                {/* Dynamic Contact Channels */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mr-2">Social Profiles</Label>
                        <DropdownMenuUI>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 border-dashed border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5">
                                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                                    Add Social
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/10 scrollbar-hide">
                                {SOCIAL_PLATFORMS.map((platform) => {
                                    const isSelected = (org.socialLinks || []).some((s: any) => s.platform === platform.value);
                                    return (
                                        <DropdownMenuItem
                                            key={platform.value}
                                            onClick={() => {
                                                if (isSelected) return;
                                                const newLink = {
                                                    id: Date.now().toString(),
                                                    platform: platform.value,
                                                    url: '',
                                                    enabled: true
                                                };
                                                onOrgChange("socialLinks", [...(org.socialLinks || []), newLink]);
                                            }}
                                            className="flex items-center justify-between gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-white/5"
                                        >
                                            <div className="flex items-center gap-2">
                                                <platform.icon className={cn("w-4 h-4", platform.value === 'twitter' ? 'text-neutral-900 dark:text-white' : platform.color)} />
                                                <span>{platform.label}</span>
                                            </div>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenuUI>
                    </div>

                    <div className="space-y-3">
                        {/* Render Dynamic Contact Items (If any left) */}
                        {(org.contactChannels || []).map((item: any) => {
                            const typeDef = CONTACT_TYPES.find(t => t.value === item.type);
                            const Icon = typeDef?.icon || MapPin;
                            return (
                                <div key={item.id} className="flex items-center gap-3 bg-[#0e0e0e]/40 p-3 rounded-[1.25rem] border border-neutral-100 dark:border-white/5 group">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 shadow-sm", typeDef?.color)}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 ml-1">{typeDef?.label}</div>
                                        <Input
                                            value={item.value}
                                            onChange={(e) => {
                                                const newChannels = (org.contactChannels || []).map((c: any) => c.id === item.id ? { ...c, value: e.target.value } : c);
                                                onOrgChange("contactChannels", newChannels);
                                            }}
                                            placeholder={typeDef?.placeholder}
                                            className="h-9 bg-[#0e0e0e]/40 dark:bg-zinc-900/40 text-sm border-white/5"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onOrgChange("contactChannels", (org.contactChannels || []).filter((c: any) => c.id !== item.id))}
                                        className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        })}

                        {/* Render Social Links */}
                        {(org.socialLinks || []).map((link: any) => {
                            const platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
                            const Icon = platform?.icon || Globe;
                            return (
                                <div key={link.id} className="flex items-center gap-3 bg-[#0e0e0e]/40 p-3 rounded-[1.25rem] border border-neutral-100 dark:border-white/5 group">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 shadow-sm", link.platform === 'twitter' ? 'text-neutral-900 dark:text-white' : platform?.color)}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 ml-1">{platform?.label}</div>
                                        <Input
                                            value={link.url}
                                            onChange={(e) => {
                                                const newSocials = (org.socialLinks || []).map((s: any) => s.id === link.id ? { ...s, url: e.target.value } : s);
                                                onOrgChange("socialLinks", newSocials);
                                            }}
                                            placeholder={platform?.placeholder}
                                            className="h-9 bg-[#0e0e0e]/40 dark:bg-zinc-900/40 text-sm border-white/5"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onOrgChange("socialLinks", (org.socialLinks || []).filter((s: any) => s.id !== link.id))}
                                        className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        })}

                        {(org.contactChannels?.length === 0 && org.socialLinks?.length === 0) && (
                            <div className="text-center py-6 text-neutral-400 text-xs italic bg-[#0e0e0e]/40 rounded-2xl border border-dashed border-neutral-200 dark:border-white/10">
                                No additional channels added yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CollapsibleSection>
    );
}

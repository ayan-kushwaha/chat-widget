"use client";
import React from "react";
import { Globe, Phone, MapPin, Mail, Building2, Target, Locate, Zap, Briefcase, Scale, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReadMoreText } from "../ReadMoreText";
import { CONTACT_TYPES, SOCIAL_PLATFORMS, DAYS } from "../constants";
import { INDUSTRIES, BUSINESS_MODELS, AUDIENCES, PRIMARY_GOALS, ACCOUNT_TYPES } from "../profileForm.schema";

const PREMIUM_CONTENT_STYLE = "text-lg text-neutral-800 dark:text-neutral-100 leading-relaxed font-black tracking-tight";

interface ProfileViewModeProps {
    org: {
        businessDescription?: string;
        heroOffering?: string;
        accountType?: string;
        industry?: string;
        subCategory?: string;
        targetAudience?: string;
        businessModel?: string;
        companySize?: string;
        primaryGoal?: string;
        contactPhone?: string;
        contactEmail?: string;
        website?: string;
        contactChannels?: { id: string; type: string; value: string; enabled: boolean }[];
        socialLinks?: { id: string; platform: string; url: string; enabled: boolean }[];
        operatingHours?: { enabled?: boolean; weeklyHours?: Record<string, { enabled: boolean; start: string; end: string }> };
        businessAddress?: { street?: string; city?: string; state?: string; country?: string; pincode?: string };
    };
    subCategoryOptions: { value: string; label: string; icon: string }[];
    countries: { value: string; label: string }[];
    states: { value: string; label: string }[];
    weeklyHours: Record<string, { enabled: boolean; start: string; end: string }>;
}

export function ProfileViewMode({ org, subCategoryOptions, countries, states, weeklyHours }: ProfileViewModeProps) {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* ── 1. Company Overview ── */}
            <section className="space-y-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Company Overview</h3>
                </div>
                <div className="rounded-[1.5rem] p-6 border border-neutral-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/20 backdrop-blur-xl shadow-xl">
                    <p className={PREMIUM_CONTENT_STYLE}>
                        <ReadMoreText text={org.businessDescription || "Every great company starts with a dream. Tell yours here..."} />
                    </p>
                </div>
            </section>

            {/* ── 2. Core Product/Service ── */}
            {org.heroOffering && (
                <section className="space-y-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Core Product/Service ⭐</h3>
                    </div>
                    <div className="relative overflow-hidden rounded-[1.5rem] p-6 border-2 border-blue-500/10 bg-gradient-to-br from-blue-50 to-white dark:from-blue-500/5 dark:to-zinc-900/50 shadow-xl shadow-blue-500/5">
                        <div className="flex items-start gap-6 relative z-10">
                            <div className="space-y-2">
                                <p className={PREMIUM_CONTENT_STYLE}>
                                    <ReadMoreText text={org.heroOffering} />
                                </p>
                            </div>
                        </div>
                        <Zap className="absolute -right-8 -bottom-8 w-48 h-48 text-blue-500/5 rotate-12" />
                    </div>
                </section>
            )}

            {/* ── 3. Classification & Strategy ── */}
            <section className="space-y-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Classification & Strategy</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { icon: Building2, label: "Account Type", value: org.accountType ? ACCOUNT_TYPES.find(t => t.value === org.accountType)?.label : null, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { icon: Briefcase, label: "Industry", value: org.industry ? INDUSTRIES.find(i => i.value === org.industry)?.label : null, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { icon: Locate, label: "Sub-Category", value: org.subCategory ? (subCategoryOptions.find(s => s.value === org.subCategory)?.label || org.subCategory) : null, color: "text-rose-500", bg: "bg-rose-500/10" },
                        { icon: Target, label: "Target Audience", value: org.targetAudience ? (AUDIENCES.find(a => a.value === org.targetAudience)?.label || org.targetAudience) : null, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                        { icon: Scale, label: "Business Model", value: org.businessModel ? (BUSINESS_MODELS.find(m => m.value === org.businessModel)?.label || org.businessModel) : null, color: "text-amber-500", bg: "bg-amber-500/10" },
                        { icon: Building2, label: "Company Size", value: org.companySize ? `${org.companySize}+ Experts` : null, color: "text-orange-500", bg: "bg-orange-500/10" },
                        { icon: ShieldCheck, label: "Primary Goal", value: org.primaryGoal ? (PRIMARY_GOALS.find(g => g.value === org.primaryGoal)?.label || org.primaryGoal) : null, color: "text-purple-500", bg: "bg-purple-500/10" }
                    ].filter(item => item.value).map((item, idx) => (
                        <div key={idx} className="group p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-white dark:bg-zinc-900/40 shadow-sm transition-all hover:shadow-lg ">
                            <div className={cn("inline-flex p-3 rounded-xl mb-4 transition-transform group-hover:rotate-12", item.bg, item.color)}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{item.label}</p>
                                <p className="text-base font-black text-neutral-900 dark:text-neutral-100">
                                    {item.value!.toString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── 4. Contact Channels ── */}
            <section className="space-y-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Contact Channels</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {org.contactPhone && (
                        <div className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-[#0e0e0e]/40 flex items-center gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm text-green-500 shrink-0">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">PRIMARY PHONE</p>
                                <p className="text-xl font-black text-neutral-900 dark:text-neutral-100">{org.contactPhone}</p>
                            </div>
                        </div>
                    )}
                    {org.contactEmail && (
                        <div className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-[#0e0e0e]/40 flex items-center gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm text-blue-500 shrink-0">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">BUSINESS EMAIL</p>
                                <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate">{org.contactEmail}</p>
                            </div>
                        </div>
                    )}
                    {org.website && (
                        <div className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-[#0e0e0e]/40 flex items-center gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm text-purple-500 shrink-0">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">OFFICIAL WEBSITE</p>
                                <a
                                    href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate hover:text-blue-500 transition-colors block"
                                >
                                    {org.website.replace(/^https?:\/\//, '')}
                                </a>
                            </div>
                        </div>
                    )}
                    {(org.contactChannels || []).map((item: any) => {
                        const typeDef = CONTACT_TYPES.find(t => t.value === item.type);
                        const Icon = typeDef?.icon || MapPin;
                        if (!item.value) return null;
                        return (
                            <div key={item.id} className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-[#0e0e0e]/40 flex items-center gap-4">
                                <div className={cn("p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm shrink-0", typeDef?.color)}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{typeDef?.label.toUpperCase()}</p>
                                    {item.type === 'email' ? (
                                        <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate">{item.value}</p>
                                    ) : item.type === 'phone' ? (
                                        <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate">{item.value}</p>
                                    ) : (
                                        <a
                                            href={item.value.startsWith('http') ? item.value : `https://${item.value}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate hover:text-blue-500 transition-colors block"
                                        >
                                            {item.value.replace(/^https?:\/\//, '')}
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {(org.socialLinks || []).map((link: any) => {
                        const platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
                        const Icon = platform?.icon || Globe;
                        if (!link.url) return null;
                        return (
                            <div key={link.id} className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-[#0e0e0e]/40 flex items-center gap-4">
                                <div className={cn("p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm shrink-0", link.platform === 'twitter' ? 'text-neutral-900 dark:text-white' : platform?.color)}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{platform?.label.toUpperCase()}</p>
                                    <a
                                        href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate hover:text-blue-500 transition-colors block"
                                    >
                                        {link.url.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── 5. Operating Hours ── */}
            {(org.operatingHours?.enabled ?? true) && (
                <section className="space-y-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Operating Hours</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {DAYS.map(day => {
                            const dayConfig = weeklyHours[day];
                            return (
                                <div key={day} className={cn(
                                    "p-4 rounded-[1.5rem] border transition-all text-center",
                                    dayConfig?.enabled
                                        ? "border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 shadow-inner"
                                        : "border-neutral-100 dark:border-white/5 opacity-50 grayscale"
                                )}>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">{day.slice(0, 3)}</p>
                                    {dayConfig?.enabled ? (
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-blue-600 dark:text-blue-400">{dayConfig.start}</p>
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-200 dark:bg-blue-500/20 mx-auto" />
                                            <p className="text-xs font-black text-blue-600 dark:text-blue-400">{dayConfig.end}</p>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-neutral-300 dark:text-neutral-700 uppercase mt-2">Closed</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── 6. Business Location ── */}
            {org.businessAddress?.city && (
                <section className="space-y-4 px-2 pb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Business Location</h3>
                    </div>
                    <div className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-zinc-900/40 flex items-center gap-6">
                        <div className="p-4 bg-white dark:bg-white/5 rounded-2xl shadow-sm text-amber-500 shrink-0">
                            <MapPin className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                                {(countries.find(c => c.value === org.businessAddress?.country)?.label || org.businessAddress?.country || "").replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "").trim()}
                                {org.businessAddress?.state ? `, ${states.find(s => s.value === org.businessAddress?.state)?.label || org.businessAddress.state}` : ""}
                                {org.businessAddress?.city ? `, ${org.businessAddress.city}` : ""}
                            </h4>
                            <p className="text-neutral-500 font-bold text-sm">{org.businessAddress?.street}</p>
                        </div>
                    </div>
                </section>
            )}

        </div>
    );
}

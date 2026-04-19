"use client";

import React, { useState } from "react";
import {
    Search, LayoutGrid, CheckCircle2, Lock, ExternalLink, Zap,
    MessageSquare, Mail, Globe, Shield, RefreshCw, Plus, Signal,
    Smartphone, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Mock Data for Apps
const APP_CATEGORIES = [
    { id: "all", label: "All Apps" },
    { id: "communication", label: "Communication" },
    { id: "intelligence", label: "Intelligence & Spy" },
    { id: "automation", label: "Automation" },
    { id: "utilities", label: "Utilities" }
];

const APPS = [
    {
        id: "whatsapp",
        title: "WhatsApp Business",
        description: "Connect your business number for automated replies and broadcasting.",
        category: "communication",
        icon: Smartphone,
        status: "connected",
        plan: "basic",
        color: "bg-green-500"
    },
    {
        id: "instagram",
        title: "Instagram DM",
        description: "Auto-respond to DMs and comments. Sync stories to memory.",
        category: "communication",
        icon: MessageSquare,
        status: "connected",
        plan: "basic",
        color: "bg-pink-500"
    },
    {
        id: "gmail",
        title: "Gmail / G-Suite",
        description: "Sync emails, draft replies, and track leads from your inbox.",
        category: "communication",
        icon: Mail,
        status: "disconnected",
        plan: "basic",
        color: "bg-red-500"
    },
    {
        id: "web_crawler",
        title: "Site Spy Crawler",
        description: "Monitor competitor websites for changes and pricing updates.",
        category: "intelligence",
        icon: Globe,
        status: "active",
        plan: "pro",
        color: "bg-blue-500",
        badge: "Pro"
    },
    {
        id: "ad_spy",
        title: "Ad Library Spy",
        description: "Track active ads from competitors on FB/Insta and save to learning.",
        category: "intelligence",
        icon: Shield,
        status: "locked",
        plan: "enterprise",
        color: "bg-purple-600",
        badge: "Enterprise"
    },
    {
        id: "google_sheets",
        title: "Google Sheets",
        description: "Auto-export leads and insights to a master spreadsheet.",
        category: "utilities",
        icon: Database,
        status: "disconnected",
        plan: "basic",
        color: "bg-emerald-600"
    },
    {
        id: "zapier",
        title: "Zapier",
        description: "Connect Cluaiz to 5000+ other apps via webhooks.",
        category: "automation",
        icon: Zap,
        status: "disconnected",
        plan: "pro",
        color: "bg-orange-500",
        badge: "Pro"
    }
];

export default function AppMarketPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const filteredApps = APPS.filter(app => {
        const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeTab === "all" || app.category === activeTab;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 scrollbar-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">App Market & Integrations 🔌</h2>
                    <p className="text-muted-foreground">
                        Connect tools, manage subscriptions, and supercharge your AI agent.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Sync All
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Request App
                    </Button>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <Signal className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Active Integrations</p>
                        <h3 className="text-2xl font-bold text-white">3 / 20</h3>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Automations Run</p>
                        <h3 className="text-2xl font-bold text-white">1,240</h3>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <LayoutGrid className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Available Apps</p>
                        <h3 className="text-2xl font-bold text-white">24</h3>
                    </div>
                </div>
            </div>

            {/* Filter and Content */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                        <div className="flex items-center justify-between mb-4">
                            <TabsList className="bg-slate-900/50">
                                {APP_CATEGORIES.map(cat => (
                                    <TabsTrigger key={cat.id} value={cat.id}>{cat.label}</TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Search apps..."
                                    className="pl-8 bg-slate-900/50 border-slate-800"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <TabsContent value={activeTab} className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredApps.map((app) => (
                                    <div
                                        key={app.id}
                                        className={`group relative bg-slate-900/40 border ${app.status === 'locked' ? 'border-slate-800 opacity-70' : 'border-slate-700 hover:border-blue-500/50'} rounded-xl p-5 transition-all hover:shadow-lg hover:-translate-y-1`}
                                    >
                                        {app.badge && (
                                            <Badge variant="secondary" className={`absolute top-3 right-3 text-[10px] font-bold ${app.badge === 'Pro' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                {app.badge.toUpperCase()}
                                            </Badge>
                                        )}

                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`h-12 w-12 rounded-lg ${app.color} bg-opacity-10 flex items-center justify-center`}>
                                                <app.icon className={`h-6 w-6 ${app.color.replace('bg-', 'text-')}`} />
                                            </div>
                                            {app.status === 'connected' && (
                                                <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                    </span>
                                                    <span className="text-[10px] font-medium">Live</span>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-semibold text-lg text-slate-100 mb-2">{app.title}</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed mb-6 h-10 line-clamp-2">
                                            {app.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                            {app.status === 'locked' ? (
                                                <Button variant="ghost" className="w-full justify-center gap-2 text-slate-500 hover:text-slate-300">
                                                    <Lock className="h-4 w-4" /> Unlock
                                                </Button>
                                            ) : app.status === 'connected' ? (
                                                <>
                                                    <Button variant="outline" size="sm" className="h-8 text-xs border-slate-700">Settings</Button>
                                                    <Switch checked={true} />
                                                </>
                                            ) : (
                                                <Button className="w-full gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200">
                                                    Connect
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

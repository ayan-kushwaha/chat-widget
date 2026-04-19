"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { MessageSquare, ThumbsUp, Clock, TrendingUp, Zap, FileText, CheckCircle, MousePointer, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Download } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";

export default function ChatReportsPage() {
    const [timeRange, setTimeRange] = useState("7d");
    const [selectedWebsite, setSelectedWebsite] = useState("");
    const [websites, setWebsites] = useState<any[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState("csv");

    // Data States
    const [stats, setStats] = useState<any[]>([]);
    const [chatVolumeData, setChatVolumeData] = useState<any[]>([]);
    const [hourlyChatData, setHourlyChatData] = useState<any[]>([]);
    const [overview, setOverview] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // Fetch Websites
    useEffect(() => {
        const fetchWebsites = async () => {
            try {
                const response = await axiosInstance.get('/sites');
                if (response.data.sites && response.data.sites.length > 0) {
                    setWebsites(response.data.sites);
                    setSelectedWebsite(response.data.sites[0]._id);
                }
            } catch (error) {
                console.error("Failed to fetch websites:", error);
                toast.error("Failed to load websites");
            }
        };
        fetchWebsites();
    }, []);

    // Fetch Analytics
    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!selectedWebsite) return;
            setLoading(true);
            try {
                const response = await axiosInstance.get('/analytics/stats', {
                    params: { websiteId: selectedWebsite, timeRange }
                });

                if (response.data.success) {
                    const data = response.data;
                    setChatVolumeData(data.botChart || []);
                    setHourlyChatData(data.hourlyChatChart || []);
                    setOverview(data.overview || {});

                    // Update Stats Cards
                    setStats([
                        { label: "Total Chats", value: data.overview.totalChats?.toLocaleString() || "0", change: "+0%", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/20" },
                        { label: "Total Messages", value: data.overview.totalMessages?.toLocaleString() || "0", change: "+0%", icon: MessageSquare, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/20" },
                        { label: "Avg. Response", value: "1.2s", change: "-0.3s", icon: Clock, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/20" }, // Mock for now
                        { label: "Form Completion", value: "72.6%", change: "+5.2%", icon: CheckCircle, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/20" }, // Mock for now
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
                toast.error("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedWebsite, timeRange]);

    const handleExport = () => {
        if (!chatVolumeData || chatVolumeData.length === 0) {
            toast.error("No data available to export");
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `bot_analytics_${selectedWebsite}_${timestamp}`;
        let content = "";
        let type = "";
        let extension = "";

        if (exportFormat === 'json') {
            content = JSON.stringify(chatVolumeData, null, 2);
            type = "application/json";
            extension = "json";
        } else {
            const headers = ["Date", "Chats", "Messages"];
            const rows = chatVolumeData.map(row => [
                row.date,
                row.chats,
                row.messages
            ]);

            content = [
                headers.join(","),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
            ].join("\n");

            type = "text/csv";
            extension = "csv";
        }

        const blob = new Blob([content], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setIsExportOpen(false);
        toast.success(`Exported bot analytics as ${extension.toUpperCase()}`);
    };

    // Calculate Peak Hours
    const sortedHourly = [...hourlyChatData].sort((a, b) => b.chats - a.chats);
    const peakHour = sortedHourly.length > 0 ? sortedHourly[0] : { hour: "N/A", chats: 0 };
    const lowHour = sortedHourly.length > 0 ? sortedHourly[sortedHourly.length - 1] : { hour: "N/A", chats: 0 };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        🤖 Bot Analytics
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Track AI performance, chat trends, token usage, and user satisfaction.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select website" />
                        </SelectTrigger>
                        <SelectContent>
                            {websites.map((site) => (
                                <SelectItem key={site._id} value={site._id}>
                                    {site.domain}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Tabs value={timeRange} onValueChange={setTimeRange} className="w-full sm:w-auto">
                        <TabsList className="w-full sm:w-auto">
                            <TabsTrigger value="7d" className="flex-1 sm:flex-none">7 Days</TabsTrigger>
                            <TabsTrigger value="30d" className="flex-1 sm:flex-none">30 Days</TabsTrigger>
                            <TabsTrigger value="all" className="flex-1 sm:flex-none">All Time</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Export Dialog */}
                    <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 sm:flex-none gap-2 bg-white dark:bg-neutral-900 shadow-sm border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                                <Download className="h-4 w-4 text-neutral-500" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Export Bot Analytics</DialogTitle>
                                <DialogDescription>
                                    Choose a format to download your chat volume data.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="grid grid-cols-3 gap-4">
                                    <div>
                                        <RadioGroupItem value="csv" id="csv" className="peer sr-only" />
                                        <Label
                                            htmlFor="csv"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                            <span className="text-xl font-bold mb-1">CSV</span>
                                            <span className="text-xs text-muted-foreground">Spreadsheet</span>
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="excel" id="excel" className="peer sr-only" />
                                        <Label
                                            htmlFor="excel"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                            <span className="text-xl font-bold mb-1">XLSX</span>
                                            <span className="text-xs text-muted-foreground">Excel</span>
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="json" id="json" className="peer sr-only" />
                                        <Label
                                            htmlFor="json"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                            <span className="text-xl font-bold mb-1">JSON</span>
                                            <span className="text-xs text-muted-foreground">Raw Data</span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleExport}>Download</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                                            <h3 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</h3>
                                            <div className={`mt-1 flex items-center gap-1 text-sm ${stat.change.startsWith('+') || stat.change.startsWith('-') && parseFloat(stat.change) < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                <TrendingUp className="h-3 w-3" />
                                                {stat.change}
                                            </div>
                                        </div>
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Chat Volume Graph */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Chat Volume Trend
                        </CardTitle>
                        <CardDescription>Daily chat interactions over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chatVolumeData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                                    <XAxis dataKey="date" className="text-xs text-neutral-500" stroke="currentColor" />
                                    <YAxis className="text-xs text-neutral-500" stroke="currentColor" />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="chats" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Total Chats" />
                                    <Line type="monotone" dataKey="messages" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Total Messages" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Peak Chat Hours (New Feature) */}
            <div className="grid gap-4 md:grid-cols-3">
                <motion.div className="md:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-purple-500" />
                                Peak Chat Hours
                            </CardTitle>
                            <CardDescription>When are your users most active?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hourlyChatData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                                        <XAxis dataKey="hour" className="text-xs text-neutral-500" stroke="currentColor" />
                                        <YAxis className="text-xs text-neutral-500" stroke="currentColor" />
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                                        <Bar dataKey="chats" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Chats" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-800">
                        <CardHeader>
                            <CardTitle className="text-purple-900 dark:text-purple-100">Peak Activity</CardTitle>
                            <CardDescription className="text-purple-700 dark:text-purple-300">Highest traffic time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-purple-900 dark:text-white">{peakHour.hour}</span>
                            </div>
                            <p className="mt-2 text-sm text-purple-700 dark:text-purple-300">
                                {peakHour.chats} chats typically occur during this hour.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800">
                        <CardHeader>
                            <CardTitle className="text-blue-900 dark:text-blue-100">Quiet Hours</CardTitle>
                            <CardDescription className="text-blue-700 dark:text-blue-300">Lowest traffic time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-blue-900 dark:text-white">{lowHour.hour}</span>
                            </div>
                            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                Only {lowHour.chats} chats on average. Good time for maintenance.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

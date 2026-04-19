"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Mail,
    Phone,
    Calendar,
    MoreVertical,
    Filter,
    Download,
    Search,
    X,
    User,
    Users,
    Building2,
    Clock,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    GripVertical,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

import { leadsAPI } from "@/lib/api";

// DnD Kit
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from "@/components/ui/use-toast";

// --- Types ---

interface Lead {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    status: 'New' | 'Contacted' | 'In Discussion' | 'Converted' | 'Lost' | 'On-Hold';
    score: number;
    score_breakdown?: string;
    source: string;
    createdAt: string;
    data: Record<string, any>;
    formId?: string | { _id: string, name: string };
}

// --- Mock Data (For UI Visualization) ---

const MOCK_FORMS = [
    { _id: "form_1", name: "Website Contact" },
    { _id: "form_2", name: "Enterprise Inquiry" },
    { _id: "form_3", name: "Hiring Application" },
    { _id: "form_4", name: "Newsletter Signup" },
    { _id: "form_5", name: "Beta Access" }
];

const MOCK_LEADS: Lead[] = [
    { _id: "1", formId: "form_1", name: "Rahul Sharma", email: "rahul@techindia.com", status: "New", score: 92, source: "Chat", createdAt: "2024-03-10T10:30:00Z", data: { budget: "₹50k - ₹1L", timeline: "Immediate", requirement: "E-commerce App" } },
    { _id: "2", formId: "form_1", name: "Sarah Jenkins", email: "sarah@global.inc", status: "In Discussion", score: 75, source: "Website", createdAt: "2024-03-09T14:15:00Z", data: { budget: "$2000", timeline: "1 Month", requirement: "CRM Integration" } },
    { _id: "3", formId: "form_2", name: "Amit Patel", email: "amit@startups.in", company: "Startup Hub", status: "New", score: 40, source: "Chat", createdAt: "2024-03-08T09:00:00Z", data: { company_size: "10-50", industry: "Fintech", role: "CTO" } },
    { _id: "4", formId: "form_3", name: "Priya Singh", email: "priya.s@design.co", status: "Contacted", score: 88, source: "LinkedIn", createdAt: "2024-03-07T11:20:00Z", data: { portfolio: "behance.net/priya", experience: "5 Years", role: "Senior Designer" } },
    { _id: "5", formId: "form_4", name: "John Doe", email: "john.doe@example.com", status: "New", score: 60, source: "Website", createdAt: "2024-03-06T10:00:00Z", data: { interest: "Product Updates", frequency: "Weekly" } },
    { _id: "6", formId: "form_5", name: "Alice Wonderland", email: "alice@wonder.land", status: "On-Hold", score: 70, source: "Referral", createdAt: "2024-03-05T15:30:00Z", data: { product_version: "Pro", feedback: "Looking for specific feature X" } },
    { _id: "7", formId: "form_1", name: "Michael Chen", email: "michael@tech.cn", status: "Converted", score: 95, source: "Direct", createdAt: "2024-03-05T09:15:00Z", data: { budget: "$5000+", timeline: "Urgent", requirement: "AI Model Training" } },
    { _id: "8", formId: "form_2", name: "Emma Watson", email: "emma@hollywood.com", status: "Lost", score: 20, source: "Social", createdAt: "2024-03-04T16:45:00Z", data: { company_size: "1000+", industry: "Entertainment", role: "Producer" } },
    { _id: "9", formId: "form_3", name: "David Miller", email: "david@code.org", status: "New", score: 55, source: "GitHub", createdAt: "2024-03-04T11:00:00Z", data: { portfolio: "github.com/david", experience: "2 Years", role: "Junior Dev" } },
    { _id: "10", formId: "form_1", name: "Sophia Li", email: "sophia@design.io", status: "In Discussion", score: 82, source: "Dribbble", createdAt: "2024-03-03T14:20:00Z", data: { budget: "$3000", timeline: "2 Months", requirement: "UI Kit" } },
    { _id: "11", formId: "form_4", name: "James Bond", email: "007@mi6.gov.uk", status: "New", score: 99, source: "Secret", createdAt: "2024-03-03T08:00:00Z", data: { interest: "Security Alerts", frequency: "Daily" } },
    { _id: "12", formId: "form_5", name: "Tony Stark", email: "tony@stark.com", status: "Converted", score: 100, source: "Expo", createdAt: "2024-03-02T10:00:00Z", data: { product_version: "Enterprise", feedback: "Build it in a cave!" } },
    { _id: "23", formId: "form_1", name: "Bruce Wayne", email: "bruce@wayne.ent", status: "New", score: 85, source: "Charity", createdAt: "2024-03-02T20:00:00Z", data: { budget: "Unlimited", timeline: "ASAP", requirement: "Bat Computer Upgrade" } },
    { _id: "24", formId: "form_1", name: "Bruce Wayne", email: "bruce@wayne.ent", status: "New", score: 85, source: "Charity", createdAt: "2024-03-02T20:00:00Z", data: { budget: "Unlimited", timeline: "ASAP", requirement: "Bat Computer Upgrade" } },
    { _id: "25", formId: "form_1", name: "Bruce Wayne", email: "bruce@wayne.ent", status: "New", score: 85, source: "Charity", createdAt: "2024-03-02T20:00:00Z", data: { budget: "Unlimited", timeline: "ASAP", requirement: "Bat Computer Upgrade" } },
    { _id: "26", formId: "form_1", name: "Bruce Wayne", email: "bruce@wayne.ent", status: "New", score: 85, source: "Charity", createdAt: "2024-03-02T20:00:00Z", data: { budget: "Unlimited", timeline: "ASAP", requirement: "Bat Computer Upgrade" } },
    { _id: "27", formId: "form_1", name: "Bruce Wayne", email: "bruce@wayne.ent", status: "New", score: 85, source: "Charity", createdAt: "2024-03-02T20:00:00Z", data: { budget: "Unlimited", timeline: "ASAP", requirement: "Bat Computer Upgrade" } },
    { _id: "14", formId: "form_2", name: "Clark Kent", email: "clark@dailyplanet.com", status: "Contacted", score: 65, source: "News", createdAt: "2024-03-01T12:30:00Z", data: { company_size: "50-200", industry: "Media", role: "Reporter" } },
    { _id: "15", formId: "form_3", name: "Diana Prince", email: "diana@themyscira.gov", status: "New", score: 78, source: "Embassy", createdAt: "2024-03-01T09:00:00Z", data: { portfolio: "museum.org/diana", experience: "Centuries", role: "Curator" } },
    { _id: "16", formId: "form_4", name: "Barry Allen", email: "barry@ccpd.org", status: "In Discussion", score: 88, source: "SpeedForce", createdAt: "2024-02-29T15:00:00Z", data: { interest: "Fast Updates", frequency: "Instant" } },
    { _id: "17", formId: "form_5", name: "Hal Jordan", email: "hal@gl.corps", status: "Lost", score: 30, source: "Space", createdAt: "2024-02-29T11:00:00Z", data: { product_version: "Basic", feedback: "Too much yellow" } },
    { _id: "18", formId: "form_1", name: "Arthur Curry", email: "arthur@atlantis.sea", status: "New", score: 60, source: "Ocean", createdAt: "2024-02-28T14:00:00Z", data: { budget: "Gold Coins", timeline: "Tide Dependent", requirement: "Sonar Tech" } },
    { _id: "19", formId: "form_2", name: "Victor Stone", email: "victor@star.labs", status: "Converted", score: 96, source: "Lab", createdAt: "2024-02-28T10:00:00Z", data: { company_size: "10-50", industry: "Tech", role: "Cyborg" } },
    { _id: "20", formId: "form_3", name: "Oliver Queen", email: "oliver@queen.ind", status: "On-Hold", score: 72, source: "Island", createdAt: "2024-02-27T16:00:00Z", data: { portfolio: "archery.com/ollie", experience: "10 Years", role: "CEO" } }
];

// --- Helpers ---

const getStatusColor = (status: string) => {
    switch (status) {
        case "New": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        case "Contacted": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
        case "In Discussion": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
        case "Converted": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
        case "Lost": return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
        case "On-Hold": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
        default: return "bg-neutral-100 text-neutral-700";
    }
};

const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
};

// --- Sortable Tab Component ---
function SortableTab({ id, children, isActive, onClick }: { id: string, children: React.ReactNode, isActive: boolean, onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="inline-flex items-center">
            <TabsTrigger
                value={id}
                onClick={onClick}
                className={`
                    relative px-4 py-2 text-sm font-medium transition-all
                    ${isActive
                        ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                        : "text-neutral-500 hover:text-blue-600"
                    }
                `}
            >
                {children}
            </TabsTrigger>
        </div>
    );
}


// --- Main Component ---

export default function LeadsPage() {
    // State
    const [leads, setLeads] = useState<Lead[]>([]);
    const [forms, setForms] = useState<any[]>([]);
    const [activeFormId, setActiveFormId] = useState<string>("");
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState("csv");
    const [filterStatus, setFilterStatus] = useState<string[]>([]);

    // Sort State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });

    const handleSort = (key: string) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                return current.direction === 'asc'
                    ? { key, direction: 'desc' }
                    : null;
            }
            return { key, direction: 'asc' };
        });
    };

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Require 5px movement to start drag
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // URL Sync
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Fetch Real Data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [leadsRes, formsRes] = await Promise.all([
                    leadsAPI.getLeads(),
                    leadsAPI.getForms()
                ]);
                if (leadsRes.data) setLeads(leadsRes.data);
                if (formsRes.data.length > 0) {
                    let loadedForms = formsRes.data;

                    // Restore order from localStorage
                    const savedOrder = localStorage.getItem('leads_form_order');
                    if (savedOrder) {
                        try {
                            const orderIds = JSON.parse(savedOrder);
                            loadedForms = [...loadedForms].sort((a, b) => {
                                const indexA = orderIds.indexOf(a._id);
                                const indexB = orderIds.indexOf(b._id);
                                // If both are in the saved order, sort by index
                                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                // If only A is in order, it comes first
                                if (indexA !== -1) return -1;
                                // If only B is in order, it comes first
                                if (indexB !== -1) return 1;
                                // Otherwise keep original order
                                return 0;
                            });
                        } catch (e) {
                            console.error("Failed to parse saved form order", e);
                        }
                    }

                    setForms(loadedForms);

                    // Initialize from URL or default to "all"
                    const formParam = searchParams.get('form');
                    if (formParam && (formParam === 'all' || formsRes.data.some((f: any) => f._id === formParam))) {
                        setActiveFormId(formParam);
                    } else if (!activeFormId) {
                        setActiveFormId("all");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast({ title: "Error", description: "Failed to load leads data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Update URL when activeFormId changes
    useEffect(() => {
        if (activeFormId && searchParams.get('form') !== activeFormId) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('form', activeFormId);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [activeFormId, pathname, router, searchParams]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setForms((items) => {
                const oldIndex = items.findIndex((item) => item._id === active.id);
                const newIndex = items.findIndex((item) => item._id === over?.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Save new order to localStorage
                const orderIds = newOrder.map(f => f._id);
                localStorage.setItem('leads_form_order', JSON.stringify(orderIds));

                return newOrder;
            });
        }
    };



    const filteredLeads = leads.filter(lead => {
        // Handle formId being either a string or an object (populated)
        const leadFormId = typeof lead.formId === 'object' && lead.formId !== null
            ? (lead.formId as any)._id
            : lead.formId;

        // Show all if "all" is selected, otherwise match formId
        if (activeFormId !== "all" && leadFormId !== activeFormId) return false;

        // Show all if "all" is selected, otherwise match formId
        if (activeFormId !== "all" && leadFormId !== activeFormId) return false;

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (
            (lead.name || "").toLowerCase().includes(searchLower) ||
            (lead.email || "").toLowerCase().includes(searchLower) ||
            (lead.company || "").toLowerCase().includes(searchLower)
        );

        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(lead.status);

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;

        let aValue: any = a[key as keyof Lead];
        let bValue: any = b[key as keyof Lead];

        // Handle nested data if key starts with 'data.'
        if (key.startsWith('data.')) {
            const dataKey = key.split('.')[1];
            aValue = a.data[dataKey];
            bValue = b.data[dataKey];
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Get all unique keys from lead data for dynamic columns
    const dynamicColumns = Array.from(new Set(leads.flatMap(lead => Object.keys(lead.data || {}))));

    const handleExport = () => {
        if (filteredLeads.length === 0) {
            toast({ title: "No data", description: "There are no leads to export.", variant: "destructive" });
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `leads_export_${timestamp}`;
        let content = "";
        let type = "";
        let extension = "";

        if (exportFormat === 'json') {
            content = JSON.stringify(filteredLeads, null, 2);
            type = "application/json";
            extension = "json";
        } else {
            // CSV or Excel (XLSX - simplified as CSV for now)
            const headers = ["ID", "Name", "Email", "Phone", "Company", "Status", "Score", "Source", "Date", ...dynamicColumns];
            const rows = filteredLeads.map(lead => [
                lead._id,
                lead.name || "",
                lead.email || "",
                lead.phone || "",
                lead.company || "",
                lead.status,
                lead.score,
                lead.source,
                new Date(lead.createdAt).toLocaleDateString(),
                ...dynamicColumns.map(col => (lead.data || {})[col] || "")
            ]);

            content = [
                headers.join(","),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            ].join("\n");

            type = "text/csv";
            extension = exportFormat === 'excel' ? 'csv' : 'csv'; // Using CSV for Excel compatibility for now
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
        toast({ title: "Export Started", description: `Downloading ${filteredLeads.length} leads.` });
    };

    return (
        <div className="h-[calc(100dvh-8rem)] flex flex-col overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/50">
            {/* 1. Header & Actions Row - FIXED */}
            <div className="flex-none">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                            <Users className="h-6 w-6 text-blue-600" />
                            Leads CRM
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Manage and track your AI-captured leads.
                        </p>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 lg:w-72 group">
                            <Search className="absolute left-3 top-2 z-20 translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search leads..."
                                className="pl-9 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 transition-all shadow-sm w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter & Export Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Filter Popover */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex-1 sm:flex-none gap-2 bg-white dark:bg-neutral-900 shadow-sm border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                                        <Filter className="h-4 w-4 text-neutral-500" />
                                        <span className="inline">Filter</span>
                                        {filterStatus.length > 0 && (
                                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-blue-100 text-blue-700">{filterStatus.length}</Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-4" align="end">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-sm text-neutral-900 dark:text-white">Filter Status</h4>
                                            {filterStatus.length > 0 && (
                                                <button
                                                    onClick={() => setFilterStatus([])}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {['New', 'Contacted', 'In Discussion', 'Converted', 'Lost', 'On-Hold'].map(status => (
                                                <div key={status} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`filter-${status}`}
                                                        checked={filterStatus.includes(status)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setFilterStatus([...filterStatus, status]);
                                                            else setFilterStatus(filterStatus.filter(s => s !== status));
                                                        }}
                                                    />
                                                    <Label htmlFor={`filter-${status}`} className="text-sm font-normal cursor-pointer text-neutral-700 dark:text-neutral-300">{status}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

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
                                        <DialogTitle>Export Leads</DialogTitle>
                                        <DialogDescription>
                                            Choose a format to download your leads data.
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
                </div>
            </div>

            {/* 2. Draggable Tabs Row - FIXED */}
            <div className="flex-none mt-3  z-20">
                <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-t-xl px-2 pt-2 shadow-sm">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <Tabs value={activeFormId} onValueChange={setActiveFormId} className="w-full">
                            <ScrollArea className="w-full whitespace-nowrap pb-0">
                                <TabsList className="bg-transparent h-auto p-0 space-x-1 flex w-max">
                                    <TabsTrigger
                                        value="all"
                                        className={`
                                            relative px-4 py-2 text-sm font-medium transition-all
                                            ${activeFormId === "all"
                                                ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                                                : "text-neutral-500 hover:text-blue-600"
                                            }
                                        `}
                                    >
                                        All Forms
                                    </TabsTrigger>
                                    <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-2 self-center" />
                                    <SortableContext
                                        items={forms.map(f => f._id)}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        {forms.map(form => (
                                            <SortableTab
                                                key={form._id}
                                                id={form._id}
                                                isActive={activeFormId === form._id}
                                                onClick={() => setActiveFormId(form._id)}
                                            >
                                                {form.name}
                                            </SortableTab>
                                        ))}
                                    </SortableContext>
                                </TabsList>
                            </ScrollArea>
                        </Tabs>
                    </DndContext>
                </div>
            </div>

            {/* 3. Data Table - SCROLLABLE */}
            <div className="flex-1 overflow-hidden  pb-4">
                <div className="h-full flex flex-col rounded-b-xl border border-t-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm overflow-hidden">
                    <div className="flex-1 overflow-auto relative [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar]:h-0.5 [&:hover::-webkit-scrollbar]:w-1 [&:hover::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full transition-all">
                        <table className="w-full text-sm text-left border-separate border-spacing-0">
                            <thead className="bg-neutral-50 dark:bg-neutral-900">
                                <tr>
                                    <th
                                        onClick={() => handleSort('name')}
                                        className="p-4 font-medium text-neutral-500 dark:text-neutral-400 w-[250px] sticky top-0 left-0 z-40 md:sticky md:left-0 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200/60 dark:border-neutral-800/60 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            Lead Profile
                                            <ArrowUpDown className={`h-3 w-3 ${sortConfig?.key === 'name' ? 'text-blue-500' : 'text-neutral-400 opacity-0 group-hover:opacity-100'} transition-all`} />
                                        </div>
                                    </th>
                                    <th className="p-4 font-medium text-neutral-500 dark:text-neutral-400 w-[120px] sticky top-0 z-40 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200/60 dark:border-neutral-800/60">Status</th>
                                    <th
                                        onClick={() => handleSort('score')}
                                        className="p-4 font-medium text-neutral-500 dark:text-neutral-400 w-[100px] sticky top-0 z-40 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200/60 dark:border-neutral-800/60 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            Score
                                            <ArrowUpDown className={`h-3 w-3 ${sortConfig?.key === 'score' ? 'text-blue-500' : 'text-neutral-400 opacity-0 group-hover:opacity-100'} transition-all`} />
                                        </div>
                                    </th>

                                    {/* Dynamic Columns */}
                                    {dynamicColumns.map(col => (
                                        <th key={col} className="p-4 font-medium text-neutral-500 dark:text-neutral-400 capitalize whitespace-nowrap sticky top-0 z-40 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200/60 dark:border-neutral-800/60">
                                            {col.replace(/_/g, ' ')}
                                        </th>
                                    ))}

                                    <th
                                        onClick={() => handleSort('createdAt')}
                                        className="p-4 font-medium text-neutral-500 dark:text-neutral-400 text-right sticky top-0 z-40 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200/60 dark:border-neutral-800/60 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors group"
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            Date
                                            <ArrowUpDown className={`h-3 w-3 ${sortConfig?.key === 'createdAt' ? 'text-blue-500' : 'text-neutral-400 opacity-0 group-hover:opacity-100'} transition-all`} />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={4 + dynamicColumns.length} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-neutral-400">
                                                <User className="h-12 w-12 mb-3 opacity-20" />
                                                <p className="text-base font-medium text-neutral-600">No leads found</p>
                                                <p className="text-sm">Try adjusting your filters or search query.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead, index) => (
                                        <motion.tr
                                            key={lead._id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer group transition-colors"
                                            onClick={() => setSelectedLead(lead)}
                                        >
                                            <td className="p-4 sticky  left-0 z-30 bg-white dark:bg-neutral-950 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-neutral-200 dark:border-neutral-800 bg-white">
                                                        <AvatarFallback className="bg-blue-50 text-blue-600 dark:bg-neutral-800 dark:text-neutral-300 font-medium text-xs">
                                                            {(lead.name || "U").substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-neutral-900 dark:text-white truncate max-w-[150px]">{lead.name || "Unknown Lead"}</p>
                                                        <p className="text-xs text-neutral-500 truncate max-w-[150px]">{lead.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="secondary" className={`font-normal   truncate no-wrap border-0 ${getStatusColor(lead.status)}`}>
                                                    {lead.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`text-sm font-bold ${getScoreColor(lead.score)}`}>
                                                        {lead.score}
                                                    </div>
                                                    <div className="h-1.5 w-16 bg-neutral-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${lead.score >= 80 ? 'bg-green-500' : lead.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${lead.score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Dynamic Data Cells */}
                                            {dynamicColumns.map(col => (
                                                <td key={col} className="p-4 text-neutral-600 dark:text-neutral-300 max-w-[200px] truncate">
                                                    {lead.data?.[col] || "-"}
                                                </td>
                                            ))}

                                            <td className="p-4 text-right text-neutral-500 text-xs">
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="border-t border-neutral-200/60 dark:border-neutral-800/60 p-4 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-sm shrink-0">
                        <p className="text-xs text-neutral-500">
                            Showing <span className="font-medium">{filteredLeads.length}</span> of <span className="font-medium">{leads.length}</span> leads
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-white border-neutral-300 text-neutral-900 shadow-sm">
                                1
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-500">
                                2
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-500">
                                3
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Lead Details Drawer (Sheet) */}
                <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
                    <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                        {selectedLead && (
                            <>
                                <SheetHeader className="mb-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                                            <AvatarFallback className="bg-blue-600 text-white text-xl">
                                                {(selectedLead.name || "U").substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <SheetTitle className="text-2xl">{selectedLead.name}</SheetTitle>
                                            <SheetDescription asChild>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
                                                    <Badge variant="outline" className={getStatusColor(selectedLead.status)}>
                                                        {selectedLead.status}
                                                    </Badge>
                                                    <span className="text-neutral-300">|</span>
                                                    <span className="text-neutral-500">{selectedLead.email}</span>
                                                </div>
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>

                                <div className="space-y-8">
                                    {/* AI Score Section */}
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                                AI Lead Score
                                            </h4>
                                            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{selectedLead.score}/100</span>
                                        </div>
                                        <div className="w-full bg-white/50 dark:bg-black/20 h-2 rounded-full overflow-hidden mb-3">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                                style={{ width: `${selectedLead.score}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                                            {selectedLead.score_breakdown || "High engagement detected. User has shown strong intent through multiple interactions and detailed responses."}
                                        </p>
                                    </div>

                                    {/* Form Data */}
                                    <div>
                                        <h4 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">Captured Data</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {selectedLead.data && Object.entries(selectedLead.data).map(([key, value]) => (
                                                <div key={key} className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
                                                    <p className="text-xs text-neutral-500 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                                                    <p className="font-medium text-neutral-900 dark:text-neutral-200">{String(value)}</p>
                                                </div>
                                            ))}
                                            {!selectedLead.data && (
                                                <div className="text-sm text-neutral-400 italic col-span-1">No captured data available.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Metadata */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100">
                                            <Clock className="h-5 w-5 text-neutral-400" />
                                            <div>
                                                <p className="text-xs text-neutral-500">Captured On</p>
                                                <p className="text-sm font-medium">{new Date(selectedLead.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100">
                                            <Building2 className="h-5 w-5 text-neutral-400" />
                                            <div>
                                                <p className="text-xs text-neutral-500">Source</p>
                                                <p className="text-sm font-medium">{selectedLead.source}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <SheetFooter className="mt-8">
                                    <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                                        <Mail className="mr-2 h-4 w-4" /> Send Email
                                    </Button>
                                </SheetFooter>
                            </>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}

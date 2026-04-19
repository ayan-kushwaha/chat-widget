"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus, Search, Calendar, Users, Percent, Gift, Trash2, Copy, Sparkles, AlertCircle, CheckCircle2, ChevronRight, X, Loader2, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { couponsAPI } from "@/api/coupons.api";

// Removed API_URL

// 🎨 Premium Gradient Styles for Coupons
const COUPON_STYLES = [
    { name: "Gold Standard", bg: "bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 dark:from-amber-900/40 dark:via-yellow-900/20 dark:to-amber-900/40", text: "text-amber-900 dark:text-amber-100", border: "border-amber-200 dark:border-amber-800" },
    { name: "Neon Cyber", bg: "bg-gradient-to-br from-violet-200 via-fuchsia-100 to-violet-300 dark:from-violet-900/40 dark:via-fuchsia-900/20 dark:to-violet-900/40", text: "text-violet-900 dark:text-violet-100", border: "border-violet-200 dark:border-violet-800" },
    { name: "Emerald City", bg: "bg-gradient-to-br from-emerald-200 via-teal-100 to-emerald-300 dark:from-emerald-900/40 dark:via-teal-900/20 dark:to-emerald-900/40", text: "text-emerald-900 dark:text-emerald-100", border: "border-emerald-200 dark:border-emerald-800" },
    { name: "Midnight Blue", bg: "bg-gradient-to-br from-blue-200 via-indigo-100 to-blue-300 dark:from-blue-900/40 dark:via-indigo-900/20 dark:to-blue-900/40", text: "text-blue-900 dark:text-blue-100", border: "border-blue-200 dark:border-blue-800" },
];

export default function OffersPage() {
    const [offers, setOffers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Editing & Deleting States
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [deletingOffer, setDeletingOffer] = useState<any>(null);
    const [editValue, setEditValue] = useState(0);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // 📊 Derived Aggregate Metrics
    const stats = {
        active: offers.filter(o => o.status === 'active').length,
        totalApplied: offers.reduce((acc, curr) => acc + (curr.applied || 0), 0),
        totalBought: offers.reduce((acc, curr) => acc + (curr.usage || 0), 0),
        avgDiscount: offers.length > 0 ? Math.round(offers.reduce((acc, curr) => acc + curr.value, 0) / offers.length) : 0
    };

    // Form State
    const [newOffer, setNewOffer] = useState({
        code: "",
        value: 10,
        type: "PERCENTAGE", // Backend expects uppercase
        validUntil: "",
        desc: "",
        style: 0
    });

    const fetchCoupons = async () => {
        try {
            setIsLoading(true);
            setIsLoading(true);
            const res = await couponsAPI.getAll();
            const data = res.data;

            // Map Backend Data to Frontend Structure
            const mappedOffers = data.map((item: any) => ({
                id: item._id,
                code: item.code,
                type: item.discountType.toLowerCase(),
                value: item.discountValue,
                validUntil: item.validUntil ? new Date(item.validUntil).toISOString().split('T')[0] : "",
                status: item.isActive ? "active" : "expired", // Simple status logic
                usage: item.usedCount || 0,
                applied: item.appliedCount || 0, // 🟢 Map from backend
                style: item.style || 0,
                desc: item.description
            }));

            setOffers(mappedOffers);
        } catch (error) {
            console.error("Failed to fetch coupons:", error);
            toast.error("Failed to load campaigns.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreate = async () => {
        if (!newOffer.code || !newOffer.value) {
            toast.error("Please fill required fields (Code, Value)");
            return;
        }

        if (newOffer.value > 15) {
            toast.error("Discount value cannot exceed 15%");
            return;
        }

        try {
            const payload = {
                code: newOffer.code,
                discountType: newOffer.type,
                discountValue: newOffer.value,
                validUntil: newOffer.validUntil || null,
                description: newOffer.desc,
                style: newOffer.style,
                isActive: true
            };

            await couponsAPI.create(payload);

            // if (!res.ok) throw new Error("Failed to create coupon");

            toast.success("Campaign created successfully!");
            setIsCreateOpen(false);
            setNewOffer({ code: "", value: 10, type: "PERCENTAGE", validUntil: "", desc: "", style: 0 });
            fetchCoupons(); // Refresh list
        } catch (error) {
            console.error("Create error:", error);
            toast.error("Failed to create campaign. Code might be duplicate.");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await couponsAPI.delete(id);
            toast.success("Campaign deleted successfully");
            fetchCoupons();
            setIsDeleteOpen(false);
        } catch (error) {
            toast.error("Failed to delete campaign");
        }
    };

    const handleUpdate = async () => {
        if (!editingOffer) return;
        if (editValue > 15) {
            toast.error("Discount value cannot exceed 15%");
            return;
        }

        try {
            await couponsAPI.update(editingOffer.id, { discountValue: editValue });
            toast.success("Discount updated successfully");
            fetchCoupons();
            setIsEditOpen(false);
        } catch (error) {
            toast.error("Failed to update discount");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info("Code copied to clipboard");
    };

    const filteredOffers = offers.filter(o =>
        o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.desc && o.desc.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 🌟 Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                        Offers & Campaign Manager
                    </h2>
                    <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
                        Create, track, and manage global discount codes dynamically.
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto h-11 px-8 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-violet-600 hover:to-violet-700 transition-all hover:scale-105 rounded-xl font-semibold">
                    <Plus className="h-5 w-5 mr-2" /> Create Campaign
                </Button>
            </div>

            {/* 📊 High-Level Metrics (Dynamic) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="border-l-4 border-l-blue-500 shadow-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Users Applied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold tracking-tighter text-blue-600 dark:text-blue-400">{stats.totalApplied}</div>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center mt-1 uppercase tracking-tighter">
                            <Ticket className="h-3 w-3 mr-1 text-blue-500" /> Intention to Buy
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Total Redemptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold tracking-tighter text-emerald-600 dark:text-emerald-400">{stats.totalBought}</div>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center mt-1 uppercase tracking-tighter">
                            <Users className="h-3 w-3 mr-1 text-emerald-500" /> Successful Purchases
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Active Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold tracking-tighter text-amber-600 dark:text-amber-400">{stats.active}</div>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center mt-1 uppercase tracking-tighter">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-amber-500" /> Live & Redeemable
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 🔍 Search & Filter Bar */}
            <div className="relative group w-fit">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-violet-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border shadow-xl ring-1 ring-black/5 focus-within:ring-primary/40 transition-all duration-300">
                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0" />
                    <Input
                        placeholder="Search by code, style, or description..."
                        className="border-none shadow-none focus-visible:ring-0 text-base h-11 w-full bg-transparent font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                </div>
            </div>

            {/* 🎫 Coupon Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredOffers.map((offer) => {
                        const style = COUPON_STYLES[offer.style || 0] || COUPON_STYLES[0];
                        return (
                            <Card key={offer.id} className={`group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border ${offer.status === 'expired' ? 'opacity-60 grayscale' : 'hover:border-primary/50'}`}>
                                {/* Detailed visual ticket stub design */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${style.bg.split(' ')[0]}`} />

                                <CardHeader className="pb-2 relative">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <Badge variant="outline" className={`bg-white/80 dark:bg-black/40 backdrop-blur-md border-0 ${style.text} font-bold shadow-sm`}>
                                                {`${offer.value}% OFF`}
                                            </Badge>
                                            <div className="flex items-center gap-1 bg-white/40 dark:bg-zinc-900/40 p-1 rounded-full border border-white/20 dark:border-white/5 w-fit backdrop-blur-sm">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                                                    onClick={() => {
                                                        setEditingOffer(offer);
                                                        setEditValue(offer.value);
                                                        setIsEditOpen(true);
                                                    }}
                                                    title="Edit Discount"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <div className="w-[1px] h-3 bg-zinc-400/30" />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                                                    onClick={() => {
                                                        setDeletingOffer(offer);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                    title="Delete Campaign"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Badge variant={offer.status === 'active' ? 'default' : 'secondary'} className={offer.status === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                            {offer.validUntil ? `EXP: ${offer.validUntil}` : 'NO EXPIRY'}
                                        </Badge>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                            {offer.code}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-muted-foreground"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(offer.code);
                                                    toast.success("Code copied to clipboard");
                                                }}
                                                title="Copy Code"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">{offer.desc}</p>
                                    </div>
                                </CardHeader>

                                <CardContent className="py-4 space-y-4">
                                    {/* 📊 Performance Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/40 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 group/metric transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800/60" title="People who applied this code">
                                            <div className="p-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                                                <Ticket className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase leading-tight tracking-tighter">Applied</span>
                                                <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">{offer.applied}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/40 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 group/metric transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800/60" title="Actual purchases made">
                                            <div className="p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                                                <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase leading-tight tracking-tighter">Bought</span>
                                                <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">{offer.usage}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 📅 Timeline/Expiry */}
                                    <div className="flex items-center gap-2.5 bg-zinc-100 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
                                        <div className="p-1.5 rounded-lg bg-zinc-500/10 dark:bg-zinc-500/20">
                                            <Calendar className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase leading-tight tracking-tighter">Availability</span>
                                            <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                                                {offer.validUntil ? `Until ${offer.validUntil}` : 'LIFETIME ACCESS'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>


                                {/* Decorative Background Elements */}
                                <div className={`absolute -right-6 -bottom-6 h-24 w-24 rounded-full blur-2xl opacity-20 pointer-events-none ${style.bg}`} />
                            </Card>
                        );
                    })}

                    {/* New Coupon Placeholder */}
                    <div
                        onClick={() => setIsCreateOpen(true)}
                        className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all group min-h-[220px]"
                    >
                        <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform mb-4 text-muted-foreground group-hover:text-primary">
                            <Plus className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg text-muted-foreground group-hover:text-primary transition-colors">Create New Offer</h3>
                        <p className="text-sm text-center text-muted-foreground/60 mt-2 max-w-[200px]">Set up a new discount code or promotional campaign.</p>
                    </div>
                </div>
            )}

            {/* 🛠️ Create Offer Sheet */}
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <SheetContent className="sm:max-w-[500px] w-full bg-zinc-50 dark:bg-zinc-950 border-l p-0 flex flex-col gap-0 shadow-2xl">
                    <SheetHeader className="p-6 pb-4 border-b shrink-0 bg-white dark:bg-zinc-900">
                        <SheetTitle className="text-2xl font-bold tracking-tight">Create New Offer</SheetTitle>
                        <SheetDescription className="text-muted-foreground/80">Configure discounts for the Plan Builder.</SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                        {/* 1. Code & Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Coupon Code</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="e.g. SUMMER2025"
                                        className="font-mono uppercase tracking-widest pl-10 border-primary/20 focus-visible:ring-primary/30 h-11 bg-white dark:bg-zinc-900/50"
                                        value={newOffer.code}
                                        onChange={(e) => setNewOffer({ ...newOffer, code: e.target.value.toUpperCase() })}
                                    />
                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Select
                                    value={newOffer.type}
                                    onValueChange={(v) => setNewOffer({ ...newOffer, type: v })}
                                >
                                    <SelectTrigger className="h-11 bg-white dark:bg-zinc-900/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Value</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="pl-8 h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-primary rounded-xl font-bold text-lg"
                                        value={newOffer.value}
                                        min={0}
                                        max={15}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            // 🔒 UI Guard: 0-15 range only
                                            if (val < 0) return setNewOffer({ ...newOffer, value: 0 });
                                            if (val > 15) return setNewOffer({ ...newOffer, value: 15 });
                                            setNewOffer({ ...newOffer, value: val });
                                        }}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Details */}
                        <div className="space-y-2">
                            <Label>Description (Internal)</Label>
                            <Input
                                placeholder="What is this offer for?"
                                className="h-11 bg-white dark:bg-zinc-900/50"
                                value={newOffer.desc}
                                onChange={(e) => setNewOffer({ ...newOffer, desc: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Valid Until</Label>
                            <Input
                                type="date"
                                className="h-11 bg-white dark:bg-zinc-900/50 text-muted-foreground"
                                value={newOffer.validUntil}
                                onChange={(e) => setNewOffer({ ...newOffer, validUntil: e.target.value })}
                            />
                        </div>

                        {/* 3. Style Picker */}
                        <div className="space-y-3">
                            <Label>Card Style</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {COUPON_STYLES.map((style, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-12 rounded-lg cursor-pointer transition-all border-2 ${style.bg} ${newOffer.style === idx ? 'ring-2 ring-primary ring-offset-2 border-transparent scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                                        onClick={() => setNewOffer({ ...newOffer, style: idx })}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-5 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            <p className="text-[10px] uppercase font-bold text-center text-muted-foreground/60 mb-3 tracking-widest">Live Preview</p>
                            <div className="flex items-center justify-between bg-white dark:bg-black p-4 rounded-xl border shadow-sm ring-1 ring-black/5">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`p-2.5 sm:p-3 rounded-lg ${COUPON_STYLES[newOffer.style].bg.split(' ')[0]} ${COUPON_STYLES[newOffer.style].text} shrink-0`}>
                                        <Ticket className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm sm:text-base tracking-tight truncate">{newOffer.code || 'CODE'}</p>
                                        <p className="text-[10px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wide truncate">{`${newOffer.value}% saved`}</p>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="font-mono text-[10px]">APPLIED</Badge>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="p-6 border-t bg-white dark:bg-zinc-900 shrink-0 flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                            Create Offer
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            {/* 📝 Quick Edit Sheet */}
            <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-6 border-b">
                        <SheetTitle>Update Discount</SheetTitle>
                        <SheetDescription>Adjust the percentage for {editingOffer?.code}</SheetDescription>
                    </SheetHeader>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label>Discount Value (%)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={editValue}
                                    min={0}
                                    max={15}
                                    onChange={(e) => setEditValue(Number(e.target.value))}
                                    className="pl-8 h-12 text-lg font-bold"
                                />
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">Maximum allowed discount is 15%.</p>
                        </div>
                    </div>
                    <SheetFooter className="mt-auto p-6 border-t gap-3">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">Cancel</Button>
                        <Button onClick={handleUpdate} className="flex-1">Save Changes</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* ⚠️ Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the <span className="font-bold text-foreground">"{deletingOffer?.code}"</span> campaign. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletingOffer && handleDelete(deletingOffer.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Campaign
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

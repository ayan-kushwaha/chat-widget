"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, DollarSign, Tag, Settings, Ticket, Loader2 } from "lucide-react";
import PlanCard from "./components/PlanCard";
import FeatureList from "./components/FeatureList";
import OffersPage from "./components/OffersPage";
import PlanEditor from "./components/PlanEditor";
import { featuresAPI } from "@/api/features.api";
import { plansAPI } from "@/api/plans.api";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export default function AdminPricingPage() {
    // Navigation State
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get active tab from URL or default to "features"
    const activeTab = searchParams.get("tab") || "features";

    const [isPlanEditorOpen, setIsPlanEditorOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [allFeatures, setAllFeatures] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);

    const handleTabChange = (val: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", val);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [plansRes, featuresRes] = await Promise.all([
                plansAPI.getAllWithInactive(), // Admin needs to see ALL plans
                featuresAPI.getAll()
            ]);

            setPlans(plansRes.data); // Backend sends names now
            setAllFeatures(featuresRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load pricing data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreatePlan = () => {
        setEditingPlan(null);
        setIsPlanEditorOpen(true);
    };

    const handleEditPlan = (plan: any) => {
        setEditingPlan(plan);
        setIsPlanEditorOpen(true);
    };

    const handleToggleStatus = async (plan: any) => {
        try {
            const updatedPlan = {
                ...plan,
                isActive: !plan.isActive
            };
            await plansAPI.update(plan.id, { isActive: updatedPlan.isActive });
            toast.success(`${plan.name} is now ${updatedPlan.isActive ? 'active' : 'inactive'}`);
            fetchData(); // Refresh
        } catch (error) {
            console.error("Failed to toggle status", error);
            toast.error("Failed to update plan status");
        }
    };

    const handleDeletePlan = (id: string, name: string) => {
        setPlanToDelete({ id, name });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!planToDelete) return;

        try {
            await plansAPI.delete(planToDelete.id);
            toast.success("Plan deleted successfully");
            fetchData(); // Refresh
        } catch (error: any) {
            console.error("Failed to delete plan", error);
            toast.error(error.response?.data?.message || "Failed to delete plan");
        } finally {
            setDeleteDialogOpen(false);
            setPlanToDelete(null);
        }
    };

    const handleDuplicatePlan = async (plan: any) => {
        try {
            // Create a copy with modified id and name
            const duplicatedPlan = {
                ...plan,
                _id: undefined, // Remove MongoDB ID
                id: `${plan.id}_copy_${Date.now()}`, // New unique ID
                name: `${plan.name} (Copy)`,
                displayName: `${plan.displayName || plan.name} (Copy)`,
                isActive: false // Start as inactive
            };

            await plansAPI.create(duplicatedPlan);
            toast.success(`${plan.name} duplicated successfully`);
            fetchData(); // Refresh
        } catch (error: any) {
            console.error("Failed to duplicate plan", error);
            toast.error(error.response?.data?.message || "Failed to duplicate plan");
        }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage plans, features, and billing intervals
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                    <TabsTrigger value="features" className="gap-2">
                        <Tag className="h-4 w-4" />
                        Menu (Features)
                    </TabsTrigger>
                    <TabsTrigger value="offers" className="gap-2">
                        <Ticket className="h-4 w-4" />
                        Offers & Coupons
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        Plan Builder
                    </TabsTrigger>
                </TabsList>

                {/* Features Tab (The Menu) */}
                <TabsContent value="features">
                    <FeatureList />
                </TabsContent>

                {/* Offers Tab (Separate Module) */}
                <TabsContent value="offers">
                    <OffersPage />
                </TabsContent>

                {/* Plans Tab (The Order Form) */}
                <TabsContent value="plans" className="space-y-6">
                    <Card>
                        <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold">Active Plans</CardTitle>
                                <p className="text-muted-foreground">Manage your subscription tiers.</p>
                            </div>
                            <Button
                                onClick={handleCreatePlan}
                                size="lg"
                                className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                            >
                                <Plus className="w-5 h-5" /> Create New Plan
                            </Button>
                        </CardHeader>
                        <CardContent className="px-0">
                            {isLoading ? (
                                <div className="flex justify-center p-20">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                                    {plans.map((plan) => (
                                        <div key={plan.id} className="h-full">
                                            <PlanCard
                                                plan={plan}
                                                allFeatures={allFeatures}
                                                onEdit={handleEditPlan}
                                                onDelete={(id) => handleDeletePlan(id, plan.name)}
                                                onToggleStatus={handleToggleStatus}
                                            />
                                        </div>
                                    ))}
                                    {plans.length === 0 && (
                                        <div className="col-span-full flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl bg-muted/10">
                                            <Ticket className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                                            <h3 className="text-xl font-bold text-muted-foreground">No plans active</h3>
                                            <Button variant="ghost" onClick={handleCreatePlan} className="mt-2 text-primary underline">Create your first plan</Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Plan Editor Dialog */}
            <PlanEditor
                open={isPlanEditorOpen}
                onClose={() => setIsPlanEditorOpen(false)}
                plan={editingPlan}
                onSaved={() => {
                    setIsPlanEditorOpen(false);
                    fetchData(); // Refresh list
                }}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            Delete Plan?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <span className="block font-semibold text-foreground">
                                Are you sure you want to delete "{planToDelete?.name}"?
                            </span>
                            <span className="block text-sm bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3">
                                ⚠️ <span className="font-semibold text-red-600">Warning:</span> This action cannot be undone. All plan data will be permanently removed.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

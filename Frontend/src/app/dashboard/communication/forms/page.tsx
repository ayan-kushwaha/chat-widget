"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    MoreVertical,
    FileText,
    Calendar,
    Users,
    Trash2,
    Edit,
    Copy,
    Search,
    Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { leadsAPI } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
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

interface LeadForm {
    _id: string;
    name: string;
    fields: any[];
    status: 'active' | 'inactive' | 'draft';
    createdAt: string;
    leadCount?: number;
}

export default function FormManagerPage() {
    const router = useRouter();
    const [forms, setForms] = useState<LeadForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [formToDelete, setFormToDelete] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            const response = await leadsAPI.getForms();
            setForms(response.data);
        } catch (error) {
            console.error("Error fetching forms:", error);
            toast({
                title: "Error",
                description: "Failed to load forms.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateForm = async () => {
        try {
            const newForm = {
                name: `Untitled Form ${new Date().toLocaleString()}`,
                fields: [],
                trigger_intent: ["general"],
                settings: { submit_button_text: "Submit" }
            };
            const response = await leadsAPI.createForm(newForm);
            router.push(`/dashboard/communication/forms/${response.data._id}`);
        } catch (error) {
            console.error("Error creating form:", error);
            toast({
                title: "Error",
                description: "Failed to create new form.",
                variant: "destructive"
            });
        }
    };

    const handleDuplicateForm = async (form: LeadForm) => {
        try {
            const newForm = {
                name: `Copy of ${form.name}`,
                fields: form.fields,
                trigger_intent: ["general"],
                settings: { submit_button_text: "Submit" }
            };
            const response = await leadsAPI.createForm(newForm);
            setForms([...forms, response.data]);
            toast({ title: "Form Duplicated", description: "A copy of the form has been created." });
        } catch (error) {
            console.error("Error duplicating form:", error);
            toast({ title: "Error", description: "Failed to duplicate form.", variant: "destructive" });
        }
    };

    const handleDeleteClick = (id: string) => {
        setFormToDelete(id);
    };

    const confirmDelete = async () => {
        if (!formToDelete) return;
        try {
            await leadsAPI.deleteForm(formToDelete);
            setForms(forms.filter(f => f._id !== formToDelete));
            toast({ title: "Form Deleted", description: "The form has been removed." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete form.", variant: "destructive" });
        } finally {
            setFormToDelete(null);
        }
    };

    const filteredForms = forms.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8  max-w-7xl mx-auto">
            {/* Header & Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        Form Manager
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-base ml-1">
                        Create and manage your lead generation forms.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 sm:w-72 group">
                        <Search className="absolute left-3 top-1/2 z-20 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Search forms..."
                            className="pl-9 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button onClick={handleCreateForm} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
                        <Plus className="mr-2 h-4 w-4" /> Create Form
                    </Button>
                </div>
            </div>

            {/* Forms Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="h-[220px] border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-4 w-1/2" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-20 rounded-full" />
                                    <Skeleton className="h-8 w-20 rounded-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredForms.length === 0 ? (
                <div className="flex flex-col ov items-center justify-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div className="p-4 bg-white dark:bg-neutral-800 rounded-full shadow-sm mb-4">
                        <Wand2 className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">No forms found</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm text-center">
                        Get started by creating your first lead capture form. It only takes a few minutes.
                    </p>
                    <Button onClick={handleCreateForm} variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
                        <Plus className="mr-2 h-4 w-4" /> Create New Form
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredForms.map((form) => (
                        <Card
                            key={form._id}
                            className={`group ov hover:shadow-xl hover:shadow-blue-00/5 transition-all duration-300 border-neutral-200 dark:border-neutral-800 cursor-pointer relative overflow-visible bg-white dark:bg-neutral-900 ${openMenuId === form._id ? 'ring-2 ring-blue-500 border-transparent shadow-lg' : 'hover:border-blue-00 dark:hover:border-blue-800'}`}
                            onClick={() => router.push(`/dashboard/communication/forms/${form._id}`)}
                        >
                            {/* Active Indicator Bar */}
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1.5">
                                        <CardTitle className={`text-lg font-bold flex items-center gap-2 transition-colors ${openMenuId === form._id ? 'text-blue-600' : 'group-hover:text-blue-600'}`}>
                                            {form.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs font-medium flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" />
                                            Created {new Date(form.createdAt).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu onOpenChange={(open) => setOpenMenuId(open ? form._id : null)}>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 -mr-2 transition-colors z-20 relative ${openMenuId === form._id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/communication/forms/${form._id}`); }}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Builder
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicateForm(form); }}>
                                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20" onClick={(e) => { e.stopPropagation(); handleDeleteClick(form._id); }}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 text-sm">
                                    <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-blue-50 hover:text-blue-600 transition-colors px-3 py-1 h-auto gap-1.5 font-medium border-0">
                                        <FileText className="h-3.5 w-3.5" />
                                        {form.fields.length} Fields
                                    </Badge>
                                    <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-blue-50 hover:text-blue-600 transition-colors px-3 py-1 h-auto gap-1.5 font-medium border-0">
                                        <Users className="h-3.5 w-3.5" />
                                        {form.leadCount || 0} Leads
                                    </Badge>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 ">
                                <div className="w-full flex items-center justify-between text-xs text-neutral-400">
                                    <span className={`flex items-center gap-1.5 transition-colors ${form.status === 'active' ? 'text-green-600 font-medium' : ''}`}>
                                        <span className={`h-2 w-2 rounded-full ${form.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-neutral-300'}`} />
                                        {form.status === 'active' ? 'Active' : 'Draft'}
                                    </span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-blue-500 font-medium">
                                        Open Builder <Wand2 className="h-3 w-3" />
                                    </span>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the form and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Form
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

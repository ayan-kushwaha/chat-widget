'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { flowsAPI } from '@/lib/api';
import { Plus, Edit3, Trash2, Calendar, PlayCircle, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useOrg } from "@/context/OrgContext";
import { ConfirmModal } from '@/app/dashboard/builder/components/ConfirmModal';

interface Flow {
    _id: string;
    name: string;
    description?: string;
    updatedAt: string;
    isActive: boolean;
    triggerIndex?: any;
    nodes?: any[];
}

export default function FlowsPage() {
    const [flows, setFlows] = useState<Flow[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { activeOrgId } = useOrg();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        if (activeOrgId) {
            loadFlows();
        }
    }, [activeOrgId]);

    const loadFlows = async () => {
        try {
            const res = await flowsAPI.list({ organizationId: activeOrgId });
            if (res.data.success) {
                setFlows(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load flows", error);
            toast.error("Could not load workflows");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await flowsAPI.delete(deleteId, { organizationId: activeOrgId });
            toast.success("Workflow deleted");
            loadFlows();
        } catch (e) {
            toast.error("Failed to delete");
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className=" max-w-7xl mx-auto">
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Workflow?"
                description="This action cannot be undone. This will permanently delete your automation flow."
                confirmText="Delete Flow"
                isDestructive={true}
            />
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Workflows</h1>
                    <p className="text-slate-400">Manage and edit your automation flows.</p>
                </div>
                <Link href="/dashboard/builder">
                    <button className="flex items-center px-4 py-2 rounded-md font-medium text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all">
                        <Plus size={18} className="mr-2" />
                        New Workflow
                    </button>
                </Link>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64 text-slate-500">Loading workflows...</div>
            ) : flows.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 py-12 dark:border-neutral-800 dark:bg-neutral-900/50"
                >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                        <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
                        No flows yet
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Create your first automated workflow to get started.
                    </p>
                    <Link href="/dashboard/builder">
                        <button className="mt-4 flex items-center px-4 py-2 rounded-md font-medium text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Flow
                        </button>
                    </Link>
                </motion.div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {flows.map((flow, index) => (
                        <motion.div
                            key={flow._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
                        >
                            {/* Gradient Overlay */}
                            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl transition-all group-hover:scale-150"></div>

                            {/* Status Badge */}
                            <div className="mb-4 flex items-center justify-between relative z-10">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${flow.isActive
                                    ? "bg-green-500/10 text-green-500 dark:text-green-400"
                                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                                    }`}>
                                    {flow.isActive ? 'Active' : 'Draft'}
                                </span>

                                <div className="flex items-center gap-1 text-xs text-neutral-500 mr-auto ml-2 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                    <GitBranch size={10} />
                                    <span>{flow.nodes?.length || 0} Nodes</span>
                                </div>

                                <div className="flex gap-1">
                                    <Link href={`/dashboard/builder?flowId=${flow._id}`}>
                                        <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-indigo-500 transition-colors" title="Edit">
                                            <Edit3 size={15} />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => setDeleteId(flow._id)}
                                        className="p-2 hover:bg-red-50 text-red-400 hover:text-red-500 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Flow Info */}
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-1 relative z-10">{flow.name}</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 h-10 mb-6 relative z-10">
                                {flow.description || "No description provided."}
                            </p>

                            {/* Footer Stats */}
                            <div className="flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800 relative z-10">
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Updated {new Date(flow.updatedAt).toLocaleDateString()}</span>
                                </div>

                                {/* Edit Action Button */}
                                <Link href={`/dashboard/builder?flowId=${flow._id}`}>
                                    <button className="flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">
                                        Open Builder <PlayCircle size={12} />
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

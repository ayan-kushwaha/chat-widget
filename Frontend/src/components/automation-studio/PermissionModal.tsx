import React from "react";
import { motion } from "framer-motion";
import { Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NodeData } from "./types";

interface PermissionModalProps {
    isOpen: boolean;
    nodeData: NodeData | null;
    onClose: () => void;
    onGrant: () => void;
}

export default function PermissionModal({
    isOpen,
    nodeData,
    onClose,
    onGrant,
}: PermissionModalProps) {
    if (!isOpen || !nodeData) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
            >
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl shadow-md"
                                style={{ backgroundColor: nodeData.color }}
                            >
                                {nodeData.icon}
                            </div>
                            <div>
                                <CardTitle className="text-lg">Connect {nodeData.name}</CardTitle>
                                <CardDescription>Grant permissions to continue</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border-2 border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                            <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                                        Cluaiz AI wants to:
                                    </h4>
                                    <ul className="mt-2 space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                                        {nodeData.scopes?.map((scope) => (
                                            <li key={scope} className="flex items-start gap-2">
                                                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <span>{scope.replace(/_/g, " ").replace(/\./g, " ")}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                onClick={onGrant}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Grant Access
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

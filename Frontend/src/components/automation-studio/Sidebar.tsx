import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NODE_CATEGORIES } from "./constants";

interface SidebarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedCategory: string | null;
    setSelectedCategory: (category: string | null) => void;
    onDragStart: (event: React.DragEvent, node: any) => void;
}

export default function Sidebar({
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    onDragStart,
}: SidebarProps) {
    return (
        <div className="flex h-full flex-col">
            {/* Search */}
            <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        placeholder="Search nodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                    {NODE_CATEGORIES.filter((category) => {
                        if (!searchQuery) return true;
                        return (
                            category.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            category.nodes.some((node) =>
                                node.name.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                        );
                    }).map((category) => {
                        const CategoryIcon = category.icon;
                        const isOpen = selectedCategory === category.id;
                        const filteredNodes = category.nodes.filter((node) =>
                            node.name.toLowerCase().includes(searchQuery.toLowerCase())
                        );

                        return (
                            <div key={category.id}>
                                <button
                                    onClick={() => setSelectedCategory(isOpen ? null : category.id)}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    <div className="flex items-center gap-2">
                                        <CategoryIcon className="h-4 w-4" style={{ color: category.color }} />
                                        <span className="text-neutral-900 dark:text-white">{category.label}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {filteredNodes.length}
                                        </Badge>
                                    </div>
                                    <ChevronRight
                                        className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? "rotate-90" : ""
                                            }`}
                                    />
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="ml-6 mt-1 space-y-1">
                                                {filteredNodes.map((node) => (
                                                    <motion.div
                                                        key={node.id}
                                                        draggable
                                                        onDragStart={(e: any) => onDragStart(e, node)}
                                                        className="flex cursor-move items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 text-sm transition-all hover:border-purple-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-purple-600"
                                                    >
                                                        <div
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
                                                            style={{ backgroundColor: node.color }}
                                                        >
                                                            {node.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-neutral-900 dark:text-white">
                                                                {node.name}
                                                            </div>
                                                            <div className="text-xs text-neutral-500">{node.subtitle}</div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

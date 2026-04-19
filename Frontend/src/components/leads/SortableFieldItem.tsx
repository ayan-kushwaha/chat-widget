"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SortableFieldItemProps {
    id: string;
    field: any;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

export function SortableFieldItem({ id, field, isSelected, onSelect, onDelete }: SortableFieldItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all mb-2
                ${isSelected
                    ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500/20 shadow-sm"
                    : "border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/50"}
            `}
            onClick={() => onSelect(id)}
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-md transition-colors">
                <GripVertical className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100 break-words leading-snug">{field.label}</p>
                <p className="text-[10px] text-muted-foreground truncate font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {field.key}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {field.required && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-red-100 dark:ring-red-900/30" title="Required" />
                )}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                    {field.type}
                </Badge>
            </div>
        </div>
    );
}

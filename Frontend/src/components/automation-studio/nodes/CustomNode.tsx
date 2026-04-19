import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { NodeData } from "../types";

interface CustomNodeData {
    nodeType: "trigger" | "logic" | "action";
    originalData: NodeData;
    status?: 'idle' | 'running' | 'success' | 'error' | 'waiting';
    errorMessage?: string;
}

export default function CustomNode({ data }: NodeProps<CustomNodeData>) {
    const { nodeType, originalData, status = 'idle', errorMessage } = data;

    // Status-based styling
    const statusStyles = {
        idle: { borderColor: originalData.color, boxShadow: 'none' },
        running: {
            borderColor: '#3b82f6',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        },
        success: {
            borderColor: '#22c55e',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)'
        },
        error: {
            borderColor: '#ef4444',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
        },
        waiting: {
            borderColor: '#eab308',
            boxShadow: '0 0 20px rgba(234, 179, 8, 0.5)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        },
    };

    const currentStyle = statusStyles[status];

    return (
        <div
            className="shadow-lg rounded-xl bg-white border-3 min-w-[220px] transition-all hover:shadow-xl dark:bg-neutral-900"
            style={{
                borderWidth: "3px",
                ...currentStyle
            }}
        >
            {/* Input Handle (Target) - Not for triggers */}
            {nodeType !== "trigger" && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="h-3 w-3 !bg-neutral-400 dark:!bg-neutral-600"
                />
            )}

            <div className="flex items-center gap-3 p-3">
                <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-md"
                    style={{ backgroundColor: originalData.color }}
                >
                    {originalData.icon}
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-neutral-900 dark:text-white">
                        {originalData.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {originalData.subtitle}
                    </div>
                </div>

                {/* Status Indicator */}
                {status !== 'idle' && (
                    <div className="flex items-center gap-1">
                        {status === 'running' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                        )}
                        {status === 'success' && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        {status === 'error' && (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                        {status === 'waiting' && (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message Display */}
            {status === 'error' && errorMessage && (
                <div className="mx-3 mb-3 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                    <p className="text-xs text-red-700 dark:text-red-400">
                        ❌ {errorMessage}
                    </p>
                </div>
            )}

            {/* Waiting Indicator */}
            {status === 'waiting' && (
                <div className="mx-3 mb-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        ⏸️ Waiting for input...
                    </p>
                </div>
            )}

            {/* Output Handle (Source) - Not for actions without logic */}
            <Handle
                type="source"
                position={Position.Right}
                className="h-3 w-3 !bg-neutral-400 dark:!bg-neutral-600"
            />
        </div>
    );
}

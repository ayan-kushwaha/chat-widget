import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Play, Clock, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { ExecutionLog } from '@/utils/FlowRunner';

interface DebugPanelProps {
    logs: ExecutionLog[];
    variables: Record<string, any>;
    onClear: () => void;
    isRunning: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ logs, variables, onClear, isRunning }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'logs' | 'variables'>('logs');

    const getLogIcon = (type: ExecutionLog['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-3 h-3 text-green-500" />;
            case 'error':
                return <XCircle className="w-3 h-3 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
            default:
                return <Info className="w-3 h-3 text-blue-500" />;
        }
    };

    const getLogColor = (type: ExecutionLog['type']) => {
        switch (type) {
            case 'success':
                return 'text-green-400';
            case 'error':
                return 'text-red-400';
            case 'warning':
                return 'text-yellow-400';
            default:
                return 'text-blue-400';
        }
    };

    return (
        <div className={`fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 transition-all duration-300 z-50 ${isOpen ? 'h-80' : 'h-12'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <Play size={16} className={isRunning ? "text-blue-400 animate-pulse" : "text-slate-500"} />
                    <span className="text-sm font-semibold text-white">Execution Console</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded">
                        {logs.length} logs
                    </span>
                    {isRunning && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-medium rounded animate-pulse">
                            ● Running
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Tab Buttons */}
                    {isOpen && (
                        <div className="flex bg-slate-800 rounded-lg p-0.5 mr-2">
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'logs'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Logs
                            </button>
                            <button
                                onClick={() => setActiveTab('variables')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'variables'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Variables
                            </button>
                        </div>
                    )}

                    <button
                        onClick={onClear}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        title="Clear logs"
                    >
                        <Trash2 size={14} />
                    </button>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    >
                        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>
            </div>

            {/* Content */}
            {isOpen && (
                <div className="h-[calc(100%-48px)] overflow-y-auto custom-scrollbar">
                    {activeTab === 'logs' ? (
                        <div className="p-4 space-y-1.5 font-mono text-xs">
                            {logs.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Info size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No execution logs yet</p>
                                    <p className="text-[10px] mt-1">Click "Test Flow" to start execution</p>
                                </div>
                            ) : (
                                logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-900/50 transition-colors group"
                                    >
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getLogIcon(log.type)}
                                        </div>

                                        {/* Timestamp */}
                                        <span className="text-slate-600 text-[10px] w-20 flex-shrink-0">
                                            {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false
                                            })}
                                        </span>

                                        {/* Node ID */}
                                        <span className={`${getLogColor(log.type)} w-24 flex-shrink-0 truncate`}>
                                            [{log.nodeId}]
                                        </span>

                                        {/* Message */}
                                        <span className="text-slate-300 flex-1">
                                            {log.message}
                                        </span>

                                        {/* Data (if present) */}
                                        {log.data && (
                                            <button
                                                className="text-[10px] text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => console.log(log.data)}
                                                title="View data in console"
                                            >
                                                📋
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="p-4">
                            {Object.keys(variables).length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Info size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No variables stored yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(variables).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800"
                                        >
                                            <div className="flex-1">
                                                <div className="text-xs font-semibold text-purple-400 mb-1">
                                                    {key}
                                                </div>
                                                <div className="text-xs text-slate-300 font-mono break-all">
                                                    {typeof value === 'object'
                                                        ? JSON.stringify(value, null, 2)
                                                        : String(value)
                                                    }
                                                </div>
                                            </div>
                                            <button
                                                className="text-[10px] text-slate-500 hover:text-slate-300"
                                                onClick={() => navigator.clipboard.writeText(String(value))}
                                                title="Copy value"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

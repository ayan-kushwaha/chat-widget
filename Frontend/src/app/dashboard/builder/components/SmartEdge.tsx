import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from 'reactflow';
import { X, Trash2 } from 'lucide-react';

export const SmartEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
}: EdgeProps) => {
    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
    });

    const onEdgeClick = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        setEdges((edges) => edges.filter((e) => e.id !== id));
    };

    return (
        <div className="group/edge relative">
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 10,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan flex flex-col items-center gap-1"
                >
                    {label && (
                        <div className="bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded shadow-lg flex flex-col items-center">
                            <span className="text-[8px] uppercase font-bold tracking-widest text-slate-500 mb-0.5">Intent</span>
                            <span className="font-bold text-amber-400">{label}</span>
                        </div>
                    )}

                    {/* DISCONNECT BUTTON - Shows on hover or if no label */}
                    <button
                        className={`w-5 h-5 rounded-full bg-slate-900 border border-red-500/50 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all shadow-lg ${label ? 'opacity-0 group-hover/edge:opacity-100' : 'opacity-100'}`}
                        onClick={onEdgeClick}
                        title="Disconnect / Delete Edge"
                    >
                        <X size={10} strokeWidth={3} />
                    </button>
                </div>
            </EdgeLabelRenderer>
        </div>
    );
};

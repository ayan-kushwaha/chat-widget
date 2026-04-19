import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MediaPreview } from './MediaPreview';
import {
    PlayCircle, FileText, MousePointer, Clock,
    MessageSquare, Image as ImageIcon, Layout as LayoutIcon, Upload,
    User, Smartphone, Calendar,
    Bot, Zap, Brain, Database, Repeat, Workflow,
    Mail, Plus, Trash2, ArrowRight, ExternalLink, AlertTriangle, Hash, Mic, List, Paperclip
} from 'lucide-react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { INTEGRATION_APPS } from '../apps_registry'; // Import Registry for Icons

// --- HELPER COMPONENTS ---
const NodeHandle = ({ type, position, id }: { type: 'target' | 'source', position: Position, id?: string }) => (
    <Handle
        type={type}
        position={position}
        id={id}
        className={`!w-3 !h-3 !bg-slate-950 !border-2 ${type === 'target' ? '!border-indigo-500' : '!border-pink-500'} !transition-all hover:!bg-white hover:!scale-125 z-50`}
    />
);

// --- 1. TRIGGER NODE ---
// --- 1. TRIGGER NODE ---
export const TriggerNode = memo(({ data, selected }: NodeProps) => {
    // Lookup App Icon
    const app = INTEGRATION_APPS.find(a => a.id === data.appId);
    const AppIcon = app?.icon;

    // Dynamic Description based on config
    const getDetails = () => {
        if (data.urlCondition) return `Run on: ${data.urlCondition} ${data.urlValue || ''}`;
        if (data.keywords) {
            const text = Array.isArray(data.keywords) ? data.keywords.join(', ') : data.keywords;
            return `Keywords: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`;
        }
        if (data.delaySeconds) return `Wait: ${data.delaySeconds}s`;
        if (data.elementId) return `Click ID: #${data.elementId}`;
        if (data.scrollPercent) return `Scroll: ${data.scrollPercent}%`;
        if (data.mobileFallback !== undefined) return `Exit Intent (Mobile: ${data.mobileFallback ? 'On' : 'Off'})`;
        return data.description || "Start flow when this event occurs.";
    };

    return (
        <div className={`w-64 bg-slate-900 border-2 rounded-xl shadow-2xl transition-all ${selected ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-slate-800'}`}>
            <div className={`px-4 py-2 flex items-center gap-2 rounded-t-[10px] ${data.label === 'Exit Intent' ? 'bg-red-600' :
                data.label === 'Scroll Depth' ? 'bg-orange-600' :
                    data.label === 'Traffic Source' ? 'bg-green-600' :
                        data.urlCondition ? 'bg-purple-600' : // Visitor Lands
                            data.delaySeconds ? 'bg-indigo-600' : // Time Delay
                                'bg-slate-700'
                }`}>
                {data.icon === 'PlayCircle' && <PlayCircle size={16} className="text-white" />}
                {data.icon === 'FileText' && <FileText size={16} className="text-white" />}
                {data.icon === 'MousePointer' && <MousePointer size={16} className="text-white" />}
                {data.icon === 'Clock' && <Clock size={16} className="text-white" />}
                {data.icon === 'ExternalLink' && <ExternalLink size={16} className="text-white" />}
                {data.icon === 'LayoutIcon' && <LayoutIcon size={16} className="text-white" />}
                {data.icon === 'LayoutIcon' && <LayoutIcon size={16} className="text-white" />}
                {data.icon === 'Zap' && <Zap size={16} className="text-white" />}
                {/* Fallback to App Icon if available */}
                {!['PlayCircle', 'FileText', 'MousePointer', 'Clock', 'ExternalLink', 'LayoutIcon', 'Zap'].includes(data.icon) && AppIcon && <AppIcon size={16} className="text-white" />}
                {!['PlayCircle', 'FileText', 'MousePointer', 'Clock', 'ExternalLink', 'LayoutIcon', 'Zap'].includes(data.icon) && !AppIcon && <Zap size={16} className="text-white" />}
                <span className="text-xs font-bold text-white uppercase tracking-wider">{data.label}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-b-[10px]">
                <p className="text-[10px] text-slate-400 font-mono">
                    {getDetails()}
                </p>
                {data.sourceType && (
                    <div className="mt-2 text-[10px] bg-slate-900 p-1 rounded border border-slate-800 text-green-400">
                        {data.sourceType.toUpperCase()}: {data.sourceValue || 'Any'}
                    </div>
                )}
            </div>
            <NodeHandle type="source" position={Position.Bottom} />
        </div>
    );
});

// --- 2. MESSAGE NODE ---
// --- 2. MESSAGE NODE ---
export const MessageNode = memo(({ data, selected }: NodeProps) => {
    // Dynamic Icon Logic
    const Icon = {
        'Mic': Mic,
        'List': List,
        'Paperclip': Paperclip,
        'ExternalLink': ExternalLink,
        'ImageIcon': ImageIcon,
        'MessageSquare': MessageSquare
    }[data.icon as string] || MessageSquare;

    return (
        <div className={`w-72 bg-slate-900 border-2 rounded-xl shadow-2xl transition-all ${selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-800'}`}>
            <NodeHandle type="target" position={Position.Top} />
            <div className="bg-blue-600 px-4 py-2 flex items-center gap-2 rounded-t-[10px]">
                <Icon size={16} className="text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">{data.label}</span>
            </div>
            <div className="p-4 bg-slate-950 space-y-3 rounded-b-[10px]">
                <div className="bg-slate-900 rounded-lg p-3 text-sm text-slate-300 border border-slate-800 relative">
                    {data.image && (
                        <MediaPreview url={data.image} className="mb-2 h-32" />
                    )}
                    {data.text || "Type your message..."}
                    {/* Tail for speech bubble effect */}
                    <div className="absolute -left-2 top-4 w-3 h-3 bg-slate-900 border-l border-b border-slate-800 rotate-45"></div>
                </div>
            </div>
            <NodeHandle type="source" position={Position.Bottom} />
        </div>
    );
});

// --- 3. INPUT / FAQ NODE (Branching Logic) ---
export const InputNode = memo(({ data, selected, id }: NodeProps) => {
    // Icon Selection Logic
    const InputIcon = {
        email: Mail,
        phone: Smartphone,
        date: Calendar,
        file: Upload,
        number: Hash,
        text: MessageSquare
    }[data.inputType as 'email' | 'phone' | 'date' | 'file' | 'number' | 'text' || 'text'] || MessageSquare;

    return (
        <div className={`w-64 bg-slate-900 border-2 rounded-xl overflow-hidden shadow-xl transition-all ${selected ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-slate-800'}`}>
            <NodeHandle type="target" position={Position.Top} />

            {/* Header changes color/icon based on selection */}
            <div className="bg-pink-600 px-3 py-2 flex items-center gap-2">
                <InputIcon size={14} className="text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Get {data.inputType || 'Input'}
                </span>
            </div>

            <div className="p-3 bg-slate-950">
                <p className="text-xs text-slate-300 italic">"{data.question || '...'}"</p>
                <div className="mt-2 text-[10px] text-slate-500 font-mono bg-slate-900 p-1 rounded border border-slate-800 text-center">
                    Saves to: <span className="text-yellow-500">{`{{${data.variableName || 'var'}}}`}</span>
                </div>
            </div>

            <NodeHandle type="source" position={Position.Bottom} />
        </div>
    );
});

// --- 3B. FAQ NODE (Dedicated Tree Engine) ---
export const FaqNode = memo(({ data, selected, id }: NodeProps) => {
    return (
        <div className={`w-80 bg-slate-900 border-2 rounded-xl shadow-2xl transition-all ${selected ? 'border-pink-600 ring-2 ring-pink-600/30' : 'border-slate-800'}`}>
            <NodeHandle type="target" position={Position.Top} />

            {/* HEADER */}
            <div className="bg-pink-600 px-4 py-3 flex items-center justify-between rounded-t-[10px]">
                <div className="flex items-center gap-2">
                    <LayoutIcon size={18} className="text-white" />
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                        FAQ / Menu Tree
                    </span>
                </div>
                <div className="bg-pink-700/50 px-2 py-0.5 rounded text-[10px] font-mono text-pink-100 border border-pink-500/30">
                    {`{{${data.variableName || 'user_choice'}}}`}
                </div>
            </div>

            {/* BODY */}
            <div className="p-4 bg-slate-950 space-y-4 rounded-b-[10px]">

                {/* QUESTION INPUT */}
                <div className="relative group">
                    <div className="absolute -top-2.5 left-2 px-1 bg-slate-950 text-[10px] font-bold text-pink-500">
                        Ask the user:
                    </div>
                    <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none transition-all"
                        rows={2}
                        placeholder="e.g. What service are you looking for?"
                        value={data.question}
                        readOnly // In builder canvas, often read-only or handled via properties panel
                    />
                </div>

                {/* OPTIONS LIST (Extension Board) */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                        <span className="uppercase tracking-widest font-bold">Options (Branches)</span>
                        <span>{data.options?.length || 0} Routes</span>
                    </div>

                    <div className="flex flex-col gap-2">
                        {(data.options || ['Option 1', 'Option 2']).map((opt: string, idx: number) => (
                            <div key={idx} className="relative group/opt">
                                <div className="h-10 px-4 bg-slate-800 border border-slate-700 hover:border-pink-500 rounded-lg flex items-center justify-between text-xs text-slate-200 transition-all hover:bg-slate-800/80">
                                    <span className="font-medium">{opt}</span>

                                    {/* CONTROLS */}
                                    <div className="flex items-center gap-3">
                                        {/* QUICK ADD CHILD */}
                                        <button
                                            className="opacity-0 group-hover/opt:opacity-100 p-1 hover:bg-pink-500/20 text-pink-400 rounded transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const event = new CustomEvent('tree-add-node', {
                                                    detail: { parentId: id, optionIdx: idx, optionLabel: opt }
                                                });
                                                window.dispatchEvent(event);
                                            }}
                                            title="Add Next Step"
                                        >
                                            <Plus size={14} />
                                        </button>

                                        {/* CONNECTOR DOT (SOCKET) */}
                                        <div className="flex items-center gap-1">
                                            <span className="text-[8px] text-slate-600 uppercase font-mono tracking-tighter opacity-0 group-hover/opt:opacity-100 transition-opacity">
                                                Link
                                            </span>
                                            <div className="relative w-3 h-3">
                                                <Handle
                                                    type="source"
                                                    position={Position.Right}
                                                    id={`option-${idx}`}
                                                    className="!w-3 !h-3 !bg-pink-500 !border-2 !border-slate-950 !right-[-8px] !top-1/2 !-translate-y-1/2 hover:!scale-125 transition-transform z-50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {(!data.options || data.options.length === 0) && (
                        <div className="text-center py-4 border-2 border-dashed border-slate-800 rounded-lg text-slate-600 text-xs">
                            No options added. Add via Properties.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Outlet (Optional fallback) */}
            <NodeHandle type="source" position={Position.Bottom} />
        </div>
    );
});

// --- 4. CAROUSEL NODE ---
export const CarouselNode = memo(({ data, selected }: NodeProps) => (
    <div className={`w-80 bg-slate-900 border-2 rounded-xl shadow-2xl transition-all ${selected ? 'border-cyan-500 ring-2 ring-cyan-500/30' : 'border-slate-800'}`}>
        <NodeHandle type="target" position={Position.Top} />
        <div className="bg-cyan-600 px-4 py-2 flex items-center justify-between rounded-t-[10px]">
            <div className="flex items-center gap-2">
                <LayoutIcon size={16} className="text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Carousel</span>
            </div>
            {data.dynamic && (
                <span className="bg-cyan-800 text-[9px] px-1.5 py-0.5 rounded text-cyan-200 border border-cyan-400/30 flex items-center gap-1">
                    <Zap size={8} /> DYNAMIC
                </span>
            )}
        </div>
        <div className="p-3 bg-slate-950 flex gap-2 overflow-hidden opacity-80 rounded-b-[10px]">
            {[1, 2].map(i => (
                <div key={i} className="w-24 h-32 bg-slate-800 rounded border border-slate-700 flex-shrink-0 flex flex-col p-1">
                    <div className="h-16 bg-slate-700 rounded-sm mb-1"></div>
                    <div className="h-2 w-16 bg-slate-600 rounded-full mb-1"></div>
                    <div className="h-2 w-10 bg-slate-600 rounded-full"></div>
                </div>
            ))}
        </div>
        <NodeHandle type="source" position={Position.Bottom} />
    </div>
));

// --- 5. AI AGENT NODE ---
export const AiNode = memo(({ data, selected }: NodeProps) => (
    <div className={`w-64 bg-slate-900 border-2 rounded-xl shadow-2xl transition-all ${selected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800'}`}>
        <NodeHandle type="target" position={Position.Top} />
        <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2 rounded-t-[10px]">
            <Bot size={16} className="text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">AI Agent</span>
        </div>
        <div className="p-4 bg-slate-950 relative overflow-hidden rounded-b-[10px]">
            <div className="absolute top-0 right-0 p-2 opacity-20">
                <Brain size={48} className="text-indigo-500" />
            </div>
            <p className="text-indigo-200 text-xs font-mono mb-2">Prompt:</p>
            <div className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-400 italic">
                {data.prompt ? `"${data.prompt.substring(0, 40)}..."` : "Generate a response regarding..."}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>Model: GPT-4o</span>
                <div className="flex items-center gap-1"><Zap size={10} className="text-amber-400" /> 1 Credit</div>
            </div>
        </div>
        <NodeHandle type="source" position={Position.Bottom} />
    </div>
));

// --- 6. LOGIC / VAR NODES ---
export const LogicNode = memo(({ data, selected }: NodeProps) => {
    // Lookup App if generic action
    const app = INTEGRATION_APPS.find(a => a.id === data.appId);
    const AppIcon = app?.icon;

    return (
        <div className={`w-64 bg-slate-900 border-2 rounded-xl shadow-2xl transition-all ${selected ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-slate-800'}`}>
            <NodeHandle type="target" position={Position.Top} />
            <div className="bg-orange-600 px-4 py-2 flex items-center justify-between rounded-t-[10px]">
                <div className="flex items-center gap-2">
                    {/* Dynamically render icon based on data.icon string */}
                    {data.icon === 'Zap' && <Zap size={16} className="text-white" />}
                    {data.icon === 'Brain' && <Brain size={16} className="text-white" />}
                    {data.icon === 'Clock' && <Clock size={16} className="text-white" />}
                    {data.icon === 'Repeat' && <Repeat size={16} className="text-white" />}
                    {/* Fallback to App Icon */}
                    {!['Zap', 'Brain', 'Clock', 'Repeat'].includes(data.icon) && AppIcon && <AppIcon size={16} className="text-white" />}
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{data.label}</span>
                </div>
            </div>
            <div className="p-4 bg-slate-950 rounded-b-[10px]">
                <div className="text-[10px] text-slate-400 font-mono">
                    {data.condition || "Action Configured"}
                </div>
            </div>
            <NodeHandle type="source" position={Position.Bottom} />
        </div>
    );
});

export const SetVarNode = memo(({ data, selected }: NodeProps) => (
    <div className={`w-56 bg-slate-900 border-2 rounded-xl shadow-2xl transition-all ${selected ? 'border-teal-500 ring-2 ring-teal-500/30' : 'border-slate-800'}`}>
        <NodeHandle type="target" position={Position.Top} />
        <div className="bg-teal-600 px-4 py-2 flex items-center justify-between rounded-t-[10px]">
            <div className="flex items-center gap-2">
                <Database size={16} className="text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Set Var</span>
            </div>
            {data.varType && (
                <span className="text-[9px] bg-slate-900/40 px-1 rounded text-white font-mono uppercase border border-white/20">
                    {data.varType.substring(0, 3)}
                </span>
            )}
        </div>
        <div className="p-3 bg-slate-950 text-center rounded-b-[10px]">
            <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-teal-300 font-mono inline-block mb-1">
                {data.variable || 'user_score'}
            </div>
            <div className="text-slate-500 text-[10px]">=</div>
            <div className="text-slate-300 text-xs font-bold truncate max-w-[150px] mx-auto">
                {data.value || '0'}
            </div>
        </div>
        <NodeHandle type="source" position={Position.Bottom} />
    </div>
));


// --- 7. FORM NODE (External Ref) ---
export const FormNode = memo(({ data, selected }: NodeProps) => {
    const hasError = !data.formId;

    return (
        <div className={`w-72 bg-slate-900 border-2 rounded-xl overflow-hidden shadow-xl transition-all ${selected
            ? (hasError ? 'border-red-500 ring-2 ring-red-500/30' : 'border-pink-500 ring-2 ring-pink-500/20')
            : (hasError ? 'border-red-600/80 shadow-red-900/20' : 'border-slate-800')
            }`}>
            <NodeHandle type="target" position={Position.Top} />

            {/* Header */}
            <div className={`${hasError ? 'bg-red-900/30 border-b border-red-500/30' : 'bg-pink-600/20 border-b border-pink-500/30'} p-3 flex items-center justify-between transition-colors`}>
                <div className={`flex items-center gap-2 ${hasError ? 'text-red-400' : 'text-pink-300'}`}>
                    {hasError ? <AlertTriangle size={16} /> : <FileText size={16} />}
                    <span className="text-xs font-bold uppercase tracking-wider">{hasError ? 'Form Missing' : 'Smart Form'}</span>
                </div>
                {/* Link to open Form Builder */}
                {data.formId && (
                    <a href={`/dashboard/communication/forms`} target="_blank" className="text-[10px] bg-pink-600 text-white px-2 py-0.5 rounded flex items-center gap-1 hover:bg-pink-500 transition-colors">
                        Edit <ExternalLink size={10} />
                    </a>
                )}
            </div>

            {/* Content Preview */}
            <div className="p-4 bg-slate-950">
                {hasError ? (
                    <div className="flex items-start gap-2">
                        <div className="text-xs text-red-400 font-medium leading-relaxed">
                            <span className="block mb-1 text-[10px] uppercase font-bold text-red-500 opacity-70">Action Required</span>
                            Please select or create a form in the properties panel.
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-white font-bold mb-1">
                            {data.formName || "Select a Form"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                            {data.fieldCount ? `${data.fieldCount} fields` : "No form selected"}
                        </p>
                    </>
                )}
            </div>

            <NodeHandle type="source" position={Position.Bottom} />
        </div>
    );
});

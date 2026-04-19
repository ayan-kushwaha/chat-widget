
import React, { useState, useMemo } from 'react';
import { Node, Edge, getIncomers } from 'reactflow';
import {
    Settings, Trash2, Zap, Brain, Workflow, Repeat, Database, Layout as LayoutIcon,
    Smartphone, Calendar, User, Upload, Plus, Bot, FileText, Check, Copy, ExternalLink,
    MessageSquare,
    ImageIcon,
    PlayCircle,
    MousePointer,
    Clock,
    Music,
    Video,
    LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomSelect } from './CustomSelect';
import { ChipsInput } from './ChipsInput';
import { MediaPreview } from './MediaPreview';
import { VariablePicker, VariableGroup } from './VariablePicker';

// Mock Data for Forms
import { leadsAPI } from '@/lib/api';
import api from '@/lib/api';
import { useOrg } from "@/context/OrgContext";

interface Form {
    _id: string;
    name: string;
    fields: any[];
}

interface KnowledgeSource {
    id: string;
    type: 'website' | 'file' | 'text';
    name: string;
    status: string;
}

// Helper: Get all ancestor nodes (recursive) to find available variables
const getAncestors = (node: Node, nodes: Node[], edges: Edge[]): Node[] => {
    const incomers = getIncomers(node, nodes, edges);
    let ancestors: Node[] = [...incomers];
    incomers.forEach(incomer => {
        // Avoid infinite loops
        const parents = getAncestors(incomer, nodes, edges);
        parents.forEach(p => {
            if (!ancestors.find(a => a.id === p.id)) {
                ancestors.push(p);
            }
        });
    });
    return ancestors;
};

// Helper for Object keys
const getDeepKeys = (obj: any, prefix = ''): string[] => {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj).reduce((res: string[], el) => {
        if (Array.isArray(obj[el])) return res;
        else if (typeof obj[el] === 'object' && obj[el] !== null) {
            return [...res, ...getDeepKeys(obj[el], prefix + el + '.')];
        }
        return [...res, prefix + el];
    }, []);
};

interface PropertiesPanelProps {
    selectedNode: Node;
    nodes: Node[];
    edges: Edge[];
    updateNodeData: (field: string, value: any) => void;
    deleteSelectedNode: () => void;
    deleteEdge?: (edgeId: string) => void;
}

export const PropertiesPanel = ({ selectedNode, nodes, edges, updateNodeData, deleteSelectedNode, deleteEdge }: PropertiesPanelProps) => {
    const { activeOrgId } = useOrg();
    const [activeAiTab, setActiveAiTab] = useState('persona');
    const [availableForms, setAvailableForms] = useState<Form[]>([]);
    const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
    const [knowledgeLoading, setKnowledgeLoading] = useState(false);

    // State for Variable Picker
    const [activePickerField, setActivePickerField] = useState<string | null>(null);

    React.useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await leadsAPI.getForms();
                setAvailableForms(response.data);
            } catch (error) {
                console.error("Failed to fetch forms", error);
            }
        };
        fetchForms();
    }, []);

    // Fetch Knowledge Base
    React.useEffect(() => {
        if (!activeOrgId || activeAiTab !== 'knowledge') return;

        const fetchKnowledge = async () => {
            setKnowledgeLoading(true);
            try {
                const res = await api.get(`/knowledge/${activeOrgId}/overview`);
                if (res.data.success) {
                    const sources: KnowledgeSource[] = [
                        ...(res.data.sources.websites || []).map((s: any) => ({ ...s, type: 'website', name: s.url })),
                        ...(res.data.sources.documents || []).map((s: any) => ({ ...s, type: 'file', name: s.filename })),
                        ...(res.data.sources.custom_text || []).map((s: any) => ({ ...s, type: 'text', name: s.title || 'Manual Entry' }))
                    ];
                    setKnowledgeSources(sources);
                }
            } catch (error) {
                console.error("Failed to fetch knowledge", error);
            } finally {
                setKnowledgeLoading(false);
            }
        };
        fetchKnowledge();
    }, [activeOrgId, activeAiTab]);

    // --- CALCULATE AVAILABLE VARIABLES ---
    const availableVariables = useMemo(() => {
        const ancestors = getAncestors(selectedNode, nodes, edges);
        const vars: VariableGroup[] = [];

        ancestors.forEach(node => {
            if (node.data.outputs && Array.isArray(node.data.outputs) && node.data.outputs.length > 0) {
                vars.push({
                    sourceName: node.data.label || 'Unknown Step',
                    sourceId: node.id,
                    icon: Zap,
                    variables: node.data.outputs
                });
            }
            if (node.type === 'question' && node.data.variableName) {
                vars.push({
                    sourceName: `Question: ${node.data.label}`,
                    sourceId: node.id,
                    variables: [{ label: 'User Answer', value: `{{${node.data.variableName}}}` }]
                });
            }
        });

        vars.push({
            sourceName: 'System',
            sourceId: 'system',
            variables: [
                { label: 'Current Date', value: '{{expect.date}}' },
                { label: 'User ID', value: '{{contact.id}}' }
            ]
        });

        return vars;
    }, [selectedNode, nodes, edges]);


    return (
        <div className="absolute top-4 right-4 w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-0 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right-8 overflow-hidden z-20 flex flex-col max-h-[85vh]">
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0"></div>
            <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Settings size={14} className="text-slate-400" />
                    Configure Node
                </h3>
                <button onClick={deleteSelectedNode} className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1.5 rounded-md transition-all">
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="px-5 pt-5 pb-20 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Label / Title (Fixed)</label>
                    <div className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg px-3 py-2 text-sm text-slate-400 font-medium cursor-not-allowed select-none italic flex justify-between items-center">
                        {selectedNode.data.label}
                        <span className="text-[9px] uppercase border px-1 rounded text-slate-600 border-slate-700">{selectedNode.type}</span>
                    </div>
                </div>

                {/* --- DYNAMIC ACTION CONFIGURATION (The "Magic" Part) --- */}
                {selectedNode.type === 'action' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap size={14} className="text-indigo-400" />
                                <span className="text-xs font-bold text-indigo-300">Action Configuration</span>
                            </div>
                            <p className="text-[10px] text-indigo-400/80">{selectedNode.data.description || "Configure this action."}</p>
                        </div>

                        {selectedNode.data.inputs && selectedNode.data.inputs.length > 0 ? (
                            selectedNode.data.inputs.map((input: any) => (
                                <div key={input.name} className="space-y-1.5 relative group">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                        {input.label}
                                        {input.required && <span className="text-red-400">*</span>}
                                    </label>
                                    <div className="relative">
                                        {(input.type === 'string' || input.type === 'text' || !input.type) && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 placeholder-slate-700 transition-all font-medium"
                                                    placeholder={input.placeholder || `Enter ${input.label}...`}
                                                    value={selectedNode.data[input.name] || ''}
                                                    onChange={(e) => updateNodeData(input.name, e.target.value)}
                                                />
                                                <button
                                                    onClick={() => setActivePickerField(activePickerField === input.name ? null : input.name)}
                                                    className={`p-2 rounded-lg border transition-all ${activePickerField === input.name ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50'}`}
                                                >
                                                    <Zap size={14} />
                                                </button>
                                            </div>
                                        )}
                                        {input.type === 'textarea' && (
                                            <div className="relative">
                                                <textarea
                                                    rows={4}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 resize-none"
                                                    value={selectedNode.data[input.name] || ''}
                                                    onChange={(e) => updateNodeData(input.name, e.target.value)}
                                                />
                                                <button
                                                    onClick={() => setActivePickerField(activePickerField === input.name ? null : input.name)}
                                                    className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-900/80 text-slate-400 hover:text-indigo-400"
                                                >
                                                    <Zap size={12} />
                                                </button>
                                            </div>
                                        )}
                                        {input.type === 'select' && (
                                            <CustomSelect
                                                label=""
                                                value={selectedNode.data[input.name] || ''}
                                                onChange={(val) => updateNodeData(input.name, val)}
                                                options={input.options || []}
                                                placeholder={input.placeholder || "Select option"}
                                            />
                                        )}
                                        {input.type === 'boolean' && (
                                            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNode.data[input.name] || false}
                                                    onChange={(e) => updateNodeData(input.name, e.target.checked)}
                                                    className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500/20 w-4 h-4"
                                                />
                                                <span className="text-xs text-slate-300">{input.label}</span>
                                            </div>
                                        )}

                                        {activePickerField === input.name && (
                                            <div className="absolute right-0 top-full mt-2 z-50">
                                                <VariablePicker
                                                    availableVariables={availableVariables}
                                                    onSelect={(val) => {
                                                        const currentVal = selectedNode.data[input.name] || '';
                                                        updateNodeData(input.name, currentVal + val);
                                                        setActivePickerField(null);
                                                    }}
                                                    onClose={() => setActivePickerField(null)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {input.description && <p className="text-[10px] text-slate-600">{input.description}</p>}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 px-4 bg-slate-950 rounded-lg border border-dashed border-slate-800">
                                <Settings className="mx-auto text-slate-600 mb-2" size={20} />
                                <p className="text-xs text-slate-500">No configuration fields available.</p>
                            </div>
                        )}
                        <div className="border-t border-slate-800 pt-3 mt-4">
                            <p className="text-[10px] text-slate-600 text-center">Use the <Zap size={8} className="inline text-indigo-500" /> icon to insert data.</p>
                        </div>
                    </div>
                )}

                {/* FORM NODE */}
                {selectedNode.type === 'form' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg">
                            <p className="text-xs text-pink-300 flex items-center gap-2 font-bold"><FileText size={14} /> Smart Form Asset</p>
                            <p className="text-[10px] text-pink-400/80 mt-1">Link an existing form.</p>
                        </div>
                        <div>
                            <CustomSelect
                                label="Select Form Asset"
                                value={selectedNode.data.formId || ''}
                                onChange={(val) => {
                                    const selectedForm = availableForms.find(f => f._id === val);
                                    if (selectedForm) {
                                        updateNodeData('formId', selectedForm._id);
                                        updateNodeData('formName', selectedForm.name);
                                        updateNodeData('fieldCount', selectedForm.fields.length);
                                    }
                                }}
                                placeholder="-- Choose a Form --"
                                options={[{ value: "", label: "-- Choose a Form --" }, ...availableForms.map(form => ({ value: form._id, label: form.name }))]}
                            />
                        </div>
                    </div>
                )}

                {/* API / ACTION CONFIGURATION (LEGACY) */}
                {selectedNode.type === 'logic' && selectedNode.data.icon === 'Zap' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                            <p className="text-xs text-green-300 flex items-center gap-2"><Zap size={12} /> External Action / API</p>
                        </div>
                        <div className="space-y-3 pb-4 border-b border-slate-800">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Setup</h4>
                            <div className="flex gap-2">
                                <div className="w-24">
                                    <CustomSelect
                                        label="Method"
                                        value={selectedNode.data.method || 'GET'}
                                        onChange={(val) => updateNodeData('method', val)}
                                        options={[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }, { value: 'DELETE', label: 'DELETE' }]}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Endpoint URL</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-green-400 font-mono focus:ring-1 focus:ring-green-500"
                                        value={selectedNode.data.url || ''}
                                        onChange={(e) => updateNodeData('url', e.target.value)}
                                        placeholder="https://api.example.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MESSAGE NODE */}
                {selectedNode.type === 'message' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <p className="text-xs text-blue-300 flex items-center gap-2 font-bold"><MessageSquare size={14} /> Message Configuration</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Message Text</label>
                            <div className="relative">
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 resize-none"
                                    rows={4}
                                    value={selectedNode.data.text || ''}
                                    onChange={(e) => updateNodeData('text', e.target.value)}
                                    placeholder="Type your message..."
                                />
                                <button
                                    onClick={() => setActivePickerField(activePickerField === 'text' ? null : 'text')}
                                    className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-900/80 text-slate-400 hover:text-indigo-400"
                                >
                                    <Zap size={12} />
                                </button>
                                {activePickerField === 'text' && (
                                    <div className="absolute right-0 top-full mt-2 z-50">
                                        <VariablePicker
                                            availableVariables={availableVariables}
                                            onSelect={(val) => {
                                                const currentVal = selectedNode.data.text || '';
                                                updateNodeData('text', currentVal + val);
                                                setActivePickerField(null);
                                            }}
                                            onClose={() => setActivePickerField(null)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Media URL</label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-blue-300 font-mono"
                                value={selectedNode.data.image || ''}
                                onChange={(e) => updateNodeData('image', e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                )}

                {/* TRIGGER NODE */}
                {selectedNode.type === 'trigger' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {/* 1. VISITOR LANDS */}
                        {selectedNode.data.iconName === 'PlayCircle' && (
                            <>
                                <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                                    <p className="text-xs text-purple-300 flex items-center gap-2 font-bold"><PlayCircle size={14} /> Visitor Lands</p>
                                </div>
                                <div>
                                    <CustomSelect
                                        label="URL Condition"
                                        value={selectedNode.data.urlCondition || 'all'}
                                        onChange={(val) => updateNodeData('urlCondition', val)}
                                        options={[{ value: 'all', label: 'All Pages' }, { value: 'exact', label: 'Exact Match' }, { value: 'contains', label: 'Contains' }]}
                                    />
                                    {selectedNode.data.urlCondition !== 'all' && (
                                        <input type="text" className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" value={selectedNode.data.urlValue || ''} onChange={(e) => updateNodeData('urlValue', e.target.value)} />
                                    )}
                                </div>
                            </>
                        )}
                        {/* 2. KEYWORD */}
                        {selectedNode.data.iconName === 'FileText' && (
                            <div>
                                <ChipsInput label="Keywords" value={selectedNode.data.keywords || []} onChange={(tags) => updateNodeData('keywords', tags)} placeholder="pricing, help" />
                            </div>
                        )}
                        {/* 3. CLICK */}
                        {selectedNode.data.iconName === 'MousePointer' && (
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">CSS ID</label>
                                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-purple-300 font-mono" value={selectedNode.data.elementId || ''} onChange={(e) => updateNodeData('elementId', e.target.value)} placeholder="#button-id" />
                            </div>
                        )}
                        {/* 4. TIME DELAY */}
                        {selectedNode.data.iconName === 'Clock' && (
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Seconds</label>
                                <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" value={selectedNode.data.delaySeconds || ''} onChange={(e) => updateNodeData('delaySeconds', e.target.value)} />
                            </div>
                        )}
                    </div>
                )}

                {/* FAQ CONFIGURATION */}
                {selectedNode.type === 'faq' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg">
                            <p className="text-xs text-pink-300 flex items-center gap-2 font-bold"><LayoutIcon size={14} /> FAQ Tree</p>
                        </div>
                        <div>
                            <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" rows={2} value={selectedNode.data.question || ''} onChange={(e) => updateNodeData('question', e.target.value)} placeholder="Question?" />
                        </div>
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Options</label>
                                <button onClick={() => updateNodeData('options', [...(selectedNode.data.options || []), `Option ${(selectedNode.data.options || []).length + 1}`])} className="text-[10px] bg-indigo-600 px-2 py-1 rounded text-white flex gap-1 items-center"><Plus size={12} /> Add</button>
                            </div>
                            <div className="space-y-2">
                                {(selectedNode.data.options || []).map((opt: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <input type="text" className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" value={opt} onChange={(e) => {
                                            const newOpts = [...selectedNode.data.options];
                                            newOpts[idx] = e.target.value;
                                            updateNodeData('options', newOpts);
                                        }} />
                                        <button onClick={() => {
                                            const newOpts = [...selectedNode.data.options];
                                            newOpts.splice(idx, 1);
                                            updateNodeData('options', newOpts);
                                        }} className="text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* QUESTION NODE */}
                {selectedNode.type === 'question' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg"><p className="text-xs text-pink-300 font-bold">Single Question</p></div>
                        <div className="grid grid-cols-3 gap-2">
                            {['Text', 'Email', 'Phone', 'Number', 'Date', 'File'].map(type => (
                                <button key={type} onClick={() => updateNodeData('inputType', type.toLowerCase())} className={`py-2 px-1 rounded border text-[10px] uppercase ${selectedNode.data.inputType === type.toLowerCase() ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400'}`}>{type}</button>
                            ))}
                        </div>
                        <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" rows={2} value={selectedNode.data.question || ''} onChange={(e) => updateNodeData('question', e.target.value)} placeholder="Question..." />
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Save To</label>
                            <div className="flex bg-slate-900 border border-slate-800 rounded p-1">
                                <span className="text-slate-500 text-xs px-2">{`{{`}</span>
                                <input type="text" className="flex-1 bg-transparent text-sm text-yellow-400 focus:outline-none" value={selectedNode.data.variableName || ''} onChange={(e) => updateNodeData('variableName', e.target.value)} placeholder="var_name" />
                                <span className="text-slate-500 text-xs px-2">{`}}`}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI CONFIGURATION */}
                {selectedNode.type === 'ai' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex bg-slate-900 p-1 rounded-lg mb-4 border border-slate-800">
                            {['persona', 'knowledge', 'skills'].map(tab => (
                                <button key={tab} onClick={() => setActiveAiTab(tab)} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded ${activeAiTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{tab}</button>
                            ))}
                        </div>
                        {activeAiTab === 'persona' && (
                            <div>
                                <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-indigo-100 font-mono" rows={8} value={selectedNode.data.systemPrompt || ''} onChange={(e) => updateNodeData('systemPrompt', e.target.value)} placeholder="Instructions..." />
                            </div>
                        )}
                        {activeAiTab === 'knowledge' && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {knowledgeSources.map(source => (
                                    <div key={source.id} className="flex justify-between items-center p-2 bg-slate-950 border border-slate-800 rounded">
                                        <span className="text-xs text-slate-300 truncate">{source.name}</span>
                                        <input type="checkbox" checked={(selectedNode.data.knowledgeIds || []).includes(source.id)} onChange={(e) => {
                                            const ids = selectedNode.data.knowledgeIds || [];
                                            updateNodeData('knowledgeIds', e.target.checked ? [...ids, source.id] : ids.filter((id: string) => id !== source.id));
                                        }} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeAiTab === 'skills' && (
                            <div className="text-[10px] text-slate-500">Connect to Action nodes to add skills.</div>
                        )}
                    </div>
                )}
            </div>
            {/* CONNECTIONS */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Workflow size={12} /> Connections</h3>
                <div className="space-y-2">
                    <span className="text-[10px] text-slate-400">Incoming</span>
                    {edges.filter(e => e.target === selectedNode.id).map(edge => (
                        <div key={edge.id} className="flex justify-between p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300">
                            <span>From {nodes.find(n => n.id === edge.source)?.data?.label || 'Unknown'}</span>
                            <button onClick={() => deleteEdge?.(edge.id)} className="text-red-400"><Trash2 size={12} /></button>
                        </div>
                    ))}
                    <span className="text-[10px] text-slate-400 mt-2 block">Outgoing</span>
                    {edges.filter(e => e.source === selectedNode.id).map(edge => (
                        <div key={edge.id} className="flex justify-between p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300">
                            <span>To {nodes.find(n => n.id === edge.target)?.data?.label || 'Unknown'}</span>
                            <button onClick={() => deleteEdge?.(edge.id)} className="text-red-400"><Trash2 size={12} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Helper for Dynamic Icons
const iconMap: any = { Zap, Settings, PlayCircle, FileText, MousePointer, Clock, LayoutIcon, ExternalLink };
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const Icon = iconMap[name] || Zap;
    return <Icon size={14} className={className} />;
}

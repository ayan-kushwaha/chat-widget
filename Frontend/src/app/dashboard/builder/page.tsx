'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Connection,
    Edge,
    Node,
    Handle,
    Position,
    BaseEdge,
    EdgeLabelRenderer,
    EdgeProps,
    getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    Settings, MessageSquare, Zap, Save, GripVertical, Trash2,
    PlayCircle, MousePointer, Clock, Image as ImageIcon, FileText, Smartphone,
    User, Calendar, Upload, Power, ArrowRight, Layout as LayoutIcon, Mail, Brain,
    Link as LinkIcon, Bot, Database, Repeat, Workflow, Plus,
    PanelLeftClose, PanelLeftOpen, Pencil, Play, StopCircle, Save as SaveIcon,
    Maximize, Minimize
} from 'lucide-react';
import { toast } from 'sonner';
import { FlowRunner, ExecutionLog } from '@/utils/FlowRunner';
import { DebugPanel } from '@/components/flow-builder/DebugPanel';
import { TestChatWindow } from '@/components/flow-builder/TestChatWindow';
import { flowsAPI } from '@/lib/api';
import {
    TriggerNode, MessageNode, InputNode, CarouselNode,
    AiNode, LogicNode, SetVarNode, FaqNode, FormNode
} from './components/CustomNodes';
import Sidebar from './components/Sidebar'; // Changed import name to match default export
import { PropertiesPanel } from './components/PropertiesPanel';
import { ContextMenu } from './components/ContextMenu';


import { SmartEdge } from './components/SmartEdge';
import { useOrg } from "@/context/OrgContext";
import { FlowStartModal } from './modals/FlowStartModal';


const edgeTypes = {
    smart: SmartEdge,
};

// --- ICON MAPPING ---
// Reuse existing mapping logic or import central one if created
const iconMap: any = {
    PlayCircle, MousePointer, Clock, ImageIcon, FileText, Smartphone,
    User, Calendar, Upload, Power, LayoutIcon, Mail, Brain, Zap, MessageSquare,
    LinkIcon, Bot, Database, Repeat, Workflow
};

const DynamicIcon = ({ name, size = 16, className }: { name: string, size?: number, className?: string }) => {
    const IconComponent = iconMap[name] || MessageSquare;
    return <IconComponent size={size} className={className} />;
};

// --- NODE TYPES REGISTRY ---
const nodeTypes = {
    trigger: TriggerNode,
    message: MessageNode,
    question: InputNode,
    logic: LogicNode,
    action: LogicNode, // Alias 'action' to LogicNode for now
    carousel: CarouselNode,
    ai: AiNode,
    set_var: SetVarNode,
    faq: FaqNode,
    form: FormNode,
};

// --- INITIAL DATA ---
const initialNodes: Node[] = []; // Start empty, let user pick source

export default function NodeBuilderPage() {
    return (
        <ReactFlowProvider>
            <NodeBuilder />
        </ReactFlowProvider>
    );
}

function NodeBuilder() {
    const { activeOrgId } = useOrg();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [activeAiTab, setActiveAiTab] = useState('persona');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = React.useState(false);
    const [showMiniMap, setShowMiniMap] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const flowId = searchParams?.get('flowId');
    const [flowName, setFlowName] = useState("Untitled Flow");
    const [flowDesc, setFlowDesc] = useState("Created via Visual Builder");
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);

    const [currentFlowId, setCurrentFlowId] = useState<string | null>(flowId || null);

    // --- SOURCE APP LOGIC ---
    const [sourceAppId, setSourceAppId] = useState<string | null>(null);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

    // --- CONTEXT MENU STATE ---
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);

    // Test Mode State
    const [isTestMode, setIsTestMode] = useState(false);
    const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
    const [testVariables, setTestVariables] = useState<Record<string, any>>({});
    const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot', text: string, timestamp: number }>>([]);
    const [isWaitingForInput, setIsWaitingForInput] = useState(false);
    const [pendingInputResolve, setPendingInputResolve] = useState<((value: string) => void) | null>(null);
    const flowRunnerRef = useRef<FlowRunner | null>(null);

    // Sync state with URL param on mount/update
    useEffect(() => {
        if (flowId) setCurrentFlowId(flowId);
    }, [flowId]);

    // Load Flow Data
    useEffect(() => {
        if (currentFlowId && activeOrgId) {
            const loadFlow = async () => {
                try {
                    const res = await flowsAPI.getById(currentFlowId, { organizationId: activeOrgId });
                    if (res.data.success) {
                        const flow = res.data.data;
                        setFlowName(flow.name);
                        setFlowDesc(flow.description || "");
                        if (flow.nodes) {
                            setNodes(flow.nodes);
                            // Attempt to detect source app
                            const firstTrigger = flow.nodes.find((n: any) => n.type === 'trigger');
                            if (firstTrigger && firstTrigger.data.appId) {
                                setSourceAppId(firstTrigger.data.appId);
                            }
                        }
                        if (flow.edges) setEdges(flow.edges);
                        if (flow.viewport && reactFlowInstance) {
                            reactFlowInstance.setViewport(flow.viewport);
                        }
                    }
                } catch (error) {
                    console.error("Failed to load flow", error);
                    toast.error("Could not load workflow data");
                }
            };
            loadFlow();
        }
    }, [currentFlowId, activeOrgId, setNodes, setEdges, reactFlowInstance]);

    // REFS
    const containerRef = useRef<HTMLDivElement>(null);

    // UI STATES
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // --- FULL SCREEN HANDLER ---
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            // Enter Full Screen on the CONTAINER, not the whole doc
            containerRef.current?.requestFullscreen().then(() => {
                setIsFullScreen(true);
            }).catch(err => {
                toast.error(`Error entering full screen: ${err.message}`);
            });
        } else {
            // Exit Full Screen
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    setIsFullScreen(false);
                });
            }
        }
    };

    // Sync state if user exits via ESC
    useEffect(() => {
        const handleFullScreenChange = () => {
            const isNowFullScreen = document.fullscreenElement === containerRef.current;
            setIsFullScreen(isNowFullScreen);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    // --- MINIMAP COLOR LOGIC ---
    const nodeColor = (node: Node) => {
        switch (node.type) {
            case 'trigger': return '#9333ea'; // Purple
            case 'message': return '#2563eb'; // Blue
            case 'question': return '#db2777'; // Pink
            case 'form': return '#db2777'; // Pink
            case 'faq': return '#db2777'; // Pink
            case 'ai': return '#4f46e5'; // Indigo
            case 'logic': return '#ea580c'; // Orange
            case 'set_var': return '#0d9488'; // Teal
            case 'action': return '#7c3aed'; // Violet
            default: return '#475569'; // Slate
        }
    };

    React.useEffect(() => {
        setIsMounted(true);

        // Open Source Modal if new flow and no source selected
        if (nodes.length === 0 && !sourceAppId && !flowId) {
            // Use Timeout to ensure mount
            setTimeout(() => setIsSourceModalOpen(true), 500);
        }

        // --- TREE BUILDER AUTO-ADD LOGIC ---
        const handleTreeAdd = (e: any) => {
            const { parentId, optionIdx, optionLabel } = e.detail;

            // 1. Find Parent to determine position
            setNodes((currentNodes) => {
                const parent = currentNodes.find(n => n.id === parentId);
                if (!parent) return currentNodes;

                // 2. Calculate New Position (Tree Structure: Right and Down)
                const X_OFFSET = 400;

                const newPos = {
                    x: parent.position.x + 450,
                    y: parent.position.y + (optionIdx * 180) - 50
                };

                // 3. Create New FAQ Node (Recursive Engine)
                const newNodeId = crypto.randomUUID();
                const newNode: Node = {
                    id: newNodeId,
                    type: 'faq', // USE NEW DEDICATED TYPE
                    position: newPos,
                    data: {
                        label: `L2: ${optionLabel}`,
                        question: `Details on ${optionLabel}?`,
                        options: ['More Info', 'Talk to Human', 'Back to Menu']
                    }
                };

                // 4. Create Connection Edge immediately (Wire it up!)
                setTimeout(() => {
                    setEdges(eds => eds.concat({
                        id: `e-${parentId}-${newNodeId}-${Date.now()}`,
                        source: parentId,
                        sourceHandle: `option-${optionIdx}`, // Connect from specific button handle
                        target: newNodeId,
                        animated: true,
                        style: { stroke: '#ec4899', strokeWidth: 2 }, // Pink for Input flow
                        type: 'smart' // Default standard edge type
                    }));
                }, 10);

                toast.success(`Created Branch for "${optionLabel}"`);
                return currentNodes.concat(newNode);
            });
        };

        window.addEventListener('tree-add-node', handleTreeAdd);
        return () => window.removeEventListener('tree-add-node', handleTreeAdd);

    }, [setEdges, setNodes, flowId, sourceAppId]);


    // --- HANDLERS ---

    const handleSourceSelect = (appId: string) => {
        setSourceAppId(appId);
        setIsSourceModalOpen(false);
        toast.success(`Source set to ${appId}. Drag a trigger to start!`);
    };

    // --- SAVE HANDLER ---
    const handleSaveWorkflow = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Saving workflow...");
        try {
            // Get current viewport
            const viewport = reactFlowInstance ? reactFlowInstance.getViewport() : { x: 0, y: 0, zoom: 1 };

            // Prepare Data
            const payload = {
                id: currentFlowId, // Use local state which is updated immediately
                name: flowName,
                nodes,
                edges,
                viewport,
                description: flowDesc,
                organizationId: activeOrgId
            };

            const response = await flowsAPI.save(payload);

            if (response.data.success) {
                console.log("Saved:", response.data.data);
                toast.success("Workflow saved successfully!", { id: toastId });

                // Update URL if it was a new flow to prevent duplication on next save
                if (!currentFlowId && response.data.data._id) {
                    const newId = response.data.data._id;
                    setCurrentFlowId(newId); // Immediate state update
                    router.replace(`/dashboard/builder?flowId=${newId}`); // URL update for consistency
                }
            } else {
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error: any) {
            console.error("Save Error:", error);
            toast.error(`Save Failed: ${error.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const onConnect = useCallback((params: Connection) => {
        // We need to access the source node to check if it's an AI Agent
        // reactFlowInstance might be stale or not ready during initial connects, but we can try using internal state if needed
        // However, standard param based addEdge is safe first.

        let label = "";
        let type = 'default';
        let style = { stroke: '#6366f1', strokeWidth: 2 };
        let zIndex = 0;

        // Helper to find node in current state list (since reactFlowInstance might be async)
        const sourceNode = nodes.find(n => n.id === params.source);

        if (sourceNode?.type === 'ai') {
            // AUTO-DETECT INTENT PROMPT
            // "Hub & Spoke" Architecture
            const intentName = window.prompt("🔌 CONNECTING TO AI BRAIN\n\nName this connection (Action/Intent):\ne.g. 'show_pricing', 'book_demo', 'fallback_human'", "action_intent");

            if (intentName) {
                label = intentName;
                type = 'smart'; // Use SmartEdge
                style = { stroke: '#fbbf24', strokeWidth: 2 }; // Amber/Gold Color
                zIndex = 1000;
            } else {
                return; // Cancel connection if user cancels prompt - strict "Hub" logic
            }
        }

        const newEdge = {
            ...params,
            id: `e-${params.source}-${params.target}-${Date.now()}`,
            type,
            label,
            animated: true,
            style,
            zIndex
        };

        setEdges((eds) => addEdge(newEdge, eds));
        if (label) toast.success(`AI Path Created: "${label}"`);

        // Data Linking Logic
        if (sourceNode) {
            const targetNode = nodes.find(n => n.id === params.target);
            if (targetNode) {
                const isApiSource = sourceNode.type === 'logic' && sourceNode.data.icon === 'Zap';
                const isDataConsumer = ['carousel', 'message'].includes(targetNode.type || '');

                if (isApiSource && isDataConsumer) {
                    const outputVar = sourceNode.data.outputVar || `api_${sourceNode.id}`;
                    setNodes((nds) => nds.map((node) => {
                        if (node.id === targetNode.id) {
                            const isCarousel = node.type === 'carousel';
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    dynamic: isCarousel ? true : node.data.dynamic,
                                    sourceNodeId: sourceNode.id,
                                    sourceVar: `{{${outputVar}}}`,
                                    discoveredKeys: sourceNode.data.discoveredKeys || []
                                }
                            };
                        }
                        return node;
                    }));
                    toast.success(`Data Linked: ${sourceNode.data.label} -> ${targetNode.data.label}`);
                }
            }
        }
    }, [nodes, setEdges, setNodes]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/label');
            const iconName = event.dataTransfer.getData('application/icon');
            const metadataStr = event.dataTransfer.getData('application/metadata');

            let metadata = {};
            try {
                metadata = metadataStr ? JSON.parse(metadataStr) : {};
            } catch (e) {
                console.warn('Failed to parse metadata', e);
            }

            if (typeof type === 'undefined' || !type) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // HANDLE DROPPING A PRE-CONFIGURED "MENU" NODE
            if (type === 'faq' || label === 'FAQ / Menu') {
                const newNode: Node = {
                    id: crypto.randomUUID(),
                    type: 'faq', // NEW TYPE
                    position,
                    data: {
                        label: 'Selection Menu',
                        // icon: 'LayoutIcon', // Icon handled by node itself now
                        question: 'Main kya madat kar karu?',
                        options: ['Pricing', 'Support', 'Location']
                    },
                };
                setNodes((nds) => nds.concat(newNode));
                return;
            }

            const newNode: Node = {
                id: crypto.randomUUID(), // Robust ID generation
                type,
                position,
                data: {
                    label: label || 'New Node',
                    icon: iconName,       // For CustomNode display
                    iconName: iconName,    // For PropertiesPanel logic
                    appId: sourceAppId || 'system', // Tag node with appId
                    ...metadata // Spread inputs, outputs, description into data
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes, sourceAppId]
    );

    const onNodeClick = (_: React.MouseEvent, node: Node) => setSelectedNodeId(node.id);
    const onPaneClick = () => setSelectedNodeId(null);

    // ... updateNodeData ...
    const updateNodeData = (field: string, value: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNodeId) {
                    // Immutable update: Return new object to ensure React Flow detects change
                    return { ...node, data: { ...node.data, [field]: value } };
                }
                return node;
            })
        );
    };

    const deleteSelectedNode = () => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
        setSelectedNodeId(null);
    };

    // --- CONTEXT MENU HANDLERS ---
    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            event.preventDefault(); // Prevent native browser menu
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                nodeId: node.id,
            });
        },
        []
    );

    const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault(); // Prevent native browser menu on canvas
        setContextMenu(null); // Close if open
    }, []);

    const handleContextAction = (action: string, nodeId: string) => {
        setContextMenu(null); // Close menu
        const node = nodes.find(n => n.id === nodeId);

        switch (action) {
            case 'run':
                // For now, trigger test mode as "Single Run" or just log
                toast.info(`Running node: ${node?.data.label || nodeId}`);
                // TODO: Implement single-node execution logic in FlowRunner
                break;
            case 'edit':
                setSelectedNodeId(nodeId); // Open Properties Panel
                break;
            case 'duplicate':
                if (node) {
                    const duplicateNode: Node = {
                        ...node,
                        id: crypto.randomUUID(),
                        position: { x: node.position.x + 50, y: node.position.y + 50 },
                        data: { ...node.data, label: `${node.data.label} (Copy)` }
                    };
                    setNodes(nds => nds.concat(duplicateNode));
                    toast.success("Node Duplicated");
                }
                break;
            case 'disconnect':
                setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
                toast.success("Node Disconnected");
                break;
            case 'delete':
                if (window.confirm("Delete this node?")) {
                    setNodes(nds => nds.filter(n => n.id !== nodeId));
                    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
                    if (selectedNodeId === nodeId) setSelectedNodeId(null);
                    toast.success("Node Deleted");
                }
                break;
        }
    };

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);

    // Test Flow Functions
    const startTestFlow = async () => {
        // Reset states
        setExecutionLogs([]);
        setTestVariables({});
        setChatMessages([]);
        setIsWaitingForInput(false);

        // Reset all node statuses
        setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle', errorMessage: undefined } })));

        setIsTestMode(true);

        // Create FlowRunner instance
        const runner = new FlowRunner(nodes, edges, {
            onStatusUpdate: (nodeId, status, errorMessage) => {
                setNodes(prevNodes =>
                    prevNodes.map(n =>
                        n.id === nodeId
                            ? { ...n, data: { ...n.data, status, errorMessage } }
                            : n
                    )
                );
            },
            onLog: (log) => {
                setExecutionLogs(prev => [...prev, log]);
            },
            onMessageSent: (message, nodeId) => {
                setChatMessages(prev => [...prev, {
                    sender: 'bot',
                    text: message,
                    timestamp: Date.now()
                }]);
            },
            onInputRequired: (nodeId, promptText) => {
                return new Promise((resolve) => {
                    setChatMessages(prev => [...prev, {
                        sender: 'bot',
                        text: promptText,
                        timestamp: Date.now()
                    }]);
                    setIsWaitingForInput(true);
                    setPendingInputResolve(() => resolve);
                });
            }
        });

        flowRunnerRef.current = runner;

        try {
            await runner.execute();
            setTestVariables(runner.getVariables());
        } catch (error: any) {
            toast.error(`Test failed: ${error.message}`);
        }
    };

    const stopTestFlow = () => {
        flowRunnerRef.current?.stop();
        setIsTestMode(false);
        setIsWaitingForInput(false);
        setPendingInputResolve(null);
        // Reset node statuses
        setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle', errorMessage: undefined } })));
    };

    const handleUserMessage = (message: string) => {
        if (pendingInputResolve) {
            setChatMessages(prev => [...prev, {
                sender: 'user',
                text: message,
                timestamp: Date.now()
            }]);
            pendingInputResolve(message);
            setIsWaitingForInput(false);
            setPendingInputResolve(null);
        }
    };

    const clearLogs = () => {
        setExecutionLogs([]);
        setTestVariables({});
    };

    // ... onDragStart ...
    const onDragStart = (event: React.DragEvent, nodeType: string, label: string, icon: string, metadata?: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/label', label);
        event.dataTransfer.setData('application/icon', icon);
        if (metadata) {
            event.dataTransfer.setData('application/metadata', JSON.stringify(metadata));
        }
        event.dataTransfer.effectAllowed = 'move';
    };


    if (!isMounted) return <div className="h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Builder...</div>;

    return (
        <div
            ref={containerRef}
            className={`flex bg-slate-950 text-white overflow-hidden relative transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 h-screen rounded-none border-none' : 'h-[calc(100vh-8rem)] border border-slate-800 rounded-2xl shadow-2xl'}`}
        >

            {/* MODAL */}
            <FlowStartModal
                isOpen={isSourceModalOpen}
                onSelect={handleSourceSelect}
                onClose={() => { /* No close allowed unless triggered by button later */ }}
            />

            {/* LEFT SIDEBAR: TOOLBOX (Collapsible) */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-slate-950 relative ${isSidebarOpen ? 'w-80 border-r border-slate-800 opacity-100' : 'w-0 border-none opacity-0'}`}>
                <div className="w-80 h-full"> {/* Inner container fixed width to prevent content squishing */}
                    <Sidebar onDragStart={onDragStart} sourceApp={sourceAppId} />
                </div>
            </div>

            {/* CANVAS */}
            <div className="flex-1 h-full relative bg-[#0f111a]" ref={reactFlowWrapper}>

                {/* HEADER BAR (Name & Actions) */}
                <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">

                    {/* Test Flow & Save Button (Right Side) */}
                    <div className="absolute right-0 pointer-events-auto flex gap-2">
                        <button
                            onClick={handleSaveWorkflow}
                            className={`flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 border border-slate-700 rounded-lg font-medium transition-colors shadow-lg ${isFullScreen ? 'hidden' : ''}`}
                        >
                            {isSaving ? (
                                <span className="animate-spin mr-1">⚪</span>
                            ) : (
                                <SaveIcon size={16} />
                            )}
                            Save
                        </button>

                        {isTestMode ? (
                            <button
                                onClick={stopTestFlow}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg"
                            >
                                <StopCircle size={16} />
                                Stop Test
                            </button>
                        ) : (
                            <button
                                onClick={startTestFlow}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg"
                                disabled={nodes.length === 0}
                            >
                                <Play size={16} />
                                Test Flow
                            </button>
                        )}
                    </div>
                    {/* Left: Sidebar Toggle & Flow Name */}
                    <div className={`flex items-center gap-2 pointer-events-auto bg-slate-900/80 backdrop-blur p-2 rounded-lg border border-slate-800 shadow-xl transition-all ${isFullScreen ? 'hidden' : ''}`}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                        >
                            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                        </button>


                        {isSidebarOpen && (
                            <>
                                <div className="h-6 w-px bg-slate-800 mx-1" />

                                {/* Editable Flow Name */}
                                <div className="flex flex-col ml-1">
                                    {isEditingName ? (
                                        <div className="flex flex-col">
                                            <input
                                                autoFocus
                                                value={flowName}
                                                onChange={(e) => setFlowName(e.target.value)}
                                                onBlur={() => setIsEditingName(false)}
                                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                                className="bg-slate-800 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 w-48 py-0.5"
                                                placeholder="Untitled Flow"
                                            />
                                            <input
                                                value={flowDesc}
                                                onChange={(e) => setFlowDesc(e.target.value)}
                                                onBlur={() => setIsEditingName(false)}
                                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                                className="bg-slate-800 text-[10px] text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 w-48 mt-1 py-0.5"
                                                placeholder="Add description..."
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setIsEditingName(true)}
                                            className="cursor-pointer group px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
                                            title="Click to rename"
                                        >
                                            <div className="flex items-center gap-2">
                                                <h1 className="text-sm font-bold text-white truncate max-w-[200px]">{flowName}</h1>
                                                <Pencil size={10} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                                {flowDesc || "No description"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    onNodeContextMenu={onNodeContextMenu}
                    onPaneContextMenu={onPaneContextMenu}
                    onClick={() => setContextMenu(null)} // Close on regular click
                >
                    <Controls
                        style={{ backgroundColor: '#1e293b', color: 'white', borderColor: '#334155' }}
                        className="!bg-slate-800 !border-slate-700 text-white fill-white [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button:hover]:!bg-slate-700"
                    />

                    {/* BOTTOM RIGHT CONTROLS */}
                    <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end gap-2">
                        {showMiniMap && (
                            <div className="border border-slate-800 rounded-lg overflow-hidden shadow-xl animate-in slide-in-from-right-10 fade-in duration-300">
                                <MiniMap
                                    style={{ position: 'relative', margin: 0, backgroundColor: '#020617' }}
                                    nodeColor={nodeColor}
                                    maskColor="rgba(2, 6, 23, 0.7)"
                                    className="!bg-slate-950 !w-48 !h-32"
                                />
                            </div>
                        )}

                        {/* TOGGLE MAP */}
                        <button
                            onClick={() => setShowMiniMap(!showMiniMap)}
                            className={`p-2 rounded-lg border shadow-lg transition-all flex items-center gap-2 text-xs font-bold
                                ${showMiniMap ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}
                            `}
                        >
                            <LayoutIcon size={14} />
                            {showMiniMap ? 'Hide Map' : 'Show Map'}
                        </button>

                        {/* FULL SCREEN TOGGLE */}
                        <button
                            onClick={toggleFullScreen}
                            className={`p-2 rounded-lg border shadow-lg transition-all flex items-center justify-center text-xs font-bold w-10 h-10
                                ${isFullScreen ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}
                            `}
                            title={isFullScreen ? "Exit Full Screen" : "Full Screen Mode"}
                        >
                            {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
                        </button>
                    </div>

                    <Background color="#334155" gap={24} size={1} />
                </ReactFlow>

                {/* CONTEXT MENU */}
                {
                    contextMenu && (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            nodeId={contextMenu.nodeId}
                            onClose={() => setContextMenu(null)}
                            onAction={handleContextAction}
                        />
                    )
                }

                {/* PROPERTIES PANEL */}
                {
                    selectedNode && (
                        <PropertiesPanel
                            selectedNode={selectedNode}
                            nodes={nodes}
                            edges={edges}
                            updateNodeData={updateNodeData}
                            deleteSelectedNode={deleteSelectedNode}
                            deleteEdge={(edgeId) => setEdges((eds) => eds.filter(e => e.id !== edgeId))}
                        />
                    )
                }
            </div >

            {/* Debug Panel */}
            {
                isTestMode && (
                    <DebugPanel
                        logs={executionLogs}
                        variables={testVariables}
                        onClear={clearLogs}
                        isRunning={isTestMode}
                    />
                )
            }

            {/* Test Chat Window */}
            {
                isTestMode && chatMessages.length > 0 && (
                    <TestChatWindow
                        messages={chatMessages}
                        onSendMessage={handleUserMessage}
                        onClose={() => setChatMessages([])}
                        isWaitingForInput={isWaitingForInput}
                    />
                )
            }
        </div >
    );
}
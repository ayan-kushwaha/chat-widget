export interface NodeData {
    id: string;
    name: string;
    subtitle: string;
    icon: string;
    color: string;
    type: "trigger" | "logic" | "action";
    scopes?: string[];
    events?: string[];
    conditions?: string[];
    options?: string[];
    capabilities?: string[];
    actions?: string[];
}

export interface NodeCategory {
    id: string;
    label: string;
    icon: any;
    color: string;
    nodes: NodeData[];
}

export interface FlowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
        label: React.ReactNode;
        nodeType: string;
        originalData: NodeData;
    };
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
    style?: any;
}

export interface AutomationFlow {
    name: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
}

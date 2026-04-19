/**
 * FlowRunner - Flow Execution Engine
 * 
 * Handles step-by-step execution of flow graphs with visual feedback
 * Similar to n8n's test mode
 */

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'waiting';

export interface ExecutionLog {
    nodeId: string;
    timestamp: number;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    data?: any;
}

export interface FlowRunnerCallbacks {
    onStatusUpdate: (nodeId: string, status: NodeStatus, errorMessage?: string) => void;
    onLog: (log: ExecutionLog) => void;
    onMessageSent: (message: string, nodeId: string) => void;
    onInputRequired: (nodeId: string, promptText: string) => Promise<string>;
}

export class FlowRunner {
    private nodes: any[];
    private edges: any[];
    private variables: Map<string, any>;
    private logs: ExecutionLog[];
    private callbacks: FlowRunnerCallbacks;
    private isRunning: boolean = false;
    private isPaused: boolean = false;

    constructor(nodes: any[], edges: any[], callbacks: FlowRunnerCallbacks) {
        this.nodes = nodes;
        this.edges = edges;
        this.variables = new Map();
        this.logs = [];
        this.callbacks = callbacks;
    }

    /**
     * Start flow execution from trigger node
     */
    async execute(): Promise<void> {
        if (this.isRunning) {
            console.warn('Flow is already running!');
            return;
        }

        // Find trigger node
        const startNode = this.nodes.find((n: any) =>
            n.data?.nodeType === 'trigger' || n.type === 'trigger'
        );

        if (!startNode) {
            this.addLog('system', 'No trigger node found in flow', 'error');
            throw new Error('No trigger node found. Please add a trigger node to start the flow.');
        }

        this.isRunning = true;
        this.addLog('system', 'Flow execution started', 'info');

        try {
            await this.processNode(startNode.id);
            this.addLog('system', 'Flow execution completed successfully', 'success');
        } catch (error: any) {
            this.addLog('system', `Flow execution failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Process individual node
     */
    private async processNode(nodeId: string): Promise<void> {
        if (this.isPaused) {
            this.addLog(nodeId, 'Execution paused', 'warning');
            return;
        }

        const node = this.nodes.find((n: any) => n.id === nodeId);
        if (!node) {
            this.addLog('system', `Node ${nodeId} not found`, 'error');
            return;
        }

        const nodeType = node.data?.nodeType || node.type;
        const nodeName = node.data?.originalData?.name || node.data?.label || nodeType;

        // Update UI: Running
        this.callbacks.onStatusUpdate(nodeId, 'running');
        this.addLog(nodeId, `Executing ${nodeName}...`, 'info');

        // Simulate processing delay for visual feedback
        await this.delay(600);

        try {
            // Execute node-specific logic
            await this.executeNodeLogic(node);

            // Update UI: Success
            this.callbacks.onStatusUpdate(nodeId, 'success');
            this.addLog(nodeId, `${nodeName} completed successfully`, 'success', {
                variables: Object.fromEntries(this.variables)
            });

            // Find next node(s) via edges
            const nextEdges = this.edges.filter((e: any) => e.source === nodeId);

            if (nextEdges.length === 0) {
                this.addLog(nodeId, 'End of flow reached', 'info');
                return;
            }

            // Process next node(s)
            for (const edge of nextEdges) {
                await this.processNode(edge.target);
            }

        } catch (error: any) {
            // Update UI: Error
            this.callbacks.onStatusUpdate(nodeId, 'error', error.message);
            this.addLog(nodeId, `Error: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Execute node-specific logic based on type
     */
    private async executeNodeLogic(node: any): Promise<void> {
        const nodeType = node.data?.nodeType || node.type;
        const config = node.data?.config || {};

        switch (nodeType) {
            case 'trigger':
                await this.handleTrigger(node);
                break;

            case 'message':
                await this.handleMessage(node);
                break;

            case 'question':
            case 'input':
                await this.handleInput(node);
                break;

            case 'logic':
                await this.handleLogic(node);
                break;

            case 'action':
                await this.handleAction(node);
                break;

            case 'ai':
                await this.handleAI(node);
                break;

            default:
                this.addLog(node.id, `Unknown node type: ${nodeType}`, 'warning');
        }
    }

    /**
     * Handle Trigger node
     */
    private async handleTrigger(node: any): Promise<void> {
        this.variables.set('trigger_time', new Date().toISOString());
        this.variables.set('flow_id', node.id);
    }

    /**
     * Handle Message node
     */
    private async handleMessage(node: any): Promise<void> {
        const message = node.data?.config?.message || node.data?.message || 'Hello!';

        // Send message to chat window
        this.callbacks.onMessageSent(message, node.id);
        this.addLog(node.id, `Sent: "${message}"`, 'info');
    }

    /**
     * Handle Input/Question node
     */
    private async handleInput(node: any): Promise<void> {
        const promptText = node.data?.config?.message || 'Please provide input:';

        // Update status to waiting
        this.callbacks.onStatusUpdate(node.id, 'waiting');
        this.addLog(node.id, 'Waiting for user input...', 'info');

        // Request input from user (this will pause execution)
        const userInput = await this.callbacks.onInputRequired(node.id, promptText);

        // Store user input in variables
        const variableName = node.data?.config?.variableName || 'user_input';
        this.variables.set(variableName, userInput);

        this.addLog(node.id, `Received input: "${userInput}"`, 'success', {
            variable: variableName,
            value: userInput
        });
    }

    /**
     * Handle Logic node (conditions, variables)
     */
    private async handleLogic(node: any): Promise<void> {
        const logicType = node.data?.config?.logicType || 'condition';

        if (logicType === 'set_variable') {
            const varName = node.data?.config?.variableName || 'temp';
            const varValue = node.data?.config?.value || '';
            this.variables.set(varName, varValue);
            this.addLog(node.id, `Set ${varName} = ${varValue}`, 'info');
        }

        if (logicType === 'condition') {
            // For now, always pass condition
            // In real implementation, evaluate actual condition
            this.addLog(node.id, 'Condition evaluated: true', 'info');
        }
    }

    /**
     * Handle Action node (API calls, integrations)
     */
    private async handleAction(node: any): Promise<void> {
        const actionType = node.data?.config?.action || 'custom';

        // Simulate API call delay
        await this.delay(1000);

        this.addLog(node.id, `Action executed: ${actionType}`, 'success');
    }

    /**
     * Handle AI node
     */
    private async handleAI(node: any): Promise<void> {
        const task = node.data?.config?.aiTask || 'process';

        // Simulate AI processing
        await this.delay(1500);

        this.addLog(node.id, `AI task completed: ${task}`, 'success');
        this.variables.set('ai_result', { task, success: true });
    }

    /**
     * Utility: Delay
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Add execution log
     */
    private addLog(nodeId: string, message: string, type: ExecutionLog['type'], data?: any): void {
        const log: ExecutionLog = {
            nodeId,
            timestamp: Date.now(),
            message,
            type,
            data
        };

        this.logs.push(log);
        this.callbacks.onLog(log);
    }

    /**
     * Get all execution logs
     */
    public getLogs(): ExecutionLog[] {
        return this.logs;
    }

    /**
     * Get all variables
     */
    public getVariables(): Record<string, any> {
        return Object.fromEntries(this.variables);
    }

    /**
     * Stop execution
     */
    public stop(): void {
        this.isRunning = false;
        this.isPaused = false;
        this.addLog('system', 'Execution stopped by user', 'warning');
    }

    /**
     * Pause execution
     */
    public pause(): void {
        this.isPaused = true;
        this.addLog('system', 'Execution paused', 'warning');
    }

    /**
     * Resume execution
     */
    public resume(): void {
        this.isPaused = false;
        this.addLog('system', 'Execution resumed', 'info');
    }

    /**
     * Clear all logs and variables
     */
    public reset(): void {
        this.logs = [];
        this.variables.clear();
        this.isRunning = false;
        this.isPaused = false;
    }
}

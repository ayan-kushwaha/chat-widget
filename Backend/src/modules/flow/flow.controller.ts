import { Request, Response } from 'express';
import { Flow } from './models/Flow.js';

// Helper to extract trigger data from nodes for the high-performance index
const buildTriggerIndex = (nodes: any[]) => {
    const index: any = { urls: [], keywords: [], elementIds: [], events: [] };

    nodes.filter((n: any) => n.type === 'trigger').forEach((n: any) => {
        const d = n.data;
        if (d.urlCondition && d.urlCondition !== 'all') {
            index.urls.push(`${d.urlCondition}:${d.urlValue}`);
        } else if (d.urlCondition === 'all') {
            index.urls.push('all');
        }

        if (d.keywords) {
            if (Array.isArray(d.keywords)) index.keywords.push(...d.keywords);
            else if (typeof d.keywords === 'string') index.keywords.push(...d.keywords.split(',').map((s: string) => s.trim()));
        }

        if (d.elementId) index.elementIds.push(d.elementId);
        if (d.iconName === 'Clock') index.events.push('time_delay');
        if (d.mobileFallback !== undefined) index.events.push('exit_intent');
    });

    return index;
};

export const saveFlow = async (req: Request, res: Response) => {
    try {
        const { id, name, nodes, edges, viewport, description, sourceTemplate } = req.body;
        console.log("params", req.body)
        // @ts-ignore - organizationId injected by auth middleware or body
        const organizationId = req.organizationId || req.user?.organizationId || req.body.organizationId;
        // @ts-ignore
        const userId = req.user?._id;

        if (!organizationId) return res.status(403).json({ success: false, message: "Organization Context Missing" });

        const triggerIndex = buildTriggerIndex(nodes || []);

        let flow;
        if (id) {
            // Update existing
            flow = await Flow.findOneAndUpdate(
                { _id: id, organizationId },
                {
                    name,
                    description,
                    nodes,
                    edges,
                    viewport,
                    triggerIndex,
                    updatedAt: new Date(),
                    ...(sourceTemplate && { sourceTemplate }) // Update sourceTemplate if provided
                },
                { new: true }
            );
        } else {
            // Create new
            flow = await Flow.create({
                organizationId,
                creatorId: userId,
                name: name || "Untitled Flow",
                description,
                nodes,
                edges,
                viewport,
                triggerIndex,
                sourceTemplate, // Save sourceTemplate on creation
                isActive: true // Active by default for now
            });
        }

        return res.status(200).json({ success: true, data: flow });

    } catch (error: any) {
        console.error("Save Flow Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getFlows = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const organizationId = req.organizationId || req.user?.organizationId || req.query.organizationId;
        if (!organizationId) return res.status(403).json({ success: false, message: "Organization Context Missing" });

        const flows = await Flow.find({ organizationId }).select('name description isActive triggerIndex updatedAt createdAt nodes sourceTemplate');
        return res.status(200).json({ success: true, data: flows });

    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getFlowById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const organizationId = req.organizationId || req.user?.organizationId || req.query.organizationId;

        const flow = await Flow.findOne({ _id: id, organizationId });
        if (!flow) return res.status(404).json({ success: false, message: "Flow not found" });

        return res.status(200).json({ success: true, data: flow });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
export const deleteFlow = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const organizationId = req.organizationId || req.user?.organizationId || req.query.organizationId;

        const flow = await Flow.findOneAndDelete({ _id: id, organizationId });
        if (!flow) return res.status(404).json({ success: false, message: "Flow not found or unauthorized" });

        return res.status(200).json({ success: true, message: "Flow deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

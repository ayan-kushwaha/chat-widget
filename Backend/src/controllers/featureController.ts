import { Request, Response } from 'express';
import { Feature } from '../models/Feature';

export const getFeatures = async (req: Request, res: Response) => {
    try {
        const features = await Feature.find().sort({ order: 1 });
        res.json(features);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createFeature = async (req: Request, res: Response) => {
    try {
        // Auto-Generate ID from Name if missing
        if (!req.body.id && req.body.name) {
            req.body.id = req.body.name.toLowerCase().replace(/ /g, '_').replace(/[^\w-]+/g, '');
        }

        const feature = new Feature(req.body);
        await feature.save();
        res.status(201).json(feature);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const feature = await Feature.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!feature) return res.status(404).json({ message: 'Feature not found' });
        res.json(feature);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const checkFeatureUsage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // TODO: When Plan model exists, check actual usage
        // For now, return mock data based on feature status
        const feature = await Feature.findOne({ id: id });
        if (!feature) return res.status(404).json({ message: 'Feature not found' });

        // Mock logic: If status is 'active', assume it's in use
        // Replace this with actual Plan.find({ 'features.id': id }) when Plan model is ready
        const inUse = feature.status === 'active';
        const planCount = inUse ? 1 : 0; // Mock count
        const estimatedUsers = inUse ? 50 : 0; // Mock user count

        res.json({
            inUse,
            planCount,
            estimatedUsers,
            featureId: id,
            featureName: feature.name
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const archiveFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const feature = await Feature.findOneAndUpdate(
            { id: id },
            { status: 'inactive' },
            { new: true }
        );
        if (!feature) return res.status(404).json({ message: 'Feature not found' });
        res.json({ message: 'Feature archived successfully', feature });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const feature = await Feature.findOneAndDelete({ id: id });
        if (!feature) return res.status(404).json({ message: 'Feature not found' });
        res.json({ message: 'Feature deleted successfully', id });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

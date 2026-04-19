import { Request, Response } from 'express';
import { LegalPage } from '../models/LegalPage.js';

// --- ADMIN ACTIONS ---

export const createPage = async (req: Request, res: Response) => {
    try {
        const { title, slug, content, category, seo } = req.body;

        // Basic Auto-Slug if missing
        const finalSlug = slug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const page = await LegalPage.create({
            title,
            slug: finalSlug,
            content,
            category,
            seo,
            isPublished: true, // Auto publish for now, can be draft later
            publishedAt: new Date()
        });

        res.status(201).json({ success: true, page });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const page = await LegalPage.findByIdAndUpdate(id, updates, { new: true });
        if (!page) return res.status(404).json({ success: false, message: "Page not found" });

        res.json({ success: true, page });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await LegalPage.findByIdAndDelete(id);
        res.json({ success: true, message: "Page deleted" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- PUBLIC ACTIONS ---

export const getAllPages = async (req: Request, res: Response) => {
    try {
        // If query 'category' exist, filter by it
        const { category } = req.query;
        const filter: any = { isPublished: true };

        if (category) filter.category = category;

        const pages = await LegalPage.find(filter).select('title slug category updatedAt');
        res.json({ success: true, pages });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPageBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const page = await LegalPage.findOne({ slug, isPublished: true });

        if (!page) return res.status(404).json({ success: false, message: "Page not found" });

        res.json({ success: true, page });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

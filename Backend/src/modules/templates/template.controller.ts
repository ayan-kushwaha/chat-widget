import { Request, Response } from 'express';
import axios from 'axios';
import { IndustryTemplate } from './models/IndustryTemplate';
import { Organization } from '@modules/core/organization/Organization';
import { jsonrepair } from 'jsonrepair';


export const TemplateController = {
    // 1. AI Generator (The "Magic" Button)
    generateTemplateAI: async (req: Request, res: Response) => {
        const { industry, specialized_niche } = req.body; // e.g. "Fitness", "Crossfit Gym"

        if (!industry || !specialized_niche) {
            return res.status(400).json({ success: false, message: "Industry and Niche are required." });
        }

        console.log(`🧠 AI Generating Template for: ${specialized_niche} (${industry})`);

        const systemInstruction = "You represent the Universal UI Builder. Output strictly valid JSON.";
        const prompt = `
        Create a "Server-Driven UI" Chatbot Template for: ${specialized_niche} (${industry}).
        
        System Philosophy: "Everything is a Component".
        
        Output JSON Structure:
        {
          "slug": "kebab-case-slug",
          "name": "Display Name",
          "description": "Short description",
          "category": "${industry}",
          "persona": { "tone": "professional", "greeting_message": "Welcome!", "system_prompt": "..." },
          "workflows": {
             "welcome_flow": {
                 "trigger_keywords": ["hi", "start"],
                 "layout": {
                     "type": "container",
                     "variant": "vertical_stack",
                     "children": [
                         { "type": "image", "url": "https://images.unsplash.com/photo-123", "style": { "height": "150px", "borderRadius": "10px" } },
                         { "type": "text", "content": "Welcome to ${specialized_niche}!", "variant": "h2_bold" },
                         { "type": "text", "content": "How can we help?", "variant": "body_regular" },
                         { 
                            "type": "carousel",
                            "items": [
                                { "type": "card_product", "data": { "title": "Service A", "price": "$50", "image": "..." } },
                                { "type": "card_product", "data": { "title": "Service B", "price": "$90", "image": "..." } }
                            ]
                         }
                     ]
                 }
             },
             "contact_flow": {
                 "trigger_keywords": ["contact", "help"],
                 "layout": {
                     "type": "form_container",
                     "children": [
                         { "type": "input_text", "label_default": "Your Name" },
                         { "type": "button", "label": "Submit", "actions": [{ "type": "submit_form", "endpoint": "/leads" }] }
                     ]
                 }
             }
          }
        }
        
        IMPORTANT:
        - Use "container", "text", "image", "carousel", "card_product", "button", "input_text" as types.
        - Be creative with the layout.
        - Return ONLY raw JSON.
        `;

        try {
            // DELEGATE TO PYTHON AI ENGINE 🧠
            const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://ai_engine:5000';


            const aiResponse = await axios.post(`${AI_ENGINE_URL}/api/v1/chat/completions`, {
                query: prompt,
                user_id: "system_template_generator",
                system_instruction: systemInstruction,
                rag_config: null, // No RAG needed
                model_preference: "auto"
            });

            const text = aiResponse.data.response || "";

            // 2. Clean & Parse JSON
            const cleanJson = jsonrepair(text.replace(/```json|```/g, '').trim());
            const templateData = JSON.parse(cleanJson);

            // 3. Save to DB
            // Check availability
            const existing = await IndustryTemplate.findOne({ slug: templateData.slug });
            if (existing) {
                templateData.slug = `${templateData.slug}-${Date.now()}`;
            }

            templateData.is_public = true; // Auto-publish for now
            templateData.author_id = 'ai_generator';

            const newTemplate = await IndustryTemplate.create(templateData);

            res.json({
                success: true,
                message: "Template Generated Successfully!",
                data: newTemplate
            });

        } catch (error: any) {
            console.error("❌ Template Generation Failed:", error.message);
            res.status(500).json({ success: false, message: "AI Generation Failed", error: error.message });
        }
    },

    // 2. List Public Templates (Production-Ready with Pagination + Search + Filters)
    listTemplates: async (req: Request, res: Response) => {
        try {
            // Pagination params
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            // Search & Filter params
            const search = req.query.search as string;
            const category = req.query.category as string;
            const minRating = parseFloat(req.query.minRating as string) || 0;
            const sort = req.query.sort as string || 'newest'; // popular | rating | newest

            // Build query
            const query: any = { is_public: true };

            // Add full-text search
            if (search) {
                query.$text = { $search: search };
            }

            // Add category filter
            if (category && category !== 'all') {
                query.category = category;
            }

            // Add rating filter
            if (minRating > 0) {
                query['rating_stats.average_rating'] = { $gte: minRating };
            }

            // Determine sort order
            let sortOptions: any = {};
            switch (sort) {
                case 'popular':
                    sortOptions = { install_count: -1 };
                    break;
                case 'rating':
                    sortOptions = { 'rating_stats.average_rating': -1, 'rating_stats.total_ratings': -1 };
                    break;
                case 'newest':
                default:
                    sortOptions = { created_at: -1 };
                    break;
            }

            // Execute query with pagination
            const templates = await IndustryTemplate
                .find(query)
                .select('slug name description category persona.greeting_message rating_stats admin_score install_count version workflows')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean();

            // Get total count for pagination metadata
            const total = await IndustryTemplate.countDocuments(query);

            res.json({
                success: true,
                data: templates,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: page < Math.ceil(total / limit)
                }
            });
        } catch (e) {
            console.error('List Templates Error:', e);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    },

    // 3. Get Single Template
    getTemplate: async (req: Request, res: Response) => {
        try {
            const template = await IndustryTemplate.findOne({ slug: req.params.slug }).lean();
            if (!template) {
                return res.status(404).json({ success: false, message: 'Template not found' });
            }

            // Check if user has already rated (for pre-filling UI)
            const userId = req.query.userId as string;
            let my_rating: number | undefined | null = undefined;
            if (userId && template.raters) {
                const userRating = template.raters.find((r: any) => r.userId === userId);
                if (userRating) {
                    my_rating = userRating.rating ?? undefined;
                }
            }

            res.json({
                success: true,
                data: { ...template, my_rating: my_rating || 0 }
            });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    },

    // 4. Install Template (Link to Org)
    installTemplate: async (req: Request, res: Response) => {
        const { orgId, templateSlug } = req.body;

        if (!orgId || !templateSlug) {
            return res.status(400).json({ success: false, message: 'Org ID and Template Slug required' });
        }

        try {
            // Verify Template Exists
            const template = await IndustryTemplate.findOne({ slug: templateSlug });
            if (!template) {
                return res.status(404).json({ success: false, message: 'Template not found' });
            }

            // Update Org
            const updatedOrg = await Organization.findByIdAndUpdate(
                orgId,
                {
                    industry: templateSlug,
                    $addToSet: { installed_templates: templateSlug }
                },
                { new: true }
            );

            // Increment Install Count
            await IndustryTemplate.updateOne(
                { slug: templateSlug },
                { $inc: { install_count: 1 } }
            );

            if (!updatedOrg) {
                return res.status(404).json({ success: false, message: 'Organization not found' });
            }

            console.log(`✅ Template Installed: ${templateSlug} for Org: ${orgId}`);

            res.json({
                success: true,
                message: `Successfully installed ${template.name}`,
                data: updatedOrg
            });

        } catch (e: any) {
            console.error("Install Error:", e);
            res.status(500).json({ success: false, message: 'Installation Failed', error: e.message });
        }
    },

    // 5. Rate Template
    rateTemplate: async (req: Request, res: Response) => {
        const { templateSlug, rating, userId } = req.body;

        if (!templateSlug || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Valid Template Slug and Rating (1-5) required' });
        }

        try {
            const template = await IndustryTemplate.findOne({ slug: templateSlug });
            if (!template) {
                return res.status(404).json({ success: false, message: 'Template not found' });
            }

            // Initialize rating_stats if not present
            if (!template.rating_stats) {
                template.rating_stats = { average_rating: 0, total_ratings: 0, total_score: 0 };
            }

            // Check if user has already rated (to update instead of adding)
            let isUpdate = false;
            let oldRating = 0;

            if (userId) {
                const existingRatingIndex = template.raters?.findIndex((r: any) => r.userId === userId);

                if (existingRatingIndex !== undefined && existingRatingIndex >= 0) {
                    // User has already rated - UPDATE their rating
                    isUpdate = true;
                    oldRating = template.raters[existingRatingIndex]?.rating || 0;

                    // Update the rating in raters array
                    template.raters[existingRatingIndex].rating = rating;

                    // Recalculate stats by removing old rating and adding new one
                    template.rating_stats.total_score = template.rating_stats.total_score - oldRating + rating;
                    // Only recalculate average if total_ratings is not zero to avoid division by zero
                    if (template.rating_stats.total_ratings > 0) {
                        template.rating_stats.average_rating = Number((template.rating_stats.total_score / template.rating_stats.total_ratings).toFixed(1));
                    }
                } else {
                    // NEW rating
                    template.rating_stats.total_ratings += 1;
                    template.rating_stats.total_score += rating;
                    template.rating_stats.average_rating = Number((template.rating_stats.total_score / template.rating_stats.total_ratings).toFixed(1));

                    // Track new rater
                    template.raters = template.raters || [];
                    template.raters.push({ userId, rating });
                }
            } else {
                // No userId - treat as new rating
                template.rating_stats.total_ratings += 1;
                template.rating_stats.total_score += rating;
                template.rating_stats.average_rating = Number((template.rating_stats.total_score / template.rating_stats.total_ratings).toFixed(1));
            }

            await template.save();

            res.json({
                success: true,
                message: isUpdate ? 'Rating updated successfully' : 'Rating submitted successfully',
                data: {
                    average_rating: template.rating_stats.average_rating,
                    total_ratings: template.rating_stats.total_ratings
                },
                my_rating: rating
            });

        } catch (e: any) {
            console.error("Rating Error:", e);
            res.status(500).json({ success: false, message: 'Rating Failed', error: e.message });
        }
    }
};


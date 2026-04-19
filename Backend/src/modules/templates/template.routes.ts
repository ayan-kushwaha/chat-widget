import express from 'express';
import { TemplateController } from './template.controller';
import { ratingLimiter, installLimiter, searchLimiter, generalLimiter } from '../../middleware/rateLimiters';

const router = express.Router();

// GET /api/templates/list -> Public Store (with search limiter for real-time UI)
router.get('/list', searchLimiter, TemplateController.listTemplates);

// GET /api/templates/:slug -> Single Template (general limiter)
router.get('/:slug', generalLimiter, TemplateController.getTemplate);

// POST /api/templates/generate -> AI Builder (Admin/User) (general limiter)
router.post('/generate', generalLimiter, TemplateController.generateTemplateAI);

// POST /api/templates/install -> Activate Template for Org (install limiter - prevent spam)
router.post('/install', installLimiter, TemplateController.installTemplate);

// POST /api/templates/rate -> Rate a Template (rating limiter - prevent abuse)
router.post('/rate', ratingLimiter, TemplateController.rateTemplate);


export default router;

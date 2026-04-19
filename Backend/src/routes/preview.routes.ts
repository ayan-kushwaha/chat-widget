
import { Router } from 'express';
import { getLinkPreview } from '../controllers/preview.controller.js';

const router = Router();

router.get('/link', getLinkPreview);

export default router;

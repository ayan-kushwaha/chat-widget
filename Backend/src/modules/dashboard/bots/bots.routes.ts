import { Router } from 'express';
import * as BotController from './bots.controller.js';

const router = Router();

router.get('/:botId/config', BotController.getConfig);
router.post('/:botId/config', BotController.saveConfig);
router.post('/:botId/onboard', BotController.onboardAgent);

export default router;

import { Router } from 'express';
import { VoiceController } from '../../../controllers/voice.controller.js';

const router = Router();

// Stream Audio (Tunnel)
router.post('/stream', VoiceController.streamAudio);

export default router;

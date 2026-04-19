import { Request, Response } from 'express';
import axios from 'axios';
import { usageService } from '../services/usage.service.js';
import { encode } from 'gpt-3-encoder';

export class VoiceController {

    /**
     * Stream Audio from AI Engine (Tunnel Mode)
     * POST /api/v1/voice/stream
     * Body: { text: string, textTokenCount: number }
     */
    static async streamAudio(req: Request, res: Response) {
        try {
            const { text } = req.body;
            const orgId = req.headers['x-org-id'] as string;

            if (!text || !orgId) {
                return res.status(400).json({ error: 'Missing text or orgId' });
            }

            // 1. 💰 Token Economics (0.3x of CHARACTERS)
            // User Request: "113 Characters -> 113 Raw in DB."
            // Formula: CharCount * 0.3 = Token Cost.
            const charCount = text.length;

            if (charCount > 0) {
                // Multiplier (0.3) is applied inside usageService.trackVoiceUsage -> trackActivity
                await usageService.trackVoiceUsage(orgId, charCount);
                console.log(`🎤 [Voice Billing] Mode: CHARACTERS | Count: ${charCount} chars`);
                console.log(`🔍 [Text Sample] Start: "${text.substring(0, 30)}..." | End: "...${text.substring(text.length - 30)}"`);
            }

            // 2. 🚇 Tunnel to Python Brain
            // Request stream from Python
            const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
            const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;

            const response = await axios({
                method: 'post',
                url: `${engineUrl}/voice/stream`,
                data: { text },
                responseType: 'stream' // Important!
            });

            // 3. 🚿 Pipe Stream to User
            res.setHeader('Content-Type', 'audio/mpeg');
            response.data.pipe(res);

        } catch (error: any) {
            console.error('❌ Voice Stream Error:', error.message);

            // Handle Quota/Billing Errors specifically if needed
            if (error.message.includes("limit")) {
                return res.status(402).json({ error: 'Quota exceeded' });
            }

            res.status(500).json({ error: 'Voice generation failed' });
        }
    }
}

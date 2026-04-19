import { Router } from 'express';
import { pushService } from '../services/push.service.js';

const router = Router();

/**
 * Register/Update Push Subscription
 * POST /v1/notifications/subscribe
 */
router.post('/subscribe', async (req, res) => {
    const { userId, orgId, subscription, deviceType } = req.body;

    if (!subscription) {
        return res.status(400).json({ error: 'Subscription object is required' });
    }

    const result = await pushService.registerSubscription({
        userId,
        orgId,
        subscription,
        deviceType
    });

    if (result.success) {
        res.status(200).json({ message: 'Push subscription registered successfully' });
    } else {
        res.status(500).json({ error: 'Failed to register push subscription' });
    }
});

/**
 * Send push notification to specific user
 * POST /v1/notifications/send
 * Body: { userId, title, body, icon, badge, data }
 */
router.post('/send', async (req, res) => {
    const { userId, title, body, icon, badge, data } = req.body;

    if (!userId || !title || !body) {
        return res.status(400).json({ error: 'userId, title, and body are required' });
    }

    const payload = {
        title,
        body,
        icon: icon || '/icons/cluaiz-logo.png',
        badge: badge || '/icons/badge.png',
        data: data || {}
    };

    try {
        await pushService.notifyUser(userId, payload);
        res.status(200).json({ success: true, message: 'Notification sent' });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ success: false, error: 'Failed to send notification' });
    }
});

export default router;

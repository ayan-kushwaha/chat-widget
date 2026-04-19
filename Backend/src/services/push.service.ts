import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import dotenv from 'dotenv';

dotenv.config();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@cluaiz.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
} else {
    console.warn('⚠️ Push Signaling: VAPID keys not configured. Background notifications will not work.');
    console.log('💡 TIP: Run `npx web-push generate-vapid-keys` and add them to your .env');
}

class PushService {
    /**
     * Send a notification to all registered devices of an organization (agents)
     */
    async notifyOrg(orgId: string, payload: any) {
        const subscriptions = await PushSubscription.find({ orgId });
        return this.sendToSubscriptions(subscriptions, payload);
    }

    /**
     * Send a notification to all registered devices of a specific user
     */
    async notifyUser(userId: string, payload: any) {
        const subscriptions = await PushSubscription.find({ userId });
        return this.sendToSubscriptions(subscriptions, payload);
    }

    private async sendToSubscriptions(subscriptions: any[], payload: any) {
        const results = await Promise.allSettled(
            subscriptions.map(sub =>
                webpush.sendNotification(
                    sub.subscription,
                    JSON.stringify(payload)
                ).catch(async (err) => {
                    // If subscription is expired or invalid, remove it
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log(`🗑️ Removing expired push subscription: ${sub.subscription.endpoint}`);
                        await PushSubscription.deleteOne({ _id: sub._id });
                    }
                    throw err;
                })
            )
        );
        return results;
    }

    /**
     * Register or update a subscription
     */
    async registerSubscription(data: { userId?: string, orgId?: string, subscription: any, deviceType?: 'mobile' | 'desktop' }) {
        try {
            await PushSubscription.findOneAndUpdate(
                { 'subscription.endpoint': data.subscription.endpoint },
                {
                    ...data,
                    createdAt: new Date()
                },
                { upsert: true, new: true }
            );
            return { success: true };
        } catch (err) {
            console.error('Error registering push subscription:', err);
            return { success: false, error: err };
        }
    }
}

export const pushService = new PushService();

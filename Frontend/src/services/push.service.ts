import axiosInstance from '@/api/axiosInstance';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export const registerPushNotifications = async (orgId?: string, userId?: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // 1. Get existing subscription or create new one
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Subscribe the user
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        // 2. Send subscription to backend
        await axiosInstance.post('/notifications/subscribe', {
            userId,
            orgId,
            subscription,
            deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
        });

        console.log('✅ Push Notification Subscription Registered');
    } catch (err) {
        console.error('Failed to subscribe to push notifications', err);
    }
};

// Helper function
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * ⚡ Service Worker (sw.js)
 * Handles Background Push Notifications for Real-time Calling
 */

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        console.log("📨 Background Push Received:", data);

        if (data.type === 'incoming_call') {
            const options = {
                body: `Incoming HD Voice Call from ${data.callerName}`,
                icon: '/logo.png', // Fallback to logo
                badge: '/logo.png',
                vibrate: [200, 100, 200, 100, 200, 100, 200],
                tag: 'incoming-call',
                renotify: true,
                requireInteraction: true,
                data: {
                    url: data.url || '/',
                    callerId: data.callerId
                },
                actions: [
                    { action: 'answer', title: 'Answer' },
                    { action: 'decline', title: 'Decline' }
                ]
            };

            event.waitUntil(
                self.registration.showNotification('Incoming Call', options)
            );
        }
    } catch (err) {
        console.error("Error processing push event", err);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    let targetUrl = event.notification.data.url;
    if (event.action === 'answer') {
        const url = new URL(targetUrl, self.location.origin);
        url.searchParams.set('auto_answer', '1');
        targetUrl = url.href;
    }

    const urlToOpen = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If tab is already open, focus it
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not open, open new tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

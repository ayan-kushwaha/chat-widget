/**
 * src/widget/index.ts
 * Entry point — matches IIFE in widget copy 2.js exactly
 * Build: npm run build:widget → public/widget.js (auto-generated, do NOT edit)
 */

import { WIDGET_STYLES } from './constants/styles';
import { ConfigService } from './services/ConfigService';
import { Launcher } from './components/Launcher';
import { ChatWindow } from './components/ChatWindow';

(function () {
    'use strict';

    // ── Inject styles ──
    const s = document.createElement('style');
    s.innerHTML = WIDGET_STYLES;
    document.head.appendChild(s);

    // ── Read orgId ──
    const scriptTag = document.querySelector('script[data-org-id]') as HTMLScriptElement | null;
    const searchParams = new URLSearchParams(window.location.search);
    const orgId: string = scriptTag?.getAttribute('data-org-id') || (window as any).CLUAIZ_ORG_ID || searchParams.get('orgId') || '6923215949f85ef492c77fdb';

    // ── Init modules ──
    const launcher = new Launcher();
    const chatWindow = new ChatWindow(orgId, launcher);
    const configService = new ConfigService(orgId, (config: any) => {
        const cfg = config.widgetConfig || config;
        if (cfg.icon && cfg.theme) {
            launcher.applyConfig(cfg);
            chatWindow.updatePosition();
        }
    });

    configService.fetchConfig();
    configService.startHeartbeat();
    configService.initEventListeners();

    // ── Restore notification persistence ──
    let unreadCount = parseInt(localStorage.getItem('cluaiz_unread_count') || '0');
    let lastMsg = localStorage.getItem('cluaiz_last_msg') || '';

    if (unreadCount > 0) {
        setTimeout(() => {
            launcher.toggleNotification(unreadCount);
            if (lastMsg) launcher.showPreview(lastMsg);
        }, 1500);
    }

    // ── New message handler ──
    window.addEventListener('message', (e) => {
        if (e.data.type === 'CLUAIZ_BOT_STATE') {
            // reserved
        }
        if (e.data.type === 'CLUAIZ_NEW_MESSAGE' && !chatWindow.isChatOpen()) {
            unreadCount += e.data.count || 1;
            lastMsg = e.data.text || lastMsg;
            localStorage.setItem('cluaiz_unread_count', String(unreadCount));
            localStorage.setItem('cluaiz_last_msg', lastMsg);
            launcher.toggleNotification(unreadCount);
            if (e.data.text) launcher.showPreview(e.data.text);
            // Notification sound
            try {
                const snd = new Audio('https://cdn.freesound.org/previews/536/536108_11532476-lq.mp3');
                snd.volume = 0.5;
                snd.play().catch(() => { });
            } catch { }
        }
    });

    // ── Click handler ──
    launcher.element.addEventListener('click', () => {
        if (launcher.clickWasDrag) { launcher.clickWasDrag = false; return; }

        chatWindow.toggle();
        if (chatWindow.isChatOpen()) {
            unreadCount = 0; lastMsg = '';
            localStorage.removeItem('cluaiz_unread_count');
            localStorage.removeItem('cluaiz_last_msg');
            launcher.toggleNotification(0);
            setTimeout(() => chatWindow.updatePosition(), 50);
        }
    });

    // ── Storage sync ──
    window.addEventListener('storage', (e) => {
        if (e.key === 'cluaiz-widget-config') configService.fetchConfig();
    });

    // ── Restore sidebar open state ──
    if (chatWindow.isSidebar && chatWindow.isOpen) chatWindow.toggle(true);

    console.log('✅ Cluaiz Modular Widget Ready!');
})();

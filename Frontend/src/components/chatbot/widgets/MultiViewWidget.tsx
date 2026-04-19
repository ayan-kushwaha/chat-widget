"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Menu, ChevronLeft } from 'lucide-react';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';

// Import Views
import { HomeView } from '../views/HomeView';
import { ChatView } from '../views/ChatView';
import { FAQView } from '../views/FAQView';
import { FormView } from '../views/FormView';
import { SettingsView } from '../views/SettingsView';
import { DocsView } from '../views/DocsView';
import { GlobalChatContextMenu } from '../messaging/GlobalChatContextMenu';
import { audioManager } from '@/utils/audioManager';
import { AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';
// 🟢 Status Imports
import { useSocket } from '../../../hooks/useSocket'; // Fixed Path (3 levels up)
import { StatusViewerOverlay } from '@/components/status/viewer/StatusViewerOverlay';

// ⌚ Apple Watch Menu Imports
import { SkillManagerProvider, useSkillManager } from '../../neural-display-v2/skills/SkillManagerContext';
import ActionMenuSkill from '../../neural-display-v2/skills/menu/ActionMenuSkill';
import TicTacToeSkill from '../../neural-display-v2/skills/games/TicTacToe';
import RockPaperScissorsSkill from '../../neural-display-v2/skills/games/RockPaperScissors';
import SnakeGameSkill from '../../neural-display-v2/skills/games/SnakeGameSkill';
import BreakoutGameSkill from '../../neural-display-v2/skills/games/BreakoutGameSkill';
import FlappyBirdSkill from '../../neural-display-v2/skills/games/FlappyBirdSkill';
import RacingGameSkill from '../../neural-display-v2/skills/games/RacingGameSkill';
import TTSGameSkill from '../../neural-display-v2/skills/games/TTSGameSkill';

// Types
export interface WidgetConfig {
    startScreen: 'profile' | 'chat' | 'home';
    menu: {
        enabled: boolean;
        items: MenuItem[];
    };
    branding: {
        showPoweredBy: boolean;
        avatarUrl?: string;
        title: string;
        subtitle: string;
    };
    theme?: {
        primaryColor?: string;
        secondaryColor?: string;
    };
}

export interface MenuItem {
    id: string;
    type: 'faq' | 'form' | 'flow' | 'profile' | 'chat' | 'home';
    label: string;
    icon: string;
    enabled: boolean;
    order: number;
    formId?: string;
    flowId?: string;
}

interface MultiViewWidgetProps {
    orgId?: string | null;
    isEmbed?: boolean;
}

export const MultiViewWidgetInner: React.FC<MultiViewWidgetProps> = ({ orgId = null, isEmbed = false }) => {
    const { activeSkill, setActiveSkill } = useSkillManager();
    const [config, setConfig] = useState<WidgetConfig | null>(null);
    const [currentView, setCurrentView] = useState<string>('home');
    const [viewHistory, setViewHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [initialChatText, setInitialChatText] = useState<string | undefined>(undefined);
    const [commandId, setCommandId] = useState<number>(0);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true); // NEW: Dynamic Header State
    const { fontFamily, fontSize } = useThemeStore();

    // Custom Context Menu States
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [isMuted, setIsMuted] = useState(audioManager.getMuteState());
    const [isDark, setIsDark] = useState(false);

    // 🟢 Status Logic
    const { statuses, markStatusViewed } = useSocket(orgId || '');
    const [showStatusViewer, setShowStatusViewer] = useState(false);

    // 🟢 Expand Iframe Logic
    useEffect(() => {
        if (showStatusViewer) {
            window.parent.postMessage('CLUAIZ_EXPAND_FULLSCREEN', '*');
        } else {
            window.parent.postMessage('CLUAIZ_COLLAPSE_FULLSCREEN', '*');
        }
    }, [showStatusViewer]);

    // Sync theme with system/parent on mount
    useEffect(() => {
        const isCurrentlyDark = document.documentElement.classList.contains('dark') ||
            document.body.classList.contains('dark');
        setIsDark(isCurrentlyDark);
    }, []);

    // Fetch widget configuration
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                let parsedBrand: any = null;
                let parsedMenu: any = null;
                let parsedTheme: any = null;

                // 1. Try fetching from Backend (Primary Source)
                if (orgId) {
                    try {
                        const { botConfigService } = await import('@/services/bot-config.service');
                        const apiConfig = await botConfigService.getBotConfig('default-bot');
                        if (apiConfig) {
                            if (apiConfig.widgetConfig) {
                                // Map widgetConfig to internal structure
                                // Note: MultiViewWidget uses a slightly different structure than widgetConfig
                                // We need to map `widgetConfig.identity` to `branding`
                                parsedBrand = {
                                    identity: {
                                        name: apiConfig.widgetConfig.identity?.businessName,
                                        tagline: apiConfig.widgetConfig.identity?.tagline,
                                        avatar: apiConfig.widgetConfig.identity?.logo
                                    }
                                };
                                parsedTheme = apiConfig.widgetConfig.theme;
                            }
                            // If we have menu config in backend later, load it here.
                            // For now, menu might still be local or default.
                        }
                    } catch (err) {
                        console.warn('Backend fetch failed, falling back to local storage', err);
                    }
                }

                // 2. Fallback to LocalStorage (Secondary Source)
                if (!parsedBrand) {
                    const savedBrandConfig = localStorage.getItem('cluaiz-brand-config');
                    if (savedBrandConfig) parsedBrand = JSON.parse(savedBrandConfig);
                }

                const savedMenuConfig = localStorage.getItem('cluaiz-menu-navigation-config');
                if (savedMenuConfig) parsedMenu = JSON.parse(savedMenuConfig);


                // --- ROBUST MENU REPAIR LOGIC ---
                // Ensure we have a base menu
                let finalMenu = parsedMenu || { enabled: true, items: [] };

                // Define the mandatory default items we want to ensure exist
                const mandatoryItems = [
                    { id: 'home', type: 'home', label: 'Home', icon: '🏠', enabled: true, order: 0 },
                    { id: 'chat', type: 'chat', label: 'Chat', icon: '💬', enabled: true, order: 1 },
                    { id: 'faq', type: 'faq', label: 'Help Center', icon: '❓', enabled: true, order: 2 },
                    { id: 'contact', type: 'form', label: 'Contact Us', icon: '📝', enabled: true, order: 3, formId: 'contact_form' }
                ];

                // If items array is missing or empty, just use mandatory defaults
                if (!finalMenu.items || !Array.isArray(finalMenu.items) || finalMenu.items.length === 0) {
                    finalMenu.items = mandatoryItems;
                } else {
                    // If items exist, check if 'home' or 'chat' are missing and add them if needed
                    const existingIds = new Set(finalMenu.items.map((i: any) => i.id));

                    if (!existingIds.has('home')) finalMenu.items.unshift(mandatoryItems[0]);
                    if (!existingIds.has('chat')) finalMenu.items.splice(1, 0, mandatoryItems[1]);
                }

                // Force menu enabled for visibility
                if (finalMenu.enabled === undefined) finalMenu.enabled = true;

                const defaultConfig: WidgetConfig = {
                    startScreen: 'home',
                    menu: finalMenu,
                    branding: {
                        showPoweredBy: true,
                        title: parsedBrand?.identity?.name || 'Cluaiz Assistant',
                        subtitle: parsedBrand?.identity?.tagline || 'Online • Replies instantly',
                        avatarUrl: parsedBrand?.identity?.avatar
                    },
                    theme: {
                        primaryColor: parsedTheme?.primaryColor || '#3B82F6',
                        secondaryColor: parsedTheme?.secondaryColor || '#8B5CF6'
                    }
                };

                setConfig(defaultConfig);
                // Respect the saved start screen if it exists
                setCurrentView(parsedMenu?.startScreen || defaultConfig.startScreen);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load widget config:', error);
                setIsLoading(false);
            }
        };

        fetchConfig();

        // Listen for LocalStorage updates (For Real-time Preview in Dashboard)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'cluaiz-widget-config' || e.key === 'cluaiz-brand-config') {
                console.log('🔄 MultiViewWidget: Config updated in storage, reloading...');
                fetchConfig();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also listen for custom event on window (if in same window context)
        const handleCustomEvent = () => fetchConfig();
        window.addEventListener('cluaiz-config-update', handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('cluaiz-config-update', handleCustomEvent);
        };
    }, [orgId]);

    const navigate = (view: string, data?: any, cmdId: number = 0) => {
        setViewHistory(prev => [...prev, currentView]);

        // Clear magic input if navigating AWAY from chat (unless going TO chat with data)
        if (view !== 'chat') {
            setInitialChatText(undefined);
            setCommandId(0);
        } else if (data && typeof data === 'string') {
            setInitialChatText(data);
            setCommandId(cmdId);
        }

        // Handle different view types
        if (view === 'settings') {
            setCurrentView('settings');
        } else if (view === 'docs') {
            setCurrentView('docs');
        } else if (view.startsWith('form_')) {
            setCurrentView(view);
        } else {
            setCurrentView(view);
        }

        // Reset sidebar/header state
        setActiveSkill(null);
        setIsHeaderVisible(true); // Always reset header to visible on nav
    };

    // ⌚ Sync Action Menu Clicks to HomeView Views
    useEffect(() => {
        if (!activeSkill || activeSkill === 'menu') return;

        console.log("⌚ Action Menu Clicked ->", activeSkill);

        // Map Action Menu IDs to Chat Widget Views
        switch (activeSkill) {
            case 'home': navigate('home'); break;
            case 'app_chat': navigate('chat'); break;
            case 'live_voice': navigate('chat', "[SYSTEM: START_VOICE]"); break; // 🎙️ NEW: Trigger voice
            case 'faq': navigate('faq'); break;
            case 'contact': navigate('form_contact_form'); break;
            case 'app_settings': navigate('settings'); break;
            case 'app_docs': navigate('docs'); break;
            case 'exit_menu': setActiveSkill(null); break;
            // Games — keep activeSkill alive so game overlays render
            case 'game_ttt':
            case 'game_rps':
            case 'game_snake':
            case 'game_breakout':
            case 'game_flappy':
            case 'game_racing':
            case 'game_tts':
                break; // Do NOT clear — game component handles its own visibility
            default: setActiveSkill(null);
        }
    }, [activeSkill]);

    const goBack = () => {
        if (viewHistory.length > 0) {
            const previous = viewHistory[viewHistory.length - 1];
            setCurrentView(previous);
            setViewHistory(prev => prev.slice(0, -1));
        } else {
            setCurrentView(config?.startScreen || 'home');
        }
    };

    const moveBack = () => {
        setCurrentView('home');
        setViewHistory([]); // Clear history when going home
    };

    const closeWidget = () => {
        if (typeof window !== 'undefined') {
            window.parent.postMessage('CLUAIZ_CLOSE', '*');
        }
    };

    const toggleMenu = () => {
        setActiveSkill(activeSkill === 'menu' ? null : 'menu');
    };

    // Right-Click Menu Handlers
    const handleContextMenu = (e: React.MouseEvent) => {
        // Prevent default browser menu
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setIsMenuVisible(true);
    };

    const triggerNewChat = () => {
        // Force navigate to chat and send the init signal
        // We use Date.now() as commandId to ensure the child sees a fresh signal
        const freshCmdId = Date.now();
        setInitialChatText("[SYSTEM: INIT_CHAT]");
        setCommandId(freshCmdId);
        setCurrentView('chat');
        console.log("🔄 Global Reset Triggered with ID:", freshCmdId);
    };

    const toggleMute = () => {
        const newState = audioManager.toggleMute();
        setIsMuted(newState);
    };

    const toggleTheme = () => {
        const widgetRoot = document.querySelector('.cluaiz-widget-root') || document.body;
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
            widgetRoot.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            widgetRoot.classList.remove('dark');
        }
        window.parent.postMessage({ type: 'CLUAIZ_THEME_TOGGLE', isDark: newDark }, '*');
    };

    if (isLoading || !config) {
        return (
            <div className="h-full flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    const enabledMenuItems = config.menu.items
        .filter(item => item.enabled)
        .sort((a, b) => a.order - b.order);

    const showBackButton = viewHistory.length > 0 || currentView !== config.startScreen;

    return (
        <div
            onContextMenu={handleContextMenu}
            className="flex flex-col h-full overflow-hidden font-sans relative cluaiz-widget-root"
            style={{
                '--primary-color': config.theme?.primaryColor || '#3B82F6',
                '--secondary-color': config.theme?.secondaryColor || '#8B5CF6',
                // 🎨 Dynamic Text Color Fix (Pure White)
                '--chat-bubble-fg': '#FFFFFF',
                '--ai-bubble-fg': '#FFFFFF',
                background: 'transparent',
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`
            } as React.CSSProperties}
        >
            {/* Header (Dynamic Visibility) */}
            {currentView !== 'chat' && (
                <div className={cn(
                    "flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300 z-50",
                    currentView === 'chat' && "absolute top-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-transparent"
                )}>
                    <div className="flex items-center gap-3">
                    {showBackButton && (
                        <button
                            onClick={goBack}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}

                    {/* Avatar -> Open Status Viewer */}
                    <div
                        className="relative cursor-pointer hover:opacity-80 transition active:scale-95 flex-shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowStatusViewer(true);
                        }}
                    >
                        {/* Status Ring Indicator (Simple Version for Widget) */}
                        {statuses.length > 0 && !statuses.every(s => Array.isArray(s.views) && (s.views as any[]).some((v: any) => v.viewerId === (window as any).fingerprint)) && (
                            <div className="absolute inset-[-3px] rounded-full border-2 border-emerald-500 animate-pulse"></div>
                        )}

                        <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 absolute bottom-0 right-0 z-10"></div>
                        {config.branding.avatarUrl ? (
                            <img
                                src={config.branding.avatarUrl}
                                className="w-10 h-10 rounded-full object-cover shadow-sm bg-white dark:bg-slate-800"
                                alt="Bot Avatar"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg"
                                style={{ background: `linear-gradient(135deg, ${config.theme?.primaryColor || '#3B82F6'}, ${config.theme?.secondaryColor || '#8B5CF6'})` }}>
                                AI
                            </div>
                        )}
                    </div>

                    {/* Name -> Open Profile Details */}
                    <div
                        className="cursor-pointer group flex-1 relative z-20"
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log("⚙️ Name Clicked -> Settings View");
                            setCurrentView('settings');
                        }}
                    >
                        <h1 className="text-slate-800 dark:text-slate-100 font-bold text-base group-hover:text-primary transition-colors">
                            {config.branding.title}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                            {config.branding.subtitle}
                            <ChevronLeft size={12} className="rotate-180 opacity-0 group-hover:opacity-100 -ml-1 transition-all" />
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {config.menu.enabled && (
                        <button
                            onClick={toggleMenu}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                </div>
            </div>
            )}

            {/* ⌚ Shared Apple Watch Menu */}
            {activeSkill === 'menu' && (
                <>
                    {/* Backdrop for clarity inside the chat window */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[150] animate-fadeIn"
                        onClick={() => setActiveSkill(null)}
                    />
                    <ActionMenuSkill />
                </>
            )}

            {/* 🎮 Game Overlays — same components, independent instance inside chat window */}
            <TicTacToeSkill />
            <RockPaperScissorsSkill />
            <SnakeGameSkill />
            <BreakoutGameSkill />
            <FlappyBirdSkill />
            <RacingGameSkill />
            <TTSGameSkill />

            {/* View Stage */}
            <div className="flex-1 overflow-hidden relative hide-scrollbar">
                {currentView === 'settings' && (
                    <SettingsView onNavigate={navigate} />
                )}

                {currentView === 'docs' && (
                    <DocsView onNavigate={navigate} />
                )}

                {currentView === 'home' && (
                    <HomeView
                        onNavigate={navigate}
                        setHeaderVisible={setIsHeaderVisible}
                        // 🟢 Status Props
                        hasActiveStatus={statuses.length > 0}
                        statusCount={statuses.length} // 🟢 Pass Count
                        onAvatarClick={() => {
                            if (statuses.length > 0) setShowStatusViewer(true);
                        }}
                    />
                )}

                {currentView === 'chat' && (
                    <ChatView
                        orgId={orgId}
                        initialMessage={initialChatText}
                        commandId={commandId}
                        onNavigate={navigate}
                    // 🟢 Pass status props if ChatView supports it (ChatWindow inside)
                    // We might need to refactor ChatWindow to accept props or let it handle its own socket?
                    // Ideally, ChatWindow handles its own socket, but we want ONE overlay.
                    // If MultiViewWidget owns the Overlay, ChatWindow shouldn't render another one.
                    // For now, let's keep ChatWindow logic separate as implemented earlier.
                    // The user's request was specifically for "Home Page".
                    />
                )}

                {currentView === 'faq' && (
                    <FAQView onNavigate={navigate} />
                )}

                {(currentView.startsWith('form_') || currentView === 'contact' || currentView === 'form') && (
                    <FormView
                        formId={currentView.startsWith('form_') ? currentView.replace('form_', '') : ''}
                        onNavigate={navigate}
                    />
                )}
            </div>

            {/* Animations */}
            <style jsx global>{`
                /* Hide scrollbar */
                .hide-scrollbar {
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* IE and Edge */
                }
                
                .hide-scrollbar::-webkit-scrollbar {
                    display: none; /* Chrome, Safari, Opera */
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-slideInRight {
                    animation: slideInRight 0.3s ease-out;
                }
            `}</style>

            <AnimatePresence>
                {isMenuVisible && (
                    <GlobalChatContextMenu
                        x={menuPos.x}
                        y={menuPos.y}
                        onClose={() => setIsMenuVisible(false)}
                        viewMode="widget"
                        isMuted={isMuted}
                        isDark={isDark}
                        onAction={(action) => {
                            if (action === 'back_home') moveBack();
                            else if (action === 'toggle_mute') toggleMute();
                            else if (action === 'toggle_theme') toggleTheme();
                            else if (action === 'close_widget') closeWidget();
                        }}
                    />
                )}
            </AnimatePresence>
            {/* 🟢 Global Status Viewer Overlay */}
            <StatusViewerOverlay
                open={showStatusViewer}
                onClose={() => setShowStatusViewer(false)}
                statuses={statuses}
                onEdit={() => { }}
                onDelete={() => { }}
                isWidgetMode={true} // Hint for styling
                onViewStatus={markStatusViewed} // 🟢 Pass Tracker
            />
        </div >
    );
};

// ─────────────────────────────────────────────────────────
//  Export default wrapped with Provider
// ─────────────────────────────────────────────────────────
export const MultiViewWidget: React.FC<MultiViewWidgetProps> = (props) => {
    return (
        <SkillManagerProvider>
            <MultiViewWidgetInner {...props} />
        </SkillManagerProvider>
    );
};

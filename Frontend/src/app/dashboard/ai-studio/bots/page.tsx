"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

// Tab components
import { InstallTab } from "./tabs/InstallTab";
import { CustomizeTab } from "./tabs/CustomizeTab";
import { ChatWindowTab } from "./tabs/ChatWindowTab";
import { ShareTab } from "./tabs/ShareTab";
import { botConfigService, BotConfig } from "@/services/bot-config.service";
import { widgetAPI } from "@/lib/api";

export default function ChatbotWidgetPage() {
    const user = useSelector((state: RootState) => state.auth.user);
    const reduxOrgId = user?.orgId;
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams?.get("tab") || "install";

    // State for config
    const [config, setConfig] = useState({
        appearance: {
            colors: {
                primary: "#3B82F6",
                background: "#FFFFFF",
                text: "#1F2937"
            },
            position: "bottom-right" as "bottom-right" | "bottom-left" | "top-right" | "top-left",
        },
        behavior: {
            welcomeMessage: "Hi! 👋 Welcome. I'm here to help you.",
            quickReplies: ["Your Interest", "Contact Support"]
        }
    });

    const [showAnalytics, setShowAnalytics] = useState(false);
    const [activeOrgId, setActiveOrgId] = useState<string>("");
    const [botConfig, setBotConfig] = useState<BotConfig | null>(null);

    useEffect(() => {
        // Robust Org ID retrieval
        let currentOrgId = "";
        if (reduxOrgId) {
            currentOrgId = reduxOrgId;
            setActiveOrgId(reduxOrgId);
        } else {
            // Fallback or wait for redux
            const stored = localStorage.getItem('activeOrgId');
            if (stored) {
                currentOrgId = stored;
                setActiveOrgId(stored);
            }
        }

        // Always fetch default-bot config on mount for debugging/verification
        console.log("Fetching bot config for default-bot (Unconditional)...");
        botConfigService.getBotConfig('default-bot')
            .then(config => {
                console.log("Fetched Bot Config:", config);
                setBotConfig(config);

                // SYNC GLOBAL CONFIG FROM BACKEND WIDGETCONFIG
                if (config?.widgetConfig) {
                    console.log("Syncing Global Config from WidgetConfig...");
                    setConfig(prev => ({
                        ...prev,
                        appearance: {
                            ...prev.appearance,
                            colors: {
                                ...prev.appearance.colors,
                                primary: config.widgetConfig?.theme?.primaryColor || prev.appearance.colors.primary,
                            },
                            // Position mapping if needed
                            position: (config.widgetConfig?.position?.vertical && config.widgetConfig?.position?.horizontal)
                                ? `${config.widgetConfig.position.vertical}-${config.widgetConfig.position.horizontal}` as any
                                : prev.appearance.position
                        }
                    }));
                }
            })
            .catch(err => console.error("Failed to load bot config", err));

        if (currentOrgId) {
            // Org specific logic if needed later
        }
    }, [reduxOrgId]);

    const handleConfigUpdate = (updates: any) => {
        setConfig(prev => ({ ...prev, ...updates }));
    };

    const handleTabChange = (val: string) => {
        router.push(`/dashboard/ai-studio/bots?tab=${val}`);
    };

    // ------------------------------------------------------------------
    //  REAL SCRIPT INJECTION LOGIC - THE ONLY WAY
    //  This injects the actual public/widget.js script.
    // ------------------------------------------------------------------
    useEffect(() => {
        // Only run on client and if we have an Org ID
        if (typeof window === 'undefined' || !activeOrgId) return;

        // Check environment to determine widget URL
        const isLocal = process.env.NODE_ENV === 'development' ||
            (typeof window !== 'undefined' && window.location.hostname === 'localhost');

        const widgetUrl = isLocal ? 'http://localhost:3000' : 'https://app.cluaiz.com';

        // Define the script source with cache busting
        const scriptSrc = `${widgetUrl}/widget.js?v=${Date.now()}`;

        // Remove existing widget script (match any version)
        const existingScript = document.querySelector(`script[src^="${widgetUrl}/widget.js"]`);
        if (existingScript) {
            existingScript.remove();
            // Also clean up widget elements to ensure fresh re-render
            const launcher = document.getElementById("cluaiz-launcher");
            const iframe = document.getElementById("cluaiz-iframe");
            if (launcher) launcher.remove();
            if (iframe) iframe.remove();
        }

        // 1. Create Script Tag
        const script = document.createElement("script");
        script.src = scriptSrc;
        script.setAttribute("data-org-id", activeOrgId);
        script.setAttribute("data-show-analytics", showAnalytics.toString());
        script.async = true;

        // 2. Append to Body
        document.body.appendChild(script);

        // 3. Cleanup on Unmount (Reset everything)
        return () => {
            // Remove script tag (match any version)
            const currentScript = document.querySelector(`script[src^="${widgetUrl}/widget.js"]`);
            if (currentScript) document.body.removeChild(currentScript);

            // Remove Widget Elements created by script (IDs found in widget.js)
            const launcher = document.getElementById("cluaiz-launcher");
            const iframe = document.getElementById("cluaiz-iframe");

            if (launcher) launcher.remove();
            if (iframe) iframe.remove();

            // Also remove analytics badge if present
            const badge = document.getElementById("cluaiz-analytics-badge");
            const analyticsIframe = document.getElementById("cluaiz-analytics-iframe");
            if (badge) badge.remove();
            if (analyticsIframe) analyticsIframe.remove();
        };
    }, [activeOrgId, showAnalytics]); // Re-run if ID or Analytics setting changes

    return (
        <div className="min-h-screen relative bg-transparent">
            {/* Centered Configuration Container */}
            <div className="max-w-[1600px] mx-auto space-y-4">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            Chatbot & Widget
                            <motion.span
                                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    repeatDelay: 3
                                }}
                            >
                                🤖
                            </motion.span>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Configure and embed your AI chatbot anywhere
                        </p>
                    </div>
                </motion.div>

                {/* Tabs - Controlled by URL, List Hidden (Managed by Sidebar) */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">

                    {/* Configuration Content - Centered */}
                    <div className="w-full">
                        <TabsContent value="install" className="m-0 focus-visible:ring-0">
                            <InstallTab
                                config={config}
                                orgId={activeOrgId}
                                showAnalytics={showAnalytics}
                                setShowAnalytics={setShowAnalytics}
                            />
                        </TabsContent>

                        <TabsContent value="design" className="m-0 focus-visible:ring-0">
                            <CustomizeTab
                                config={config}
                                orgId={activeOrgId}
                                initialConfig={botConfig?.widgetConfig}
                            />
                        </TabsContent>

                        <TabsContent value="chatwindow" className="m-0 focus-visible:ring-0">
                            <ChatWindowTab
                                config={config}
                                orgId={activeOrgId}
                            />
                        </TabsContent>

                        <TabsContent value="share" className="m-0 focus-visible:ring-0">
                            <ShareTab
                                config={config}
                                orgId={activeOrgId}
                            />
                        </TabsContent>

                        <TabsContent value="advanced" className="m-0 focus-visible:ring-0">
                            <Card><CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader></Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="m-0 focus-visible:ring-0">
                            <Card><CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader></Card>
                        </TabsContent>
                    </div>
                </Tabs>

            </div>

        </div>
    );
}

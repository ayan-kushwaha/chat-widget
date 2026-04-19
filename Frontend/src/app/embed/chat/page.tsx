"use client";

import { MultiViewWidget } from "@/components/chatbot/widgets/MultiViewWidget";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";
import { ThemeProvider } from "next-themes";
import { botConfigService } from "@/services/bot-config.service";

function ChatContent() {
    const searchParams = useSearchParams();
    const isEmbed = searchParams.get("embed") === "1";
    const orgId = searchParams.get("orgId");

    const [windowConfig, setWindowConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWindowConfig = async () => {
            try {
                const config = await botConfigService.getBotConfig('default_bot');
                if (config?.widgetConfig?.window) {
                    setWindowConfig(config.widgetConfig.window);
                }
            } catch (error) {
                console.error('Failed to load window config:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isEmbed) {
            document.documentElement.style.background = 'transparent';
            document.body.style.background = 'transparent';
            fetchWindowConfig();
        } else {
            document.body.classList.add("transparent-bg");
            document.documentElement.classList.add("transparent-bg");
            setIsLoading(false);
        }

        return () => {
            document.body.classList.remove("transparent-bg");
            document.documentElement.classList.remove("transparent-bg");
            document.documentElement.style.background = '';
            document.body.style.background = '';
        };
    }, [isEmbed]);

    if (isLoading && isEmbed) {
        return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
    }

    if (isEmbed) {
        // Determine theme settings
        const theme = windowConfig?.theme || 'auto';
        const forcedTheme = theme !== 'auto' ? theme : undefined;

        return (
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                forcedTheme={forcedTheme}
                enableSystem={theme === 'auto'}
            >
                <div className="w-full h-screen bg-white dark:bg-slate-900">
                    <MultiViewWidget isEmbed={true} orgId={orgId} />
                </div>
            </ThemeProvider>
        );
    }

    return (
        <div className="w-full h-screen bg-transparent pointer-events-none flex items-end justify-end">
            <MultiViewWidget orgId={orgId} />
        </div>
    );
}

export default function EmbedChatPage() {
    return (
        <Suspense fallback={null}>
            <ChatContent />
        </Suspense>
    );
}

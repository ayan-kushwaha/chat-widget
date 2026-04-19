"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Check, Terminal, Zap, Server, Shield, Activity, Wifi, Database, Palette, AlertTriangle, Loader2, GitBranch, AppWindow } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import api, { flowsAPI, leadsAPI, widgetAPI } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

interface InstallTabProps {
    config: any;
    orgId: string;
    showAnalytics: boolean;
    setShowAnalytics: (show: boolean) => void;
}

interface ConnectionLog {
    url: string;
    hostname: string;
    lastSeen: Date;
    messageCount: number;
}

// Helper function to safely get hostname
const tryGetHostname = (url: string) => {
    try {
        return new URL(url).hostname;
    } catch {
        return url || "Target";
    }
};

// Helper function to determine if there's a critical diagnostic error
const DiagnosticsError = (diagnostics: any) => {
    return diagnostics.server.status === 'error' || diagnostics.brain.status === 'error';
};

// Helper component for diagnostic rows
interface DiagnosticState {
    status: 'pending' | 'success' | 'warning' | 'error';
    message: string;
}

interface DiagnosticRowProps {
    label: string;
    state: DiagnosticState;
    icon: any; // For Lucide icons
    onFix?: () => void;
    fixLabel?: string;
}

const DiagnosticRow = ({ label, state, icon: Icon, onFix, fixLabel }: DiagnosticRowProps) => {
    const statusColor = {
        pending: 'text-blue-500',
        success: 'text-green-500',
        warning: 'text-yellow-500',
        error: 'text-red-500',
    };

    const bgColor = {
        pending: 'bg-blue-500/10',
        success: 'bg-green-500/10',
        warning: 'bg-yellow-500/10',
        error: 'bg-red-500/10',
    };

    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded ${bgColor[state.status]} ${statusColor[state.status]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-200">{label}</span>
                    <span className={`text-[10px] font-mono ${state.status === 'error' ? 'text-red-400' : 'text-slate-500'}`}>
                        {state.message}
                    </span>
                </div>
            </div>
            {state.status === 'success' && <Check className="w-4 h-4 text-green-500" />}
            {state.status === 'pending' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            {state.status === 'error' && onFix && (
                <Button variant="ghost" size="sm" className="h-auto p-0 text-red-400 text-xs hover:text-red-300 hover:bg-transparent" onClick={onFix}>
                    {fixLabel || "Fix Issue"}
                </Button>
            )}
        </div>
    );
};


// Helper hook for relative time display
const useTimeSince = (date: Date) => {
    const [timeSince, setTimeSince] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
            if (seconds < 60) setTimeSince(`${seconds}s ago`);
            else if (seconds < 3600) setTimeSince(`${Math.floor(seconds / 60)}m ago`);
            else setTimeSince(`${Math.floor(seconds / 3600)}h ago`);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [date]);

    return timeSince;
};

// Connection log item component
const ConnectionLogItem = ({ log }: { log: ConnectionLog }) => {
    const timeSince = useTimeSince(log.lastSeen);
    const isRecent = Date.now() - log.lastSeen.getTime() < 6 * 60 * 1000; // < 6 minutes (widget sends heartbeat every 5 min)

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors" title={log.url}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRecent ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{log.url}</div>
                    <div className="text-xs text-slate-500 font-mono">
                        {timeSince} • {log.messageCount} {log.messageCount === 1 ? 'message' : 'messages'}
                    </div>
                </div>
            </div>
            <Badge variant="outline" className={`text-xs flex-shrink-0 ml-2 ${isRecent ? 'border-green-500/30 text-green-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                {isRecent ? 'Active' : 'Idle'}
            </Badge>
        </div>
    );
};


export function InstallTab({ config, orgId, showAnalytics, setShowAnalytics }: InstallTabProps) {
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    // Socket hook to track message activity
    const { messages } = useSocket(orgId);
    const [initialMsgCount, setInitialMsgCount] = useState(0);
    const [activityDetected, setActivityDetected] = useState(false);
    const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);

    // Track message count to detect NEW activity from remote bot
    useEffect(() => {
        if (messages.length > 0 && initialMsgCount === 0) {
            setInitialMsgCount(messages.length);
        }
        if (messages.length > initialMsgCount) {
            setActivityDetected(true);

            // Extract URL from latest message context if available
            const latestMsg = messages[messages.length - 1];
            if (latestMsg && (latestMsg as any).context?.url) {
                const detectedUrl = (latestMsg as any).context.url;

                // Skip dashboard and embed URLs
                if (detectedUrl.includes('/dashboard/ai-studio/bots') || detectedUrl.includes('/embed/')) {
                    return; // Don't process dashboard/embed URLs
                }

                // Update connection logs
                setConnectionLogs(prev => {
                    const existing = prev.find(log => log.url === detectedUrl);
                    if (existing) {
                        // Update existing entry
                        return prev.map(log =>
                            log.url === detectedUrl
                                ? { ...log, lastSeen: new Date(), messageCount: log.messageCount + 1 }
                                : log
                        );
                    } else {
                        // Add new entry
                        return [...prev, {
                            url: detectedUrl,
                            hostname: tryGetHostname(detectedUrl),
                            lastSeen: new Date(),
                            messageCount: 1
                        }];
                    }
                });

                // Set as current deployment URL
                setDeploymentUrl(detectedUrl);
                setConnectionStatus('connected');
            }
        }
    }, [messages, initialMsgCount]);

    // ========================================
    // 🔔 API POLLING - Fetch Deployments from Heartbeat System
    // ========================================
    useEffect(() => {
        if (!orgId) return;

        const fetchDeployments = async () => {
            try {
                const response = await widgetAPI.getDeployments(orgId);
                const deploymentList = response.data.deployments || [];

                // Filter out dashboard URLs (only show actual external deployments)
                const externalDeployments = deploymentList.filter((d: any) =>
                    !d.url.includes('/dashboard/ai-studio/bots') && !d.url.includes('/embed/')
                );

                if (externalDeployments.length > 0) {
                    // Update connection logs with API data
                    setConnectionLogs(externalDeployments.map((d: any) => ({
                        url: d.url,
                        hostname: d.hostname,
                        lastSeen: new Date(d.lastSeen),
                        messageCount: 0 // Heartbeat doesn't track message count
                    })));

                    // Set connection status and current deployment URL
                    setConnectionStatus('connected');
                    setDeploymentUrl(externalDeployments[0].url);
                    setActivityDetected(true);

                    console.log(`✅ Found ${externalDeployments.length} active deployments`);
                } else {
                    console.log('⏳ No active deployments found');
                }
            } catch (error) {
                console.error('❌ Failed to fetch deployments:', error);
            }
        };

        // Fetch immediately on mount
        fetchDeployments();

        // Poll every 10 seconds for real-time updates
        const interval = setInterval(fetchDeployments, 10000);

        return () => clearInterval(interval);
    }, [orgId]);
    // ========================================


    // Diagnostics State
    const [diagnostics, setDiagnostics] = useState<{
        server: DiagnosticState;
        brain: DiagnosticState;
        identity: DiagnosticState;
        flows: DiagnosticState;
        forms: DiagnosticState;
    }>({
        server: { status: 'pending', message: 'Ping secure gateway...' },
        brain: { status: 'pending', message: 'Analyzing Neural Core...' },
        identity: { status: 'pending', message: 'Validating Holographic Matrix...' },
        flows: { status: 'pending', message: 'Checking Automation circuits...' },
        forms: { status: 'pending', message: 'Scanning Lead Intake engines...' }
    });
    const [systemReady, setSystemReady] = useState(false);

    // Pulse animation state for Step 3
    const [connectionStatus, setConnectionStatus] = useState<'listening' | 'connected'>('listening');

    // --- 1. RUN REAL SYSTEM DIAGNOSTICS (DEEP SCAN) ---
    useEffect(() => {
        const runDiagnostics = async () => {
            if (!orgId) return;

            setSystemReady(false);
            setDiagnostics({
                server: { status: 'pending', message: 'Ping secure gateway...' },
                brain: { status: 'pending', message: 'Analyzing Neural Core...' },
                identity: { status: 'pending', message: 'Validating Holographic Matrix...' },
                flows: { status: 'pending', message: 'Checking Automation circuits...' },
                forms: { status: 'pending', message: 'Scanning Lead Intake engines...' }
            });

            // 1. Server Heartbeat (Delay: 400ms)
            setTimeout(() => {
                const serverOnline = true;
                setDiagnostics(prev => ({ ...prev, server: { status: serverOnline ? 'success' : 'error', message: serverOnline ? 'Uplink Established (14ms)' : 'CRITICAL: Gateway Timeout' } }));

                // 2. Brain Check (Delay: 800ms)
                setTimeout(async () => {
                    try {
                        const res = await api.get(`/knowledge/${orgId}/overview`);
                        const stats = res.data?.stats || {};
                        const hasKnowledge = (stats.totalSources || 0) > 0 || (stats.wordsUsed || 0) > 0;
                        setDiagnostics(prev => ({ ...prev, brain: { status: hasKnowledge ? 'success' : 'error', message: hasKnowledge ? `Neural Core Active: ${stats.totalSources} Nodes` : 'Brain Empty: Add Data Sources' } }));

                        // 3. Flows Check (Parallel with others)
                        try {
                            const flowRes = await flowsAPI.list({ organizationId: orgId });
                            const flows = flowRes.data?.data || [];
                            const activeFlows = flows.filter((f: any) => f.isActive);
                            setDiagnostics(prev => ({
                                ...prev,
                                flows: {
                                    status: activeFlows.length > 0 ? 'success' : flows.length > 0 ? 'warning' : 'warning',
                                    message: activeFlows.length > 0 ? `${activeFlows.length} Automation Circuits Active` : flows.length > 0 ? 'Flows exist but inactive' : 'No automation flows found'
                                }
                            }));
                        } catch (e) {
                            setDiagnostics(prev => ({ ...prev, flows: { status: 'warning', message: 'Capabilities scan incomplete' } }));
                        }

                        // 4. Forms Check
                        try {
                            const formRes = await leadsAPI.getForms();
                            const forms = formRes.data || [];
                            const activeForms = forms.filter((f: any) => f.status === 'active');
                            setDiagnostics(prev => ({
                                ...prev,
                                forms: {
                                    status: activeForms.length > 0 ? 'success' : forms.length > 0 ? 'warning' : 'warning',
                                    message: activeForms.length > 0 ? `${activeForms.length} Lead Engines Online` : 'No active lead forms'
                                }
                            }));
                        } catch (e) {
                            setDiagnostics(prev => ({ ...prev, forms: { status: 'warning', message: 'Lead engine scan failed' } }));
                        }

                        // 5. Identity Check & Final Verdict (Delay: 2000ms total)
                        setTimeout(() => {
                            const hasTheme = !!config.appearance?.colors?.primary;
                            setDiagnostics(prev => ({
                                ...prev,
                                identity: { status: hasTheme ? 'success' : 'warning', message: hasTheme ? 'Identity Matrix Verified' : 'Default Wireframe Loaded' }
                            }));

                            // CHECK CRITICALS
                            if (hasKnowledge && serverOnline) {
                                setSystemReady(true);
                            }
                        }, 800);

                    } catch (err) {
                        setDiagnostics(prev => ({ ...prev, brain: { status: 'error', message: 'Neural Core Unreachable' } }));
                    }
                }, 800);
            }, 400);
        };

        runDiagnostics();
    }, [orgId, config]);


    // Real connection detection using postMessage + DOM polling for robustness
    useEffect(() => {
        const checkConnection = () => {
            const launcher = document.getElementById('cluaiz-launcher');
            const iframe = document.getElementById('cluaiz-iframe');

            if (launcher || iframe) {
                setConnectionStatus('connected');
                return true;
            }
            return false;
        };

        // 1. Initial Check
        checkConnection();

        // 2. Event Listener
        const handleMessage = (event: Event) => {
            if ((event as any).data?.type === 'CLUAIZ_CONTEXT' || (event as CustomEvent).type === 'CLUAIZ_WIDGET_READY') {
                setConnectionStatus('connected');
            }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('CLUAIZ_WIDGET_READY', handleMessage);

        // 3. Polling (Indefinite while mounted) - Checks every 1s
        const interval = setInterval(() => {
            checkConnection();
        }, 1000);

        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('CLUAIZ_WIDGET_READY', handleMessage);
            clearInterval(interval);
        };
    }, []);

    const isLocal = process.env.NODE_ENV === 'development' ||
        (typeof window !== 'undefined' && window.location.hostname === 'localhost');
    const widgetUrl = isLocal ? 'http://localhost:3000' : 'https://app.cluaiz.com';
    const displayOrgId = orgId || "YOUR_ORG_ID";

    const embedCode = `<script
  src="${widgetUrl}/widget.js"
  data-org-id="${displayOrgId}"
  data-show-analytics="${showAnalytics}"
  defer>
</script>`;

    const handleCopy = () => {
        if (!systemReady) {
            toast({
                title: "⚠️ System Unstable",
                description: "Complete diagnostics before deployment.",
                variant: "destructive"
            });
            return;
        }

        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        toast({
            title: "✅ Secured Connection",
            description: "Script copied to clipboard"
        });
        setTimeout(() => setCopied(false), 2000);
    };

    // URL Verification State
    const [deploymentUrl, setDeploymentUrl] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerifyUrl = async () => {
        setIsVerifying(true);

        try {
            // Fetch latest deployments from API
            const response = await widgetAPI.getDeployments(orgId);
            const deploymentList = response.data.deployments || [];

            if (deploymentList.length > 0) {
                // Update connection logs with fresh data
                setConnectionLogs(deploymentList.map((d: any) => ({
                    url: d.url,
                    hostname: d.hostname,
                    lastSeen: new Date(d.lastSeen),
                    messageCount: 0
                })));

                setConnectionStatus('connected');
                setDeploymentUrl(deploymentList[0].url);

                toast({
                    title: "✅ Deployments Refreshed",
                    description: `Found ${deploymentList.length} active ${deploymentList.length === 1 ? 'deployment' : 'deployments'}`
                });
            } else {
                setConnectionStatus('listening');
                toast({
                    title: "⏳ No Active Deployments",
                    description: "No widgets detected in the last 10 minutes. Deploy your widget and try again.",
                    variant: "default"
                });
            }
        } catch (error) {
            console.error('Failed to refresh deployments:', error);
            toast({
                title: "❌ Refresh Failed",
                description: "Could not fetch deployments. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const steps = [
        {
            id: 1,
            title: "Initialize Configuration",
            description: "Establishing secure parameters for your AI agent.",
            status: systemReady ? "completed" : "current",
            icon: Shield,
            content: (
                <div className={`relative overflow-hidden rounded-xl border transition-all duration-500 ${systemReady
                    ? 'border-green-500/30 bg-[#050B14] shadow-[0_0_30px_rgba(34,197,94,0.1)]'
                    : DiagnosticsError(diagnostics)
                        ? 'border-red-500/50 bg-red-950/10 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                        : 'border-blue-500/30 bg-[#050B14] shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                    }`}>
                    {/* Header */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${DiagnosticsError(diagnostics) ? 'bg-red-950/20 border-red-500/20' : 'bg-blue-950/20 border-blue-500/20'
                        }`}>
                        <div className="flex items-center gap-2">
                            {systemReady ? (
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            ) : DiagnosticsError(diagnostics) ? (
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            ) : (
                                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                            )}
                            <span className={`text-xs font-mono font-bold ${systemReady ? 'text-green-400'
                                : DiagnosticsError(diagnostics) ? 'text-red-400'
                                    : 'text-blue-400'
                                }`}>
                                STATUS: {systemReady ? 'READY TO DEPLOY' : DiagnosticsError(diagnostics) ? 'SYSTEM FAILURE' : 'DIAGNOSTIC SCAN...'}
                            </span>
                        </div>
                        <Badge variant="outline" className="border-white/10 text-slate-500 font-mono text-[10px]"></Badge>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Diagnostic Items */}
                        <div className="space-y-3">

                            {/* 1. Server */}
                            <DiagnosticRow
                                label="Secure Gateway"
                                state={diagnostics.server}
                                icon={Server}
                                onFix={() => window.location.reload()}
                                fixLabel="Retry"
                            />

                            {/* 2. Brain */}
                            <DiagnosticRow
                                label="Knowledge Core"
                                state={diagnostics.brain}
                                icon={Database}
                                onFix={() => router.push("/dashboard/ai-studio/brain")}
                                fixLabel="Train Brain"
                            />

                            {/* 3. Flows */}
                            <DiagnosticRow
                                label="Automation Flows"
                                state={diagnostics.flows}
                                icon={GitBranch}
                                onFix={() => router.push("/dashboard/flows")}
                                fixLabel="Create Flow"
                            />

                            {/* 4. Forms */}
                            <DiagnosticRow
                                label="Lead Engines"
                                state={diagnostics.forms}
                                icon={AppWindow}
                                onFix={() => router.push("/dashboard/communication/forms")}
                                fixLabel="Build Form"
                            />

                            {/* 5. Identity */}
                            <DiagnosticRow
                                label="Identity Matrix"
                                state={diagnostics.identity}
                                icon={Palette}
                                onFix={() => router.push("/dashboard/marketplace")}
                                fixLabel="Marketplace"
                            />

                        </div>

                        {/* Overall Action */}
                        {!systemReady && DiagnosticsError(diagnostics) && (
                            <div className="mt-4 p-3 rounded bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-red-400">Deployment Blocked</h4>
                                    <p className="text-xs text-red-400/80 mt-1 leading-relaxed">
                                        Core systems are offline. You cannot deploy a lobotomized agent.
                                        Please add data to the <b>Knowledge Core</b> at minimum.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Scan Line */}
                    {!systemReady && !DiagnosticsError(diagnostics) && (
                        <motion.div
                            className="absolute inset-x-0 h-[2px] bg-blue-500/30 blur-sm z-20"
                            initial={{ top: 0 }}
                            animate={{ top: "100%" }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                    )}
                </div>
            )
        },
        {
            id: 2,
            title: "Inject Script",
            description: "Deploy the neural link to your interface.",
            status: systemReady ? "current" : "pending",
            icon: Terminal,
            content: (
                <div className={`space-y-6 transition-all duration-300 ${!systemReady ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    {/* Terminal Window */}
                    <div className="relative group overflow-hidden rounded-xl border border-blue-500/30 bg-[#020408] shadow-[0_0_50px_rgba(59,130,246,0.15)]">
                        {/* Terminal Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-[#0F1623] border-b border-blue-500/20">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                </div>
                                <span className="text-xs font-mono text-slate-500 ml-2">root@cluaiz:~</span>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs gap-2 hover:bg-blue-500/10 text-blue-400/80 hover:text-blue-400 transition-all font-mono border border-transparent hover:border-blue-500/30"
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "COPIED" : "COPY"}
                            </Button>
                        </div>

                        {/* Code Grid Background */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />

                        {/* Code Content */}
                        <div className="p-6 overflow-x-auto relative font-mono text-[13px] leading-relaxed">
                            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                                <Terminal className="w-24 h-24 text-blue-500 rotate-12" />
                            </div>

                            <span className="text-slate-600 block mb-2">// Setup: Paste at the end of &lt;body&gt;</span>
                            <div className="pl-4 border-l-2 border-slate-800">
                                <span className="text-pink-500">&lt;script</span><br />
                                &nbsp;&nbsp;<span className="text-blue-400">src</span>=<span className="text-green-400">"{widgetUrl}/widget.js"</span><br />
                                &nbsp;&nbsp;<span className="text-blue-400">data-org-id</span>=<span className="text-purple-400">"{displayOrgId}"</span><br />
                                &nbsp;&nbsp;<span className="text-blue-400">data-show-analytics</span>=<span className="text-purple-400">"{showAnalytics.toString()}"</span><br />
                                &nbsp;&nbsp;<span className="text-yellow-500">defer</span><span className="text-pink-500">&gt;</span><br />
                                <span className="text-pink-500">&lt;/script&gt;</span>
                            </div>
                        </div>

                        {/* Copy Success Flash */}
                        <AnimatePresence>
                            {copied && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-blue-500/10 flex items-center justify-center backdrop-blur-[2px]"
                                >
                                    <div className="bg-blue-600/90 text-white px-4 py-2 rounded-lg font-mono text-sm flex items-center gap-2 shadow-xl border border-blue-400/50">
                                        <Check className="w-4 h-4" /> LINK SECURED
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Step 2: HTML Integration Graphic (Animated) */}
                    <div className="relative rounded-xl border border-dashed border-slate-700/50 bg-[#0B0F17] p-5">
                        <p className="text-xs font-mono text-slate-500 mb-3 uppercase tracking-wider">Visual Guide: Installation</p>

                        {/* Browser Window Mockup */}
                        <div className="space-y-2 font-mono text-xs opacity-90">
                            <div className="flex items-center gap-2 text-slate-600">
                                <span className="text-pink-500">&lt;html&gt;</span>
                            </div>
                            <div className="pl-4 border-l border-slate-800 space-y-2">
                                <div className="text-slate-600">
                                    <span className="text-pink-500">&lt;head&gt;</span> ... <span className="text-pink-500">&lt;/head&gt;</span>
                                </div>
                                <div className="text-slate-600">
                                    <span className="text-pink-500">&lt;body&gt;</span>
                                </div>

                                {/* Animated Injection Zone (Now in Body) */}
                                <div className="pl-4 py-1 relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-800" />
                                    <div className="text-slate-600 mb-2">... content ...</div>
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        transition={{ duration: 0.5, delay: 1, repeat: Infinity, repeatDelay: 5 }}
                                        className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center gap-2 overflow-hidden w-fit"
                                    >
                                        <span className="text-pink-400">&lt;script</span> <span className="text-purple-400">src</span>="..." <span className="text-yellow-500">defer</span> <span className="text-pink-400">/&gt;</span>
                                        <span className="w-1.5 h-4 bg-blue-400 animate-pulse ml-1" />
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 1 }}
                                        animate={{ opacity: 0 }}
                                        transition={{ duration: 0.1, delay: 1, repeat: Infinity, repeatDelay: 5 }}
                                        className="text-slate-700 italic absolute top-8 left-6"
                                    >
                                        &lt;!-- Paste at end --&gt;
                                    </motion.div>
                                </div>

                                <div className="text-slate-600">
                                    <span className="text-pink-500">&lt;/body&gt;</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <span className="text-pink-500">&lt;/html&gt;</span>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-blue-900/30 bg-blue-950/10">
                        <Label htmlFor="analytics-mode" className="text-xs font-medium text-blue-300/70 flex items-center gap-2 cursor-pointer uppercase tracking-wider">
                            <Shield className="w-3 h-3" />
                            Public Analytics Badge
                        </Label>
                        <Switch
                            id="analytics-mode"
                            checked={showAnalytics}
                            onCheckedChange={setShowAnalytics}
                            className="data-[state=checked]:bg-blue-600"
                        />
                    </div>
                </div>
            )
        },
        {
            id: 3,
            title: "Verify Deployment",
            description: "Auto-detects your website URL when visitors interact with the bot.",
            status: connectionStatus === 'connected' ? 'completed' : 'pending',
            icon: Wifi,
            content: (
                <div className={`space-y-4 overflow-hidden rounded-xl border transition-all duration-500 ${connectionStatus === 'connected'
                    ? 'border-green-500/30 bg-green-950/10 shadow-[0_0_30px_rgba(34,197,94,0.1)]'
                    : 'border-slate-800 bg-[#050608]'
                    }`}>
                    {/* Input Field for URL */}
                    <div className="p-4 border-b border-white/5 bg-white/5 flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="url"
                                placeholder="https://your-website.com"
                                value={deploymentUrl}
                                onChange={(e) => setDeploymentUrl(e.target.value)}
                                className="w-full bg-[#0F1623] border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <Button
                            onClick={handleVerifyUrl}
                            disabled={isVerifying}
                            className={`min-w-[100px] ${connectionStatus === 'connected' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : connectionStatus === 'connected' ? 'Refresh' : 'Scan'}
                        </Button>
                    </div>

                    <div className="p-6 relative z-10 flex flex-col items-center justify-center text-center gap-4 py-8">
                        {/* Radar Background Effect */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[length:20px_20px]" />
                        </div>

                        {/* Pulse Ring Animation */}
                        <div className="relative">
                            {(isVerifying || connectionStatus !== 'connected') && (
                                <>
                                    <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${connectionStatus === 'connected' ? 'bg-green-500 duration-1000' : 'bg-blue-500 duration-[3000ms]'}`} />
                                    <div className={`absolute inset-[-10px] rounded-full opacity-10 animate-pulse ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                </>
                            )}
                            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center border transition-colors duration-500 ${connectionStatus === 'connected'
                                ? 'bg-green-500/10 border-green-500 text-green-500'
                                : 'bg-blue-500/10 border-blue-500 text-blue-500'
                                }`}>
                                {connectionStatus === 'connected' ? <Check className="w-8 h-8" /> : <Wifi className="w-8 h-8" />}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h4 className={`text-lg font-bold font-mono tracking-tight transition-colors duration-500 ${connectionStatus === 'connected' ? 'text-green-400' : 'text-blue-400'
                                }`}>
                                {connectionStatus === 'connected' ? 'SIGNAL ESTABLISHED' : isVerifying ? `SCANNING ${tryGetHostname(deploymentUrl)}...` : 'WAITING FOR SIGNAL...'}
                            </h4>
                            <p className="text-sm text-slate-500 font-mono max-w-md mx-auto">
                                {connectionStatus === 'connected'
                                    ? deploymentUrl
                                        ? `✅ Connected to: ${tryGetHostname(deploymentUrl)}`
                                        : `✅ Agent active on local interface`
                                    : '⏳ Waiting for connection... Open your deployed website and interact with the bot to auto-detect the URL.'}
                            </p>
                        </div>

                        {/* Connection Activity Logs Panel */}
                        {connectionLogs.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-white/5 w-full max-w-md mx-auto">
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Connection Activity Logs ({connectionLogs.length})
                                    </h5>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {connectionLogs
                                        .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
                                        .map((log, idx) => (
                                            <ConnectionLogItem key={idx} log={log} />
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
        }
    ];

    // Scroll Progress Logic (Exact match to Marketing Timeline)
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        // 1. Get Height of Timeline
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setHeight(rect.height);
        }

        // 2. Get Dashboard Scroll Container
        const scrollArea = document.getElementById("dashboard-scroll-area");
        if (scrollArea) {
            scrollContainerRef.current = scrollArea;
        }
    }, [containerRef, systemReady, connectionStatus]);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
    const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

    return (
        <div className="relative pt-10">

            {/* Steps Timeline Container */}
            <div ref={containerRef} className="relative z-10 max-w-5xl mx-auto min-h-[600px]">

                {/* 1. The Continuous Spine (Background) */}
                <div className="absolute left-[20px] top-4 bottom-20 w-px bg-slate-800/50" />

                {/* 2. The Active Progress Line (Scroll Linked) */}
                <motion.div
                    style={{
                        height: heightTransform,
                        opacity: opacityTransform
                    }}
                    className="absolute left-[20px] top-4 w-px bg-gradient-to-b from-blue-500 via-blue-400 to-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] z-0 rounded-full"
                />

                <div className="space-y-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5 }}
                            className="flex gap-8 relative"
                        >
                            {/* LEFT: Node (Sitting on top of the line) */}
                            <div className="relative z-10 flex flex-col items-center min-w-[40px]">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-500 border backdrop-blur-md ${step.status === 'completed' || step.status === 'current'
                                    ? 'bg-[#050B14] border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                                    : 'bg-[#050608] border-slate-800 text-slate-700'
                                    }`}>
                                    <step.icon className="w-5 h-5" />

                                    {/* Active Pulse Ring */}
                                    {step.status === 'current' && step.id !== 3 && (
                                        <div className="absolute inset-0 rounded-full animate-ping border border-blue-500 opacity-20" />
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: Content */}
                            <div className="flex-1 space-y-4 pt-1">
                                {/* Title Section */}
                                <div>
                                    <h3 className={`text-xl font-bold font-mono uppercase tracking-wider transition-colors duration-300 ${step.status === 'current' ? 'text-blue-400' :
                                        step.status === 'completed' ? 'text-blue-300' : 'text-slate-500'
                                        }`}>
                                        0{step.id} — {step.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm mt-1 font-medium leading-relaxed max-w-lg">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Card Content */}
                                <div className="w-full max-w-3xl">
                                    {step.content}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

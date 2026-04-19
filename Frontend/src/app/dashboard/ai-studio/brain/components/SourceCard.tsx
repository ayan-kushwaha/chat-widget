import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Globe, FileText, MessageSquare, RefreshCw, Trash2,
    Download, Pencil, MoreVertical, Zap, Clock, Database,
    Loader2, AlertTriangle, FileJson, FileSpreadsheet, FileCode, Eye,
    ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { toast } from "sonner";
import { useOrg } from "@/context/OrgContext";
import { useRouter } from "next/navigation";

interface SourceCardProps {
    source: any;
    type: 'website' | 'file' | 'qa' | 'text' | 'api';
    onEdit: (source: any) => void;
    onDelete: (type: 'website' | 'file' | 'text' | 'api', id: string) => void;
    onToggle: (type: 'file' | 'text' | 'api' | 'website', id: string) => void;
    onRefresh?: () => void;
}

const stripHtml = (html?: string) => {
    if (!html) return "";
    let text = html;
    // Remove the first h1 if it exists because it's usually the title
    text = text.replace(/^<h1[^>]*>[\s\S]*?<\/h1>/i, '');
    // Replace block tags with a space so words don't stick together
    text = text.replace(/<\/(p|h1|h2|h3|h4|h5|h6|div|li)>/gi, ' ');
    text = text.replace(/<br\s*\/?>/gi, ' ');
    text = text.replace(/<[^>]*>?/gm, '');
    return text.replace(/\s+/g, ' ').trim();
};


export function SourceCard({ source, type, onEdit, onDelete, onToggle }: SourceCardProps) {
    const router = useRouter();
    const { activeOrgId, userRoleInActiveOrg } = useOrg();
    const [status, setStatus] = useState(source.status || "synced");
    const [progress, setProgress] = useState(100);
    const [statusMessage, setStatusMessage] = useState("");
    const [isActive, setIsActive] = useState(source.isActive ?? true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Helper to get safe ID
    const getSafeId = () => source._id || source.id;

    // Sync local state with source prop (updated by parent)
    useEffect(() => {
        if (source.message) setStatusMessage(source.message);
        if (source.isActive !== undefined) setIsActive(source.isActive);
    }, [source.message, source.isActive]);

    // 🔥 Sync local state with prop updates (Socket/Parent changes)
    // Only sync when PROPS change, not when local state changes (to preserve optimistic updates)
    useEffect(() => {
        if (source.status && source.status !== status) setStatus(source.status);
        if (source.progress !== undefined && source.progress !== progress) setProgress(source.progress);
    }, [source.status, source.progress]); // 🔥 Removed status, progress from deps to prevent fighting optimistic updates
    console.log('status ⚡', status);

    // Initialize status message based on current status
    useEffect(() => {
        if (status === 'failed' || status === 'error') {
            setStatusMessage(source.message || "❌ Processing Failed");
        } else if (type === 'website') {
            // 🔥 FIX: Prefer socket message over hardcoded strings when processing
            if (source.message && isProcessing) {
                setStatusMessage(source.message); // Shows actual page URL being processed
            } else {
                switch (status) {
                    case 'crawling':
                        setStatusMessage("📖 Reading Website...");
                        break;
                    case 'processing': // 🔥 Sent when crawl done, before embed starts
                        setStatusMessage("⚡ Analyzing Content...");
                        break;
                    case 'embedding':
                        setStatusMessage("🧠 Training Brain...");
                        break;
                    case 'storing':
                        setStatusMessage("💾 Memorizing Facts...");
                        break;
                    case 'active': // 🔥 Handle 'active' same as 'synced'
                    case 'synced':
                        setStatusMessage("✅ Active & Ready");
                        break;
                    case 'draft':
                        setStatusMessage("📝 Saved as Draft");
                        break;
                    default:
                        if (!source.message) setStatusMessage(status || "Unknown");
                }
            }
        } else {
            // For Files/Text
            if (isProcessing) {
                setStatusMessage(source.message || "🧠 Processing...");
            }
        }
    }, [status, type, source.message]);

    const handleRecrawl = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // ⚠️ Show confirmation dialog before refresh
        setShowRefreshConfirm(true);
    };

    const confirmRefresh = async () => {
        setShowRefreshConfirm(false);

        // 🔥 NO OPTIMISTIC UPDATES - Wait for backend confirmation
        // Status will be updated via Socket.io events when backend starts processing
        try {
            let response;
            if (type === 'website') {
                response = await api.post(`/knowledge/${getSafeId()}/crawl`, {});
            } else {
                response = await api.post(`/knowledge/${activeOrgId}/source/${type === 'qa' ? 'text' : type}/${getSafeId()}/refresh`);
            }

            // 🔥 IMMEDIATE STATUS UPDATE from backend response
            if (response?.data) {
                if (response.data.entry) setStatus(response.data.entry.status || 'training');
                else if (response.data.document) setStatus(response.data.document.status || 'processing');
                else if (response.data.site) setStatus(response.data.site.status || 'crawling');
            }

            // ✅ Show appropriate success message based on type
            const actionName = type === 'website' ? 'Crawling' : 'Training';
            toast.success(`✅ ${actionName} started!`, {
                description: type === 'website'
                    ? "Pages are being recrawled and analyzed."
                    : "Your content is being reprocessed with AI."
            });

        } catch (error: any) {
            // Show specific error from backend (no console.error - it's expected)
            const errorMsg = error.response?.data?.message || "Failed to start refresh";
            toast.error(errorMsg);
        }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await api.get(`/knowledge/download/${getSafeId()}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', source.name || "download");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to download file");
        }
    };

    // Render Icon based on type
    const renderIcon = () => {
        if (type === 'website') return <Globe className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
        if (type === 'api') return <Database className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
        if (type === 'file') {
            const fileName = source.name || source.fileName || "";
            if (fileName.endsWith('.pdf')) return <FileText className="w-5 h-5 text-rose-500 dark:text-rose-400" />;
            if (fileName.endsWith('.docx')) return <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
            if (fileName.endsWith('.csv')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
            if (fileName.endsWith('.json')) return <FileJson className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
            if (fileName.endsWith('.md')) return <FileCode className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
            return <FileText className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
        }
        if (type === 'qa' || type === 'text') return <MessageSquare className="w-5 h-5 text-violet-500 dark:text-violet-400" />;
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    };

    // Render Background Color based on type
    const renderBgColor = () => {
        if (type === 'website') return "bg-blue-500/10 dark:bg-blue-500/20 shadow-inner border border-blue-500/10";
        if (type === 'api') return "bg-emerald-500/10 dark:bg-emerald-500/20 shadow-inner border border-emerald-500/10";
        if (type === 'file') {
            const fileName = source.name || source.fileName || "";
            if (fileName.endsWith('.pdf')) return "bg-rose-500/10 dark:bg-rose-500/20 shadow-inner border border-rose-500/10";
            if (fileName.endsWith('.docx')) return "bg-blue-500/10 dark:bg-blue-500/20 shadow-inner border border-blue-500/10";
            if (fileName.endsWith('.csv')) return "bg-emerald-500/10 dark:bg-emerald-500/20 shadow-inner border border-emerald-500/10";
            if (fileName.endsWith('.json')) return "bg-amber-500/10 dark:bg-amber-500/20 shadow-inner border border-amber-500/10";
            if (fileName.endsWith('.md')) return "bg-purple-500/10 dark:bg-purple-500/20 shadow-inner border border-purple-500/10";
            return "bg-orange-500/10 dark:bg-orange-500/20 shadow-inner border border-orange-500/10";
        }
        if (type === 'qa' || type === 'text') return "bg-violet-500/10 dark:bg-violet-500/20 shadow-inner border border-violet-500/10";
        return "bg-gray-500/10 shadow-inner";
    };

    const isProcessing = ['crawling', 'embedding', 'processing', 'learning', 'reading', 'pending', 'training', 'embedding_metadata'].includes(status);
    const isTrained = ['trained', 'ready', 'synced', 'active'].includes(status);
    const isFailed = ['failed', 'error'].includes(status);
    const isDraft = ['draft'].includes(status);

    const handleTrainNow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const safeType = type === 'qa' ? 'text' : type;
            const response = await api.post(`/knowledge/${activeOrgId}/source/${safeType}/${getSafeId()}/train`);

            if (response.data.success) {
                setStatus(type === 'website' ? 'crawling' : 'training');
                toast.success("🧠 Training Started!", {
                    description: "AI is now learning from this source."
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to start training");
        }
    };

    return (
        <Card
            onClick={() => type === 'website' && router.push(`/dashboard/ai-studio/brain/${getSafeId()}`)}
            className={`group relative overflow-hidden bg-card/40 backdrop-blur-xl border-white/5 hover:border-white/10 dark:hover:border-primary/30 transition-all duration-500 shadow-sm hover:shadow-xl ${type === 'website' ? 'cursor-pointer' : ''} ${isProcessing ? 'border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-primary/20' : ''} ${isFailed ? 'border-destructive/40 bg-destructive/5' : ''}`}
        >
            {/* Subtle Gradient Glow on Hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none bg-gradient-to-tr ${type === 'website' ? 'from-blue-500 to-transparent' : type === 'file' ? 'from-rose-500 to-transparent' : type === 'api' ? 'from-emerald-500 to-transparent' : 'from-violet-500 to-transparent'}`} />

            <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${renderBgColor()}`}>
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> :
                                isFailed ? <AlertTriangle className="w-5 h-5 text-red-500" /> :
                                    isDraft ? <Clock className="w-5 h-5 text-amber-600" /> : renderIcon()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-[17px] tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300" title={stripHtml(source.domain || source.name || source.title)}>{stripHtml(source.domain || source.name || source.title)}</h3>
                                {isDraft && (
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 py-0 h-[22px] text-[10px] uppercase font-bold tracking-wider">
                                        Draft
                                    </Badge>
                                )}
                            </div>

                            {/* Status Display */}
                            {type === 'website' ? (
                                <div className="flex flex-col gap-1 mt-1">
                                    <p
                                        className={`text-xs font-medium ${isProcessing ? 'text-blue-600 animate-pulse' : isDraft ? 'text-amber-600' : isFailed ? 'text-red-500 cursor-help' : 'text-muted-foreground'}`}
                                        title={isFailed ? statusMessage : undefined} // 🔥 Native tooltip for errors
                                    >
                                        {isFailed ? (statusMessage.length > 80 ? statusMessage.substring(0, 80) + '...' : statusMessage) : statusMessage}
                                    </p>
                                    {/* {isProcessing && (
                                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                                        </div>
                                    )} */}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1 mt-1">
                                    <div
                                        className={`text-xs font-medium ${isProcessing ? 'text-blue-600 animate-pulse' : isDraft ? 'text-amber-600' : isFailed ? 'text-red-500 cursor-help' : 'text-muted-foreground'}`}
                                        title={isFailed ? statusMessage : undefined} // 🔥 Native tooltip for errors
                                    >
                                        {isProcessing || isDraft || isFailed ? (isFailed && statusMessage.length > 60 ? statusMessage.substring(0, 60) + '...' : statusMessage) : (
                                            /* API / URL Sources: Show 'EXTERNAL API' + URL */
                                            // @ts-ignore
                                            ((type === 'api' || source.url || source.metadata?.originalUrl) && type !== 'file') ? (
                                                <div className="flex flex-col items-start gap-0.5 min-w-0">
                                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                                        EXTERNAL API {source.name?.endsWith('.json') ? <span className="text-muted-foreground font-normal normal-case">(Import)</span> : null}
                                                    </span>
                                                    <span className="flex items-center gap-1 w-full" title={source.url || source.metadata?.originalUrl}>
                                                        <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {source.url || source.metadata?.originalUrl || source.name}
                                                        </span>
                                                    </span>
                                                </div>
                                            ) : (
                                                type === 'file' ?
                                                    (source.type === 'application/json' || source.type === 'json' ? <span className="font-mono text-[10px]">JSON SOURCE</span> : source.type?.toUpperCase() || "DOCUMENT")
                                                    : "Manual Entry"
                                            )
                                        )}
                                    </div>
                                    {/* 🔥 NEW: Progress Bar for Files/Text */}
                                    {isProcessing && (
                                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Actions */}
                    {/* Unified Actions Area */}
                    <div className="flex items-center gap-2">
                        {type === 'website' && isTrained && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border-blue-500/20 dark:text-blue-400 font-bold transition-all duration-300"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/dashboard/ai-studio/brain/${getSafeId()}`);
                                }}
                            >
                                <Eye className="w-3.5 h-3.5" />
                                View Pages
                            </Button>
                        )}

                        {/* Primary Action Button (Visible only when Draft or Ready to Refresh) */}
                        {(isDraft || isFailed) && !isProcessing && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20 dark:text-amber-500 font-bold transition-all duration-300"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    isDraft ? handleTrainNow(e) : handleRecrawl(e);
                                }}
                            >
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                {isDraft ? (type === 'website' ? "Crawl Now" : "Train AI") : "Retry"}
                            </Button>
                        )}

                        {/* Secondary Actions Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-secondary/80">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1 backdrop-blur-xl bg-card/90 border-white/10">
                                {/* 1. Edit Metadata */}
                                <DropdownMenuItem className="cursor-pointer" onClick={(e) => {
                                    e.stopPropagation();
                                    const editQuery = type === 'qa' || type === 'text' ? 'knowledge-doc' : type;
                                    router.push(`/dashboard/ai-studio/brain/editor?type=${editQuery}&edit=${getSafeId()}`);
                                }}>
                                    <Pencil className="w-4 h-4 mr-2" /> Edit Details
                                </DropdownMenuItem>

                                {/* 2. Refresh/Recrawl */}
                                {!isDraft && (
                                    (type === 'text' || type === 'file' || type === 'qa') && isTrained ? (
                                        <DropdownMenuItem className="cursor-not-allowed text-muted-foreground bg-white/5 opacity-80" onClick={(e) => { e.stopPropagation(); toast.success("Content is already fully up-to-date! No need to re-train."); }}>
                                            <Zap className="w-4 h-4 mr-2 text-green-500" /> Fully Up-to-Date
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem className="cursor-pointer" onClick={handleRecrawl} disabled={isProcessing}>
                                            <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                                            {type === 'website' ? "Recrawl Site" : "Re-train AI"}
                                        </DropdownMenuItem>
                                    )
                                )}

                                {/* 3. View Snapshot / Preview (Website or File) */}
                                {((type === 'website' && (source.pages?.[0]?.raw_url || source.raw_url)) || (type === 'file' && (source.url || source.file_path) && !source.name?.endsWith('.csv'))) && (
                                    <DropdownMenuItem className="cursor-pointer" onClick={(e) => {
                                        e.stopPropagation();
                                        if (type === 'website') {
                                            const rawPath = source.screenshot_url || source.pages?.[0]?.screenshot_url || source.pages?.[0]?.raw_url || source.raw_url;
                                            let minioUrl = rawPath;
                                            if (rawPath.startsWith('s3://')) {
                                                minioUrl = rawPath.replace('s3://', 'http://localhost:9000/');
                                            } else if (rawPath.startsWith('crawls/')) {
                                                minioUrl = `http://localhost:9000/cluaiz-raw-data/${rawPath}`;
                                            }
                                            if (rawPath.includes('http')) minioUrl = rawPath;
                                            window.open(minioUrl, '_blank');
                                        } else {
                                            window.open(source.url || source.file_path, '_blank');
                                        }
                                    }}>
                                        <Eye className="w-4 h-4 mr-2" /> Live Preview
                                    </DropdownMenuItem>
                                )}

                                {/* 4. Download (Files/JSON) */}
                                {(type === 'file' || (type === 'api' && (source.name?.endsWith('.json') || source.name?.endsWith('.csv')))) && (
                                    <DropdownMenuItem className="cursor-pointer" onClick={handleDownload}>
                                        <Download className="w-4 h-4 mr-2" /> Download File
                                    </DropdownMenuItem>
                                )}

                                <div className="h-[1px] bg-white/5 my-1" />

                                {/* 5. Toggle Active (Universal for all types) */}
                                <div className="flex items-center justify-between px-2 py-1.5 text-sm" onClick={(e) => e.stopPropagation()}>
                                    <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Active Status</span>
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={(checked) => {
                                            setIsActive(checked);
                                            const toggleType = type === 'qa' || type === 'text' ? 'text' : type;
                                            onToggle(toggleType, getSafeId());
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                <div className="h-[1px] bg-white/5 my-1" />

                                {/* 6. Delete (Danger Zone) */}
                                <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10" onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(type === 'qa' || type === 'text' ? 'text' : type, getSafeId());
                                }}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Source
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Tags */}
                {source.tags && source.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {source.tags.map((tag: string, idx: number) => {
                            // Premium Silicon Valley Status Badge Colors
                            const lower = (tag || "").toLowerCase();
                            let colorClass = "bg-primary/10 text-primary border-primary/20 dark:bg-white/5 dark:text-white/70 dark:border-white/10"; // Default

                            if (['agentic ai', 'ai capabilities', 'real-time processing', 'ai intent generation'].some(k => lower.includes(k)))
                                colorClass = "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]";
                            else if (['invoice', 'bill', 'receipt', 'tax', 'finance', 'cost', 'price'].some(k => lower.includes(k)))
                                colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
                            else if (['agreement', 'contract', 'nda', 'legal', 'policy'].some(k => lower.includes(k)))
                                colorClass = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20";
                            else if (['api', 'code', 'react', 'node', 'python', 'json', 'xml', 'tech'].some(k => lower.includes(k)))
                                colorClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
                            else if (['design', 'brand', 'ui', 'ux', 'creative'].some(k => lower.includes(k)))
                                colorClass = "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20";

                            return (
                                <Badge key={idx} variant="outline" className={`text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-md backdrop-blur-md transition-colors ${colorClass}`}>
                                    {tag.toUpperCase()}
                                </Badge>
                            );
                        })}
                    </div>
                )}

                {/* Description / Content Preview */}
                {(source.description || source.content || source.summary || source.intent_summary || source.preview) && (
                    <div className="space-y-3 mb-4">
                        {(source.description || source.content || source.preview || source.summary) && (
                            <p className={`text-sm text-foreground/80 leading-relaxed italic ${type === 'qa' || type === 'text' ? 'line-clamp-6' : 'line-clamp-3'}`}>
                                "{stripHtml(source.description || source.summary || source.preview || source.content)}"
                            </p>
                        )}
                        {(source.intent_summary || source.intent) && (
                            <div className="relative overflow-hidden p-3.5 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/10 dark:to-transparent border border-primary/20 rounded-xl shadow-inner mt-4 group">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
                                <span className="text-[10px] font-bold text-primary dark:text-primary uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <Zap className="w-3.5 h-3.5" /> AI Intent
                                </span>
                                <p className="text-xs text-foreground/70 italic leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                                    {stripHtml(source.intent_summary || source.intent)}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-white/5 mt-4">
                    {type === 'website' ? (
                        <>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 rounded-md flex items-center gap-1.5 transition-all"
                                >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    {source.pages?.length || 0} Pages
                                </Button>
                                <span className="flex items-center gap-1.5 font-medium px-2 py-1 bg-white/5 rounded-md"><Database className="w-3.5 h-3.5" /> {source.chunk_count || source.pages?.reduce((acc: number, p: any) => acc + (p.chunk_count || 0), 0) || 0} Neural Nodes</span>
                                <span className="flex items-center gap-1.5 font-medium px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md shadow-sm"><Zap className="w-3.5 h-3.5" /> {(source.token_count || source.pages?.reduce((acc: number, p: any) => acc + (p.token_count || 0), 0) || 0).toLocaleString()} Tokens</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 border border-gray-500/20'}`}>{isActive ? "Active" : "Inactive"}</span>
                                <span className="flex items-center gap-1.5 font-medium">
                                    <Clock className="w-3.5 h-3.5" />
                                    {source.crawl_schedule === 'daily' ? '24h' : source.crawl_schedule === 'weekly' ? '7d' : source.crawl_schedule || '7d'}
                                </span>
                            </div>
                        </>
                    ) : (type === 'api' && !(source.name?.endsWith('.json') || source.name?.endsWith('.csv'))) ? (
                        /* 🔥 API Specific Footer (Premium Status) - ONLY For Live APIs */
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-md">
                                <span className="relative flex h-2.5 w-2.5">
                                    {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                </span>
                                <span className={`text-xs font-semibold tracking-wide uppercase ${isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                    {isActive ? "Live Connected" : "Paused"}
                                </span>
                            </div>

                            <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase" title="Last Synced">
                                <Clock className="w-3.5 h-3.5" />
                                {source.lastSynced ? new Date(source.lastSynced).toLocaleDateString() : 'Never'}
                            </span>
                        </div>
                    ) : (
                        /* Default File/Text Footer (AND Static API Imports) */
                        <>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 font-medium px-2 py-1 bg-white/5 rounded-md"><Database className="w-3.5 h-3.5" /> {source.chunk_count || 0} Neural Nodes</span>
                                <span className="flex items-center gap-1.5 font-medium px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md shadow-sm"><Zap className="w-3.5 h-3.5" /> {(source.token_count || 0).toLocaleString()} Tokens</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 border border-gray-500/20'}`}>{isActive ? "Active" : "Inactive"}</span>
                                {(type === 'qa' || type === 'text') && source.priority && (
                                    <Badge variant="outline" className="text-[10px] h-[22px] rounded-md tracking-wider uppercase font-semibold">{source.priority}</Badge>
                                )}
                            </div>
                        </>
                    )}
                </div>
                {/* 🔥 Collapsible Page List (Website only) */}
                {type === 'website' && isExpanded && source.pages && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                            <Globe className="w-3 h-3 text-primary" /> Crawled Map
                        </div>
                        <div className="grid gap-2 overflow-hidden">
                            {source.pages.map((page: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-500/5 hover:bg-neutral-500/10 border border-transparent hover:border-white/5 transition-all group/page">
                                    <div className="flex flex-col gap-0.5 truncate pr-4">
                                        <span className="text-[11px] font-semibold text-foreground/90 truncate group-hover/page:text-primary transition-colors">
                                            {page.title || "Untitled Page"}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-mono truncate">
                                            {page.url}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${page.status === 'trained' || page.status === 'completed' || page.status === 'active'
                                                ? 'bg-green-500/10 text-green-500'
                                                : page.status === 'failed'
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {page.status || 'pending'}
                                            </span>
                                            <span className="text-[9px] font-mono text-muted-foreground">
                                                {(page.token_count || 0).toLocaleString()} tokens
                                            </span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/page:opacity-100 transition-opacity" onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(page.url, '_blank');
                                        }}>
                                            <ExternalLink className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Refresh Confirmation Dialog */}
            <AlertDialog open={showRefreshConfirm} onOpenChange={setShowRefreshConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-5 h-5" /> Confirm Refresh?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Refreshing will check this {type === 'website' ? 'website' : type === 'file' ? 'file' : 'content'} for updates.
                            <br /><br />
                            {/* Show current size info */}
                            {type === 'website' && (
                                <span className="block text-sm mb-2">
                                    <strong>Current Size:</strong> {source.pages?.length || 0} pages, ~{((source.token_count || 0) / 1000).toFixed(1)}k words
                                </span>
                            )}
                            {type === 'file' && (
                                <span className="block text-sm mb-2">
                                    <strong>Current Size:</strong> ~{((source.token_count || 0) / 1000).toFixed(1)}k words
                                </span>
                            )}
                            <span className="block p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-700 dark:text-blue-400 text-sm">
                                <span className="font-semibold flex items-center gap-1.5 mb-1"><Zap className="w-3.5 h-3.5" /> Smart Token Billing</span>
                                Max cost if fully replaced: <strong>~{Math.ceil((source.token_count || source.pages?.reduce((acc: number, p: any) => acc + (p.token_count || 0), 0) || 1000) * 1.0)} tokens</strong>.
                                <br />
                                <span className="text-xs opacity-80 mt-1 block">
                                    *Smart Diff active: Unchanged content will be skipped and cost <strong>0 tokens</strong>.
                                </span>
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRefresh}>Yes, Refresh</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card >
    );
}

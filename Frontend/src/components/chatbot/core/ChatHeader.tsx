import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    X,
    Filter,
    FilterX,
    Sparkles,
    Phone,
    PhoneCall,
    Image,
    Video,
    Music,
    Globe,
    File,
    MapPin,
    Calendar,
    BarChart,
    FileText as FileTextIcon,
    ShoppingBag,
    Zap,
    Tag,
    User as UserIcon,
    Bot as BotIcon
} from 'lucide-react';
import { Bot } from '@/components/animate-ui/icons/bot';
import { BotOff } from '@/components/animate-ui/icons/bot-off';
import { PhoneCall as AnimatedPhoneCall } from '@/components/animate-ui/icons/phone-call';
import { Search as AnimatedSearch } from '@/components/animate-ui/icons/search';
import { SlidersHorizontal as AnimatedSliders } from '@/components/animate-ui/icons/sliders-horizontal';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGatekeeperStore } from '@/store/gatekeeperStore';
import { useOrg } from '@/context/OrgContext';
import { DataManagementModal } from '../profile-details/DataManagementModal';
import { useState } from 'react';
import { DeviceService } from '@/services/device.service';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';

// Helper Component for Filter Options
const FilterOption = ({ item, active, onClick }: { item: any; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold transition-all",
            active
                ? "bg-emerald-500/10 text-emerald-500"
                : "text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5"
        )}
    >
        <div className="flex items-center gap-2">
            <item.icon size={14} className={active ? "text-emerald-500" : "text-zinc-400"} />
            {item.label}
        </div>
        {active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
    </button>
);

// 🟢 Helper to generate Segmented Ring Gradient (Shared Logic)
const getStatusGradient = (count: number) => {
    if (count <= 1) return 'linear-gradient(to top right, #FF0080, #7928CA)';
    const gap = 4; // Slightly larger gap for small avatar visibility
    const totalGap = gap * count;
    const segment = (360 - totalGap) / count;
    let gradient = 'conic-gradient(';
    let currentAngle = 0;
    for (let i = 0; i < count; i++) {
        gradient += `#FF0080 ${currentAngle}deg ${currentAngle + segment}deg`;
        currentAngle += segment;
        if (i < count - 1) {
            gradient += `, transparent ${currentAngle}deg ${currentAngle + gap}deg, `;
            currentAngle += gap;
        } else {
            gradient += `, transparent ${currentAngle}deg ${currentAngle + gap}deg`;
        }
    }
    gradient += ')';
    return gradient;
};

interface ChatHeaderProps {
    isAssistantMode: boolean;
    userName: string;
    userLocation?: string;
    isConnected: boolean;
    isSearchActive: boolean;
    setIsSearchActive: (active: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filterType: string | null;
    setFilterType: (type: string | null) => void;
    isFilterOpen: boolean;
    setIsFilterOpen: (open: boolean) => void;
    viewMode: 'widget' | 'dashboard';
    callStatus: string;
    callerNumber: string;
    conversationId?: string;
    orgId: string;
    startCall: (name: string, phone: string, avatar: string) => void;
    incomingCall: (name: string, phone: string, avatar: string) => void;
    mode: 'ai' | 'human';
    onToggleMode?: (mode: 'ai' | 'human') => void; // 🔄 New Prop
    onClose?: () => void;
    onToggleAssistant?: () => void;
    onToggleContext?: () => void; // 🔄 Add missing prop
    onOpenDossier?: () => void;
    // 🟢 Status Props
    hasActiveStatus?: boolean;
    statusCount?: number; // 🟢 New
    onAvatarClick?: () => void;
    // ✍️ Typing Props
    isTyping?: boolean;
    // 👤 User Metadata
    userEmail?: string;
    userPhone?: string;
    // 🏢 Business Branding
    businessName?: string;
    agentName?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    isAssistantMode,
    userName,
    userLocation,
    isConnected,
    isSearchActive,
    setIsSearchActive,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    isFilterOpen,
    setIsFilterOpen,
    viewMode,
    callStatus,
    callerNumber,
    conversationId,
    orgId,
    startCall,
    incomingCall,
    onClose,
    mode, // 🔄 Destructure missing prop
    onToggleMode, // 🔄 Destructure
    onToggleAssistant,
    onToggleContext, // 🔄 Destructure missing prop
    onOpenDossier,
    hasActiveStatus,
    statusCount = 0, // Default 0
    onAvatarClick,
    userEmail,
    userPhone,
    businessName,
    agentName,
    isTyping = false
}) => {
    const isWidget = viewMode === 'widget';
    const [showDataModal, setShowDataModal] = useState(false);

    // Get Device & Role for Deletion Management
    const deviceId = typeof window !== 'undefined' ? (localStorage.getItem('cluaiz_device_id') || 'guest_device') : 'guest_device';
    const isolatedId = `${deviceId}_${isWidget ? 'user' : 'agent'}`;

    const handleContextMenu = (e: React.MouseEvent) => {
        // 🔐 Only allow Data Management in Dashboard (Admin), not Widget (User)
        if (!isWidget) {
            e.preventDefault();
            setShowDataModal(true);
        }
    };

    // 🔐 Access Control Integration
    const { activeOrg } = useOrg();
    const { open: openGatekeeper } = useGatekeeperStore();
    const isStrictMode = activeOrg?.access_control?.mode === 'strict';

    const handleStartCallClick = (name: string, id: string, avatar: string) => {
        // Check if we need verification
        const verified = sessionStorage.getItem('cluaiz_gatekeeper_verified');

        if (isStrictMode && !verified) {
            // Open gatekeeper modal
            openGatekeeper(`Verify to call ${name}`, (userData) => {
                // Start call after verification
                startCall(name, id, avatar);
            });
        } else {
            // Direct call (Guest Mode or already verified)
            startCall(name, id, avatar);
        }
    };

    return (
        <>
            <div
                onContextMenu={handleContextMenu}
                className="flex items-center justify-between px-6 py-3 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl z-30 select-none transition-colors duration-500 relative"
            >
                {/* ... existing header content ... */}
                <div className="flex items-center gap-4">
                    {/* 🟢 Avatar -> Opens Status (if active) or Fallback */}
                    <div
                        className={cn(
                            "relative flex-shrink-0 cursor-pointer transition active:scale-95 group/avatar",
                            onAvatarClick ? "hover:opacity-80" : ""
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onAvatarClick) onAvatarClick();
                            else if (!isAssistantMode && (onOpenDossier || onToggleContext)) (onOpenDossier || onToggleContext)!();
                        }}
                    >
                        <div className={cn(
                            "rounded-full p-[2px] transition-all duration-300 relative",
                            hasActiveStatus ? "bg-transparent" : "bg-transparent"
                        )}>
                            {hasActiveStatus && !(!isWidget && !isAssistantMode) && (
                                <div
                                    className="absolute -inset-[3px] rounded-full animate-spin-slow"
                                    style={{
                                        background: getStatusGradient(statusCount),
                                        mask: 'radial-gradient(transparent 68%, black 69%)',
                                        WebkitMask: 'radial-gradient(transparent 68%, black 69%)'
                                    }}
                                ></div>
                            )}
                            {hasActiveStatus && statusCount <= 1 && !(!isWidget && !isAssistantMode) && (
                                <div className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-[#FF0080] via-[#FF0080] to-[#FF0080] animate-pulse -z-10 opacity-50"></div>
                            )}

                            <Avatar className={cn(
                                "w-10 h-10 border-2 transition-colors border-white dark:border-[#121212] z-10",
                                isAssistantMode && !hasActiveStatus ? "border-emerald-500/50 bg-emerald-500/10" : ""
                            )}>
                                <AvatarImage src={isWidget ? (businessName ? '/logo.png' : '/favicon.ico') : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} />
                                <AvatarFallback className="bg-zinc-800 text-zinc-500">
                                    {isAssistantMode ? '✨' : (isWidget ? 'AI' : (userName.charAt(0)))}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-[#121212] rounded-full z-20 transition-colors",
                            isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-zinc-500"
                        )}></div>
                    </div>

                    <div
                        className={cn(
                            "flex flex-col relative z-20",
                            (!isAssistantMode && (onOpenDossier || onToggleContext)) ? "cursor-pointer group/name" : ""
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isAssistantMode && (onOpenDossier || onToggleContext)) {
                                (onOpenDossier || onToggleContext)!();
                            }
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "font-bold text-sm text-zinc-800 dark:text-zinc-100 transition-colors",
                                (!isAssistantMode && (onOpenDossier || onToggleContext)) ? "group-hover/name:text-primary" : ""
                            )}>
                                {!isWidget
                                    ? userName
                                    : (mode === 'ai' ? (businessName || 'Cluaiz AI') : (agentName || 'Aryan'))
                                }
                            </span>
                            {isAssistantMode && (
                                <Badge variant="outline" className="h-5 px-1.5 text-[9px] gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                                    <Sparkles size={8} /> BETA
                                </Badge>
                            )}
                            {!isAssistantMode && callStatus === 'connected' && (
                                <Badge variant="outline" className="h-5 px-1.5 text-[9px] gap-1 border-green-500/20 bg-green-500/10 text-green-500 animate-pulse">
                                    <PhoneCall size={8} /> LIVE
                                </Badge>
                            )}
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 min-h-[1.1rem]">
                            <div className="flex items-center gap-1.5">
                                {isConnected ? (
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                                        <span className="text-[9px] uppercase font-black tracking-widest text-emerald-500/80">
                                            {isTyping ? 'Typing' : 'Online'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                                        <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Offline</span>
                                    </div>
                                )}

                                {isTyping && (
                                    <div className="flex -ml-1 gap-0.5 mt-[1px]">
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-0.5 h-0.5 bg-emerald-500 rounded-full" />
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-0.5 h-0.5 bg-emerald-500 rounded-full" />
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-0.5 h-0.5 bg-emerald-500 rounded-full" />
                                    </div>
                                )}

                                <div className="w-[1px] h-2 bg-zinc-300 dark:bg-zinc-800 shrink-0" />

                                <span className="text-[9px] font-bold opacity-60 uppercase tracking-tight flex items-center gap-1.5">
                                    {isWidget
                                        ? (mode === 'ai' ? 'Cluaiz AI' : (
                                            <>
                                                <span>{agentName || 'Aryan'} | Team</span>
                                            </>
                                        ))
                                        : (isAssistantMode ? 'Cluaiz AI' : (mode === 'ai' ? 'AI HANDLER' : 'Customer'))
                                    }
                                </span>
                            </div>

                            {/* Metadata below or next to it (Dashboard Mode) */}
                            {!isWidget && !isAssistantMode && (
                                <div className="flex items-center gap-1.5">
                                    {userPhone && (
                                        <>
                                            <div className="w-[1px] h-2 bg-zinc-300 dark:bg-zinc-800 shrink-0" />
                                            <span className="text-[9px] font-bold truncate max-w-[100px] opacity-70 text-primary">{userPhone}</span>
                                        </>
                                    )}
                                    {userEmail && (
                                        <>
                                            <div className="w-[1px] h-2 bg-zinc-300 dark:bg-zinc-800 shrink-0" />
                                            <span className="text-[9px] font-bold truncate max-w-[150px] opacity-70 text-primary">{userEmail}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end h-10">
                    {/* Call Status Indicator (Handled by CallManager) */}
                    {callStatus !== 'idle' && callStatus !== 'ended' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 animate-pulse mr-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                {callStatus === 'connected' ? 'On Call' : (callStatus === 'ringing' ? 'Incoming' : 'Calling')}
                            </span>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        </div>
                    )}
                    <AnimatePresence mode="wait">
                        {isSearchActive ? (
                            <motion.div
                                key="search-bar"
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="absolute right-4 top-1.5 -translate-y-1/2 z-[60] flex items-center gap-2 w-full max-w-[250px] md:max-w-md bg-white dark:bg-[#121212] shadow-2xl rounded-full px-4 py-2 border border-black/10 dark:border-white/10"
                            >
                                <Search size={16} className="text-zinc-500 shrink-0" />
                                <input
                                    autoFocus
                                    placeholder="Search messages..."
                                    className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-500 min-w-0"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                    <PopoverTrigger asChild>
                                        <button className="p-1.5 text-zinc-500 hover:text-emerald-500 transition-colors shrink-0">
                                            <Badge variant="outline" className={cn("p-0.5 border-none hover:bg-transparent", filterType && "text-emerald-500 animate-pulse")}>
                                                <AnimatedSliders size={16} animateOnHover />
                                            </Badge>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0  bg-white/95 scrollbar-hide dark:bg-[#121212]/95 backdrop-blur-xl border-black/5 dark:border-white/10 rounded-lg shadow-2xl h-[300px] scroll-smooth  overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" align="end">
                                        <div className="text-[10px] pl-2 font-black uppercase tracking-widest text-zinc-500 mb-2 backdrop-blur-xl py-2 border-b  border-black/5 dark:border-white/5 sticky top-0  bg-white/95 dark:bg-[#121212]/95  z-10">Filter Messages</div>

                                        <div className="grid gap-1 p-2">
                                            <div className="px-2 text-[9px] font-bold text-zinc-400 mt-1 mb-0.5 uppercase">Media & Files</div>
                                            {[
                                                { id: 'image', label: 'Images', icon: Image },
                                                { id: 'video', label: 'Videos', icon: Video },
                                                { id: 'audio', label: 'Audio', icon: Music },
                                                { id: 'voice_call', label: 'Voice Calls', icon: PhoneCall },
                                                { id: 'document', label: 'Documents', icon: File },
                                                { id: 'links', label: 'Links', icon: Globe },
                                            ].map((item) => (
                                                <FilterOption
                                                    key={item.id}
                                                    item={item}
                                                    active={filterType === item.id}
                                                    onClick={() => {
                                                        setFilterType(filterType === item.id ? null : item.id);
                                                        setIsFilterOpen(false);
                                                    }}
                                                />
                                            ))}

                                            <div className="px-2 text-[9px] font-bold text-zinc-400 mt-2 mb-0.5 uppercase">Interactions</div>
                                            {[
                                                { id: 'location', label: 'Location', icon: MapPin },
                                                { id: 'booking', label: 'Book Slots', icon: Calendar },
                                                { id: 'poll', label: 'Polls', icon: BarChart },
                                                { id: 'form', label: 'Forms', icon: FileTextIcon },
                                                { id: 'product', label: 'Products', icon: ShoppingBag },
                                                { id: 'quick_reply', label: 'Quick Replies', icon: Zap },
                                                { id: 'offer', label: 'Offers', icon: Tag },
                                            ].map((item) => (
                                                <FilterOption
                                                    key={item.id}
                                                    item={item}
                                                    active={filterType === item.id}
                                                    onClick={() => {
                                                        setFilterType(filterType === item.id ? null : item.id);
                                                        setIsFilterOpen(false);
                                                    }}
                                                />
                                            ))}

                                            <div className="px-2 text-[9px] font-bold text-zinc-400 mt-2 mb-0.5 uppercase">Flow</div>
                                            {[
                                                { id: 'my_sms', label: 'My Messages', icon: UserIcon },
                                                { id: 'incoming_sms', label: 'Channel Messages', icon: BotIcon },
                                            ].map((item) => (
                                                <FilterOption
                                                    key={item.id}
                                                    item={item}
                                                    active={filterType === item.id}
                                                    onClick={() => {
                                                        setFilterType(filterType === item.id ? null : item.id);
                                                        setIsFilterOpen(false);
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {filterType && (
                                            <button
                                                onClick={() => {
                                                    setFilterType(null);
                                                    setIsFilterOpen(false);
                                                }}
                                                className="w-full mt-2 px-3 py-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-500/5 rounded-xl transition-all sticky bottom-0 bg-white/95 dark:bg-[#121212]/95"
                                            >
                                                Clear Filter
                                            </button>
                                        )}
                                    </PopoverContent>
                                </Popover>
                                <button
                                    onClick={() => {
                                        setIsSearchActive(false);
                                        setSearchQuery('');
                                    }}
                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all text-zinc-500 shrink-0"
                                >
                                    <AnimatedX size={16} animateOnHover />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="actions"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-1"
                            >
                                {!isWidget && isAssistantMode && (
                                    <button
                                        onClick={onToggleAssistant}
                                        className="p-2.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-full transition-all group"
                                    >
                                        <Sparkles size={19} className="group-hover:animate-pulse" />
                                    </button>
                                )}

                                {/* 🤖 PREMIUM AI TOGGLE (Requested by User) */}
                                {!isAssistantMode && (
                                    <button
                                        onClick={() => onToggleMode && onToggleMode(mode === 'ai' ? 'human' : 'ai')}
                                        className={cn(
                                            "p-2.5 rounded-full transition-all flex items-center gap-1.5 relative group",
                                            mode === 'ai'
                                                ? "text-emerald-500"
                                                : "text-zinc-500 hover:text-emerald-500"
                                        )}
                                        title={mode === 'ai' ? "AI is ON (Pause to switch to Human)" : "AI is OFF (Resume AI for automation)"}
                                    >
                                        {mode === 'ai' ? <Bot size={20} animateOnHover /> : <BotOff size={20} animateOnHover />}
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        // 🟢 Uses handleStartCallClick which handles Gatekeeper internally
                                        const targetId = isWidget ? orgId : (conversationId || 'Unknown');
                                        handleStartCallClick(userName, targetId, `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`);
                                    }}
                                    className={`p-2.5 rounded-full transition-all ${callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connected'
                                        ? 'text-emerald-500'
                                        : 'text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400'
                                        }`}
                                    title="Start Voice Call"
                                >
                                    {callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connected' ? (
                                        <AnimatedPhoneCall className="text-emerald-500 animate-pulse" size={19} animateOnHover />
                                    ) : (
                                        <AnimatedPhoneCall size={19} animateOnHover />
                                    )}
                                </button>


                                <button
                                    onClick={() => setIsSearchActive(true)}
                                    className="p-2.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-all"
                                >
                                    <AnimatedSearch size={19} animateOnHover />
                                </button>

                                {!isWidget && isAssistantMode && (
                                    <button
                                        onClick={onClose}
                                        className="p-2.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                    >
                                        <X size={19} />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>


            </div>

            {/* 🔥 Phase 4: Data Management Modal (Admin Dashboard Only) */}
            {!isWidget && (
                <DataManagementModal
                    isOpen={showDataModal}
                    onClose={() => setShowDataModal(false)}
                    chatId={conversationId || ""}
                    orgId={orgId}
                    isolatedId={isolatedId}
                />
            )}
        </>
    )
};

"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, HelpCircle, User, Star, Send, Search, ArrowRight, FileText, Mail, Phone, Globe, MapPin } from 'lucide-react';
import defaultData from "@/app/dashboard/ai-studio/bots/tabs/page-designers/default-data.json";
import { botConfigService } from "@/services/bot-config.service";
import { cn } from "@/lib/utils";

// Types defined locally as requested
interface Highlight {
    id: string;
    emoji: string;
    title: string;
    description: string;
    enabled: boolean;
}

interface BrandConfig {
    identity: {
        logo: string;
        logoStyle: string;
        businessName: string;
        tagline: string;
    };
    highlights?: Highlight[];
    ratingFeedback?: {
        enableRating: boolean;
        enableFeedback: boolean;
        formTitle: string;
        feedbackPlaceholder: string;
    };
    contact?: {
        showContact: boolean;
        email?: string;
        phone?: string;
        website?: string;
        address?: string;
        items?: any[];
    };
}

interface HomeConfig {
    hero?: {
        title: string;
        subtitle: string;
        backgroundType: 'gradient' | 'image' | 'solid';
        backgroundImage: string;
    };
    suggestions?: Array<{
        id: string;
        icon: string;
        text: string;
        enabled: boolean;
        order: number;
    }>;
    showGreeting?: boolean;
    showLatestFAQ?: boolean;
    placeholders?: Array<{
        id: string;
        text: string;
        enabled: boolean;
        order: number;
    }>;
}

// 🟢 Helper to generate Segmented Ring Gradient
const getStatusGradient = (count: number) => {
    if (count <= 1) return 'linear-gradient(to top right, #FF0080, #7928CA)'; // Default Single Ring

    const gap = 3; // Gap in degrees
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

interface HomeViewProps {
    onNavigate: (view: string, data?: any) => void;
    setHeaderVisible?: (visible: boolean) => void;
    // 🟢 Status Props
    hasActiveStatus?: boolean;
    statusCount?: number;
    onAvatarClick?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, setHeaderVisible, hasActiveStatus, statusCount = 0, onAvatarClick }) => {
    const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);
    const [homeConfig, setHomeConfig] = useState<HomeConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Rating State
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    // Magic Input & Greeting State
    const [greeting, setGreeting] = useState('');
    const [magicInput, setMagicInput] = useState('');

    useEffect(() => {
        // Initially hide header on mount because we start at top
        if (setHeaderVisible) setHeaderVisible(false);

        // Dynamic Greeting logic
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning! 👋');
        else if (hour < 18) setGreeting('Good afternoon! 👋');
        else setGreeting('Good evening! 👋');

        return () => {
            // Reset header when unmounting
            if (setHeaderVisible) setHeaderVisible(true);
        }
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!setHeaderVisible) return;
        const scrollTop = e.currentTarget.scrollTop;

        // Threshold: 50px. 
        // If we are at top (scrollTop < 50), HIDE header.
        // If we scroll down (scrollTop > 50), SHOW header.
        if (scrollTop > 50) {
            setHeaderVisible(true);
        } else {
            setHeaderVisible(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // Using 'default_bot' for now
                const apiConfig = await botConfigService.getBotConfig('default_bot');

                if (apiConfig) {
                    setBrandConfig((apiConfig.brandConfig as any) || defaultData.brand);
                    setHomeConfig((apiConfig.homeConfig as any) || null);
                } else {
                    setBrandConfig(defaultData.brand);
                }

                setIsLoading(false);
            } catch (e) {
                console.error("HomeView load error", e);
                // Fallback to defaults on error
                setBrandConfig(defaultData.brand);
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Placeholder Typing Effect
    const DEFAULT_PLACEHOLDERS = [
        "Ask anything...",
        "Track my order...",
        "Talk to support...",
        "Product pricing...",
        "How do I return?..."
    ];

    const activePlaceholders = homeConfig?.placeholders
        ? homeConfig.placeholders
            .filter(p => p.enabled)
            .sort((a, b) => a.order - b.order)
            .map(p => p.text)
        : DEFAULT_PLACEHOLDERS;

    const PLACEHOLDERS = activePlaceholders.length > 0 ? activePlaceholders : DEFAULT_PLACEHOLDERS;
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(100);

    useEffect(() => {
        const currentText = PLACEHOLDERS[placeholderIndex];

        const handleTyping = () => {
            if (!isDeleting) {
                // Typing
                setDisplayedPlaceholder(currentText.substring(0, displayedPlaceholder.length + 1));
                setTypingSpeed(100); // Normal typing speed

                if (displayedPlaceholder === currentText) {
                    // Finished typing, pause before deleting
                    setTimeout(() => setIsDeleting(true), 2000);
                }
            } else {
                // Deleting
                setDisplayedPlaceholder(currentText.substring(0, displayedPlaceholder.length - 1));
                setTypingSpeed(50); // Faster deleting

                if (displayedPlaceholder === "") {
                    // Finished deleting, move to next word
                    setIsDeleting(false);
                    setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
                }
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayedPlaceholder, isDeleting, placeholderIndex, typingSpeed]);

    // Quick Suggestions
    const DEFAULT_SUGGESTIONS = [
        { icon: "📦", text: "Order Status", enabled: true },
        { icon: "💳", text: "Pricing", enabled: true },
        { icon: "💁", text: "Support", enabled: true },
        { icon: "❗", text: "How it Work", enabled: true },
    ];

    const displaySuggestions = homeConfig?.suggestions
        ? homeConfig.suggestions.filter(s => s.enabled)
        : DEFAULT_SUGGESTIONS;

    // Contact Icons Map
    const CONTACT_ICONS_MAP: Record<string, { Icon: any; color: string }> = {
        email: { Icon: Mail, color: 'text-blue-500' },
        phone: { Icon: Phone, color: 'text-green-500' },
        website: { Icon: Globe, color: 'text-purple-500' },
        address: { Icon: MapPin, color: 'text-orange-500' },
        location: { Icon: MapPin, color: 'text-red-500' }
    };

    const handleMagicInputSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (magicInput.trim()) {
            onNavigate('chat', magicInput); // Pass text to chat
        } else {
            onNavigate('chat');
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-sm text-slate-500">Loading Home...</div>;
    }

    const { identity, highlights, ratingFeedback, contact } = brandConfig || {};

    return (
        <div
            className="h-full  overflow-y-auto bg-slate-50 dark:bg-slate-950 animate-fadeIn relative pb-4 no-scrollbar scroll-smooth"
            onScroll={handleScroll}
        >

            {/* 1. Identity Cover (World Class Header) */}
            <div className="relative mb-2">
                {/* Mesh Gradient Cover - Flush with edges */}
                <div className="h-32 w-full bg-gradient-to-br from-[var(--primary-color)] via-[var(--secondary-color)] to-[var(--primary-color)] rounded-b-[2rem] shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-overlay"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute top-10 right-10 w-20 h-20 bg-purple-400/20 rounded-full blur-xl"></div>
                </div>

                {/* Floating Avatar */}
                <div className="  -mt-10 left-0 right-0 flex flex-col items-center">
                    <div className="relative">

                        {/* Main Avatar */}
                        <div
                            className={cn(
                                "relative z-10 p-1.5 bg-white dark:bg-slate-900 rounded-full shadow-xl transition-all duration-300",
                                onAvatarClick ? "cursor-pointer active:scale-95" : ""
                            )}
                            onClick={onAvatarClick}
                        >
                            {/* 🟢 Dynamic Status Ring */}
                            {hasActiveStatus && (
                                <div
                                    className="absolute -inset-[3px] rounded-full animate-spin-slow"
                                    style={{
                                        background: getStatusGradient(statusCount),
                                        // Mask to make it a ring (donut)
                                        mask: 'radial-gradient(transparent 66%, black 67%)',
                                        WebkitMask: 'radial-gradient(transparent 66%, black 67%)'
                                    }}
                                ></div>
                            )}
                            {/* Fallback Backup Ring for Single (if mask fails or just style preference) */}
                            {hasActiveStatus && statusCount <= 1 && (
                                <div className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-[#FF0080] via-[#FF0080] to-[#FF0080] animate-pulse -z-10 opacity-50"></div>
                            )}

                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--primary-color)]/10 to-[var(--secondary-color)]/10 dark:from-slate-800 dark:to-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-50 dark:border-slate-800 z-10">
                                {identity?.logo ? (
                                    <img src={identity.logo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-6xl font-bold bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] bg-clip-text text-transparent">
                                        {identity?.businessName ? identity.businessName.substring(0, 1).toUpperCase() : 'B'}
                                    </span>
                                )}
                            </div>

                            {/* Online Badge (Hide if Status Active, or keep as indicator) */}
                            {!hasActiveStatus && (
                                <>
                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full z-20 " title="Online now" />
                                    <div className="absolute bottom-1 right-1 inset-0 rounded-full bg-green-400/10 animate-ping duration-1000" />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Info (Name & Tagline) */}
            <div className="mt-4 text-center px-6 mb-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 leading-tight">
                    {homeConfig?.hero?.title || identity?.businessName || 'Cluaiz Assistant'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {homeConfig?.hero?.subtitle || identity?.tagline || 'Online • Typically replies in seconds'}
                </p>
            </div>

            {/* Greeting */}
            {(homeConfig?.showGreeting ?? true) && (
                <div className="text-center px-6 mb-4">
                    <h2 className="text-sm font-semibold text-[var(--primary-color)] dark:text-[var(--primary-color)] opacity-80 tracking-wide uppercase">
                        {greeting.replace('👋', '')} <span className="animate-wave">👋</span>
                    </h2>
                </div>
            )}

            {/* 2. Magic Input (The Hook) & Suggestions */}
            <div className="px-6 mb-8 relative z-20">
                <form onSubmit={handleMagicInputSubmit} className="relative group mb-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-color)]/20 to-[var(--secondary-color)]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 overflow-hidden transform group-hover:scale-[1.01] transition-transform duration-300">
                        <Search className="w-5 h-5 text-slate-400 ml-4 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder={displayedPlaceholder}
                            value={magicInput}
                            onChange={(e) => setMagicInput(e.target.value)}
                            className="w-full py-4 px-3 bg-transparent text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 text-sm font-medium"
                        />
                        <button type="submit" className="mr-2 p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-[var(--primary-color)] hover:text-white transition-all">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </form>

                {/* Suggestion Chips - Marquee or Centered */}
                <div className="w-full overflow-hidden">
                    {displaySuggestions.length > 3 ? (
                        <div className="relative flex overflow-x-hidden group">
                            <div className="animate-marquee whitespace-nowrap flex gap-2 group-hover:[animation-play-state:paused]">
                                {displaySuggestions.map((s, i) => (
                                    <button
                                        key={`orig-${i}`}
                                        onClick={() => onNavigate('chat', s.text)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 transition-all"
                                    >
                                        <span>{s.icon}</span>
                                        <span>{s.text}</span>
                                    </button>
                                ))}
                                {/* Duplicate for seamless loop */}
                                {displaySuggestions.map((s, i) => (
                                    <button
                                        key={`dup-${i}`}
                                        onClick={() => onNavigate('chat', s.text)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 transition-all"
                                    >
                                        <span>{s.icon}</span>
                                        <span>{s.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2 justify-center pb-1">
                            {displaySuggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => onNavigate('chat', s.text)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 transition-all whitespace-nowrap animate-slideUp"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <span>{s.icon}</span>
                                    <span>{s.text}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Bento Grid (Actions) */}
            <div className="px-6 mb-8">
                <div className="grid grid-cols-2 grid-rows-2 gap-4 h-64">
                    {/* Big Card: About Us (Left, Spans 2 Rows) */}
                    <button
                        onClick={() => onNavigate('profile')}
                        className="row-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 flex flex-col justify-between shadow-lg shadow-indigo-500/30 group hover:shadow-indigo-500/50 transition-all duration-300 hover:-translate-y-1"
                    >
                        {/* Background Watermark Icon */}
                        <div className="absolute top-0 right-0 opacity-10 scale-[2.5] transform translate-x-4 -translate-y-4 rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                            <User size={100} fill="currentColor" className="text-white" />
                        </div>

                        <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-4 group-hover:rotate-12 transition-transform duration-300">
                            <User size={36} fill="currentColor" className="text-white" />
                        </div>
                        <div className="relative z-10 text-left">
                            <h3 className="text-xl font-bold text-white mb-1">About Us</h3>
                            <p className="text-indigo-100 text-xs font-medium leading-relaxed">Discover our story & mission.</p>
                        </div>
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    </button>

                    {/* Small Card: Help Center (Top Right) */}
                    <button
                        onClick={() => onNavigate('faq')}
                        className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 flex flex-col justify-center items-start shadow-md hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800/30 transition-all duration-300 group hover:-translate-y-1"
                    >
                        <div className="absolute top-2 right-2 opacity-5 scale-150 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                            <HelpCircle size={60} />
                        </div>
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                            <HelpCircle size={20} />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Help Center</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Browse FAQs</span>
                    </button>

                    {/* Small Card: Contact (Bottom Right) */}
                    <button
                        onClick={() => onNavigate('contact')}
                        className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 flex flex-col justify-center items-start shadow-md hover:shadow-xl hover:border-pink-200 dark:hover:border-pink-800/30 transition-all duration-300 group hover:-translate-y-1"
                    >
                        <div className="absolute top-2 right-2 opacity-5 scale-150 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                            <FileText size={60} />
                        </div>
                        <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-xl flex items-center justify-center text-pink-600 dark:text-pink-400 mb-2 group-hover:scale-110 transition-transform">
                            <FileText size={20} />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Contact Us</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Drop a line</span>
                    </button>
                </div>
            </div>

            {/* 4. Highlights (Subtle Section) */}
            {highlights && highlights.length > 0 && highlights.some((h: any) => h.enabled) && (
                <div className="px-6 mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Highlights</h3>
                    <div className="space-y-3">
                        {highlights.filter((h: any) => h.enabled).map((highlight: any) => (
                            <div
                                key={highlight.id}
                                className="group flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <div className="text-xl bg-slate-50 dark:bg-slate-800 w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform">
                                    {highlight.emoji}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white text-sm">
                                        {highlight.title}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {highlight.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Latest FAQs (Conditional) */}
            {homeConfig?.showLatestFAQ && (
                <div className="px-6 mb-8">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Popular Questions</h3>
                        <button onClick={() => onNavigate('faq')} className="text-xs text-blue-500 hover:underline">View all</button>
                    </div>
                    <div className="space-y-2">
                        {defaultData.faq.items.slice(0, 4).map((faq) => (
                            <button
                                key={faq.id}
                                onClick={() => onNavigate('faq')}
                                className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors shadow-sm flex items-center justify-between group"
                            >
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                    {faq.question}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. Rating & Feedback (Peach Card - Restored) */}
            {ratingFeedback && (ratingFeedback.enableRating || ratingFeedback.enableFeedback) && (
                <div className="px-6 pb-6 pt-2">
                    <div className="bg-[#FFF8F5] dark:bg-slate-900/50 rounded-3xl p-6 border border-orange-100/50 dark:border-orange-900/10 text-center shadow-sm">

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                            {ratingFeedback.formTitle || 'Rate Your Experience'}
                        </h3>
                        <p className="text-xs text-slate-500 mb-6 font-medium">We value your feedback!</p>

                        {/* Star Rating */}
                        {ratingFeedback.enableRating && (
                            <div className="flex justify-center gap-3 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none transform transition-transform active:scale-90 hover:scale-110"
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-all duration-300 ${star <= (hoverRating || rating)
                                                ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                                : 'text-slate-200 dark:text-slate-700 fill-slate-100 dark:fill-slate-800'
                                                }`}
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Integrated Feedback Form */}
                        {ratingFeedback.enableFeedback && (
                            <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-sm border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all group">
                                <textarea
                                    placeholder={ratingFeedback.feedbackPlaceholder || "How can we improve?"}
                                    rows={3}
                                    className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none resize-none text-slate-800 dark:text-white placeholder:text-slate-400"
                                />
                                <div className="flex justify-end p-2">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 active:scale-95 transform">
                                        Send <Send className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Contact Info */}
            {contact?.showContact && (
                <div className="px-4 py-4">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Dynamic Contact Items */}
                        {Array.isArray(contact?.items) && contact?.items
                            .filter((item: any) => item.enabled && item.value)
                            .map((item: any) => {
                                const { Icon, color } = CONTACT_ICONS_MAP[item.type] || { Icon: MapPin, color: 'text-slate-500' };
                                const isLink = ['email', 'phone', 'website', 'location'].includes(item.type);

                                const getHref = () => {
                                    if (item.type === 'email') return `mailto:${item.value}`;
                                    if (item.type === 'phone') return `tel:${item.value}`;
                                    if (item.type.includes('http')) return item.value;
                                    return item.value.startsWith('http') ? item.value : `https://${item.value}`;
                                };

                                const content = (
                                    <>
                                        <Icon className={`w-4 h-4 ${color}`} />
                                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.value}</span>
                                    </>
                                );

                                if (isLink && item.type !== 'location') {
                                    return (
                                        <a
                                            key={item.id}
                                            href={getHref()}
                                            target={item.type === 'website' ? '_blank' : undefined}
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors`}
                                        >
                                            {content}
                                        </a>
                                    );
                                }

                                return (
                                    <div key={item.id} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        {content}
                                    </div>
                                );
                            })}

                        {/* Fallback for Legacy Data */}
                        {!Array.isArray(contact?.items) && (
                            <>
                                {contact?.email && (
                                    <a href={`mailto:${contact?.email}`} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{contact?.email}</span>
                                    </a>
                                )}
                                {contact?.phone && (
                                    <a href={`tel:${contact?.phone}`} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Phone className="w-4 h-4 text-green-500" />
                                        <span className="text-xs text-slate-700 dark:text-slate-300">{contact?.phone}</span>
                                    </a>
                                )}
                                {contact?.website && (
                                    <a href={contact?.website} target="_blank" className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Globe className="w-4 h-4 text-purple-500" />
                                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">Website</span>
                                    </a>
                                )}
                                {contact?.address && (
                                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <MapPin className="w-4 h-4 text-orange-500" />
                                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{contact?.address}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}


            {/* 6. Powered By Footer (Scrollable) */}
            <div className="text-center py-2 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                <a
                    href="https://cluaiz.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-slate-400 font-medium hover:text-[var(--primary-color)] transition-colors flex items-center justify-center gap-1"
                >
                    Powered by <span className="font-bold">Cluaiz AI</span>
                </a>
            </div>
        </div>
    );
};

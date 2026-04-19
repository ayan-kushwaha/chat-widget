"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Save, Upload, Plus, Trash2, GripVertical, Eye, EyeOff,
    Users, Award, Calendar, Trophy, Star, TrendingUp, Target, Zap,
    Heart, Shield, CheckCircle, Clock, MessageCircle, Mail,
    Phone, Globe, MapPin, Briefcase, Sparkles, Rocket, Gift,
    ThumbsUp, Lightbulb, BadgeCheck, Download, Edit, MousePointer2, MessageSquare, X, AlertCircle, ChevronDown,
    Scissors, Link, Activity, BarChart, PieChart, Settings, Search, Home, Menu, Smile, Frown, Meh, ThumbsDown,
    Volume2, Video, Image, Music, File, Folder, Tag, Bookmark, Flag, Bot, Smartphone, Tablet, Monitor, Cpu, Database, Wifi, Signal
} from "lucide-react";
import {
    FaLinkedin, FaXTwitter, FaInstagram, FaFacebook, FaYoutube,
    FaWhatsapp, FaTelegram, FaGithub, FaTwitch, FaDiscord, FaGlobe
} from "react-icons/fa6";
import { CustomTimePicker } from "@/components/ui/custom-time-picker";

interface AboutPageDesignerProps {
    config: any;
    orgId: string;
}

// Available icons for stats
const STAT_ICONS = [
    { value: 'users', label: 'Users', Icon: Users },
    { value: 'award', label: 'Award', Icon: Award },
    { value: 'calendar', label: 'Calendar', Icon: Calendar },
    { value: 'trophy', label: 'Trophy', Icon: Trophy },
    { value: 'star', label: 'Star', Icon: Star },
    { value: 'trending', label: 'Trending', Icon: TrendingUp },
    { value: 'target', label: 'Target', Icon: Target },
    { value: 'zap', label: 'Zap', Icon: Zap },
    { value: 'heart', label: 'Heart', Icon: Heart },
    { value: 'shield', label: 'Shield', Icon: Shield },
    { value: 'check', label: 'Check', Icon: CheckCircle },
    { value: 'clock', label: 'Clock', Icon: Clock },
    { value: 'message', label: 'Message', Icon: MessageCircle },
    { value: 'bot', label: 'Bot / AI', Icon: Bot },
    { value: 'cut', label: 'Cut / Scissors', Icon: Scissors },
    { value: 'briefcase', label: 'Briefcase', Icon: Briefcase },
    { value: 'rocket', label: 'Rocket', Icon: Rocket },
    { value: 'gift', label: 'Gift', Icon: Gift },
    { value: 'thumbsup', label: 'Thumbs Up', Icon: ThumbsUp },
    { value: 'lightbulb', label: 'Lightbulb', Icon: Lightbulb },
    { value: 'badgecheck', label: 'Verified', Icon: BadgeCheck },
    { value: 'download', label: 'Download', Icon: Download },
    { value: 'link', label: 'Link', Icon: Link },
    { value: 'activity', label: 'Activity', Icon: Activity },
    { value: 'chart', label: 'Chart', Icon: BarChart },
    { value: 'pie', label: 'Pie Chart', Icon: PieChart },
    { value: 'settings', label: 'Settings', Icon: Settings },
    { value: 'search', label: 'Search', Icon: Search },
    { value: 'home', label: 'Home', Icon: Home },
    { value: 'menu', label: 'Menu', Icon: Menu },
    { value: 'smile', label: 'Smile', Icon: Smile },
    { value: 'file', label: 'File', Icon: File },
    { value: 'folder', label: 'Folder', Icon: Folder },
    { value: 'tag', label: 'Tag', Icon: Tag },
    { value: 'bookmark', label: 'Bookmark', Icon: Bookmark },
    { value: 'flag', label: 'Flag', Icon: Flag },
    { value: 'wifi', label: 'Wifi', Icon: Wifi },
    { value: 'database', label: 'Database', Icon: Database },
    { value: 'cpu', label: 'Technology', Icon: Cpu }
];

// Color presets
const COLOR_PRESETS = [
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
    { value: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
    { value: 'indigo', label: 'Indigo', color: 'bg-indigo-500' },
    { value: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
    { value: 'rose', label: 'Rose', color: 'bg-rose-500' },
    { value: 'teal', label: 'Teal', color: 'bg-teal-500' }
];

// Social Media Platforms
// Social Media Platforms
const SOCIAL_PLATFORMS = [
    { value: 'linkedin', label: 'LinkedIn', icon: FaLinkedin, color: 'bg-blue-600', placeholder: 'https://linkedin.com/in/...' },
    { value: 'twitter', label: 'X', icon: FaXTwitter, color: 'bg-black', placeholder: 'https://x.com/...' },
    { value: 'instagram', label: 'Instagram', icon: FaInstagram, color: 'bg-pink-600', placeholder: 'https://instagram.com/...' },
    { value: 'facebook', label: 'Facebook', icon: FaFacebook, color: 'bg-blue-700', placeholder: 'https://facebook.com/...' },
    { value: 'youtube', label: 'YouTube', icon: FaYoutube, color: 'bg-red-600', placeholder: 'https://youtube.com/...' },
    { value: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, color: 'bg-green-500', placeholder: 'https://wa.me/...' },
    { value: 'telegram', label: 'Telegram', icon: FaTelegram, color: 'bg-sky-500', placeholder: 'https://t.me/...' },
    { value: 'github', label: 'GitHub', icon: FaGithub, color: 'bg-gray-800', placeholder: 'https://github.com/...' },
    { value: 'twitch', label: 'Twitch', icon: FaTwitch, color: 'bg-purple-600', placeholder: 'https://twitch.tv/...' },
    { value: 'discord', label: 'Discord', icon: FaDiscord, color: 'bg-indigo-600', placeholder: 'https://discord.gg/...' },
    { value: 'website', label: 'Website', icon: FaGlobe, color: 'bg-blue-500', placeholder: 'https://...' }
];

// Contact Types
const CONTACT_TYPES = [
    { value: 'email', label: 'Email', icon: Mail, color: 'bg-blue-500', placeholder: 'hello@example.com' },
    { value: 'phone', label: 'Phone', icon: Phone, color: 'bg-green-500', placeholder: '+1 (555) 000-0000' },
    { value: 'website', label: 'Website', icon: Globe, color: 'bg-purple-500', placeholder: 'https://example.com' },
    { value: 'address', label: 'Address', icon: MapPin, color: 'bg-orange-500', placeholder: '123 Main St, City, Country' },
    { value: 'location', label: 'Location Link', icon: MapPin, color: 'bg-red-500', placeholder: 'https://maps.google.com/...' }
];

interface Stat {
    id: string;
    icon: string;
    value: string;
    label: string;
    color: string;
    enabled: boolean;
    order: number;
}

interface Highlight {
    id: string;
    emoji: string;
    title: string;
    description: string;
    enabled: boolean;
    order: number;
}

interface BrandConfig {
    identity: {
        logo: string;
        logoStyle: 'circle' | 'square';
        businessName: string;
        tagline: string;
        coverImage: string;
    };
    pitch: {
        description: string;
        showDescription: boolean;
    };
    stats: Stat[];
    highlights: Highlight[];
    media: {
        videoIntro: string;
        featuredImage: string;
        showVideo: boolean;
        showImage: boolean;
    };
    contact: {
        items: { id: string; type: string; value: string; enabled: boolean }[];
        showContact: boolean;
    };
    socials: {
        links: { id: string; platform: string; url: string; enabled: boolean }[];
        showSocials: boolean;
    };
    cta: {
        primary: {
            text: string;
            action: string;
            style: 'gradient' | 'solid';
        };
        secondary: {
            text: string;
            action: string;
            style: 'outline' | 'ghost';
        };
    };
    ratingFeedback: {
        enableRating: boolean;
        enableFeedback: boolean;
        formTitle: string;
        feedbackPlaceholder: string;
    };
    businessHours?: {
        enabled: boolean;
        title: string;
        description: string;
        schedule: { day: string; isOpen: boolean; time: string }[];
    };
}

const getVideoId = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/);
    if (ytMatch && ytMatch[1].length === 11) return { type: 'youtube', id: ytMatch[1] };
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
    if (vimeoMatch && vimeoMatch[1]) return { type: 'vimeo', id: vimeoMatch[1] };
    return null;
};

import defaultData from "./default-data.json";

import { botConfigService } from "@/services/bot-config.service";

// ... (existing imports, but remove any unused local storage related imports if necessary, though current context shows none explicit)

// ... (keeping existing interfaces and constants)

export function AboutPageDesigner({ config, orgId }: AboutPageDesignerProps) {
    const [brandConfig, setBrandConfig] = useState<BrandConfig>(defaultData.brand as unknown as BrandConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [isGlobalEditing, setIsGlobalEditing] = useState(false);
    const [draggedStat, setDraggedStat] = useState<string | null>(null);

    const loadConfig = async () => {
        try {
            // Using 'default_bot' for now
            const apiConfig = await botConfigService.getBotConfig('default_bot');
            if (apiConfig && apiConfig.brandConfig) {
                // Ensure backward compatibility and default values
                const parsed = { ...defaultData.brand, ...apiConfig.brandConfig } as unknown as BrandConfig;

                // Ensure highlights exists
                if (!parsed.highlights) {
                    parsed.highlights = [];
                }
                // Ensure ratingFeedback exists
                if (!parsed.ratingFeedback) {
                    parsed.ratingFeedback = defaultData.brand.ratingFeedback;
                }

                // Cleanup old ui props
                if (parsed.stats) {
                    parsed.stats = parsed.stats.map(({ isEditing, ...rest }: any) => rest);
                }

                // Transform/Migrate legacy structures if they exist in DB
                // Migration for old contact structure
                if (parsed.contact && !Array.isArray(parsed.contact.items)) {
                    const items: any[] = [];
                    const c: any = parsed.contact;
                    if (c.email) items.push({ id: '1', type: 'email', value: c.email, enabled: true });
                    if (c.phone) items.push({ id: '2', type: 'phone', value: c.phone, enabled: true });
                    if (c.website) items.push({ id: '3', type: 'website', value: c.website, enabled: true });
                    if (c.address) items.push({ id: '4', type: 'address', value: c.address, enabled: true });

                    parsed.contact = {
                        items: items,
                        showContact: c.showContact ?? true
                    };
                }

                // Migration for old social structure
                if (parsed.socials && !Array.isArray(parsed.socials.links)) {
                    const links: any[] = [];
                    const s: any = parsed.socials;
                    // Check for old keys and migrate
                    if (s.linkedin) links.push({ id: '1', platform: 'linkedin', url: s.linkedin, enabled: true });
                    if (s.twitter) links.push({ id: '2', platform: 'twitter', url: s.twitter, enabled: true });
                    if (s.instagram) links.push({ id: '3', platform: 'instagram', url: s.instagram, enabled: true });
                    if (s.facebook) links.push({ id: '4', platform: 'facebook', url: s.facebook, enabled: true });
                    if (s.youtube) links.push({ id: '5', platform: 'youtube', url: s.youtube, enabled: true });

                    parsed.socials = {
                        links: links,
                        showSocials: s.showSocials ?? true
                    };
                }

                // Migration for Business Hours
                if (!parsed.businessHours) {
                    parsed.businessHours = {
                        enabled: false,
                        title: "Opening Hours",
                        description: "Visit us during these times.",
                        schedule: [
                            { day: 'Monday', isOpen: true, time: '9:00 AM - 6:00 PM' },
                            { day: 'Tuesday', isOpen: true, time: '9:00 AM - 6:00 PM' },
                            { day: 'Wednesday', isOpen: true, time: '9:00 AM - 6:00 PM' },
                            { day: 'Thursday', isOpen: true, time: '9:00 AM - 6:00 PM' },
                            { day: 'Friday', isOpen: true, time: '9:00 AM - 6:00 PM' },
                            { day: 'Saturday', isOpen: true, time: '10:00 AM - 4:00 PM' },
                            { day: 'Sunday', isOpen: false, time: 'Closed' }
                        ]
                    };
                }

                setBrandConfig(parsed);
            }
        } catch (e) {
            console.error('Failed to load brand config:', e);
            toast({
                title: "⚠️ Could not load config",
                description: "Using default configuration",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await botConfigService.saveBotConfig('default_bot', {
                brandConfig,
                orgId
            });
            toast({
                title: "✅ Brand Configuration Saved!",
                description: "Your About Us page is updated"
            });
            setIsGlobalEditing(false); // Retrun to View Mode
        } catch (error) {
            console.error(error);
            toast({
                title: "❌ Error",
                description: "Failed to save configuration",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsGlobalEditing(false);
        loadConfig(); // Revert to server state
        toast({ title: "Changes Discarded" });
    }

    // Stat management
    const addStat = () => {
        const newStat: Stat = {
            id: `stat_${Date.now()}`,
            icon: 'star',
            value: '',     // Empty for UX
            label: '',     // Empty for UX
            color: 'blue',
            enabled: true,
            order: brandConfig.stats.length
        };
        setBrandConfig(prev => ({
            ...prev,
            stats: [...prev.stats, newStat]
        }));
    };

    const updateStat = (id: string, updates: Partial<Stat>) => {
        setBrandConfig(prev => ({
            ...prev,
            stats: prev.stats.map(stat => stat.id === id ? { ...stat, ...updates } : stat)
        }));
    };

    const deleteStat = (id: string) => {
        setBrandConfig(prev => ({
            ...prev,
            stats: prev.stats.filter(stat => stat.id !== id)
        }));
    };

    const handleDragStart = (id: string) => {
        if (!isGlobalEditing) return;
        setDraggedStat(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!isGlobalEditing || !draggedStat || draggedStat === targetId) return;

        const stats = [...brandConfig.stats];
        const draggedIndex = stats.findIndex(s => s.id === draggedStat);
        const targetIndex = stats.findIndex(s => s.id === targetId);

        const [removed] = stats.splice(draggedIndex, 1);
        stats.splice(targetIndex, 0, removed);

        stats.forEach((stat, index) => {
            stat.order = index;
        });

        setBrandConfig(prev => ({ ...prev, stats }));
    };

    const handleDragEnd = () => {
        setDraggedStat(null);
    };

    // Highlight management
    const [draggedHighlight, setDraggedHighlight] = useState<string | null>(null);

    const addHighlight = () => {
        const newHighlight: Highlight = {
            id: `hl_${Date.now()}`,
            emoji: '✨',
            title: '',      // Empty for UX
            description: '', // Empty for UX
            enabled: true,
            order: brandConfig.highlights.length
        };
        setBrandConfig(prev => ({
            ...prev,
            highlights: [...prev.highlights, newHighlight]
        }));
    };

    const updateHighlight = (id: string, updates: Partial<Highlight>) => {
        setBrandConfig(prev => ({
            ...prev,
            highlights: prev.highlights.map(h =>
                h.id === id ? { ...h, ...updates } : h
            )
        }));
    };

    const deleteHighlight = (id: string) => {
        setBrandConfig(prev => ({
            ...prev,
            highlights: prev.highlights.filter(h => h.id !== id)
        }));
        toast({ description: 'Highlight removed' });
    };

    const handleHighlightDragStart = (id: string) => {
        if (!isGlobalEditing) return;
        setDraggedHighlight(id);
    };

    const handleHighlightDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!isGlobalEditing || !draggedHighlight || draggedHighlight === targetId) return;

        const highlights = [...brandConfig.highlights];
        const draggedIndex = highlights.findIndex(h => h.id === draggedHighlight);
        const targetIndex = highlights.findIndex(h => h.id === targetId);

        const [removed] = highlights.splice(draggedIndex, 1);
        highlights.splice(targetIndex, 0, removed);

        highlights.forEach((highlight, index) => {
            highlight.order = index;
        });

        setBrandConfig(prev => ({ ...prev, highlights }));
    };

    const handleHighlightDragEnd = () => {
        setDraggedHighlight(null);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center w-full px-8 py-6 border-b border-white/5">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Brand & About Page
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Customize your widget's About Us section</p>
                </div>

                <div className="flex gap-2">
                    {!isGlobalEditing ? (
                        <Button
                            onClick={() => setIsGlobalEditing(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl shadow-lg shadow-purple-500/20"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Configuration
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                className="border-white/20 hover:bg-white/10 text-slate-300"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-xl font-semibold shadow-lg shadow-purple-500/20"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto px-8 py-8 ${!isGlobalEditing ? 'opacity-90 pointer-events-none' : ''}`}>
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Section 1: Identity Card */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">Identity Card</h3>

                        <div className="space-y-4">
                            {/* Business Name */}
                            <div>
                                <Label className="text-slate-300 mb-2">Business Name</Label>
                                <Input
                                    value={brandConfig.identity.businessName}
                                    onChange={(e) => setBrandConfig(prev => ({
                                        ...prev,
                                        identity: { ...prev.identity, businessName: e.target.value }
                                    }))}
                                    placeholder="Nike Support"
                                    maxLength={50}
                                    disabled={!isGlobalEditing}
                                    className="bg-black/40 border-white/20 text-white disabled:opacity-50"
                                />
                            </div>

                            {/* Tagline */}
                            <div>
                                <Label className="text-slate-300 mb-2">Tagline</Label>
                                <Input
                                    value={brandConfig.identity.tagline}
                                    onChange={(e) => setBrandConfig(prev => ({
                                        ...prev,
                                        identity: { ...prev.identity, tagline: e.target.value }
                                    }))}
                                    placeholder="Just Do It"
                                    maxLength={100}
                                    disabled={!isGlobalEditing}
                                    className="bg-black/40 border-white/20 text-white disabled:opacity-50"
                                />
                            </div>

                            {/* Logo Style */}
                            <div className="flex flex-col ">
                                <Label className="text-slate-300 mb-2">Logo Style</Label>
                                <div className={`flex gap-3 ${!isGlobalEditing ? 'opacity-50' : ''}`}>
                                    <button
                                        onClick={() => isGlobalEditing && setBrandConfig(prev => ({
                                            ...prev,
                                            identity: { ...prev.identity, logoStyle: 'circle' }
                                        }))}
                                        className={`px-6 py-3 rounded-xl border-2 transition-all ${brandConfig.identity.logoStyle === 'circle'
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                            } ${!isGlobalEditing ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <div className="text-sm font-semibold text-white">Circle</div>
                                    </button>
                                    <button
                                        onClick={() => isGlobalEditing && setBrandConfig(prev => ({
                                            ...prev,
                                            identity: { ...prev.identity, logoStyle: 'square' }
                                        }))}
                                        className={`px-6 py-3 rounded-xl border-2 transition-all ${brandConfig.identity.logoStyle === 'square'
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                            } ${!isGlobalEditing ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <div className="text-sm font-semibold text-white">Square</div>
                                    </button>
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Section 2: Pitch */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Business Pitch</h3>
                            <button
                                onClick={() => isGlobalEditing && setBrandConfig(prev => ({
                                    ...prev,
                                    pitch: { ...prev.pitch, showDescription: !prev.pitch.showDescription }
                                }))}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${brandConfig.pitch.showDescription
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-slate-700 text-slate-400'
                                    } ${!isGlobalEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {brandConfig.pitch.showDescription ? <Eye size={16} /> : <EyeOff size={16} />}
                                {brandConfig.pitch.showDescription ? 'Visible' : 'Hidden'}
                            </button>
                        </div>

                        <Textarea
                            value={brandConfig.pitch.description}
                            onChange={(e) => setBrandConfig(prev => ({
                                ...prev,
                                pitch: { ...prev.pitch, description: e.target.value }
                            }))}
                            placeholder="Describe your business, mission, and what makes you special..."
                            maxLength={500}
                            rows={4}
                            disabled={!isGlobalEditing}
                            className="bg-black/20 border-white/10 resize-none text-slate-300 min-h-[80px] p-4 focus-visible:ring-purple-500/20 rounded-lg disabled:opacity-80"
                        />
                        <div className="text-xs text-slate-500 mt-2 text-right">
                            {brandConfig.pitch.description.length}/500 characters
                        </div>
                    </div>

                    {/* Section 3: Trust Signals - Simplified */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Key Metrics</h3>
                                <p className="text-sm text-slate-400 mt-1">Add up to 4 stats to showcase achievements</p>
                            </div>
                            {isGlobalEditing && (
                                <Button
                                    onClick={addStat}
                                    disabled={brandConfig.stats.length >= 4}
                                    variant="outline"
                                    className="border-white/20 hover:bg-white/10"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Card ({brandConfig.stats.length}/4)
                                </Button>
                            )}
                        </div>

                        {/* Stats List */}
                        <div className="space-y-3">
                            {brandConfig.stats
                                .sort((a, b) => a.order - b.order)
                                .map((stat) => {
                                    const IconComponent = STAT_ICONS.find(i => i.value === stat.icon)?.Icon || Star;
                                    const colorPreset = COLOR_PRESETS.find(c => c.value === stat.color);

                                    // Hide in view mode if disabled
                                    if (!isGlobalEditing && !stat.enabled) return null;

                                    return (
                                        <div
                                            key={stat.id}
                                            draggable={isGlobalEditing}
                                            onDragStart={() => handleDragStart(stat.id)}
                                            onDragOver={(e) => handleDragOver(e, stat.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`bg-white/5 border border-white/10 rounded-xl p-4 transition-all ${draggedStat === stat.id ? 'opacity-50' : 'opacity-100'
                                                } ${stat.enabled ? '' : 'opacity-50 grayscale'} ${!isGlobalEditing ? 'cursor-default' : ''}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                {isGlobalEditing && (
                                                    <GripVertical className="w-5 h-5 text-slate-500 cursor-grab mt-2 flex-shrink-0" />
                                                )}

                                                {/* Icon Selector with Dropdown */}
                                                <div className="flex-shrink-0">
                                                    <Label className="text-slate-400 text-xs mb-1 block">Icon</Label>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild disabled={!isGlobalEditing}>
                                                            <button
                                                                title={isGlobalEditing ? "Click to change icon" : "Edit mode to change"}
                                                                disabled={!isGlobalEditing}
                                                                className={`relative group w-16 h-16 rounded-xl ${colorPreset?.color} bg-opacity-20 flex items-center justify-center border-2 transition-all ${stat.color === 'blue' ? 'border-blue-500/30' :
                                                                    stat.color === 'purple' ? 'border-purple-500/30' :
                                                                        stat.color === 'green' ? 'border-green-500/30' :
                                                                            stat.color === 'orange' ? 'border-orange-500/30' :
                                                                                stat.color === 'pink' ? 'border-pink-500/30' :
                                                                                    stat.color === 'cyan' ? 'border-cyan-500/30' :
                                                                                        stat.color === 'red' ? 'border-red-500/30' :
                                                                                            stat.color === 'yellow' ? 'border-yellow-500/30' :
                                                                                                stat.color === 'indigo' ? 'border-indigo-500/30' :
                                                                                                    stat.color === 'emerald' ? 'border-emerald-500/30' :
                                                                                                        stat.color === 'rose' ? 'border-rose-500/30' :
                                                                                                            'border-teal-500/30'
                                                                    } ${isGlobalEditing ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-default opacity-80'}`}>
                                                                <IconComponent className={`w-8 h-8 ${stat.color === 'blue' ? 'text-blue-500' :
                                                                    stat.color === 'purple' ? 'text-purple-500' :
                                                                        stat.color === 'green' ? 'text-green-500' :
                                                                            stat.color === 'orange' ? 'text-orange-500' :
                                                                                stat.color === 'pink' ? 'text-pink-500' :
                                                                                    stat.color === 'cyan' ? 'text-cyan-500' :
                                                                                        stat.color === 'red' ? 'text-red-500' :
                                                                                            stat.color === 'yellow' ? 'text-yellow-500' :
                                                                                                stat.color === 'indigo' ? 'text-indigo-500' :
                                                                                                    stat.color === 'emerald' ? 'text-emerald-500' :
                                                                                                        stat.color === 'rose' ? 'text-rose-500' :
                                                                                                            'text-teal-500'
                                                                    }`} />
                                                                {/* Click indicator only in edit mode */}
                                                                {isGlobalEditing && (
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                                        <MousePointer2 className="w-5 h-5 text-white" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto bg-slate-900 border-white/20">
                                                            {STAT_ICONS.map(({ value, label, Icon }) => {
                                                                const isSelected = stat.icon === value;
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={value}
                                                                        onClick={() => updateStat(stat.id, { icon: value })}
                                                                        className={`flex items-center gap-3 cursor-pointer py-2.5 ${isSelected
                                                                            ? 'bg-white/20 hover:bg-white/25'
                                                                            : 'hover:bg-white/10'
                                                                            }`}
                                                                    >
                                                                        <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-400' : 'text-slate-300'
                                                                            }`} />
                                                                        <span className={`flex-1 ${isSelected ? 'text-white font-semibold' : 'text-slate-200'
                                                                            }`}>{label}</span>
                                                                        {isSelected && (
                                                                            <CheckCircle className="w-4 h-4 text-blue-400" />
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                );
                                                            })}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Inputs */}
                                                <div className="flex-1 space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="relative">
                                                            <Label className="text-slate-400 text-xs mb-1">Value</Label>
                                                            <Input
                                                                value={stat.value}
                                                                onChange={(e) => updateStat(stat.id, { value: e.target.value })}
                                                                placeholder="e.g. 10K+"
                                                                disabled={!isGlobalEditing}
                                                                className="bg-black/40 border-white/20 text-white h-10 pr-8 disabled:opacity-50"
                                                            />
                                                        </div>

                                                        <div className="relative">
                                                            <Label className="text-slate-400 text-xs mb-1">Label</Label>
                                                            <Input
                                                                value={stat.label}
                                                                onChange={(e) => updateStat(stat.id, { label: e.target.value })}
                                                                placeholder="e.g. Active Users"
                                                                disabled={!isGlobalEditing}
                                                                className="bg-black/40 border-white/20 text-white h-10 pr-8 disabled:opacity-50"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Color Picker */}
                                            <div className="pl-10 pt-2">
                                                <Label className="text-slate-400 text-xs mb-2 block">Color</Label>
                                                <div className={`flex gap-2 ${!isGlobalEditing ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    {COLOR_PRESETS.map((preset) => (
                                                        <button
                                                            key={preset.value}
                                                            onClick={() => updateStat(stat.id, { color: preset.value })}
                                                            className={`w-8 h-8 rounded-lg ${preset.color} transition-all ${stat.color === preset.value
                                                                ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                                                                : 'hover:scale-105'
                                                                }`}
                                                            title={preset.label}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {isGlobalEditing && (
                                                <div className="flex flex-col gap-2 flex-shrink-0 mt-4 pt-4 border-t border-white/10">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => updateStat(stat.id, { enabled: !stat.enabled })}
                                                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${stat.enabled
                                                                ? 'text-green-400 bg-green-400/10'
                                                                : 'text-slate-400 bg-slate-800'
                                                                }`}
                                                        >
                                                            {stat.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                                                            {stat.enabled ? 'Visible' : 'Hidden'}
                                                        </button>

                                                        <button
                                                            onClick={() => deleteStat(stat.id)}
                                                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-2 text-sm"
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete Card
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            {brandConfig.stats.length === 0 && (
                                <div className="text-center py-12 text-slate-500 bg-white/5 rounded-xl border-2 border-dashed border-white/10">
                                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-semibold mb-1">No cards added yet</p>
                                    <p className="text-sm">Add up to 4 trust signal cards!</p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Section 3.5: Key Highlights */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Key Highlights</h3>
                                <p className="text-sm text-slate-400 mt-1">Add feature highlights with emoji + title + description</p>
                            </div>
                            {isGlobalEditing && (
                                <Button
                                    onClick={addHighlight}
                                    disabled={brandConfig.highlights.length >= 6}
                                    variant="outline"
                                    className="border-white/20 hover:bg-white/10"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Highlight ({brandConfig.highlights.length}/6)
                                </Button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {brandConfig.highlights
                                .sort((a, b) => a.order - b.order)
                                .map((highlight) => {
                                    // Hide in view mode if disabled
                                    if (!isGlobalEditing && !highlight.enabled) return null;

                                    return (
                                        <div
                                            key={highlight.id}
                                            draggable={isGlobalEditing}
                                            onDragStart={() => handleHighlightDragStart(highlight.id)}
                                            onDragOver={(e) => handleHighlightDragOver(e, highlight.id)}
                                            onDragEnd={handleHighlightDragEnd}
                                            className={`bg-white/5 border border-white/10 rounded-xl p-4 transition-all ${draggedHighlight === highlight.id ? 'opacity-50' : 'opacity-100'
                                                } ${highlight.enabled ? '' : 'opacity-50 grayscale'} ${!isGlobalEditing ? 'cursor-default' : ''}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                {isGlobalEditing && (
                                                    <GripVertical className="w-5 h-5 text-slate-500 cursor-grab mt-2 flex-shrink-0" />
                                                )}

                                                {/* Emoji Picker */}
                                                <div className="flex-shrink-0">
                                                    <Label className="text-slate-400 text-xs mb-1 block">Emoji</Label>
                                                    <Input
                                                        value={highlight.emoji}
                                                        onChange={(e) => updateHighlight(highlight.id, { emoji: e.target.value })}
                                                        placeholder="✨"
                                                        disabled={!isGlobalEditing}
                                                        className="bg-black/40 border-white/20 text-white w-16 h-16 text-center text-2xl disabled:opacity-50"
                                                        maxLength={2}
                                                    />
                                                </div>

                                                {/* Title & Description */}
                                                <div className="flex-1 space-y-3">
                                                    <div>
                                                        <Label className="text-slate-400 text-xs mb-1">Title</Label>
                                                        <Input
                                                            value={highlight.title}
                                                            onChange={(e) => updateHighlight(highlight.id, { title: e.target.value })}
                                                            placeholder="Feature Title"
                                                            disabled={!isGlobalEditing}
                                                            className="bg-black/40 border-white/20 text-white h-10 disabled:opacity-50"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="text-slate-400 text-xs mb-1">Description</Label>
                                                        <Textarea
                                                            value={highlight.description}
                                                            onChange={(e) => updateHighlight(highlight.id, { description: e.target.value })}
                                                            placeholder="Brief description of this feature..."
                                                            className="bg-black/20 border-white/10 resize-none text-slate-300 min-h-[80px] p-4 focus-visible:ring-purple-500/20 rounded-lg disabled:opacity-80"
                                                            rows={2}
                                                            disabled={!isGlobalEditing}
                                                        />

                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                {isGlobalEditing && (
                                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={() => updateHighlight(highlight.id, { enabled: !highlight.enabled })}
                                                            className={`p-2 rounded-lg transition-colors ${highlight.enabled
                                                                ? 'text-green-400 hover:bg-green-400/10'
                                                                : 'text-slate-500 hover:bg-slate-700'
                                                                }`}
                                                            title={highlight.enabled ? 'Hide' : 'Show'}
                                                        >
                                                            {highlight.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                                                        </button>

                                                        <button
                                                            onClick={() => deleteHighlight(highlight.id)}
                                                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })}

                            {brandConfig.highlights.length === 0 && (
                                <div className="text-center py-12 text-slate-500 bg-white/5 rounded-xl border-2 border-dashed border-white/10">
                                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-semibold mb-1">No highlights added yet</p>
                                    <p className="text-sm">Add key features to showcase what makes you special!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 4: Media */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">Media Gallery</h3>

                        <div className="space-y-4">
                            {/* Video Intro */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-slate-300">Video Introduction (YouTube/Vimeo)</Label>
                                    <button
                                        onClick={() => isGlobalEditing && setBrandConfig(prev => ({
                                            ...prev,
                                            media: { ...prev.media, showVideo: !prev.media.showVideo }
                                        }))}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs transition-all ${brandConfig.media.showVideo
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-slate-700 text-slate-400'
                                            } ${!isGlobalEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {brandConfig.media.showVideo ? <Eye size={14} /> : <EyeOff size={14} />}
                                        {brandConfig.media.showVideo ? 'Show' : 'Hide'}
                                    </button>
                                </div>
                                <Input
                                    value={brandConfig.media.videoIntro}
                                    onChange={(e) => setBrandConfig(prev => ({
                                        ...prev,
                                        media: { ...prev.media, videoIntro: e.target.value }
                                    }))}
                                    placeholder="https://youtube.com/watch?v=..."
                                    disabled={!isGlobalEditing}
                                    className="bg-black/40 border-white/20 text-white disabled:opacity-50"
                                />
                                {(() => {
                                    const videoData = getVideoId(brandConfig.media.videoIntro);
                                    return (
                                        <>
                                            {videoData && (
                                                <div className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 aspect-video relative group animate-in fade-in zoom-in duration-300">
                                                    <iframe
                                                        src={videoData.type === 'youtube'
                                                            ? `https://www.youtube.com/embed/${videoData.id}`
                                                            : `https://player.vimeo.com/video/${videoData.id}`}
                                                        className="w-full h-full"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        title="Video Preview"
                                                    />
                                                </div>
                                            )}
                                            {brandConfig.media.videoIntro && !videoData && (
                                                <div className="mt-2 text-orange-400 text-xs flex items-center gap-2 animate-pulse">
                                                    <AlertCircle size={14} />
                                                    Invalid or unsupported video URL (YouTube & Vimeo only)
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Contact */}
                    <div className="bg-white/5 flex flex-col gap-6 p-6 rounded-2xl border border-white/10">


                        {/* Section 5: Contact Info */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                                <button
                                    onClick={() => isGlobalEditing && setBrandConfig(prev => ({
                                        ...prev,
                                        contact: { ...prev.contact, showContact: !prev.contact.showContact }
                                    }))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${brandConfig.contact.showContact
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-slate-700 text-slate-400'
                                        } ${!isGlobalEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {brandConfig.contact.showContact ? <Eye size={16} /> : <EyeOff size={16} />}
                                    {brandConfig.contact.showContact ? 'Visible' : 'Hidden'}
                                </button>
                            </div>

                            {/* Add Button */}
                            {isGlobalEditing && (
                                <div className="mb-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full border-dashed border-white/20 hover:bg-white/5 text-slate-300 hover:text-white">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Contact Detail
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56 bg-slate-900 border-white/20">
                                            {CONTACT_TYPES.map((type) => {
                                                const isAdded = brandConfig.contact.items.some(item => item.type === type.value);
                                                return (
                                                    <DropdownMenuItem
                                                        key={type.value}
                                                        disabled={isAdded}
                                                        onClick={() => {
                                                            if (isAdded) return;
                                                            const newItem = {
                                                                id: Date.now().toString(),
                                                                type: type.value,
                                                                value: '',
                                                                enabled: true
                                                            };
                                                            setBrandConfig(prev => ({
                                                                ...prev,
                                                                contact: {
                                                                    ...prev.contact,
                                                                    items: [...prev.contact.items, newItem]
                                                                }
                                                            }));
                                                        }}
                                                        className={`flex items-center gap-2 cursor-pointer ${isAdded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`}
                                                    >
                                                        <type.icon className={`w-4 h-4 ${type.color.replace('bg-', 'text-')}`} />
                                                        <span className="flex-1">{type.label}</span>
                                                        {isAdded && <CheckCircle className="w-3 h-3 text-green-500" />}
                                                    </DropdownMenuItem>
                                                );
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}

                            {/* Contact Items List */}
                            <div className="space-y-3">
                                {brandConfig.contact.items.map((item) => {
                                    const typeDef = CONTACT_TYPES.find(t => t.value === item.type);
                                    const Icon = typeDef?.icon || MapPin;

                                    // Hide in view mode if disabled
                                    if (!isGlobalEditing && !item.enabled) return null;

                                    return (
                                        <div key={item.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5 group">
                                            <div className={`w-10 mt-4 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeDef?.color || 'bg-slate-700'}`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="text-xs text-slate-500 mb-1 ml-1">{typeDef?.label}</div>
                                                <Input
                                                    value={item.value}
                                                    onChange={(e) => setBrandConfig(prev => ({
                                                        ...prev,
                                                        contact: {
                                                            ...prev.contact,
                                                            items: prev.contact.items.map(i => i.id === item.id ? { ...i, value: e.target.value } : i)
                                                        }
                                                    }))}
                                                    placeholder={typeDef?.placeholder || 'Enter details...'}
                                                    disabled={!isGlobalEditing}
                                                />
                                            </div>

                                            {isGlobalEditing && (
                                                <button
                                                    onClick={() => setBrandConfig(prev => ({
                                                        ...prev,
                                                        contact: {
                                                            ...prev.contact,
                                                            items: prev.contact.items.filter(i => i.id !== item.id)
                                                        }
                                                    }))}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                {brandConfig.contact.items.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 text-sm italic">
                                        No contact details added yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: Business Hours */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-400" />
                                        Business Hours
                                    </h3>
                                    <p className="text-sm text-slate-400">Manage your weekly operating schedule</p>
                                </div>
                                <button
                                    onClick={() => isGlobalEditing && setBrandConfig(prev => ({
                                        ...prev,
                                        businessHours: { ...prev.businessHours!, enabled: !prev.businessHours?.enabled }
                                    }))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${brandConfig.businessHours?.enabled
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-slate-700 text-slate-400'
                                        } ${!isGlobalEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {brandConfig.businessHours?.enabled ? <CheckCircle size={16} /> : <X size={16} />}
                                    {brandConfig.businessHours?.enabled ? 'Enabled' : 'Disabled'}
                                </button>
                            </div>

                            {brandConfig.businessHours?.enabled && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <Label className="text-slate-400 text-sm mb-2 block">Section Title</Label>
                                            <Input
                                                value={brandConfig.businessHours.title}
                                                onChange={(e) => setBrandConfig(prev => ({
                                                    ...prev,
                                                    businessHours: { ...prev.businessHours!, title: e.target.value }
                                                }))}
                                                disabled={!isGlobalEditing}
                                                className="bg-black/40 border-white/20 text-white"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-slate-400 text-sm mb-2 block">Description</Label>
                                            <Textarea
                                                value={brandConfig.businessHours.description}
                                                onChange={(e) => setBrandConfig(prev => ({
                                                    ...prev,
                                                    businessHours: { ...prev.businessHours!, description: e.target.value }
                                                }))}
                                                disabled={!isGlobalEditing}
                                                className="bg-black/20 border-white/10 resize-none text-slate-300 min-h-[80px] p-4 focus-visible:ring-purple-500/20 rounded-lg disabled:opacity-80"
                                                rows={2}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <Label className="text-slate-300 font-medium">Weekly Schedule</Label>
                                            {isGlobalEditing && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setBrandConfig(prev => ({
                                                        ...prev,
                                                        businessHours: {
                                                            ...prev.businessHours!,
                                                            schedule: prev.businessHours!.schedule.map(d => ({ ...d, isOpen: true, time: 'Open 24 Hours' }))
                                                        }
                                                    }))}
                                                    className="text-xs text-blue-400 hover:text-blue-300"
                                                >
                                                    Set All 24/7
                                                </Button>
                                            )}
                                        </div>
                                        {brandConfig.businessHours.schedule.map((day, index) => (
                                            <div key={day.day} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                <div className="w-24 font-medium text-slate-300 text-sm">{day.day}</div>

                                                <button
                                                    onClick={() => {
                                                        if (!isGlobalEditing) return;
                                                        const newSchedule = [...brandConfig.businessHours!.schedule];
                                                        newSchedule[index].isOpen = !newSchedule[index].isOpen;
                                                        setBrandConfig(prev => ({
                                                            ...prev,
                                                            businessHours: { ...prev.businessHours!, schedule: newSchedule }
                                                        }));
                                                    }}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all w-20 flex justify-center uppercase ${day.isOpen
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                                                        : 'bg-red-500/10 text-red-500 border border-red-500/10 opacity-70'
                                                        } ${!isGlobalEditing ? 'cursor-not-allowed' : ''}`}
                                                >
                                                    {day.isOpen ? 'OPEN' : 'CLOSED'}
                                                </button>

                                                {day.isOpen && (
                                                    <div className="flex-1 flex gap-4 items-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger disabled={!isGlobalEditing} asChild>
                                                                <button
                                                                    className={`flex items-center justify-between gap-2 bg-black/40 border border-white/10 text-white text-xs rounded-md px-3 py-2 min-w-[140px] hover:border-blue-500/50 transition-colors ${!isGlobalEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <span>{day.time === 'Open 24 Hours' ? 'Open 24 Hours' : 'Custom Hours'}</span>
                                                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="bg-slate-900 border-white/20 min-w-[140px]">
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        const newSchedule = [...brandConfig.businessHours!.schedule];
                                                                        newSchedule[index].time = 'Open 24 Hours';
                                                                        setBrandConfig(prev => ({
                                                                            ...prev,
                                                                            businessHours: { ...prev.businessHours!, schedule: newSchedule }
                                                                        }));
                                                                    }}
                                                                    className="text-xs text-slate-300 hover:text-white cursor-pointer"
                                                                >
                                                                    Open 24 Hours
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        const newSchedule = [...brandConfig.businessHours!.schedule];
                                                                        newSchedule[index].time = '9:00 AM - 6:00 PM';
                                                                        setBrandConfig(prev => ({
                                                                            ...prev,
                                                                            businessHours: { ...prev.businessHours!, schedule: newSchedule }
                                                                        }));
                                                                    }}
                                                                    className="text-xs text-slate-300 hover:text-white cursor-pointer"
                                                                >
                                                                    Custom Hours
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

                                                        {day.time !== 'Open 24 Hours' && (
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <CustomTimePicker
                                                                    value={day.time.includes(' - ') ? day.time.split(' - ')[0].trim() : ''}
                                                                    onChange={(newTime) => {
                                                                        const newSchedule = [...brandConfig.businessHours!.schedule];
                                                                        // If existing format was "9:00 AM - ...", we might need to be careful, but we are moving to 24h "09:00 - 18:00"
                                                                        // If current End is "6:00 PM", we should probably try to keep it or convert it? 
                                                                        // For now, let's just use whatever is there for End, but if it has AM/PM, it might look odd next to 24h.
                                                                        // Let's assume user will update both or we just append.
                                                                        const currentEnd = day.time.includes(' - ') ? day.time.split(' - ')[1].trim() : '06:00 PM';
                                                                        newSchedule[index].time = `${newTime} - ${currentEnd}`;
                                                                        setBrandConfig(prev => ({
                                                                            ...prev,
                                                                            businessHours: { ...prev.businessHours!, schedule: newSchedule }
                                                                        }));
                                                                    }}
                                                                    disabled={!isGlobalEditing}
                                                                    className="w-[130px]"
                                                                />
                                                                <span className="text-slate-500 text-xs">to</span>
                                                                <CustomTimePicker
                                                                    value={day.time.includes(' - ') ? day.time.split(' - ')[1].trim() : ''}
                                                                    onChange={(newTime) => {
                                                                        const newSchedule = [...brandConfig.businessHours!.schedule];
                                                                        const currentStart = day.time.includes(' - ') ? day.time.split(' - ')[0].trim() : '09:00 AM';
                                                                        newSchedule[index].time = `${currentStart} - ${newTime}`;
                                                                        setBrandConfig(prev => ({
                                                                            ...prev,
                                                                            businessHours: { ...prev.businessHours!, schedule: newSchedule }
                                                                        }));
                                                                    }}
                                                                    disabled={!isGlobalEditing}
                                                                    className="w-[130px]"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {!day.isOpen && (
                                                    <span className="text-xs text-slate-600 font-medium italic ml-2">Unavailable</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 6: Social Links */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Social Media Links</h3>
                                <button
                                    onClick={() => isGlobalEditing && setBrandConfig(prev => ({
                                        ...prev,
                                        socials: { ...prev.socials, showSocials: !prev.socials.showSocials }
                                    }))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${brandConfig.socials.showSocials
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-slate-700 text-slate-400'
                                        } ${!isGlobalEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {brandConfig.socials.showSocials ? <Eye size={16} /> : <EyeOff size={16} />}
                                    {brandConfig.socials.showSocials ? 'Visible' : 'Hidden'}
                                </button>
                            </div>

                            {/* Add Button */}
                            {isGlobalEditing && (
                                <div className="mb-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full border-dashed border-white/20 hover:bg-white/5 text-slate-300 hover:text-white">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Social Profile
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto bg-slate-900 border-white/20">
                                            {SOCIAL_PLATFORMS.map((platform) => {
                                                const isAdded = brandConfig.socials.links.some(link => link.platform === platform.value);
                                                return (
                                                    <DropdownMenuItem
                                                        key={platform.value}
                                                        disabled={isAdded}
                                                        onClick={() => {
                                                            if (isAdded) return;
                                                            const newLink = {
                                                                id: Date.now().toString(),
                                                                platform: platform.value,
                                                                url: '',
                                                                enabled: true
                                                            };
                                                            setBrandConfig(prev => ({
                                                                ...prev,
                                                                socials: {
                                                                    ...prev.socials,
                                                                    links: [...prev.socials.links, newLink]
                                                                }
                                                            }));
                                                        }}
                                                        className={`flex items-center gap-2 cursor-pointer ${isAdded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`}
                                                    >
                                                        <platform.icon className={`w-4 h-4 ${platform.value === 'twitter' ? 'text-white' : platform.color.replace('bg-', 'text-')}`} />
                                                        <span className="flex-1">{platform.label}</span>
                                                        {isAdded && <CheckCircle className="w-3 h-3 text-green-500" />}
                                                    </DropdownMenuItem>
                                                );
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}

                            {/* Social Links List */}
                            <div className="space-y-3">
                                {brandConfig.socials.links.map((link) => {
                                    const platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
                                    const Icon = platform?.icon || Globe;

                                    // Hide in view mode if disabled
                                    if (!isGlobalEditing && !link.enabled) return null;

                                    return (
                                        <div key={link.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5 group">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${platform?.color || 'bg-slate-700'}`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>

                                            <div className="flex-1">
                                                <Input
                                                    value={link.url}
                                                    onChange={(e) => setBrandConfig(prev => ({
                                                        ...prev,
                                                        socials: {
                                                            ...prev.socials,
                                                            links: prev.socials.links.map(l => l.id === link.id ? { ...l, url: e.target.value } : l)
                                                        }
                                                    }))}
                                                    placeholder={platform?.placeholder || 'https://...'}
                                                    disabled={!isGlobalEditing}
                                                />
                                            </div>

                                            {isGlobalEditing && (
                                                <button
                                                    onClick={() => setBrandConfig(prev => ({
                                                        ...prev,
                                                        socials: {
                                                            ...prev.socials,
                                                            links: prev.socials.links.filter(l => l.id !== link.id)
                                                        }
                                                    }))}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                {brandConfig.socials.links.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 text-sm italic">
                                        No social links added yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: Rating & Feedback */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4">Rating & Feedback Form</h3>

                            <div className="space-y-4">
                                {/* Enable/Disable Toggles */}
                                <div className={`grid grid-cols-2 gap-4 ${!isGlobalEditing ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                        <div>
                                            <Label className="text-white font-medium">Star Rating</Label>
                                            <p className="text-xs text-slate-400 mt-1">Show 5-star rating selector</p>
                                        </div>
                                        <button
                                            onClick={() => isGlobalEditing && setBrandConfig(prev => ({
                                                ...prev,
                                                ratingFeedback: {
                                                    ...prev.ratingFeedback,
                                                    enableRating: !prev.ratingFeedback.enableRating
                                                }
                                            }))}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${brandConfig.ratingFeedback.enableRating
                                                ? 'bg-green-500'
                                                : 'bg-slate-600'
                                                } ${!isGlobalEditing ? 'cursor-not-allowed' : ''}`}
                                        >
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${brandConfig.ratingFeedback.enableRating
                                                ? 'translate-x-6'
                                                : 'translate-x-0.5'
                                                }`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                        <div>
                                            <Label className="text-white font-medium">Text Feedback</Label>
                                            <p className="text-xs text-slate-400 mt-1">Show feedback text area</p>
                                        </div>
                                        <button
                                            onClick={() => isGlobalEditing && setBrandConfig(prev => ({
                                                ...prev,
                                                ratingFeedback: {
                                                    ...prev.ratingFeedback,
                                                    enableFeedback: !prev.ratingFeedback.enableFeedback
                                                }
                                            }))}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${brandConfig.ratingFeedback.enableFeedback
                                                ? 'bg-green-500'
                                                : 'bg-slate-600'
                                                } ${!isGlobalEditing ? 'cursor-not-allowed' : ''}`}
                                        >
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${brandConfig.ratingFeedback.enableFeedback
                                                ? 'translate-x-6'
                                                : 'translate-x-0.5'
                                                }`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Form Customization */}
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-slate-400 text-sm mb-2 block">Form Title</Label>
                                        <Input
                                            value={brandConfig.ratingFeedback.formTitle}
                                            onChange={(e) => setBrandConfig(prev => ({
                                                ...prev,
                                                ratingFeedback: {
                                                    ...prev.ratingFeedback,
                                                    formTitle: e.target.value
                                                }
                                            }))}
                                            placeholder="Rate Your Experience"
                                            disabled={!isGlobalEditing}
                                            className="bg-black/40 border-white/20 text-white disabled:opacity-50"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-slate-400 text-sm mb-2 block">Feedback Placeholder</Label>
                                        <Input
                                            value={brandConfig.ratingFeedback.feedbackPlaceholder}
                                            onChange={(e) => setBrandConfig(prev => ({
                                                ...prev,
                                                ratingFeedback: {
                                                    ...prev.ratingFeedback,
                                                    feedbackPlaceholder: e.target.value
                                                }
                                            }))}
                                            placeholder="Share your thoughts..."
                                            disabled={!isGlobalEditing}
                                            className="bg-black/40 border-white/20 text-white disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                {(brandConfig.ratingFeedback.enableRating || brandConfig.ratingFeedback.enableFeedback) && (
                                    <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-white/10">
                                        <Label className="text-slate-300 mb-3 block text-sm flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            Preview
                                        </Label>
                                        <div className="bg-white/5 p-4 rounded-lg space-y-3">
                                            <p className="text-white font-medium text-center">{brandConfig.ratingFeedback.formTitle}</p>
                                            {brandConfig.ratingFeedback.enableRating && (
                                                <div className="flex justify-center gap-2">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star key={star} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                                                    ))}
                                                </div>
                                            )}
                                            {brandConfig.ratingFeedback.enableFeedback && (
                                                <Textarea
                                                    placeholder={brandConfig.ratingFeedback.feedbackPlaceholder}
                                                    className="bg-black/20 border-white/10 text-white resize-none"
                                                    rows={3}
                                                    disabled
                                                />
                                            )}
                                            <Button className="w-full bg-blue-500 hover:bg-blue-600" disabled>
                                                Submit Feedback
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

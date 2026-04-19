"use client";

import React, { useEffect, useState } from 'react';
import {
    Mail, Phone, Globe, MapPin,
    Users, Award, Calendar, Trophy, Star, TrendingUp, Target, Zap,
    Heart, Shield, CheckCircle, Clock, MessageCircle, Briefcase,
    Play, ExternalLink, MessageSquare
} from 'lucide-react';
import {
    FaLinkedin, FaXTwitter, FaInstagram, FaFacebook, FaYoutube,
    FaWhatsapp, FaTelegram, FaGithub, FaTwitch, FaDiscord, FaGlobe
} from "react-icons/fa6";
import CountUp from 'react-countup';

interface ProfileViewProps {
    onNavigate: (view: string) => void;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
    users: Users,
    award: Award,
    calendar: Calendar,
    trophy: Trophy,
    star: Star,
    trending: TrendingUp,
    target: Target,
    zap: Zap,
    heart: Heart,
    shield: Shield,
    check: CheckCircle,
    clock: Clock,
    message: MessageCircle,
    briefcase: Briefcase
};

// Color mapping
const COLOR_MAP: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    green: 'text-green-500 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    pink: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'
};

// Parse number from string (e.g., "10K+" -> 10000)
const parseNumber = (value: string): number => {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (value.includes('K') || value.includes('k')) return num * 1000;
    if (value.includes('M') || value.includes('m')) return num * 1000000;
    return num;
};

// Get video embed URL
const getEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be')
            ? url.split('/').pop()?.split('?')[0]
            : new URLSearchParams(new URL(url).search).get('v');
        return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
};

// Contact Icons Map
const CONTACT_ICONS_MAP: Record<string, { Icon: any; color: string }> = {
    email: { Icon: Mail, color: 'text-blue-500' },
    phone: { Icon: Phone, color: 'text-green-500' },
    website: { Icon: Globe, color: 'text-purple-500' },
    address: { Icon: MapPin, color: 'text-orange-500' },
    location: { Icon: MapPin, color: 'text-red-500' }
};

// Social icons map
const SOCIAL_ICONS_MAP: Record<string, { Icon: any; color: string }> = {
    linkedin: { Icon: FaLinkedin, color: 'bg-blue-600' },
    twitter: { Icon: FaXTwitter, color: 'bg-black' },
    instagram: { Icon: FaInstagram, color: 'bg-pink-600' },
    facebook: { Icon: FaFacebook, color: 'bg-blue-700' },
    youtube: { Icon: FaYoutube, color: 'bg-red-600' },
    whatsapp: { Icon: FaWhatsapp, color: 'bg-green-500' },
    telegram: { Icon: FaTelegram, color: 'bg-sky-500' },
    github: { Icon: FaGithub, color: 'bg-gray-800' },
    twitch: { Icon: FaTwitch, color: 'bg-purple-600' },
    discord: { Icon: FaDiscord, color: 'bg-indigo-600' },
    website: { Icon: FaGlobe, color: 'bg-blue-500' }
};

const SocialIcon = ({ platform, url }: { platform: string; url: string }) => {
    const { Icon, color } = SOCIAL_ICONS_MAP[platform] || { Icon: FaGlobe, color: 'bg-gray-600' };

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg`}
        >
            <Icon className="w-5 h-5" />
        </a>
    );
};

import defaultData from "@/app/dashboard/ai-studio/bots/tabs/page-designers/default-data.json";
import { botConfigService } from "@/services/bot-config.service";

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
    const [brandConfig, setBrandConfig] = useState<any>(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const apiConfig = await botConfigService.getBotConfig('default_bot');
                if (apiConfig && apiConfig.brandConfig) {
                    // Merge with defaults to ensure no missing sections (like identity)
                    setBrandConfig({ ...defaultData.brand, ...apiConfig.brandConfig });
                } else {
                    setBrandConfig(defaultData.brand);
                }
            } catch (e) {
                console.error('Failed to load brand config:', e);
                setBrandConfig(defaultData.brand);
            }
        };
        loadConfig();
    }, []);

    if (!brandConfig) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    const { identity, pitch, stats, media, contact, socials, cta } = brandConfig;

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 animate-fadeIn no-scrollbar">

            {/* Cover Header */}
            {identity.coverImage && (
                <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-500">
                    <img
                        src={identity.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Identity Card */}
            <div className={`relative ${identity.coverImage ? '-mt-20' : 'pt-8'} px-4 z-10`}>
                <div className="bg-white dark:bg-slate-900 rounded-[1rem] shadow-xl shadow-slate-200/50 dark:shadow-black/50 p-4 mt-8 border border-white dark:border-slate-800 transition-transform duration-500 hover:-translate-y-1">
                    {/* Logo */}
                    <div className="flex flex-col items-center text-center">
                        <div className={`relative w-28 h-28 -mt-16 mb-4 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-8 ring-white dark:ring-slate-900 ${identity.logoStyle === 'circle' ? 'rounded-full' : 'rounded-3xl rotate-3 hover:rotate-0 transition-all duration-500'
                            }`}>
                            {identity.logo ? (
                                <img src={identity.logo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                identity.businessName.substring(0, 2).toUpperCase()
                            )}
                        </div>

                        {/* Business Name */}
                        <div className="mb-1.5">
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                                {identity.businessName}
                            </h1>
                        </div>

                        {/* Tagline */}
                        {identity.tagline && (
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide   px-3 py-1 rounded-full">
                                {identity.tagline}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Pitch Section - Clean & Readable */}
            {pitch.showDescription && pitch.description && (
                <div className="px-6 py-6 fade-in-up">
                    <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed text-center font-medium max-w-sm mx-auto">
                        {pitch.description}
                    </p>
                </div>
            )}

            {/* Stats Grid - Premium Cards */}
            {stats.filter((s: any) => s.enabled).length > 0 && (
                <div className="px-4 py-4">
                    {(() => {
                        const filteredStats = stats
                            .filter((s: any) => s.enabled)
                            .sort((a: any, b: any) => a.order - b.order)
                            .slice(0, 6);

                        const count = filteredStats.length;

                        // Dynamic Grid Logic per user request:
                        // 1 card -> 1 col (Centered, Big)
                        // 2 cards -> 2 cols
                        // 3 cards -> 3 cols (One line)
                        // 4+ cards -> 2 cols (Standard)
                        let gridClass = 'grid-cols-2';
                        if (count === 1) gridClass = 'grid-cols-1';
                        if (count === 3) gridClass = 'grid-cols-3';

                        // Adjust sizing for 3-col layout to fit narrow spaces
                        const paddingClass = count === 3 ? 'p-2.5' : 'p-5';
                        const titleSize = count === 3 ? 'text-lg' : 'text-3xl';
                        const iconSize = count === 3 ? 'w-4 h-4' : 'w-6 h-6';
                        const labelSize = count === 3 ? 'text-[10px] leading-3' : 'text-sm font-medium';
                        const iconPadding = count === 3 ? 'p-2' : 'p-3';

                        return (
                            <div className={`grid ${gridClass} gap-3`}>
                                {filteredStats.map((stat: any, index: number) => {
                                    const IconComponent = ICON_MAP[stat.icon] || Star;
                                    const colorName = stat.color || 'blue';

                                    const THEME_STYLES: Record<string, { text: string, bg: string, border: string, shadow: string }> = {
                                        blue: { text: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'group-hover:border-blue-200 dark:group-hover:border-blue-900', shadow: 'group-hover:shadow-blue-500/10' },
                                        purple: { text: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'group-hover:border-purple-200 dark:group-hover:border-purple-900', shadow: 'group-hover:shadow-purple-500/10' },
                                        green: { text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'group-hover:border-emerald-200 dark:group-hover:border-emerald-900', shadow: 'group-hover:shadow-emerald-500/10' },
                                        orange: { text: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'group-hover:border-orange-200 dark:group-hover:border-orange-900', shadow: 'group-hover:shadow-orange-500/10' },
                                        pink: { text: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10', border: 'group-hover:border-pink-200 dark:group-hover:border-pink-900', shadow: 'group-hover:shadow-pink-500/10' },
                                        cyan: { text: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'group-hover:border-cyan-200 dark:group-hover:border-cyan-900', shadow: 'group-hover:shadow-cyan-500/10' }
                                    };
                                    const theme = THEME_STYLES[colorName] || THEME_STYLES.blue;
                                    const numValue = parseNumber(stat.value);

                                    // Spanning logic only applies if we fall back to grid-cols-2 with odd numbers > 3 (e.g. 5 items)
                                    // For count === 3, we use grid-cols-3 so no span needed.
                                    // For count === 1, grid-cols-1 handles it.
                                    let spanClass = '';
                                    if (count > 3 && count % 2 !== 0 && index === count - 1) {
                                        spanClass = 'col-span-2';
                                    }

                                    return (
                                        <div
                                            key={stat.id}
                                            className={`group relative bg-white dark:bg-slate-900 ${paddingClass} rounded-2xl border border-slate-100 dark:border-slate-800 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl ${theme.border} ${theme.shadow} ${spanClass}`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className={`${iconPadding} rounded-xl ${theme.bg} ${theme.text} transition-colors duration-300`}>
                                                    <IconComponent className={`${iconSize} stroke-[2.5px]`} />
                                                </div>
                                                <div className={`w-1.5 h-1.5 rounded-full ${theme.bg.replace('bg-', 'bg-').replace('/10', '')} opacity-40 group-hover:opacity-100 transition-opacity`} />
                                            </div>

                                            <div className="space-y-0.5">
                                                <div className={`${titleSize} font-black ${theme.text} tracking-tight`}>
                                                    {!isNaN(numValue) ? (
                                                        <CountUp
                                                            end={numValue}
                                                            duration={2.5}
                                                            separator=","
                                                            suffix={stat.value.includes('+') ? '+' : ''}
                                                        />
                                                    ) : stat.value}
                                                </div>

                                                <div className={`${labelSize} text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors`}>
                                                    {stat.label}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Video Section */}
            {media.showVideo && media.videoIntro && (
                <div className="px-4 py-4">
                    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
                        <iframe
                            src={getEmbedUrl(media.videoIntro)}
                            className="w-full h-48"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}


            {/* Business Hours Section - World Class Design */}
            {brandConfig.businessHours?.enabled && (
                <div className="px-4 py-4">
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden group">
                        {/* Decor elements */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="w-24 h-24 text-blue-500 transform rotate-12" />
                        </div>

                        <div className="relative p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">
                                        {brandConfig.businessHours.title || "Business Hours"}
                                    </h3>
                                    {brandConfig.businessHours.description && (
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">{brandConfig.businessHours.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 relative z-10">
                            <ul className="space-y-3">
                                {brandConfig.businessHours.schedule.map((day: any) => {
                                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                                    const isToday = today === day.day;

                                    return (
                                        <li
                                            key={day.day}
                                            className={`flex justify-between items-center text-sm py-2 px-3 rounded-lg transition-all ${isToday
                                                ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 shadow-sm transform scale-[1.02]'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {day.day}
                                                </span>
                                                {isToday && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 uppercase tracking-wide">
                                                        Today
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {day.isOpen ? (
                                                    <span className={`font-semibold ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                                        {day.time}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 italic">
                                                        Closed
                                                    </span>
                                                )}
                                                {day.isOpen && (
                                                    <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-green-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Info */}
            {contact.showContact && (
                <div className="px-4 py-4">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Dynamic Contact Items */}
                        {Array.isArray(contact.items) && contact.items
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
                                            className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[var(--primary-color)] transition-colors`}
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
                        {!Array.isArray(contact.items) && (
                            <>
                                {contact.email && (
                                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{contact.email}</span>
                                    </a>
                                )}
                                {contact.phone && (
                                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Phone className="w-4 h-4 text-green-500" />
                                        <span className="text-xs text-slate-700 dark:text-slate-300">{contact.phone}</span>
                                    </a>
                                )}
                                {contact.website && (
                                    <a href={contact.website} target="_blank" className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Globe className="w-4 h-4 text-purple-500" />
                                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">Website</span>
                                    </a>
                                )}
                                {contact.address && (
                                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <MapPin className="w-4 h-4 text-orange-500" />
                                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{contact.address}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}






            {/* Social Links */}
            {socials.showSocials && (
                <div className="px-6 py-4">
                    <div className="flex flex-wrap justify-center gap-3">
                        {/* Handle Array Structure (New) */}
                        {Array.isArray(socials.links) && socials.links
                            .filter((link: any) => link.enabled && link.url)
                            .map((link: any) => (
                                <SocialIcon key={link.id} platform={link.platform} url={link.url} />
                            ))
                        }

                        {/* Handle Legacy Object Structure (Fallback) */}
                        {!Array.isArray(socials.links) && (['linkedin', 'twitter', 'instagram', 'facebook', 'youtube'] as const).map((platform) => {
                            const url = socials[platform];
                            return url && <SocialIcon key={platform} platform={platform} url={url} />;
                        })}
                    </div>
                </div>
            )}

            {/* 7. Call to Action (CTA) */}
            {(cta.primary.text || cta.secondary.text) && (
                <div className="px-6 py-6 pb-2">
                    <div className="flex flex-col gap-3">
                        {cta.primary.text && (
                            <button
                                onClick={() => {
                                    if (cta.primary.action.startsWith('link:')) window.open(cta.primary.action.replace('link:', ''), '_blank');
                                    else if (cta.primary.action.startsWith('navigate:')) onNavigate(cta.primary.action.replace('navigate:', ''));
                                }}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white font-bold text-lg shadow-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {cta.primary.text}
                            </button>
                        )}

                        {cta.secondary.text && (
                            <button
                                onClick={() => {
                                    if (cta.secondary.action.startsWith('link:')) window.open(cta.secondary.action.replace('link:', ''), '_blank');
                                    else if (cta.secondary.action.startsWith('navigate:')) onNavigate(cta.secondary.action.replace('navigate:', ''));
                                }}
                                className="w-full py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                {cta.secondary.text}
                            </button>
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
            {/* Glassmorphism Styles */}
            <style jsx>{`
                .glassmorphism {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>

    );
};

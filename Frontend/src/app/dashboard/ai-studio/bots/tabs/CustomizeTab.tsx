"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { botConfigService } from "@/services/bot-config.service";
import {
    Save,
    MessageCircle,
    Mail,
    Sparkles,
    Bot,
    Palette,
    MapPin,
    Zap,
    Edit2,
    X,
    Check
} from "lucide-react";
import { DebugPanel } from "./DebugPanel";
import { WindowDesigner } from "./page-designers/WindowDesigner";

interface CustomizeTabProps {
    config: any;
    orgId: string;
    initialConfig?: any;
}

interface WidgetConfig {
    theme: {
        primaryColor: string;
        secondaryColor: string;
        useGradient: boolean;
        iconColor: string;
        iconStyle: 'solid' | 'outline';
        showBox: boolean;
        boxRadius: number;
        iconScale: number;
        boxAnimation: 'none' | 'pulse' | 'ripple' | 'morph' | 'orbit' | 'shake' | 'bounce' | 'swing' | 'beat' | 'glow' | 'tilt';
    };
    icon: {
        type: 'chat' | 'message' | 'robot' | 'sparkles' | 'comment' | 'icon6' | 'icon7' | 'icon8' | 'cluaiz3bairobot';
        size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    };
    animation: {
        robot: 'none' | 'float' | 'wave' | 'bounce' | 'peep' | 'glitch' | 'spin';
        simple: 'ripple' | 'pulse' | 'morph' | 'shake' | 'glow' | 'bounce' | 'swing' | 'beat' | 'tilt';
        entrance: 'popup' | 'slide' | 'fade' | 'zoom' | 'elastic' | 'rotate';
        speed: number;
        intensity: number;
    };
    position: {
        horizontal: 'left' | 'right';
        vertical: 'bottom' | 'top';
        offsetX: number;
        offsetY: number;
    };
    behavior: {
        robot: {
            hover: 'none' | 'giggle' | 'wave' | 'surprise';
            click: 'none' | 'nod' | 'jump' | 'wink' | 'close-eyes';
        };
        icon: {
            hover: 'none' | 'scale' | 'spin' | 'glow-boost' | 'magnetic';
            click: 'pop' | 'ripple-burst';
        };
    };
    robot: {
        eyeColor: string;
        cheekColor: string;
        lipColor: string;
        earColor: string;
        eyebrowColor: string;
        bodyColor: string;
        // Gradient system
        useGradient: boolean;
        gradientType: 'linear' | 'radial' | 'conic';
        gradientColor1: string;
        gradientColor2: string;
        gradientAngle: number;
        animateGradient: boolean;
    };
    window: {
        theme: 'auto' | 'light' | 'dark';
        colorMode: 'auto' | 'custom';
        customColor?: string;
    };
}

const defaultConfig: WidgetConfig = {
    theme: {
        primaryColor: '#3B82F6',

        secondaryColor: '#8B5CF6',
        useGradient: true,
        iconColor: '#FFFFFF',
        iconStyle: 'solid',
        showBox: true,
        boxRadius: 50,
        iconScale: 1.0,
        boxAnimation: 'none',
    },
    icon: {
        type: 'robot',
        size: 'md',
    },
    animation: {
        robot: 'float',
        simple: 'ripple',
        entrance: 'popup',
        speed: 1.0, // Normal speed
        intensity: 1.0 // Normal intensity
    },
    position: {
        horizontal: 'right',
        vertical: 'bottom',
        offsetX: 20,
        offsetY: 20
    },
    behavior: {
        robot: { hover: 'giggle', click: 'nod' },
        icon: { hover: 'magnetic', click: 'ripple-burst' }
    },
    robot: {
        eyeColor: '#3B82F6',
        cheekColor: '#F472B6',
        lipColor: '#F472B6',
        earColor: '#0F172A',
        eyebrowColor: '#F59E0B',
        bodyColor: '#FFFFFF',
        useGradient: false,
        gradientType: 'linear',
        gradientColor1: '#3B82F6',
        gradientColor2: '#8B5CF6',
        gradientAngle: 45,
        animateGradient: false
    },
    window: {
        theme: 'auto',
        colorMode: 'auto',
        customColor: '#3B82F6'
    }
};

// Behavior Options
const ROBOT_HOVER_BEHAVIORS = [
    { id: 'giggle', name: 'Happy Shake', desc: 'Cute wiggle', emoji: '🎵' },
    { id: 'wave', name: 'Wave Hello', desc: 'Friendly greeting', emoji: '👋' },
    { id: 'surprise', name: 'Surprise', desc: 'Reacts to mouse', emoji: '😲' },
    { id: 'none', name: 'Ignore', desc: 'No reaction', emoji: '😐' },
];

const ROBOT_CLICK_BEHAVIORS = [
    { id: 'none', name: 'None', desc: 'No reaction', emoji: '🚫' },
    { id: 'nod', name: 'Nod', desc: 'Acknowledges click', emoji: '👍' },
    { id: 'jump', name: 'Jump', desc: 'Excited hop', emoji: '☝️' },
    { id: 'wink', name: 'Wink', desc: 'Playful wink', emoji: '😉' },
    { id: 'close-eyes', name: 'Close Eyes', desc: 'Sleepy blink', emoji: '😴' },
];

const ICON_HOVER_BEHAVIORS = [
    { id: 'none', name: 'None', desc: 'No hover effect', emoji: '🚫' },
    { id: 'bounce', name: 'Bounce', desc: 'Gentle bounce', emoji: '⬆️' },
    { id: 'tilt', name: 'Tilt', desc: 'Playful lean', emoji: '📐' },
    { id: 'pulse', name: 'Pulse', desc: 'Gentle heartbeat', emoji: '💓' },
    { id: 'scale', name: 'Scale Up', desc: 'Simple zoom', emoji: '🔍' },
];

const ICON_CLICK_BEHAVIORS = [
    { id: 'none', name: 'None', desc: 'No click effect', emoji: '🚫' },
    { id: 'ripple-burst', name: 'Ripple', desc: 'Energy shockwave', emoji: '🌊' },
    { id: 'pop', name: 'Pop', desc: 'Tactile press', emoji: '🍩' },
    { id: 'shake', name: 'Shake', desc: 'Vibrate alert', emoji: '📳' },
    { id: 'flip', name: 'Flip', desc: '3D Rotation', emoji: '🔄' },
];

// Robot Animations (Character Personality)
const ROBOT_ANIMATIONS = [
    {
        id: 'none',
        name: 'None',
        desc: 'No animation',
        emoji: '🚫'
    },
    {
        id: 'float',
        name: 'Zero-G Float',
        desc: 'Calm floating in space',
        emoji: '🌊'
    },
    {
        id: 'wave',
        name: 'The Wave',
        desc: 'Friendly hello gesture',
        emoji: '👋'
    },
    {
        id: 'bounce',
        name: 'Hyper Bounce',
        desc: 'Excited energy burst',
        emoji: '⚡'
    },
    {
        id: 'peep',
        name: 'Curious Peep',
        desc: 'Playful head tilt',
        emoji: '👀'
    },
    {
        id: 'glitch',
        name: 'Glitch Mode',
        desc: 'Cyberpunk hologram',
        emoji: '✨'
    },
    {
        id: 'spin',
        name: 'Happy Wiggle',
        desc: 'Cute energetic sway',
        emoji: '🎵'
    },
];

// Simple Icon Animations (Abstract Energy)
const SIMPLE_ANIMATIONS = [
    {
        id: 'none',
        name: 'None',
        desc: 'No animation',
        emoji: '🚫'
    },
    {
        id: 'ripple',
        name: 'Sonar Ripple',
        desc: 'Expanding wave rings',
        emoji: '〰️'
    },
    {
        id: 'pulse',
        name: 'Soft Pulse',
        desc: 'Breathing effect',
        emoji: '💓'
    },
    {
        id: 'glow',
        name: 'Neon Glow',
        desc: 'Radiant aura',
        emoji: '✨'
    },
    {
        id: 'morph',
        name: 'Liquid Morph',
        desc: 'Organic shape shift',
        emoji: '💧'
    },

    {
        id: 'shake',
        name: 'Shake Alert',
        desc: 'Attention grabber',
        emoji: '🔔'
    },
    {
        id: 'bounce',
        name: 'Bounce',
        desc: 'Playful jump',
        emoji: '🏀'
    },
    {
        id: 'swing',
        name: 'Swing',
        desc: 'Pendulum sway',
        emoji: '⏰'
    },
    {
        id: 'beat',
        name: 'Heartbeat',
        desc: 'Rhythmic throb',
        emoji: '❤️'
    },
    {
        id: 'tilt',
        name: '3D Tilt',
        desc: 'Perspective shift',
        emoji: '📐'
    },
];

// Entrance Animations
const ENTRANCE_ANIMATIONS = [
    { id: 'popup', name: 'Pop Up', desc: 'Bounce from bottom', emoji: '⬆️' },
    { id: 'slide', name: 'Slide In', desc: 'Smooth slide', emoji: '➡️' },
    { id: 'fade', name: 'Fade In', desc: 'Ghost appearance', emoji: '👻' },
    { id: 'zoom', name: 'Zoom In', desc: 'Scale up from zero', emoji: '🔍' },
    { id: 'elastic', name: 'Elastic', desc: 'Bouncy arrival', emoji: '🏀' },
    { id: 'rotate', name: 'Twist In', desc: 'Spin entry', emoji: '🔄' },
];
export function CustomizeTab({ config, orgId, initialConfig }: CustomizeTabProps) {
    const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(() => {
        // Priority: Passed initialConfig > LocalStorage Fallback > Default
        if (initialConfig && Object.keys(initialConfig).length > 0) {
            // Merge with default to ensure all fields exist if schema updates
            return { ...defaultConfig, ...initialConfig };
        }
        return defaultConfig;
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<'identity' | 'colors' | 'position' | 'animation' | 'behavior' | 'window'>('identity');
    const [activeColorPart, setActiveColorPart] = useState<'body' | 'eyes' | 'cheeks' | 'lips' | 'ears' | 'eyebrows'>('body');
    const [activeIconPart, setActiveIconPart] = useState<'box' | 'icon'>('box');
    const [activeMotionTab, setActiveMotionTab] = useState<'icon' | 'box'>('icon');

    // Sync initialConfig if it arrives later (async fetch)
    useEffect(() => {
        console.log("CustomizeTab received initialConfig:", initialConfig);
        if (initialConfig && Object.keys(initialConfig).length > 0) {
            console.log("Syncing widgetConfig from backend data");
            setWidgetConfig(prev => ({
                ...defaultConfig,
                ...initialConfig
            }));
        }
    }, [initialConfig]);

    useEffect(() => {
        localStorage.setItem('cluaiz-widget-config', JSON.stringify(widgetConfig));
        window.dispatchEvent(new CustomEvent('cluaiz-config-update', {
            detail: widgetConfig
        }));
    }, [widgetConfig]);

    const updateIcon = (key: keyof WidgetConfig['icon'], value: any) => {
        setWidgetConfig(prev => ({
            ...prev,
            icon: { ...prev.icon, [key]: value }
        }));
    };

    const updatePosition = (key: keyof WidgetConfig['position'], value: any) => {
        setWidgetConfig(prev => ({
            ...prev,
            position: { ...prev.position, [key]: value }
        }));
    };

    const updateTheme = (key: keyof WidgetConfig['theme'], value: any) => {
        setWidgetConfig(prev => ({
            ...prev,
            theme: { ...prev.theme, [key]: value }
        }));
    };

    const updateRobot = (key: keyof WidgetConfig['robot'], value: any) => {
        setWidgetConfig(prev => ({
            ...prev,
            robot: { ...prev.robot, [key]: value }
        }));
    };

    const updateBehavior = (category: 'robot' | 'icon', type: 'hover' | 'click', value: string) => {
        setWidgetConfig(prev => ({
            ...prev,
            behavior: {
                ...prev.behavior,
                [category]: {
                    ...prev.behavior[category],
                    [type]: value
                }
            }
        }));
    };

    const updateAnimation = (key: keyof WidgetConfig['animation'], value: any) => {
        setWidgetConfig(prev => ({
            ...prev,
            animation: { ...prev.animation, [key]: value }
        }));
    };

    const updateWindow = (key: keyof WidgetConfig['window'], value: any) => {
        setWidgetConfig(prev => ({
            ...prev,
            window: { ...prev.window, [key]: value }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // If on Window section, save via WindowDesigner
            if (activeSection === 'window' && (window as any).saveWindowDesigner) {
                await (window as any).saveWindowDesigner();
            } else {
                // Original save logic for all other tabs
                await botConfigService.saveBotConfig('default-bot', {
                    widgetConfig: widgetConfig,
                    orgId: orgId
                });

                // Dispatch event for widget update
                window.dispatchEvent(new CustomEvent('cluaiz-config-update', {
                    detail: widgetConfig
                }));
            }

            toast({
                title: "✅ Configuration Saved!",
                description: "Your widget design has been updated."
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Save error:", error);
            toast({
                title: "❌ Error",
                description: "Failed to save configuration.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Determine which animations to show based on icon type
    const isRobot = widgetConfig.icon.type === 'robot' || widgetConfig.icon.type === 'cluaiz3bairobot';
    const currentAnimations = isRobot ? ROBOT_ANIMATIONS : SIMPLE_ANIMATIONS;
    const currentAnimation = isRobot ? widgetConfig.animation.robot : widgetConfig.animation.simple;

    return (
        <>
            {/*             <DebugPanel
                orgId={orgId}
                isEditing={isEditing}
                initialConfig={initialConfig}
                widgetConfig={widgetConfig}
            /> */}
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center w-[100%] px-8 py-6 border-b border-white/5">
                    <div className="">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Widget Customization Studio
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Design your perfect chatbot widget with live preview</p>
                    </div>

                    <div className="flex gap-3">
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-6 rounded-xl text-base font-medium transition-all duration-300"
                            >
                                <Edit2 className="w-5 h-5 mr-2" />
                                Edit Configuration
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Ideally revert changes here, but for now just exit mode
                                        // We would need a 'previousConfig' state to revert properly
                                        if (initialConfig) setWidgetConfig({ ...defaultConfig, ...initialConfig });
                                    }}
                                    variant="ghost"
                                    className="text-slate-400 hover:text-white px-4 py-6 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-6 rounded-xl text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                                >
                                    {isSaving ? (
                                        <>Saving...</>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Section Navigation */}
                <div className="px-8 py-4 border-b border-white/5">
                    <div className="max-w-7xl mx-auto flex gap-3">
                        {[
                            { id: 'identity', label: 'Identity', icon: Bot },
                            { id: 'colors', label: 'Colors', icon: Palette },
                            { id: 'position', label: 'Position', icon: MapPin },
                            { id: 'animation', label: 'Motion', icon: Zap },
                            { id: 'behavior', label: 'Behavior', icon: Sparkles },
                            { id: 'window', label: 'Window', icon: MessageCircle }
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveSection(id as any)}
                                className={`group relative px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${activeSection === id
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    <span>{label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-8 py-8">
                    <div className={`max-w-7xl mx-auto transition-opacity duration-300 ${!isEditing ? 'pointer-events-none opacity-80' : ''}`}>
                        {/* Identity Section */}
                        {activeSection === 'identity' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Choose Your Bot Identity</h3>
                                    <p className="text-slate-400 text-sm mb-6">Select the icon that best represents your brand</p>

                                    <div className="grid grid-cols-4 gap-6">
                                        {[
                                            { type: 'robot', icon: Bot, label: 'Animated Robot', desc: 'Interactive bot with personality' },
                                            {
                                                type: 'cluaiz3bairobot',
                                                icon: Sparkles,
                                                label: 'Cluaiz Emo (3D)',
                                                desc: 'Advanced Real-time 3D AI'
                                            },
                                            {
                                                type: 'chat',
                                                customIcon: (
                                                    <svg viewBox="0 0 116 123" className="w-12 h-12 mx-auto mb-4" style={{ fill: 'currentColor' }}>
                                                        <path d="M17.2,0h59.47c4.73,0,9.03,1.93,12.15,5.05c3.12,3.12,5.05,7.42,5.05,12.15v38.36c0,4.73-1.93,9.03-5.05,12.15 c-3.12,3.12-7.42,5.05-12.15,5.05H46.93L20.81,95.21c-1.21,1.04-3.04,0.9-4.08-0.32c-0.51-0.6-0.74-1.34-0.69-2.07l1.39-20.07H17.2 c-4.73,0-9.03-1.93-12.15-5.05C1.93,64.59,0,60.29,0,55.56V17.2c0-4.73,1.93-9.03,5.05-12.15C8.16,1.93,12.46,0,17.2,0L17.2,0z M102.31,27.98c3.37,0.65,6.39,2.31,8.73,4.65c3.05,3.05,4.95,7.26,4.95,11.9v38.36c0,4.64-1.89,8.85-4.95,11.9 c-3.05,3.05-7.26,4.95-11.9,4.95h-0.61l1.42,20.44l0,0c0.04,0.64-0.15,1.3-0.6,1.82c-0.91,1.07-2.52,1.19-3.58,0.28l-26.22-23.2 H35.01l17.01-17.3h36.04c7.86,0,14.3-6.43,14.3-14.3V29.11C102.35,28.73,102.34,28.35,102.31,27.98L102.31,27.98z M25.68,43.68 c-1.6,0-2.9-1.3-2.9-2.9c0-1.6,1.3-2.9,2.9-2.9h30.35c1.6,0,2.9,1.3,2.9,2.9c0,1.6-1.3,2.9-2.9,2.9H25.68L25.68,43.68z M25.68,29.32c-1.6,0-2.9-1.3-2.9-2.9c0-1.6,1.3-2.9,2.9-2.9H68.7c1.6,0,2.9,1.3,2.9,2.9c0,1.6-1.3,2.9-2.9,2.9H25.68L25.68,29.32z M76.66,5.8H17.2c-3.13,0-5.98,1.28-8.05,3.35C7.08,11.22,5.8,14.06,5.8,17.2v38.36c0,3.13,1.28,5.98,3.35,8.05 c2.07,2.07,4.92,3.35,8.05,3.35h3.34v0.01l0.19,0.01c1.59,0.11,2.8,1.49,2.69,3.08l-1.13,16.26L43.83,67.8 c0.52-0.52,1.24-0.84,2.04-0.84h30.79c3.13,0,5.98-1.28,8.05-3.35c2.07-2.07,3.35-4.92,3.35-8.05V17.2c0-3.13-1.28-5.98-3.35-8.05 C82.65,7.08,79.8,5.8,76.66,5.8L76.66,5.8z" />
                                                    </svg>
                                                ),
                                                label: 'Chat',
                                                desc: 'Classic chat style'
                                            },
                                            {
                                                type: 'message',
                                                customIcon: (
                                                    <svg viewBox="0 0 123 107" className="w-12 h-12 mx-auto mb-4" style={{ fill: 'currentColor' }}>
                                                        <path d="M56,92.15a38.3,38.3,0,0,0,11.23,5.78c8.41,2.66,17.75,2.25,27.12-1.74a2.72,2.72,0,0,1,2-.08l12,4L107,90.36a2.78,2.78,0,0,1,1-2.53,28.41,28.41,0,0,0,6.31-6.8,17.53,17.53,0,0,0,2.73-12.47,27,27,0,0,0-6-12.5c-.6-.76-1.25-1.5-1.92-2.23h0a42.62,42.62,0,0,0,1.27-6.59,50,50,0,0,1,5,5.34,32.71,32.71,0,0,1,7.14,15.14A23,23,0,0,1,119.05,84a32.7,32.7,0,0,1-6.29,7.12l1.61,12.4a2.79,2.79,0,0,1-3.6,3.21l-15.24-5a43.85,43.85,0,0,1-30,1.53A45,45,0,0,1,47.47,92.16c.65,0,1.33.06,2.06.09,2.18.06,4.34,0,6.46-.1ZM72.11,35.22a6.39,6.39,0,1,1-6.38,6.39,6.39,6.39,0,0,1,6.38-6.39Zm-42.18,0a6.39,6.39,0,1,1-6.38,6.39,6.39,6.39,0,0,1,6.38-6.39Zm21.09,0a6.39,6.39,0,1,1-6.38,6.39A6.38,6.38,0,0,1,51,35.22ZM52.3,0h.05C66.29.46,78.79,5.42,87.74,13.09,96.89,20.93,102.37,31.6,102,43.26v0c-.36,11.66-6.48,22-16.1,29.3-9.41,7.14-22.22,11.36-36.16,11A62.05,62.05,0,0,1,38.5,82.2a58.64,58.64,0,0,1-9.43-2.87l-22.83,9,7.65-18.19a42.35,42.35,0,0,1-10-12.73A35.22,35.22,0,0,1,0,40.3C.37,28.63,6.49,18.28,16.11,11,25.53,3.83,38.33-.38,52.28,0Zm-.17,6.35h-.05C39.62,6,28.25,9.74,19.94,16,11.83,22.2,6.66,30.83,6.37,40.47A29.15,29.15,0,0,0,9.56,54.53,36.92,36.92,0,0,0,19.7,66.69l1.89,1.51-3.65,8.67,11.21-4.41,1.2.51a52.07,52.07,0,0,0,9.47,3A57,57,0,0,0,49.94,77.2c12.47.36,23.85-3.36,32.16-9.66,8.11-6.16,13.28-14.79,13.57-24.43v0C96,33.44,91.32,24.54,83.6,17.92c-7.91-6.78-19-11.16-31.45-11.54Z" />
                                                    </svg>
                                                ),
                                                label: 'Speech Bubble',
                                                desc: 'Direct messaging style'
                                            },
                                            {
                                                type: 'sparkles',
                                                customIcon: (
                                                    <svg viewBox="0 0 123 119" className="w-12 h-12 mx-auto mb-4" style={{ fill: 'currentColor' }}>
                                                        <path d="M57.49,29.2V23.53a14.41,14.41,0,0,1-2-.93A12.18,12.18,0,0,1,50.44,7.5a12.39,12.39,0,0,1,2.64-3.95A12.21,12.21,0,0,1,57,.92,12,12,0,0,1,61.66,0,12.14,12.14,0,0,1,72.88,7.5a12.14,12.14,0,0,1,0,9.27,12.08,12.08,0,0,1-2.64,3.94l-.06.06a12.74,12.74,0,0,1-2.36,1.83,11.26,11.26,0,0,1-2,.93V29.2H94.3a15.47,15.47,0,0,1,15.42,15.43v2.29H115a7.93,7.93,0,0,1,7.9,7.91V73.2A7.93,7.93,0,0,1,115,81.11h-5.25v2.07A15.48,15.48,0,0,1,94.3,98.61H55.23L31.81,118.72a2.58,2.58,0,0,1-3.65-.29,2.63,2.63,0,0,1-.63-1.85l1.25-18h-.21A15.45,15.45,0,0,1,13.16,83.18V81.11H7.91A7.93,7.93,0,0,1,0,73.2V54.83a7.93,7.93,0,0,1,7.9-7.91h5.26v-2.3A15.45,15.45,0,0,1,28.57,29.2H57.49ZM82.74,47.32a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm-42.58,0a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm6.38,31.36a2.28,2.28,0,0,1-.38-.38,2.18,2.18,0,0,1-.52-1.36,2.21,2.21,0,0,1,.46-1.39,2.4,2.4,0,0,1,.39-.39,3.22,3.22,0,0,1,3.88-.08A22.36,22.36,0,0,0,56,78.32a14.86,14.86,0,0,0,5.47,1A16.18,16.18,0,0,0,67,78.22,25.39,25.39,0,0,0,72.75,75a3.24,3.24,0,0,1,3.89.18,3,3,0,0,1,.37.41,2.22,2.22,0,0,1,.42,1.4,2.33,2.33,0,0,1-.58,1.35,2.29,2.29,0,0,1-.43.38,30.59,30.59,0,0,1-7.33,4,22.28,22.28,0,0,1-7.53,1.43A21.22,21.22,0,0,1,54,82.87a27.78,27.78,0,0,1-7.41-4.16l0,0ZM94.29,34.4H28.57A10.26,10.26,0,0,0,18.35,44.63V83.18A10.26,10.26,0,0,0,28.57,93.41h3.17a2.61,2.61,0,0,1,2.41,2.77l-1,14.58L52.45,94.15a2.56,2.56,0,0,1,1.83-.75h40a10.26,10.26,0,0,0,10.22-10.23V44.62A10.24,10.24,0,0,0,94.29,34.4Z" />
                                                    </svg>
                                                ),
                                                label: 'AI Bot',
                                                desc: 'Smart assistant avatar'
                                            },
                                            {
                                                type: 'comment',
                                                customIcon: (
                                                    <svg viewBox="0 0 122.88 122.09" className="w-12 h-12 mx-auto mb-4" style={{ fill: 'currentColor' }}>
                                                        <path d="M31.23,113.89,30,115.11a5.2,5.2,0,0,1-9-3.48V99.45H19.39A9,9,0,0,1,13,96.79a9.28,9.28,0,0,1-1.82-2.61h-.44A10.75,10.75,0,0,1,0,83.45V10.73A10.68,10.68,0,0,1,2.8,3.56l.36-.4A10.72,10.72,0,0,1,10.73,0h94.41A10.81,10.81,0,0,1,115.7,8.79a9.2,9.2,0,0,1,4.51,2.47,9.05,9.05,0,0,1,2.67,6.4V90.38a9.08,9.08,0,0,1-9.07,9.07h-54L37.39,120.93a3.54,3.54,0,0,1-6.16-2.37v-4.67ZM27.94,60.37a3.54,3.54,0,0,1,0-7.07H76.87a3.54,3.54,0,1,1,0,7.07Zm0-23a3.54,3.54,0,0,1,0-7.07h60a3.54,3.54,0,0,1,0,7.07ZM26.1,111.63,49.71,89h55.43a5.55,5.55,0,0,0,5.54-5.53V10.73a5.58,5.58,0,0,0-5.54-5.53H10.73A5.59,5.59,0,0,0,5.2,10.73V83.45A5.57,5.57,0,0,0,10.73,89H26.1v22.65Z" />
                                                    </svg>
                                                ),
                                                label: 'Comment Bubble',
                                                desc: 'Modern chat style'
                                            },
                                            {
                                                type: 'icon6',
                                                customIcon: (
                                                    <svg viewBox="0 0 122.88 86.411" className="w-12 h-12 mx-auto mb-4" style={{ fill: 'currentColor' }}>
                                                        <g><path d="M57.055,28.881c-3.2,0-5.796,2.596-5.796,5.796s2.596,5.796,5.796,5.796c3.201,0,5.796-2.596,5.796-5.796 S60.255,28.881,57.055,28.881L57.055,28.881z M21.489,28.881c-3.201,0-5.796,2.596-5.796,5.796s2.596,5.796,5.796,5.796 s5.796-2.596,5.796-5.796S24.689,28.881,21.489,28.881L21.489,28.881z M39.271,28.881c-3.201,0-5.796,2.596-5.796,5.796 s2.595,5.796,5.796,5.796s5.796-2.596,5.796-5.796S42.472,28.881,39.271,28.881L39.271,28.881z M83.299,8.182h25.468 c7.763,0,14.113,6.351,14.113,14.113v24.907c0,7.761-6.352,14.113-14.113,14.113H97.803c1.568,6.206,3.468,11.781,9.272,16.929 c-11.098-2.838-19.665-8.576-25.952-16.929h-1.896c-0.736,0-1.509-0.059-2.302-0.168c4.193-3.396,7.105-7.659,7.105-12.275V38.493 c0.926,0.643,2.052,1.021,3.264,1.021c3.164,0,5.73-2.566,5.73-5.729s-2.566-5.729-5.73-5.729c-1.212,0-2.338,0.377-3.264,1.02 V13.535C84.031,11.683,83.774,9.888,83.299,8.182L83.299,8.182z M105.571,28.056c-3.164,0-5.729,2.566-5.729,5.729 s2.565,5.729,5.729,5.729s5.729-2.566,5.729-5.729S108.735,28.056,105.571,28.056L105.571,28.056z M19.542,0H59h0.004v0.014 c5.386,0.002,10.27,2.193,13.8,5.724l-0.007,0.007c3.536,3.539,5.73,8.422,5.731,13.796h0.014v0.002h-0.014v28.184h0.014v0.003 h-0.014c-0.002,5.746-3.994,10.752-9.312,14.248c-4.951,3.256-11.204,5.277-16.247,5.277v0.015h-0.002v-0.015h-0.404 c-3.562,4.436-7.696,8.225-12.429,11.333c-5.235,3.438-11.157,6.028-17.799,7.727l-0.003-0.012c-1.25,0.315-2.628-0.06-3.541-1.091 c-1.302-1.472-1.165-3.721,0.307-5.023c2.896-2.567,4.816-5.239,6.207-8.041c0.774-1.559,1.398-3.188,1.939-4.878h-7.702h-0.004 v-0.015c-5.385-0.001-10.27-2.193-13.799-5.723c-3.532-3.531-5.724-8.417-5.725-13.804H0v-0.002h0.014V19.542H0v-0.005h0.014 C0.016,14.263,2.126,9.466,5.541,5.952c0.062-0.073,0.127-0.145,0.196-0.214c3.531-3.531,8.417-5.724,13.803-5.725V0H19.542 L19.542,0z" /></g>
                                                    </svg>
                                                ),
                                                label: 'Crown',
                                                desc: 'Premium identity'
                                            },
                                            {
                                                type: 'icon7',
                                                customIcon: (
                                                    <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto mb-4" style={{ fill: 'currentColor' }}>
                                                        <g fill="none">
                                                            <path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z" />
                                                            <path fill="currentColor" d="M13 3a1 1 0 1 1 0 2H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3.697a2 2 0 0 1 1.11.336L12 18.798l2.193-1.462a2 2 0 0 1 1.11-.336H19a1 1 0 0 0 1-1v-4a1 1 0 1 1 2 0v4a3 3 0 0 1-3 3h-3.697l-2.61 1.74c-.42.28-.966.28-1.386 0L8.697 19H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm-4.5 7a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3m7 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3M20 1a1 1 0 0 1 .946.677l.13.378c.3.879.99 1.57 1.87 1.87l.377.129a1 1 0 0 1 0 1.892l-.378.13c-.879.3-1.57.99-1.87 1.87l-.129.377a1 1 0 0 1-1.892 0l-.13-.378a3 3 0 0 0-1.87-1.87l-.377-.129a1 1 0 0 1 0-1.892l.378-.13c.879-.3 1.57-.99 1.87-1.87l.129-.377l.062-.146A1 1 0 0 1 20 1m0 3.196a5 5 0 0 1-.804.804q.449.355.804.803q.356-.447.803-.803A5 5 0 0 1 20 4.196" />
                                                        </g>
                                                    </svg>
                                                ),
                                                label: 'Magic Badge',
                                                desc: 'Smart editor style'
                                            },
                                            {
                                                type: 'icon8',
                                                customIcon: (
                                                    <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto mb-4" style={{ fill: 'currentColor' }}>
                                                        <path d="M7.76497 19.225C8.35411 18.9652 9.01479 18.9164 9.63316 19.0861C10.4032 19.2963 11.198 19.4019 12.001 19.4C16.5861 19.4 20.001 16.1135 20.001 11.7C20.001 7.28651 16.5861 4 12.001 4C7.41585 4 4.00098 7.28651 4.00098 11.7C4.00098 13.9699 4.89652 15.9722 6.46655 17.3764C7.0418 17.8853 7.38251 18.6082 7.409 19.3822L7.76497 19.225ZM12.001 2C17.6345 2 22.001 6.1265 22.001 11.7C22.001 17.2735 17.6345 21.4 12.001 21.4C11.0233 21.4023 10.0497 21.273 9.10648 21.0155C8.92907 20.9668 8.7403 20.9808 8.57198 21.055L6.58748 21.931C6.34398 22.0386 6.06291 22.018 5.83768 21.8761C5.61244 21.7342 5.47254 21.4896 5.46448 21.2235L5.40998 19.4445C5.40257 19.2257 5.30547 19.0196 5.14148 18.8745C3.19598 17.1345 2.00098 14.6155 2.00098 11.7C2.00098 6.1265 6.36748 2 12.001 2ZM5.99598 14.5365L8.93348 9.8765C9.15689 9.5221 9.51834 9.27728 9.93034 9.2013C10.3423 9.12532 10.7673 9.22511 11.1025 9.4765L13.439 11.2265C13.6528 11.3878 13.9476 11.3878 14.1615 11.2265L17.317 8.8315C17.738 8.512 18.288 9.016 18.006 9.4635L15.0685 14.1235C14.8451 14.4779 14.4836 14.7227 14.0716 14.7987C13.6596 14.8747 13.2346 14.7749 12.8995 14.5235L10.563 12.7735C10.3491 12.6122 10.0543 12.6122 9.84048 12.7735L6.68498 15.1685C6.26398 15.488 5.71398 14.984 5.99598 14.5365Z"></path>
                                                    </svg>
                                                ),
                                                label: 'Analytics',
                                                desc: 'Data insight style'
                                            }
                                        ].map(({ type, icon: Icon, customIcon, label, desc }) => {
                                            const isSelected = widgetConfig.icon.type === type;
                                            const dynColor = widgetConfig.theme.primaryColor || '#3B82F6';
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => updateIcon('type', type)}
                                                    className={`group p-6 rounded-2xl border-2 transition-all duration-300 ${isSelected
                                                        ? 'scale-105'
                                                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                                        }`}
                                                    style={isSelected ? {
                                                        borderColor: dynColor,
                                                        backgroundColor: `${dynColor}18`,
                                                        boxShadow: `0 8px 20px ${dynColor}30`
                                                    } : {}}
                                                >
                                                    {customIcon ? (
                                                        <div
                                                            className={`transition-all duration-300 ${isSelected ? 'scale-110' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-105'}`}
                                                            style={isSelected ? { color: dynColor } : {}}
                                                        >
                                                            {customIcon}
                                                        </div>
                                                    ) : (
                                                        <Icon
                                                            className={`w-12 h-12 mx-auto mb-4 transition-all duration-300 ${isSelected ? 'scale-110' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-105'}`}
                                                            style={isSelected ? { color: dynColor } : {}}
                                                        />
                                                    )}
                                                    <h4
                                                        className={`font-semibold mb-1 transition-colors ${isSelected ? '' : 'text-white'}`}
                                                        style={isSelected ? { color: dynColor } : {}}
                                                    >{label}</h4>
                                                    <p className="text-xs text-slate-500">{desc}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Icon Size</h3>
                                    <p className="text-slate-400 text-sm mb-6">Adjust the size to fit your design</p>

                                    <div className="flex items-center gap-6 max-w-2xl">
                                        <span className="text-sm text-slate-500">XS</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="4"
                                            value={
                                                widgetConfig.icon.size === 'xs' ? 0 :
                                                    widgetConfig.icon.size === 'sm' ? 1 :
                                                        widgetConfig.icon.size === 'md' ? 2 :
                                                            widgetConfig.icon.size === 'lg' ? 3 : 4
                                            }
                                            onChange={(e) => {
                                                const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
                                                updateIcon('size', sizes[parseInt(e.target.value)]);
                                            }}
                                            className="flex-1 premium-slider"
                                        />
                                        <span className="text-sm text-slate-500">XL</span>
                                        <span className="text-blue-400 font-semibold min-w-[80px] text-right uppercase">{widgetConfig.icon.size}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Colors Section */}
                        {activeSection === 'colors' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {widgetConfig.icon.type === 'robot' ? (
                                    <>


                                        <div>
                                            <div className="space-y-6">
                                                {/* Part Selector Tabs */}
                                                <div className="flex flex-wrap gap-2 p-1 bg-black/20 rounded-xl border border-white/10">
                                                    {['body', 'eyes', 'cheeks', 'lips', 'ears', 'eyebrows'].map((part) => (
                                                        <button
                                                            key={part}
                                                            onClick={() => setActiveColorPart(part as any)}
                                                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${activeColorPart === part
                                                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                                                }`}
                                                        >
                                                            {part}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white capitalize">{activeColorPart} Color</h3>
                                                        <p className="text-slate-400 text-sm">
                                                            {activeColorPart === 'body' && widgetConfig.robot.useGradient
                                                                ? 'Select a gradient for the body'
                                                                : `Choose a solid color for ${activeColorPart}`}
                                                        </p>
                                                    </div>

                                                    {/* Gradient Toggle - Only for Body */}
                                                    {activeColorPart === 'body' && (
                                                        <button
                                                            onClick={() => updateRobot('useGradient', !widgetConfig.robot.useGradient)}
                                                            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all border ${widgetConfig.robot.useGradient
                                                                ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {widgetConfig.robot.useGradient ? 'GRADIENT MODE' : 'SOLID MODE'}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Color Grid */}
                                                {activeColorPart === 'body' && widgetConfig.robot.useGradient ? (
                                                    /* Gradient Grid (16) */
                                                    <div className="grid grid-cols-8 gap-3 max-w-4xl">
                                                        {[
                                                            { c1: '#3B82F6', c2: '#1E40AF' }, { c1: '#8B5CF6', c2: '#EC4899' },
                                                            { c1: '#EC4899', c2: '#BE185D' }, { c1: '#14B8A6', c2: '#0D9488' },
                                                            { c1: '#F59E0B', c2: '#DC2626' }, { c1: '#06B6D4', c2: '#0369A1' },
                                                            { c1: '#A855F7', c2: '#7C3AED' }, { c1: '#10B981', c2: '#059669' },
                                                            { c1: '#34D399', c2: '#10B981' }, { c1: '#FB7185', c2: '#F43F5E' },
                                                            { c1: '#C084FC', c2: '#9333EA' }, { c1: '#FBBF24', c2: '#F59E0B' },
                                                            { c1: '#F472B6', c2: '#DB2777' }, { c1: '#60A5FA', c2: '#3B82F6' },
                                                            { c1: '#4ADE80', c2: '#22C55E' }, { c1: '#FB923C', c2: '#F97316' }
                                                        ].map((g, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    updateRobot('gradientColor1', g.c1);
                                                                    updateRobot('gradientColor2', g.c2);
                                                                    updateRobot('gradientAngle', 135);
                                                                }}
                                                                className={`aspect-square rounded-xl transition-all duration-300 ${widgetConfig.robot.gradientColor1 === g.c1 && widgetConfig.robot.gradientColor2 === g.c2
                                                                    ? 'ring-4 ring-white shadow-xl z-10'
                                                                    : 'hover:ring-2 hover:ring-white/50 shadow-md'
                                                                    }`}
                                                                style={{ background: `linear-gradient(135deg, ${g.c1}, ${g.c2})` }}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    /* Solid Grid (32) */
                                                    <div className="grid grid-cols-8 gap-3 max-w-4xl">
                                                        {[
                                                            '#FFFFFF', '#94A3B8', '#475569', '#0F172A', '#000000', // Grays
                                                            '#FECACA', '#EF4444', '#B91C1C', '#7F1D1D', // Reds
                                                            '#FED7AA', '#F97316', '#C2410C', '#7C2D12', // Oranges
                                                            '#FEF08A', '#FACC15', '#A16207', '#713F12', // Yellows
                                                            '#BBF7D0', '#4ADE80', '#16A34A', '#14532D', // Greens
                                                            '#BFDBFE', '#60A5FA', '#2563EB', '#1E3A8A', // Blues
                                                            '#DDD6FE', '#8B5CF6', '#6D28D9', '#4C1D95', // Violets
                                                            '#FBCFE8', '#EC4899', '#DB2777', '#831843'  // Pinks
                                                        ].map(color => {
                                                            const keyMap: Record<string, keyof WidgetConfig['robot']> = { body: 'bodyColor', eyes: 'eyeColor', cheeks: 'cheekColor', lips: 'lipColor', ears: 'earColor', eyebrows: 'eyebrowColor' };
                                                            const targetKey = keyMap[activeColorPart];
                                                            const isActive = widgetConfig.robot[targetKey] === color;

                                                            return (
                                                                <button
                                                                    key={color}
                                                                    onClick={() => updateRobot(targetKey as any, color)}
                                                                    className={`aspect-square rounded-xl transition-all duration-300 ${isActive
                                                                        ? 'ring-4 ring-white shadow-xl z-10'
                                                                        : 'hover:ring-2 hover:ring-white/50 shadow-md'
                                                                        }`}
                                                                    style={{ backgroundColor: color }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Custom Input */}
                                                {!widgetConfig.robot.useGradient &&
                                                    <div className="mt-4 flex w-fit items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                                                        <Label className="text-sm font-semibold text-white whitespace-nowrap">Custom Hex:</Label>
                                                        <div className=" flex gap-2  items-center bg-white/5 rounded-lg border border-white/20 p-2">
                                                            {(() => {
                                                                const keyMap: Record<string, keyof WidgetConfig['robot']> = { body: 'bodyColor', eyes: 'eyeColor', cheeks: 'cheekColor', lips: 'lipColor', ears: 'earColor', eyebrows: 'eyebrowColor' };
                                                                const targetKey = keyMap[activeColorPart];
                                                                const value = widgetConfig.robot[targetKey] as string;

                                                                return (
                                                                    <>
                                                                        <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: value }} />
                                                                        <span className="text-slate-400 font-mono">#</span>
                                                                        <input
                                                                            type="text"
                                                                            value={value?.replace('#', '') || ''}
                                                                            onChange={(e) => updateRobot(targetKey as any, '#' + e.target.value.replace('#', ''))}
                                                                            className="flex-1 bg-transparent border-none text-white font-mono text-sm focus:ring-0 px-1"
                                                                            placeholder="000000"
                                                                            maxLength={6}
                                                                        />
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                }

                                                {/* Gradient Inputs if Body + UseGradient */}
                                                {activeColorPart === 'body' && widgetConfig.robot.useGradient && (
                                                    <div className="mt-4 flex gap-6">
                                                        <div className="flex items-center w-fit gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                                            <Label className="text-xs font-semibold text-slate-400">Start:</Label>
                                                            <div className=" flex gap-2  items-center bg-white/5 rounded-lg border border-white/20 p-2">
                                                                <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: widgetConfig.robot.gradientColor1 }} />
                                                                <span className="text-slate-500 font-mono text-xs">#</span>
                                                                <input
                                                                    type="text"
                                                                    value={widgetConfig.robot.gradientColor1.replace('#', '')}
                                                                    onChange={(e) => updateRobot('gradientColor1', '#' + e.target.value.replace('#', ''))}
                                                                    className="flex-1 min-w-0 bg-transparent border-none text-white font-mono text-xs focus:ring-0 p-1"
                                                                    placeholder="Start"
                                                                    maxLength={6}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center w-fit gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                                            <Label className="text-xs font-semibold text-slate-400">End:</Label>
                                                            <div className=" flex gap-2  items-center bg-white/5 rounded-lg border border-white/20 p-2">
                                                                <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: widgetConfig.robot.gradientColor2 }} />
                                                                <span className="text-slate-500 font-mono text-xs">#</span>
                                                                <input
                                                                    type="text"
                                                                    value={widgetConfig.robot.gradientColor2.replace('#', '')}
                                                                    onChange={(e) => updateRobot('gradientColor2', '#' + e.target.value.replace('#', ''))}
                                                                    className="flex-1 min-w-0 bg-transparent border-none text-white font-mono text-xs focus:ring-0 p-1"
                                                                    placeholder="End"
                                                                    maxLength={6}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <div className="space-y-6">
                                            {/* Icon Part Selector */}
                                            <div className="flex p-1 bg-black/20 rounded-xl border border-white/10">
                                                {['box', 'icon'].map((part) => (
                                                    <button
                                                        key={part}
                                                        onClick={() => setActiveIconPart(part as any)}
                                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${activeIconPart === part
                                                            ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        {part}
                                                    </button>
                                                ))}
                                            </div>

                                            <h3 className="text-lg font-semibold text-white capitalize">{activeIconPart} Design</h3>

                                            {/* Box Color Logic */}
                                            {activeIconPart === 'box' && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between mb-2 bg-white/5 p-3 rounded-xl border border-white/10">
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-white">Show Background</h3>
                                                            <p className="text-xs text-slate-500">Enable container box</p>
                                                        </div>
                                                        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                                                            <button onClick={() => updateTheme('showBox', true)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${widgetConfig.theme.showBox ? 'bg-blue-500 text-white shadow' : 'text-slate-500 hover:text-white'}`}>On</button>
                                                            <button onClick={() => updateTheme('showBox', false)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${!widgetConfig.theme.showBox ? 'bg-red-500 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Off</button>
                                                        </div>
                                                    </div>
                                                    <div className={`space-y-4 transition-all duration-300 ${!widgetConfig.theme.showBox ? 'opacity-30 pointer-events-none grayscale blur-sm' : ''}`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="text-sm font-semibold text-white">Background Style</h3>
                                                            <button
                                                                onClick={() => updateTheme('useGradient', !widgetConfig.theme.useGradient)}
                                                                className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-300 ${widgetConfig.theme.useGradient
                                                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                                                    : 'bg-white/10 text-slate-400 hover:bg-white/20'
                                                                    }`}
                                                            >
                                                                {widgetConfig.theme.useGradient ? '🎨 Gradient' : 'Solid'}
                                                            </button>
                                                        </div>

                                                        {!widgetConfig.theme.useGradient ? (
                                                            /* Solid Mode */
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-8 gap-3 max-w-4xl">
                                                                    {[
                                                                        '#FFFFFF', '#94A3B8', '#475569', '#0F172A', '#000000',
                                                                        '#FECACA', '#EF4444', '#B91C1C', '#7F1D1D',
                                                                        '#FED7AA', '#F97316', '#C2410C', '#7C2D12',
                                                                        '#FEF08A', '#FACC15', '#A16207', '#713F12',
                                                                        '#BBF7D0', '#4ADE80', '#16A34A', '#14532D',
                                                                        '#BFDBFE', '#60A5FA', '#2563EB', '#1E3A8A',
                                                                        '#DDD6FE', '#8B5CF6', '#6D28D9', '#4C1D95',
                                                                        '#FBCFE8', '#EC4899', '#DB2777', '#831843'
                                                                    ].map(color => (
                                                                        <button
                                                                            key={color}
                                                                            onClick={() => {
                                                                                updateTheme('primaryColor', color);
                                                                                updateTheme('secondaryColor', color);
                                                                            }}
                                                                            className={`aspect-square rounded-xl transition-all duration-300 ${widgetConfig.theme.primaryColor === color && widgetConfig.theme.secondaryColor === color
                                                                                ? 'ring-4 ring-white shadow-xl z-10'
                                                                                : 'hover:ring-2 hover:ring-white/50 shadow-md'
                                                                                }`}
                                                                            style={{ backgroundColor: color }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                {/* Custom Solid Input */}
                                                                <div className="mt-4 flex w-fit items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                                                                    <Label className="text-sm font-semibold text-white whitespace-nowrap">Custom Hex:</Label>
                                                                    <div className="flex gap-2 items-center bg-white/5 rounded-lg border border-white/20 p-2">
                                                                        <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: widgetConfig.theme.primaryColor }} />
                                                                        <span className="text-slate-400 font-mono">#</span>
                                                                        <input
                                                                            type="text"
                                                                            value={widgetConfig.theme.primaryColor.replace('#', '')}
                                                                            onChange={(e) => {
                                                                                const val = '#' + e.target.value.replace('#', '');
                                                                                updateTheme('primaryColor', val);
                                                                                updateTheme('secondaryColor', val);
                                                                            }}
                                                                            className="flex-1 bg-transparent border-none text-white font-mono text-sm focus:ring-0 px-1"
                                                                            placeholder="000000"
                                                                            maxLength={6}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Gradient Mode */

                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-8 gap-3 max-w-4xl">
                                                                    {[
                                                                        { c1: '#3B82F6', c2: '#1E40AF' }, { c1: '#8B5CF6', c2: '#EC4899' },
                                                                        { c1: '#EC4899', c2: '#BE185D' }, { c1: '#14B8A6', c2: '#0D9488' },
                                                                        { c1: '#F59E0B', c2: '#DC2626' }, { c1: '#06B6D4', c2: '#0369A1' },
                                                                        { c1: '#A855F7', c2: '#7C3AED' }, { c1: '#10B981', c2: '#059669' },
                                                                        { c1: '#34D399', c2: '#10B981' }, { c1: '#FB7185', c2: '#F43F5E' },
                                                                        { c1: '#C084FC', c2: '#9333EA' }, { c1: '#FBBF24', c2: '#F59E0B' },
                                                                        { c1: '#F472B6', c2: '#DB2777' }, { c1: '#60A5FA', c2: '#3B82F6' },
                                                                        { c1: '#4ADE80', c2: '#22C55E' }, { c1: '#FB923C', c2: '#F97316' }
                                                                    ].map((g, idx) => (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={() => {
                                                                                updateTheme('primaryColor', g.c1);
                                                                                updateTheme('secondaryColor', g.c2);
                                                                            }}
                                                                            className={`aspect-square rounded-xl transition-all duration-300 ${widgetConfig.theme.primaryColor === g.c1
                                                                                ? 'ring-4 ring-white shadow-xl z-10'
                                                                                : 'hover:ring-2 hover:ring-white/50 shadow-md'
                                                                                }`}
                                                                            style={{ background: `linear-gradient(135deg, ${g.c1}, ${g.c2})` }}
                                                                        />
                                                                    ))}
                                                                </div>

                                                                {/* Manual Gradient Inputs */}
                                                                <div className="mt-4 flex gap-6">
                                                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 w-fit">
                                                                        <Label className="text-xs font-semibold text-slate-400">Start:</Label>
                                                                        <div className="flex-1 flex gap-2 items-center bg-black/20 rounded border border-white/10 p-2">
                                                                            <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: widgetConfig.theme.primaryColor }} />
                                                                            <input
                                                                                type="text"
                                                                                value={widgetConfig.theme.primaryColor.replace('#', '')}
                                                                                onChange={(e) => updateTheme('primaryColor', '#' + e.target.value.replace('#', ''))}
                                                                                className="flex-1 min-w-0 bg-transparent border-none text-white font-mono text-xs focus:ring-0 p-1"
                                                                                maxLength={6}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 w-fit">
                                                                        <Label className="text-xs font-semibold text-slate-400">End:</Label>
                                                                        <div className="flex-1 flex gap-2 items-center bg-black/20 rounded border border-white/10 p-2">
                                                                            <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: widgetConfig.theme.secondaryColor }} />
                                                                            <input
                                                                                type="text"
                                                                                value={widgetConfig.theme.secondaryColor.replace('#', '')}
                                                                                onChange={(e) => updateTheme('secondaryColor', '#' + e.target.value.replace('#', ''))}
                                                                                className="flex-1 min-w-0 bg-transparent border-none text-white font-mono text-xs focus:ring-0 p-1"
                                                                                maxLength={6}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Icon Foreground Color */}
                                            {activeIconPart === 'icon' && (
                                                <div className="space-y-6">
                                                    {/* Shape & Size Controls */}
                                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-5">
                                                        {/* Radius Control */}
                                                        <div>
                                                            <div className="flex justify-between mb-2">
                                                                <h4 className="text-sm font-semibold text-white">Box Softness</h4>
                                                                <span className="text-blue-400 font-mono text-xs">{widgetConfig.theme.boxRadius}%</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="50"
                                                                step="1"
                                                                value={widgetConfig.theme.boxRadius}
                                                                onChange={(e) => updateTheme('boxRadius', parseInt(e.target.value))}
                                                                className="w-full premium-slider"
                                                            />
                                                        </div>

                                                        {/* Scale Control */}
                                                        <div>
                                                            <div className="flex justify-between mb-2">
                                                                <h4 className="text-sm font-semibold text-white">Icon Size</h4>
                                                                <span className="text-blue-400 font-mono text-xs">{Math.round((widgetConfig.theme.iconScale || 1) * 100)}%</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0.5"
                                                                max="1.5"
                                                                step="0.05"
                                                                value={widgetConfig.theme.iconScale || 1}
                                                                onChange={(e) => updateTheme('iconScale', parseFloat(e.target.value))}
                                                                className="w-full premium-slider"
                                                            />
                                                        </div>
                                                    </div>



                                                    <div className="grid grid-cols-8 gap-3 max-w-4xl">
                                                        {[
                                                            '#FFFFFF', '#000000', '#F8FAFC', '#94A3B8',
                                                            '#EF4444', '#F97316', '#FACC15', '#22C55E',
                                                            '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E',
                                                            '#1E293B', '#14B8A6', '#6366F1', '#A855F7'
                                                        ].map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={() => updateTheme('iconColor', color)}
                                                                className={`aspect-square rounded-xl transition-all duration-300 ${widgetConfig.theme.iconColor === color
                                                                    ? 'ring-4 ring-white shadow-xl z-10'
                                                                    : 'hover:ring-2 hover:ring-white/50 shadow-md'
                                                                    }`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                    {/* Custom Icon Color Input */}
                                                    <div className="mt-4 flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10 w-fit">
                                                        <Label className="text-sm font-semibold text-white whitespace-nowrap">Custom Hex:</Label>
                                                        <div className="flex-1 flex gap-2 items-center bg-white/5 rounded-lg border border-white/20 p-2">
                                                            <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: widgetConfig.theme.iconColor || '#FFF' }} />
                                                            <span className="text-slate-400 font-mono">#</span>
                                                            <input
                                                                type="text"
                                                                value={widgetConfig.theme.iconColor?.replace('#', '') || ''}
                                                                onChange={(e) => updateTheme('iconColor', '#' + e.target.value.replace('#', ''))}
                                                                className="flex-1 bg-transparent border-none text-white font-mono text-sm focus:ring-0 px-1"
                                                                maxLength={6}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Position Section */}
                        {activeSection === 'position' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Corner Position</h3>
                                    <p className="text-slate-400 text-sm mb-6">Choose where your widget appears on the page</p>

                                    <div className="grid grid-cols-2 gap-4 max-w-2xl">
                                        {[
                                            { h: 'right', v: 'bottom', label: 'Bottom Right', icon: '↘️' },
                                            { h: 'left', v: 'bottom', label: 'Bottom Left', icon: '↙️' },
                                            { h: 'right', v: 'top', label: 'Top Right', icon: '↗️' },
                                            { h: 'left', v: 'top', label: 'Top Left', icon: '↖️' }
                                        ].map(({ h, v, label, icon }) => (
                                            <button
                                                key={label}
                                                onClick={() => {
                                                    updatePosition('horizontal', h);
                                                    updatePosition('vertical', v);
                                                }}
                                                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${widgetConfig.position.horizontal === h && widgetConfig.position.vertical === v
                                                    ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                                                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="text-3xl mb-2">{icon}</div>
                                                <div className={`font-semibold ${widgetConfig.position.horizontal === h && widgetConfig.position.vertical === v
                                                    ? 'text-green-400'
                                                    : 'text-white'
                                                    }`}>{label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6 max-w-3xl">
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white">Horizontal Offset</h3>
                                            <span className="text-blue-400 font-semibold">{widgetConfig.position.offsetX}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={widgetConfig.position.offsetX}
                                            onChange={(e) => updatePosition('offsetX', parseInt(e.target.value))}
                                            className="w-full premium-slider"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white">Vertical Offset</h3>
                                            <span className="text-blue-400 font-semibold">{widgetConfig.position.offsetY}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={widgetConfig.position.offsetY}
                                            onChange={(e) => updatePosition('offsetY', parseInt(e.target.value))}
                                            className="w-full premium-slider"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Motion Matrix Section */}
                        {activeSection === 'animation' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Sub-Tabs for Icon vs Box Animations */}
                                {/* Sub-Tabs for Icon vs Box Animations - Hide for Robot */}
                                {!isRobot && (
                                    <div className="flex gap-3 p-1 bg-white/5 rounded-xl border border-white/10">
                                        <button
                                            onClick={() => setActiveMotionTab('icon')}
                                            className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all ${activeMotionTab === 'icon'
                                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {isRobot ? '🤖 Icon Animation' : '⚡ Icon Animation'}
                                        </button>
                                        <button
                                            onClick={() => setActiveMotionTab('box')}
                                            className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all ${activeMotionTab === 'box'
                                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            📦 Box Animation
                                        </button>
                                    </div>
                                )}

                                {/* Icon Animation Tab */}
                                {/* Icon Animation Tab */}
                                {(activeMotionTab === 'icon' || isRobot) && (
                                    <>
                                        <div>
                                            <div className="mb-6">
                                                <h3 className="text-lg font-semibold text-white mb-2">
                                                    {isRobot ? '🤖 Character Personality' : '✨ Energy Style'}
                                                </h3>
                                                <p className="text-slate-400 text-sm">
                                                    {isRobot
                                                        ? 'Choose how your bot expresses its personality when idle'
                                                        : 'Select the abstract animation that matches your brand energy'
                                                    }
                                                </p>
                                            </div>

                                            {/* Motion Selection Grid (3x2) */}
                                            <div className="grid grid-cols-3 gap-4 max-w-4xl">
                                                {currentAnimations.map(({ id, name, desc, emoji }) => (
                                                    <button
                                                        key={id}
                                                        onClick={() => updateAnimation(isRobot ? 'robot' : 'simple', id)}
                                                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${currentAnimation === id
                                                            ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/30 scale-105'
                                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5 hover:scale-102'
                                                            }`}
                                                    >
                                                        {/* Preview Dot with Animation */}
                                                        <div className="flex justify-center mb-4">
                                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-300 ${currentAnimation === id
                                                                ? 'bg-purple-500/20 scale-110'
                                                                : 'bg-white/5 group-hover:bg-white/10'
                                                                }`}>
                                                                <span className={`${currentAnimation === id ? 'motion-preview-active' : ''
                                                                    }`}>
                                                                    {emoji}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <h4 className={`font-semibold mb-2 text-center transition-colors ${currentAnimation === id ? 'text-purple-400' : 'text-white'
                                                            }`}>
                                                            {name}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 text-center">{desc}</p>

                                                        {/* Active Indicator */}
                                                        {currentAnimation === id && (
                                                            <div className="absolute top-3 right-3">
                                                                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Entrance Animation */}
                                        <div>
                                            <div className="mb-6">
                                                <h3 className="text-lg font-semibold text-white mb-2">🎬 Entrance Animation</h3>
                                                <p className="text-slate-400 text-sm">How your widget appears when the page loads</p>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 max-w-3xl">
                                                {ENTRANCE_ANIMATIONS.map(({ id, name, desc, emoji }) => (
                                                    <button
                                                        key={id}
                                                        onClick={() => updateAnimation('entrance', id)}
                                                        className={`p-5 rounded-xl border-2 transition-all duration-300 ${widgetConfig.animation.entrance === id
                                                            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <div className="text-2xl mb-2 text-center">{emoji}</div>
                                                        <h4 className={`font-semibold text-sm mb-1 text-center ${widgetConfig.animation.entrance === id ? 'text-blue-400' : 'text-white'
                                                            }`}>
                                                            {name}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 text-center">{desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Deep Animation Controls */}
                                        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-2xl p-6 max-w-4xl">
                                            <div className="mb-6">
                                                <h3 className="text-lg font-semibold text-white mb-2">⚙️ Fine-Tune Animation</h3>
                                                <p className="text-slate-400 text-sm">Adjust speed and intensity for perfect animation feel</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                {/* Speed Control */}
                                                <div>
                                                    <div className="flex justify-between mb-4">
                                                        <Label className="text-sm font-medium text-slate-300">Animation Speed</Label>
                                                        <span className="text-blue-400 font-semibold text-sm">
                                                            {widgetConfig.animation.speed === 0.5 ? 'Slow' :
                                                                widgetConfig.animation.speed === 1.0 ? 'Normal' :
                                                                    widgetConfig.animation.speed === 1.5 ? 'Fast' : 'Very Fast'}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <input
                                                            type="range"
                                                            min="0.5"
                                                            max="2"
                                                            step="0.5"
                                                            value={widgetConfig.animation.speed}
                                                            onChange={(e) => updateAnimation('speed', parseFloat(e.target.value))}
                                                            className="w-full premium-slider"
                                                        />
                                                        <div className="flex justify-between text-xs text-slate-500">
                                                            <span>0.5x</span>
                                                            <span>1.0x</span>
                                                            <span>1.5x</span>
                                                            <span>2.0x</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-3">
                                                        {widgetConfig.animation.speed < 1 ? '🐌 Slower animations feel more relaxed and professional' :
                                                            widgetConfig.animation.speed === 1 ? '⚡ Normal speed works for most use cases' :
                                                                '🚀 Faster animations grab attention and feel energetic'}
                                                    </p>
                                                </div>

                                                {/* Intensity Control */}
                                                <div>
                                                    <div className="flex justify-between mb-4">
                                                        <Label className="text-sm font-medium text-slate-300">Animation Intensity</Label>
                                                        <span className="text-purple-400 font-semibold text-sm">
                                                            {widgetConfig.animation.intensity === 0.5 ? 'Subtle' :
                                                                widgetConfig.animation.intensity === 1.0 ? 'Normal' : 'Strong'}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <input
                                                            type="range"
                                                            min="0.5"
                                                            max="1.5"
                                                            step="0.5"
                                                            value={widgetConfig.animation.intensity}
                                                            onChange={(e) => updateAnimation('intensity', parseFloat(e.target.value))}
                                                            className="w-full premium-slider"
                                                        />
                                                        <div className="flex justify-between text-xs text-slate-500">
                                                            <span>Subtle</span>
                                                            <span>Normal</span>
                                                            <span>Strong</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-3">
                                                        {widgetConfig.animation.intensity < 1 ? '✨ Subtle movements are elegant and non-distracting' :
                                                            widgetConfig.animation.intensity === 1 ? '💫 Normal intensity balances visibility and subtlety' :
                                                                '💥 Strong animations are bold and eye-catching'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Box Animation Tab */}
                                {activeMotionTab === 'box' && (
                                    <>
                                        {!widgetConfig.theme.showBox ? (
                                            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8 max-w-4xl">
                                                <div className="flex items-start gap-4">
                                                    <div className="text-5xl">📦</div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white mb-3">Background Box is Disabled</h3>
                                                        <p className="text-slate-300 mb-4">
                                                            Box animations can only be configured when the background box is visible.
                                                        </p>
                                                        <div className="bg-black/20 rounded-xl p-4 border border-orange-500/30">
                                                            <p className="text-sm text-slate-400 mb-2">
                                                                <strong className="text-white">To enable box animations:</strong>
                                                            </p>
                                                            <ol className="text-sm text-slate-400 space-y-1 ml-4 list-decimal">
                                                                <li>Go to the <strong className="text-orange-400">Colors</strong> tab</li>
                                                                <li>Find the <strong className="text-orange-400">"Show Background Box"</strong> toggle</li>
                                                                <li>Turn it <strong className="text-green-400">ON</strong></li>
                                                                <li>Return here to configure animations</li>
                                                            </ol>
                                                        </div>
                                                        <button
                                                            onClick={() => setActiveSection('colors')}
                                                            className="mt-4 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-medium text-sm transition-all hover:scale-105 shadow-lg"
                                                        >
                                                            → Go to Colors Tab
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-white mb-2">
                                                        Box Animation <span className="text-sm font-normal text-slate-400">(Background Box)</span>
                                                    </h3>
                                                    <p className="text-sm text-slate-400">
                                                        Choose how the background box animates when visible
                                                    </p>
                                                </div>

                                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 max-w-4xl">
                                                    <div className="grid grid-cols-5 gap-3 mb-6">
                                                        {['none', 'pulse', 'glow', 'ripple', 'morph', 'shake', 'bounce', 'swing', 'beat', 'tilt'].map((anim) => (
                                                            <button
                                                                key={anim}
                                                                onClick={() => updateTheme('boxAnimation', anim as any)}
                                                                className={`px-3 py-3 rounded-xl text-sm font-medium capitalize transition-all ${(widgetConfig.theme.boxAnimation || 'none') === anim
                                                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg ring-2 ring-purple-400'
                                                                    : 'bg-black/40 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                                                                    }`}
                                                            >
                                                                {anim}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Animation Speed - Only show if animation is not 'none' */}
                                                    {widgetConfig.theme.boxAnimation && widgetConfig.theme.boxAnimation !== 'none' && (
                                                        <>
                                                            <div className="border-t border-white/10 pt-6">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <Label className="text-sm font-medium text-slate-300">Animation Speed</Label>
                                                                    <span className="text-purple-400 font-semibold">{widgetConfig.animation.speed}x</span>
                                                                </div>

                                                                {/* Speed Presets */}
                                                                <div className="grid grid-cols-3 gap-3 mb-4">
                                                                    <button
                                                                        onClick={() => updateAnimation('speed', 0.75)}
                                                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${widgetConfig.animation.speed === 0.75
                                                                            ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                                                            : 'bg-black/40 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                                                                            }`}
                                                                    >
                                                                        🐌 Slow
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateAnimation('speed', 1.5)}
                                                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${widgetConfig.animation.speed === 1.5
                                                                            ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                                                            : 'bg-black/40 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                                                                            }`}
                                                                    >
                                                                        ⚡ Normal
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateAnimation('speed', 2)}
                                                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${widgetConfig.animation.speed === 2
                                                                            ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                                                            : 'bg-black/40 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                                                                            }`}
                                                                    >
                                                                        🚀 Fast
                                                                    </button>
                                                                </div>

                                                                {/* Fine-tune Slider */}
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs text-slate-500">Fine-tune</Label>
                                                                    <input
                                                                        type="range"
                                                                        min="0.25"
                                                                        max="2"
                                                                        step="0.05"
                                                                        value={widgetConfig.animation.speed}
                                                                        onChange={(e) => updateAnimation('speed', parseFloat(e.target.value))}
                                                                        className="w-full premium-slider"
                                                                    />
                                                                    <div className="flex justify-between text-xs text-slate-600">
                                                                        <span>0.25x</span>
                                                                        <span>2x</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Moment/Intensity Control */}
                                                            <div className="border-t border-white/10 pt-6 mt-6">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <Label className="text-sm font-medium text-slate-300">
                                                                        Moment (Intensity)
                                                                    </Label>
                                                                    <span className="text-purple-400 font-semibold">{widgetConfig.animation.intensity}</span>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <input
                                                                        type="range"
                                                                        min="0.5"
                                                                        max="2"
                                                                        step="0.1"
                                                                        value={widgetConfig.animation.intensity}
                                                                        onChange={(e) => updateAnimation('intensity', parseFloat(e.target.value))}
                                                                        className="w-full premium-slider"
                                                                    />
                                                                    <div className="flex justify-between text-xs text-slate-600">
                                                                        <span>Subtle</span>
                                                                        <span>Strong</span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-3 italic">
                                                                    {widgetConfig.theme.boxAnimation === 'bounce' && '💪 Controls bounce height and force'}
                                                                    {widgetConfig.theme.boxAnimation === 'glow' && '✨ Controls glow radius and smoothness'}
                                                                    {widgetConfig.theme.boxAnimation === 'pulse' && '💓 Controls pulse scale intensity'}
                                                                    {widgetConfig.theme.boxAnimation === 'swing' && '⚖️ Controls swing rotation angle'}
                                                                    {widgetConfig.theme.boxAnimation === 'beat' && '❤️ Controls heartbeat pump strength'}
                                                                    {widgetConfig.theme.boxAnimation === 'tilt' && '🎭 Controls 3D tilt angle'}
                                                                    {widgetConfig.theme.boxAnimation === 'ripple' && '🌊 Controls wave expansion size'}
                                                                    {!['bounce', 'glow', 'pulse', 'swing', 'beat', 'tilt', 'ripple'].includes(widgetConfig.theme.boxAnimation || '') && '⚡ Controls animation intensity'}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    </>
                                )}
                            </div>
                        )}



                        {/* Behavior Section - Premium "God Mode" Edition */}
                        {activeSection === 'behavior' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {(() => {
                                    const isRobot = widgetConfig.icon.type === 'robot';
                                    const category = isRobot ? 'robot' : 'icon';
                                    const hoverBehaviors = isRobot ? ROBOT_HOVER_BEHAVIORS : ICON_HOVER_BEHAVIORS;
                                    const clickBehaviors = isRobot ? ROBOT_CLICK_BEHAVIORS : ICON_CLICK_BEHAVIORS;

                                    return (
                                        <>
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="text-4xl">{isRobot ? '🧠' : '⚡'}</div>
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-bold text-white mb-2">
                                                            {isRobot ? 'Emotional Intelligence' : 'Energy Physics'}
                                                        </h3>
                                                        <p className="text-slate-300 text-sm mb-3">
                                                            {isRobot
                                                                ? 'Control how your robot reacts to humans'
                                                                : 'Define magnetic and light behavior'}
                                                        </p>
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full">
                                                            <div className={`w-2 h-2 rounded-full ${isRobot ? 'bg-pink-400' : 'bg-cyan-400'} animate-pulse`}></div>
                                                            <span className="text-xs font-semibold text-white">
                                                                {isRobot ? 'Bio-Digital Mode' : 'Quantum Field Mode'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hover Section */}
                                            <div>
                                                <h4 className="text-base font-semibold text-white mb-4">
                                                    {isRobot ? '👀 Awareness (Hover)' : '🧲 Field Effect (Hover)'}
                                                </h4>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {hoverBehaviors.map((b) => (
                                                        <button
                                                            key={b.id}
                                                            onClick={() => updateBehavior(category, 'hover', b.id)}
                                                            className={`p-4 rounded-xl text-center transition-all ${
                                                                // @ts-ignore
                                                                widgetConfig.behavior[category].hover === b.id
                                                                    ? 'bg-blue-600/20 border-2 border-blue-500 shadow-lg shadow-blue-500/20'
                                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            <div className="text-3xl mb-2">{b.emoji}</div>
                                                            <div className="font-semibold text-white text-sm">{b.name}</div>
                                                            <div className="text-xs text-slate-400">{b.desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Click Section */}
                                            <div>
                                                <h4 className="text-base font-semibold text-white mb-4">
                                                    {isRobot ? '👆 Interaction (Click)' : '💥 Impact (Click)'}
                                                </h4>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {clickBehaviors.map((b) => (
                                                        <button
                                                            key={b.id}
                                                            onClick={() => updateBehavior(category, 'click', b.id)}
                                                            className={`p-4 rounded-xl text-center transition-all ${
                                                                // @ts-ignore
                                                                widgetConfig.behavior[category].click === b.id
                                                                    ? 'bg-purple-600/20 border-2 border-purple-500 shadow-lg shadow-purple-500/20'
                                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            <div className="text-3xl mb-2">{b.emoji}</div>
                                                            <div className="font-semibold text-white text-sm">{b.name}</div>
                                                            <div className="text-xs text-slate-400">{b.desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Window Section */}
                        {activeSection === 'window' && (
                            <WindowDesigner config={config} orgId={orgId} isEditing={isEditing} />
                        )}
                    </div>

                </div>
            </div>

            {/* Footer with Save Button */}
            <div>


                <style jsx global>{`
                @keyframes slide-in-from-bottom-4 {
                    from {
                        opacity: 0;
                        transform: translateY(1rem);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-in {
                    animation-fill-mode: both;
                }
                
                .fade-in {
                    animation-name: fadeIn;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                /* Motion Preview Animations */
                .motion-preview-active {
                    animation: preview-motion 2s ease-in-out infinite;
                }
                
                @keyframes preview-motion {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-4px) scale(1.1); }
                }
                
                .premium-slider {
                    height: 8px;
                    background: linear-gradient(to right, #1e293b, #475569);
                    border-radius: 9999px;
                    outline: none;
                    -webkit-appearance: none;
                    transition: all 0.3s;
                }
                
                .premium-slider:hover {
                    background: linear-gradient(to right, #334155, #64748b);
                }
                
                .premium-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
                    transition: all 0.3s;
                }
                
                .premium-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.3);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.7);
                }
                
                .premium-slider::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
                    transition: all 0.3s;
                }
                
                .premium-slider::-moz-range-thumb:hover {
                    transform: scale(1.3);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.7);
                }
            `}
                </style>
            </div>

        </>
    );
}
// old 2
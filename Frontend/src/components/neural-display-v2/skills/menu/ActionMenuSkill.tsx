import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useSkillManager } from '../SkillManagerContext';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';
import {
    Mic, Ghost, HandMetal, CircleDashed, BookOpen,
    MessageCircle, Info, Settings, BrickWall, Bird, CarFront,
    Home, User, HelpCircle, Mail, MessageSquare
} from 'lucide-react';
import { Item } from "./Item";
import { TooltipProvider } from "@/components/ui/tooltip";

// Real Apps
const appsList = [
    // Main Chat/Widget Navigation
    { id: 'home', icon: Home, bg: 'linear-gradient(135deg, #3b82f6, #60a5fa)', label: 'Home' }, 
    { id: 'app_chat', icon: MessageSquare, bg: 'linear-gradient(135deg, #10b981, #34d399)', label: 'AI Chat' },
    { id: 'app_docs', icon: Info, bg: 'linear-gradient(135deg, #6366f1, #818cf8)', label: 'Docs' },
    { id: 'faq', icon: HelpCircle, bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', label: 'FAQ' },
    { id: 'contact', icon: Mail, bg: 'linear-gradient(135deg, #f43f5e, #fb7185)', label: 'Contact Us' },
    
    // Voice & Settings
    { id: 'live_voice', icon: Mic, bg: 'linear-gradient(135deg, #8b5cf6, #c084fc)', label: 'Live Voice' },
    { id: 'app_settings', icon: Settings, bg: 'linear-gradient(135deg, #475569, #94a3b8)', label: 'Settings' },
    
    // Control
    { id: 'exit_menu', icon: AnimatedX, bg: 'linear-gradient(135deg, #f43f5e, #fb7185)', label: 'Close' },

    // Games
    { id: 'game_snake', icon: Ghost, bg: 'linear-gradient(135deg, #059669, #34d399)', label: 'Snake' },
    { id: 'game_rps', icon: HandMetal, bg: 'linear-gradient(135deg, #7e22ce, #c084fc)', label: 'RPS' },
    { id: 'game_ttt', icon: CircleDashed, bg: 'linear-gradient(135deg, #16a34a, #4ade80)', label: 'Tic Tac Toe' },
    { id: 'game_tts', icon: Info, bg: 'linear-gradient(135deg, #ea580c, #fb923c)', label: 'Story Bot' },
    { id: 'game_breakout', icon: BrickWall, bg: 'linear-gradient(135deg, #dc2626, #f87171)', label: 'Breakout' },
    { id: 'game_flappy', icon: Bird, bg: 'linear-gradient(135deg, #ca8a04, #fde047)', label: 'Flappy' },
    { id: 'game_racing', icon: CarFront, bg: 'linear-gradient(135deg, #7c3aed, #a78bfa)', label: 'Racing' }
];

const ROWS = 6;
const COLS = 6;
const gridData = new Array(ROWS).fill(0).map(() => new Array(COLS).fill(0).map((_, i) => i));

export default function ActionMenuSkill() {
    const { activeSkill, setActiveSkill } = useSkillManager();
    const isVisible = activeSkill === 'menu';
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 368, height: 448 });

    useEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setDimensions({
                    width: clientWidth || 368,
                    height: clientHeight || 448
                });
            }
        };

        const observer = new ResizeObserver(updateSize);
        observer.observe(containerRef.current);
        updateSize();

        return () => observer.disconnect();
    }, [isVisible]);

    const dynamicSettings = useMemo(() => {
        const { width, height } = dimensions;

        // Compact density
        const iconSize = width / 5.2;
        const margin = iconSize * 0.3;
        const scaleFactor = width / 368;

        const gridWidth = COLS * (iconSize + margin);
        const gridHeight = ROWS * iconSize;

        // Centering for 6x6 grid (Middle offset index is 2.5)
        const initialX = (width / 2) - (2.5 * (iconSize + margin)) - (iconSize / 2);
        const initialY = (height / 2) - (2.5 * iconSize) - (iconSize / 2);

        return {
            icon: { margin, size: iconSize },
            device: { width, height },
            initialX,
            initialY,
            scaleFactor,
            constraints: {
                // Almost touch the edges
                left: width - gridWidth - 5,
                right: 5,
                top: height - gridHeight - 5,
                bottom: 5
            }
        };
    }, [dimensions]);

    const x = useMotionValue(dynamicSettings.initialX);
    const y = useMotionValue(dynamicSettings.initialY);

    useEffect(() => {
        x.set(dynamicSettings.initialX);
        y.set(dynamicSettings.initialY);
    }, [dynamicSettings.initialX, dynamicSettings.initialY, x, y]);

    if (!isVisible) return null;

    return (
        <TooltipProvider>
            <motion.div
                ref={containerRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[200] overflow-hidden pointer-events-auto flex items-center justify-center bg-transparent"
                onContextMenu={(e) => { e.preventDefault(); setActiveSkill(null); }}
            >
                <div className="device relative overflow-visible" style={dynamicSettings.device}>
                    <motion.div
                        drag
                        dragConstraints={dynamicSettings.constraints}
                        style={{
                            width: COLS * (dynamicSettings.icon.size + dynamicSettings.icon.margin),
                            height: ROWS * dynamicSettings.icon.size,
                            x,
                            y,
                            background: "transparent",
                            cursor: "grab",
                            position: "absolute"
                        }}
                        whileTap={{ cursor: "grabbing" }}
                    >
                        {gridData.map((rowArr, rowIndex) =>
                            rowArr.map((_, colIndex) => {
                                const index = rowIndex * COLS + colIndex;
                                const app = appsList[index % appsList.length];

                                return (
                                    <Item
                                        key={`${rowIndex}-${colIndex}`}
                                        row={rowIndex}
                                        col={colIndex}
                                        planeX={x}
                                        planeY={y}
                                        app={app}
                                        setActiveSkill={(id) => setActiveSkill(id as any)}
                                        settings={dynamicSettings}
                                    />
                                );
                            })
                        )}
                    </motion.div>
                </div>

                <div className="absolute inset-0 z-[-1]" onClick={() => setActiveSkill(null)} />
            </motion.div>
        </TooltipProvider>
    );
}

"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useThemeStore } from '@/store/themeStore';

// Lazy load BitsUI components
import Galaxy from '@/components/BitsUI/Galaxy';
import RippleGrid from '@/components/BitsUI/RippleGrid';
import Threads from '@/components/BitsUI/Threads';
import FloatingLines from '@/components/BitsUI/FloatingLines';
import PixelBlast from '@/components/BitsUI/PixelBlast';

const DynamicBackground = ({ zIndex }: { zIndex?: number }) => {
    const { bgType, opacity } = useThemeStore();
    const [mounted, setMounted] = useState(false);

    // ⚡ PERFORMANCE OPTIMIZATION: 
    // Background component ko MEMOIZE kar diya. 
    // Ab 'isInteractable' change hone par ye dobara render nahi hoga.
    const backgroundComponent = useMemo(() => {
        switch (bgType) {
            case 'galaxy': return (
                <div className="w-full h-full relative">
                    {/* @ts-ignore */}
                    <Galaxy
                        mouseRepulsion mouseInteraction density={1} glowIntensity={0.3}
                        saturation={0} hueShift={140} twinkleIntensity={0.3} rotationSpeed={0.1}
                        repulsionStrength={2} autoCenterRepulsion={0} starSpeed={0.5} speed={1}
                    />
                </div>
            );
            case 'liquid': return (
                <div className="w-full h-full relative">
                    {/* @ts-ignore */}
                    <FloatingLines
                        enabledWaves={["top", "middle", "bottom"]}
                        // Array - specify line count per wave; Number - same count for all waves
                        // lineCount={5}
                        // Array - specify line distance per wave; Number - same distance for all waves
                        // lineDistance={5}
                        bendRadius={5}
                        bendStrength={-0.5}
                        interactive={true}
                        parallax={true}
                    />
                </div>
            );
            case 'ripple': return (
                <div className="w-full h-full relative">
                    {/* @ts-ignore */}
                    <RippleGrid
                        enableRainbow={true} gridColor="#000" rippleIntensity={0.05}
                        gridSize={10} gridThickness={15} mouseInteraction={true} mouseInteractionRadius={1.2}
                    />
                </div>
            );
            case 'threads': return (
                <div className="w-full h-full relative">
                    {/* @ts-ignore */}
                    <Threads amplitude={1} distance={0} enableMouseInteraction />
                </div>
            );
            case 'PixelBlast': return (
                <>
                    {/* @ts-ignore */}
                    <PixelBlast
                        variant="square" pixelSize={4} color="#B19EEF" patternScale={2}
                        patternDensity={1} pixelSizeJitter={0} enableRipples rippleSpeed={0.4}
                        rippleThickness={0.12} rippleIntensityScale={1.5} liquid={false}
                        liquidStrength={0.12} liquidRadius={1.2} liquidWobbleSpeed={5}
                        speed={0.5} edgeFade={0.25} transparent
                    />
                </>
            );
            default: return null;
        }
    }, [bgType]);

    useEffect(() => {
        setMounted(true);

    }, []);

    if (!mounted) return <div className="fixed inset-0 bg-[#0b141a] z-[-1]" />;

    return (
        <div

            onContextMenu={(e) => e.preventDefault()} /// no right click woking
            className="absolute  w-full h-full transition-none " // Transition hata di taaki lag na ho
            style={{
                opacity,
                zIndex: '0'
            }}
        >
            {backgroundComponent}
        </div>
    );
};

export default DynamicBackground;
//
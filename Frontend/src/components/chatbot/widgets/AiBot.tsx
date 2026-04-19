import React, { useEffect, useRef } from 'react';

interface AiBotProps {
    size?: number;
    className?: string;
    interactionState?: 'idle' | 'listening' | 'excited' | 'speaking' | 'sad' | 'love';
    bodyColor?: string;
    eyeColor?: string;
    lipColor?: string;
}

const AiBot: React.FC<AiBotProps> = ({
    size = 200,
    className = "",
    interactionState = 'idle',
    bodyColor = "#FFFFFF",
    eyeColor = "#F59E0B",
    lipColor = "#B91C1C"
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Refs for parallax layers
    const bodyRef = useRef<SVGSVGElement>(null);
    const faceRef = useRef<SVGSVGElement>(null);
    const featuresRef = useRef<SVGSVGElement>(null);

    // Refs for blink groups
    const eyeLRef = useRef<SVGGElement>(null);
    const eyeRRef = useRef<SVGGElement>(null);

    // --- Parallax & Blink Logic ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Layer Configuration
        const layers = [
            {
                ref: bodyRef,
                initialOffset: { x: 0, y: 0 },
                maxOffset: 4,
                reverse: false,
            },
            {
                ref: faceRef,
                initialOffset: { x: 0, y: 2 },
                maxOffset: 8,
                reverse: false,
            },
            {
                ref: featuresRef,
                initialOffset: { x: 0, y: 2 },
                maxOffset: 12,
                reverse: false,
            },
        ];

        // --- Parallax Loop ---
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let maxDistance = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 2;

        const updateParallax = () => {
            // Check if element is still in DOM
            if (!container.isConnected) return;

            const containerRect = container.getBoundingClientRect();
            const centerX = containerRect.left + containerRect.width / 2;
            const centerY = containerRect.top + containerRect.height / 2;

            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0) return;

            const influence = Math.min(distance / maxDistance, 1);
            const dirX = dx / distance;
            const dirY = dy / distance;

            // Update Layer Parallax
            layers.forEach((layer) => {
                const el = layer.ref.current;
                if (!el) return;

                const { x: initialX, y: initialY } = layer.initialOffset;
                const factor = layer.reverse ? -1 : 1;
                const offsetX = dirX * layer.maxOffset * influence * factor;
                const offsetY = dirY * layer.maxOffset * influence * factor;

                el.style.setProperty("--offset-x", `${initialX + offsetX}px`);
                el.style.setProperty("--offset-y", `${initialY + offsetY}px`);
            });

            // Update Pupil Tracking
            const pupilMaxOffset = 8;
            const pupilX = dirX * pupilMaxOffset * influence;
            const pupilY = dirY * pupilMaxOffset * influence;
            container.style.setProperty('--pupil-x', `${pupilX}px`);
            container.style.setProperty('--pupil-y', `${pupilY}px`);
        };

        let animationFrameId: number;
        const animate = () => {
            updateParallax();
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        // Listen for custom event forwarded from parent (for iframe)
        const handleCustomMouseMove = (e: any) => {
            mouseX = e.detail.x;
            mouseY = e.detail.y;
        };

        const handleResize = () => {
            maxDistance = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 2;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("BOT_MOUSE_MOVE", handleCustomMouseMove);
        window.addEventListener("resize", handleResize);

        // --- Blink Logic ---
        const blinkConfig = {
            minInterval: 2000,
            maxInterval: 6000,
            closeSpeed: 100,
            closedDuration: 150,
            openSpeed: 150
        };

        let blinkTimeoutId: ReturnType<typeof setTimeout>;

        const blink = () => {
            const leftEyeGroup = eyeLRef.current;
            const rightEyeGroup = eyeRRef.current;
            if (!leftEyeGroup || !rightEyeGroup) return;

            try {
                // Adjust blink origin based on new eye position/size
                leftEyeGroup.style.transformOrigin = `36px 48px`;
                rightEyeGroup.style.transformOrigin = `64px 48px`;

                const setScale = (s: number) => {
                    leftEyeGroup.style.transform = `scaleY(${s})`;
                    rightEyeGroup.style.transform = `scaleY(${s})`;
                };

                leftEyeGroup.style.transition = `transform ${blinkConfig.closeSpeed}ms ease-out`;
                rightEyeGroup.style.transition = `transform ${blinkConfig.closeSpeed}ms ease-out`;
                setScale(0.1);

                setTimeout(() => {
                    leftEyeGroup.style.transition = `transform ${blinkConfig.openSpeed}ms ease-out`;
                    rightEyeGroup.style.transition = `transform ${blinkConfig.openSpeed}ms ease-out`;
                    setScale(1);
                }, blinkConfig.closeSpeed + blinkConfig.closedDuration);
            } catch (e) { }
        };

        const scheduleBlink = () => {
            const delay = Math.random() * (blinkConfig.maxInterval - blinkConfig.minInterval) + blinkConfig.minInterval;
            blinkTimeoutId = setTimeout(() => {
                blink();
                scheduleBlink();
            }, delay);
        };
        scheduleBlink();

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("BOT_MOUSE_MOVE", handleCustomMouseMove);
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
            clearTimeout(blinkTimeoutId);
        };
    }, []);

    const baseSize = 100;
    const scale = size / baseSize;

    // Animation Classes
    const getAnimationClass = () => {
        switch (interactionState) {
            case 'listening': return 'bot-nodding';
            case 'excited': return 'bot-bouncing';
            case 'love': return 'bot-sway';
            case 'speaking': return '';
            case 'sad': return 'bot-sad';
            default: return 'bot-idle';
        }
    };

    const getPupilScale = () => {
        switch (interactionState) {
            case 'listening': return 1.1;
            case 'excited': return 1.2;
            case 'love': return 1.2;
            case 'sad': return 0.9;
            case 'speaking': return 1.05;
            default: return 1;
        }
    };

    return (
        <div
            className={`${className} ai-bot-container`}
            style={{
                width: size,
                height: size,
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                userSelect: 'none',
                // @ts-ignore
                '--pupil-scale': getPupilScale(),
                '--body-color': bodyColor,
                '--eye-color': eyeColor,
                '--lip-color': lipColor,
            }}
        >
            <style>
                {`
          .robot-layer {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(
              calc(-50% + var(--offset-x, 0px)),
              calc(-50% + var(--offset-y, 0px))
            );
            transition: transform 0.1s ease-out;
            will-change: transform;
            overflow: visible;
            pointer-events: none;
          }
          
          .ai-pupil {
             transform: translate(var(--pupil-x, 0px), var(--pupil-y, 0px)) scale(var(--pupil-scale, 1));
             transition: transform 0.2s cubic-bezier(0.25, 1.6, 0.5, 1); 
             transform-origin: center;
             transform-box: fill-box;
          }

          /* --- Interactive Animations --- */
          .bot-container-anim {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            transform-origin: bottom center;
          }

          .bot-idle { animation: bot-idle 4s ease-in-out infinite; }
          @keyframes bot-idle {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-3px) scale(1.02); }
          }

          .bot-nodding { animation: bot-nod 1.5s ease-in-out infinite; }
          @keyframes bot-nod {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(3px); }
          }

          .bot-bouncing { animation: bot-bounce 0.6s ease-in-out infinite; }
          @keyframes bot-bounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-4px) scale(1.02); }
          }

          .bot-sway { animation: bot-sway 2s ease-in-out infinite; }
          @keyframes bot-sway {
             0%, 100% { transform: rotate(-2deg); }
             50% { transform: rotate(2deg); }
          }

          .bot-sad { transition: transform 0.5s; transform: translateY(2px) scale(0.98); }

          .mouth-talking {
            animation: mouth-talk 0.2s ease-in-out infinite alternate;
            transform-origin: center;
            transform-box: fill-box;
          }
          @keyframes mouth-talk {
            0% { transform: scaleY(0.5); }
            100% { transform: scaleY(1); }
          }
          
          .blush { animation: blush-pulse 2s ease-in-out infinite; }
          @keyframes blush-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
        `}
            </style>

            <div
                id="chatbot-wrapper"
                ref={wrapperRef}
                style={{
                    position: 'relative',
                    width: baseSize,
                    height: baseSize,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center'
                }}
            >
                <div className={`bot-container-anim ${getAnimationClass()}`}>
                    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>

                        {/* Layer 2: Head Body */}
                        <svg
                            ref={bodyRef}
                            className="robot-layer"
                            width="100" height="100" viewBox="0 0 100 100" fill="none"
                            style={{ zIndex: 1 }}
                        >
                            <filter id="body-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.15" />
                            </filter>

                            {/* Head */}
                            <rect x="12" y="22" width="76" height="64" rx="24" fill="url(#head-gradient)" filter="url(#body-shadow)" />
                            <defs>
                                <linearGradient id="head-gradient" x1="50" y1="20" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="var(--body-color)" />
                                    <stop offset="100%" stopColor="#CBD5E1" />
                                </linearGradient>
                            </defs>

                        </svg>

                        {/* Layer 3: Face Screen & Ear Pods */}
                        <svg
                            ref={faceRef}
                            className="robot-layer"
                            width="100" height="100" viewBox="0 0 100 100" fill="none"
                            style={{ zIndex: 2 }}
                        >
                            {/* Ear Pods */}
                            <rect x="4" y="42" width="8" height="20" rx="4" fill="#0F172A" />
                            <rect x="88" y="42" width="8" height="20" rx="4" fill="#0F172A" />

                            {/* Screen Bezel Shadow */}
                            <rect x="18" y="30" width="64" height="46" rx="18" fill="#0F172A" opacity="0.3" transform="translate(0, 2)" />

                            {/* Black Screen */}
                            <rect x="18" y="30" width="64" height="46" rx="16" fill="#020617" />

                            {/* Soft Glass Reflection (Clean Look) */}
                            <defs>
                                <linearGradient id="reflection-grad" x1="50" y1="30" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="white" stopOpacity="0.08" />
                                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <rect x="18" y="30" width="64" height="26" rx="16" fill="url(#reflection-grad)" />
                        </svg>

                        {/* Layer 4: Features (Real Eyes & Mouth) */}
                        <svg
                            ref={featuresRef}
                            className="robot-layer"
                            width="100" height="100" viewBox="0 0 100 100" fill="none"
                            style={{ zIndex: 3 }}
                        >
                            <defs>
                                {/* Realistic Eye Gradients */}
                                <radialGradient id="iris-gradient" cx="50%" cy="50%" r="50%">
                                    <stop offset="40%" stopColor="var(--eye-color)" />
                                    <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
                                </radialGradient>

                                <filter id="sclera-inner-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feComponentTransfer in="SourceAlpha">
                                        <feFuncA type="table" tableValues="1 0" />
                                    </feComponentTransfer>
                                    <feGaussianBlur stdDeviation="2" />
                                    <feOffset dx="0" dy="0" result="offsetblur" />
                                    <feFlood floodColor="rgb(0,0,0)" floodOpacity="0.2" />
                                    <feComposite in2="offsetblur" operator="in" />
                                    <feComposite in2="SourceAlpha" operator="in" />
                                    <feMerge>
                                        <feMergeNode in="SourceGraphic" />
                                        <feMergeNode />
                                    </feMerge>
                                </filter>

                                {/* Masks for Eye Clipping */}
                                <clipPath id="eye-mask-l">
                                    <ellipse cx="36" cy="48" rx="11" ry="13.5" />
                                </clipPath>
                                <clipPath id="eye-mask-r">
                                    <ellipse cx="64" cy="48" rx="11" ry="13.5" />
                                </clipPath>
                            </defs>

                            {/* Left Eye */}
                            <g ref={eyeLRef} className="eye-group">
                                {/* Sclera (White base) */}
                                <ellipse cx="36" cy="48" rx="11" ry="13.5" fill="#FFFFFF" filter="url(#sclera-inner-shadow)" />

                                {/* Iris & Pupil (Clipped) */}
                                <g clipPath="url(#eye-mask-l)">
                                    <g className="ai-pupil">
                                        {/* Iris */}
                                        <circle cx="36" cy="48" r="7" fill="url(#iris-gradient)" />
                                        {/* Pupil (Black) */}
                                        <circle cx="36" cy="48" r="3.5" fill="#000000" />
                                        {/* Glint (Reflection) */}
                                        <ellipse cx="38" cy="44" rx="2.5" ry="1.5" fill="#FFFFFF" opacity="0.9" transform="rotate(-45 38 44)" />
                                    </g>
                                </g>
                            </g>

                            {/* Right Eye */}
                            <g ref={eyeRRef} className="eye-group">
                                {/* Sclera */}
                                <ellipse cx="64" cy="48" rx="11" ry="13.5" fill="#FFFFFF" filter="url(#sclera-inner-shadow)" />

                                {/* Iris & Pupil (Clipped) */}
                                <g clipPath="url(#eye-mask-r)">
                                    <g className="ai-pupil">
                                        {/* Iris */}
                                        <circle cx="64" cy="48" r="7" fill="url(#iris-gradient)" />
                                        {/* Pupil */}
                                        <circle cx="64" cy="48" r="3.5" fill="#000000" />
                                        {/* Glint */}
                                        <ellipse cx="66" cy="44" rx="2.5" ry="1.5" fill="#FFFFFF" opacity="0.9" transform="rotate(-45 66 44)" />
                                    </g>
                                </g>
                            </g>

                            {/* Blushing Cheeks (Love State) */}
                            <g style={{ opacity: interactionState === 'love' ? 1 : 0, transition: 'opacity 0.5s' }}>
                                <circle className="blush" cx="34" cy="62" r="5" fill="#F472B6" filter="blur(2px)" />
                                <circle className="blush" cx="66" cy="62" r="5" fill="#F472B6" filter="blur(2px)" />
                            </g>

                            {/* Brows - Volumetric Pills for 3D look */}
                            <g style={{
                                transform: interactionState === 'sad' ? 'rotate(-5deg) translateY(2px)' : (interactionState === 'excited' ? 'translateY(-3px)' : 'none'),
                                transformOrigin: '50px 35px',
                                transition: 'transform 0.3s'
                            }}>
                                {/* Left Brow */}
                                <rect x="28" y="32" width="14" height="3" rx="1.5" fill="var(--eye-color)" opacity="0.9" transform="rotate(-5 35 33.5)" />
                                {/* Right Brow */}
                                <rect x="58" y="32" width="14" height="3" rx="1.5" fill="var(--eye-color)" opacity="0.9" transform="rotate(5 65 33.5)" />
                            </g>

                            {/* Mouth - Moved Up (cy ~66) */}
                            {interactionState === 'speaking' ? (
                                <ellipse className="mouth-talking" cx="50" cy="66" rx="4.5" ry="2.5" fill="var(--lip-color)" />
                            ) : interactionState === 'sad' ? (
                                <path d="M42 70 Q 50 64 58 70" stroke="var(--lip-color)" strokeWidth="2" strokeLinecap="round" opacity="0.8" style={{ transition: 'd 0.3s' }} />
                            ) : (
                                <path d="M42 66 Q 50 72 58 66" stroke="var(--lip-color)" strokeWidth="2" strokeLinecap="round" opacity="0.8" style={{ transition: 'd 0.3s' }} />
                            )}
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiBot;

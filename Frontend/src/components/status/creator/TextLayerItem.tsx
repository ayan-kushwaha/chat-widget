import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Moveable from "react-moveable";
import type { TextLayer } from './StatusCreatorOverlay';

interface TextLayerItemProps {
    layer: TextLayer;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (updates: Partial<TextLayer>) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export const TextLayerItem: React.FC<TextLayerItemProps> = ({
    layer,
    isSelected,
    onSelect,
    onChange,
    containerRef
}) => {
    const textRef = useRef<HTMLDivElement>(null);
    const targetRef = useRef<HTMLDivElement>(null);
    const [localContent, setLocalContent] = useState(layer.content);
    const [isEditing, setIsEditing] = useState(false);

    // Stable Resize State
    const dragStart = useRef({ size: 1, height: 100 });

    // Sync from parent ONLY if NOT editing
    useEffect(() => {
        if (!isEditing) {
            setLocalContent(layer.content);
        }
    }, [layer.content, isEditing]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        setLocalContent(e.currentTarget.innerText);
    };

    const handleBlur = () => {
        setIsEditing(false);
        onChange({ content: localContent });
    };

    const handleDoubleClick = () => {
        setIsEditing(true);
        // Defer focus
        setTimeout(() => {
            textRef.current?.focus();
            // Select all text
            document.execCommand('selectAll', false, undefined);
        }, 10);
    };

    return (
        <>
            <div
                ref={targetRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
                onDoubleClick={handleDoubleClick}
                className={cn(
                    "absolute z-30 origin-center cursor-move",
                    isSelected ? "z-40" : "z-30"
                )}
                style={{
                    transform: `translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotation || 0}deg)`,
                    width: layer.width ? `${layer.width}px` : 'auto',
                    top: 0, left: 0
                }}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: layer.bg ? (layer.bgColor || (layer.color === '#ffffff' ? '#000000' : '#ffffff')) : 'transparent',
                        opacity: layer.opacity ?? 1,
                        filter: layer.blur ? `blur(${layer.blur}px)` : 'none',
                        borderRadius: `${layer.radius ?? 8}px`,
                        transform: 'scale(1.05)', // Slightly larger background for better "aura"
                        zIndex: -1
                    }}
                />
                <div
                    ref={textRef}
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    // 🟢 Fix: Remove onInput state update to prevent cursor jumping (Reversed Text Bug)
                    // onInput={handleInput} 
                    onBlur={() => {
                        if (textRef.current) {
                            const newContent = textRef.current.innerText;
                            setLocalContent(newContent); // Sync state on blur
                            handleBlur(); // Trigger parent save
                        }
                    }}
                    className={cn(
                        "font-black drop-shadow-2xl break-words outline-none min-w-[50px] whitespace-pre-wrap relative z-10",
                        layer.align === 'left' ? 'text-left' : layer.align === 'right' ? 'text-right' : 'text-center',
                        // 🟢 Ensure LTR to prevent weird flipping
                        "direction-ltr",
                        isEditing ? "cursor-text select-text ring-2 ring-emerald-500/50 rounded-lg" : "select-none"
                    )}
                    style={{
                        fontFamily: layer.font,
                        color: layer.color,
                        fontSize: `${2 * layer.size}rem`,
                        lineHeight: 1.5,
                        padding: '0.5em 1em',
                        borderRadius: `${layer.radius ?? 8}px`,
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                        boxDecorationBreak: 'clone',
                        WebkitBoxDecorationBreak: 'clone',
                        direction: 'ltr', // Force LTR
                        unicodeBidi: 'plaintext' // Handle mixed content better
                    }}
                >
                    {localContent}
                </div>
            </div>

            {isSelected && !isEditing && (
                <Moveable
                    target={targetRef.current}
                    container={containerRef.current}
                    draggable={true}
                    resizable={true}
                    rotatable={true}

                    /* Fresh Features: Snapping & Guides */
                    snappable={true}
                    snapDirections={{
                        top: true, left: true, bottom: true, right: true,
                        center: true, middle: true
                    }}
                    elementGuidelines={containerRef.current ? [containerRef.current] : []}
                    snapThreshold={5}
                    isDisplaySnapDigit={true}

                    /* Styling Class */
                    className="moveable-cluaiz-theme"

                    keepRatio={false}
                    throttleDrag={0}
                    throttleResize={0}
                    throttleRotate={0}
                    renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}

                    onDrag={({ translate }) => {
                        onChange({ x: translate[0], y: translate[1] });
                    }}

                    onResizeStart={(e) => {
                        const element = e.target as HTMLElement;
                        dragStart.current = {
                            size: layer.size || 1,
                            height: element.offsetHeight || 50
                        };
                    }}

                    onResize={({ width, height, drag, direction }) => {
                        // Smart & Stable Resize Logic
                        const isPureHorizontal = direction[0] !== 0 && direction[1] === 0;
                        let updates: Partial<TextLayer> = {
                            x: drag.translate[0],
                            y: drag.translate[1]
                        };

                        if (isPureHorizontal) {
                            updates.width = width;
                        } else {
                            // Stable Scaling based on initial capture
                            const startH = dragStart.current.height;
                            const startS = dragStart.current.size;

                            if (startH > 20) {
                                const ratio = height / startH;

                                // STRICT LIMIT: Max 200% (2.0)
                                let newSize = startS * ratio;
                                newSize = Math.max(0.5, Math.min(2.0, newSize));

                                updates.size = newSize;

                                if (direction[0] !== 0) {
                                    updates.width = width;
                                }
                            }
                        }

                        onChange(updates);
                    }}

                    onRotate={({ rotate }) => {
                        onChange({ rotation: rotate });
                    }}
                />
            )}
        </>
    );
};

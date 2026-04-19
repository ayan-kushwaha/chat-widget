"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface OrbitingCirclesProps
    extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    children?: React.ReactNode;
    reverse?: boolean;
    duration?: number;
    delay?: number;
    radius?: number;
    path?: boolean;
    iconSize?: number;
    speed?: number;
}

export function OrbitingCircles({
    className,
    children,
    reverse,
    duration = 20,
    radius = 160,
    path = true,
    iconSize = 30,
    speed = 1,
    ...props
}: OrbitingCirclesProps) {
    const calculatedDuration = duration / speed;

    return (
        <>
            {/* Force-inject keyframes to ensure they exist and use translateX */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes orbit-horizontal {
          0% {
            transform: rotate(calc(var(--angle) * 1deg)) translateX(calc(var(--radius) * 1px)) rotate(calc(var(--angle) * -1deg));
          }
          100% {
            transform: rotate(calc(var(--angle) * 1deg + 360deg)) translateX(calc(var(--radius) * 1px)) rotate(calc((var(--angle) * -1deg) - 360deg));
          }
        }
      `}} />

            {path && (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    className="pointer-events-none absolute inset-0 size-full"
                >
                    <circle
                        className="stroke-white/10 stroke-1 dark:stroke-white/10"
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="none"
                    />
                </svg>
            )}

            <div className={cn("absolute inset-0 size-full flex items-center justify-center pointer-events-none")}>
                {React.Children.map(children, (child, index) => {
                    const angle = (360 / React.Children.count(children)) * index;
                    return (
                        <div
                            style={
                                {
                                    "--duration": calculatedDuration,
                                    "--radius": radius,
                                    "--angle": angle,
                                    "--icon-size": `${iconSize}px`,
                                    animation: `orbit-horizontal ${calculatedDuration}s linear infinite`,
                                    animationDirection: reverse ? "reverse" : "normal",
                                    position: "absolute",
                                    display: "flex",
                                    width: `${iconSize}px`,
                                    height: `${iconSize}px`,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "9999px",
                                } as React.CSSProperties
                            }
                            className={cn(
                                "transform-gpu",
                                className
                            )}
                            {...props}
                        >
                            {child}
                        </div>
                    );
                })}
            </div>
        </>
    );
}

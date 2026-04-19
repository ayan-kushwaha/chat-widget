"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface NeonGradientCardProps {
    /**
     * @default <div />
     * @type ReactNode
     * @description
     * The content of the card
     */
    children?: ReactNode;

    /**
     * @default ""
     * @type string
     * @description
     * The class name of the card
     */
    className?: string;

    /**
     * @default 5
     * @type number
     * @description
     * The size of the border in pixels
     */
    borderSize?: number;

    /**
     * @default 20
     * @type number
     * @description
     * The radius of the border in pixels
     */
    borderRadius?: number;

    /**
     * @default "#ffaa40"
     * @type string
     * @description
     * The first color of the gradient
     */
    neonColors?: {
        firstColor: string;
        secondColor: string;
    };
}

const NeonGradientCard = ({
    children,
    className,
    borderSize = 2,
    borderRadius = 20,
    neonColors = {
        firstColor: "#ff00aa",
        secondColor: "#00FFF1",
    },
    ...props
}: NeonGradientCardProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                setDimensions({ width: offsetWidth, height: offsetHeight });
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);

        return () => {
            window.removeEventListener("resize", updateDimensions);
        };
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            const { offsetWidth, offsetHeight } = containerRef.current;
            setDimensions({ width: offsetWidth, height: offsetHeight });
        }
    }, [children]);

    return (
        <div
            ref={containerRef}
            style={
                {
                    "--border-size": `${borderSize}px`,
                    "--border-radius": `${borderRadius}px`,
                    "--neon-first-color": neonColors.firstColor,
                    "--neon-second-color": neonColors.secondColor,
                    "--card-width": `${dimensions.width}px`,
                    "--card-height": `${dimensions.height}px`,
                    "--card-content-radius": `${borderRadius - borderSize}px`,
                } as CSSProperties
            }
            className={cn(
                "relative z-10 size-full rounded-[var(--border-radius)] hover:shadow-[0_0_30px_0_rgba(255,0,170,0.3)] transition-shadow duration-500",
                className,
            )}
            {...props}
        >
            <div
                className={cn(
                    "relative size-full min-h-[inherit] rounded-[var(--card-content-radius)] bg-gray-900 p-6",
                    "before:absolute before:-left-[var(--border-size)] before:-top-[var(--border-size)] before:-z-10 before:block",
                    "before:h-[calc(100%+var(--border-size)*2)] before:w-[calc(100%+var(--border-size)*2)] before:rounded-[var(--border-radius)] before:content-['']",
                    "before:bg-[linear-gradient(0deg,var(--neon-first-color),var(--neon-second-color))] before:bg-[length:100%_200%]",
                    "before:animate-background-position-spin",
                    "after:absolute after:-left-[var(--border-size)] after:-top-[var(--border-size)] after:-z-10 after:block",
                    "after:h-[calc(100%+var(--border-size)*2)] after:w-[calc(100%+var(--border-size)*2)] after:rounded-[var(--border-radius)] after:content-['']",
                    "after:bg-[linear-gradient(0deg,var(--neon-first-color),var(--neon-second-color))] after:bg-[length:100%_200%] after:opacity-80",
                    "after:filter after:blur-[calc(var(--border-size)+10px)] after:animate-background-position-spin",
                )}
            >
                {children}
            </div>
        </div>
    );
};

export { NeonGradientCard };

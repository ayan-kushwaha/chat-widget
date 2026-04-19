"use client";
import { useScroll, useTransform } from "motion/react";
import React from "react";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";
import { StarsBackground } from "../ui/ShootingStarsBackground/stars-background";
import { ShootingStars } from "../ui/ShootingStarsBackground/shooting-stars";

export function GeminiSection() {
    const ref = React.useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]);
    const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]);
    const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]);
    const pathLengthFourth = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]);
    const pathLengthFifth = useTransform(scrollYProgress, [0, 0.8], [0, 1.2]);

    return (
        <div
            className="h-[300vh]  rounded-md relative  overflow-clip"
            ref={ref}
        >
            <ShootingStars />
            <StarsBackground />
            {/* <GridBackgroundDemo /> */}
            <GoogleGeminiEffect
                pathLengths={[
                    pathLengthFirst,
                    pathLengthSecond,
                    pathLengthThird,
                    pathLengthFourth,
                    pathLengthFifth,
                ]}
                title="Infinite Scale. Zero Headcount."
                description="Harness the power of a Hybrid AI Brain. Cluaiz fuses Gemini’s reasoning with your business data to automate support, sales, and operations—instantly and flawlessly."
            />
        </div>
    );
}

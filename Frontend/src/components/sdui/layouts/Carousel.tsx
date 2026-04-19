import React from 'react';
import { UniversalRenderer } from '../UniversalRenderer';
import { UIBlock } from '../types';

export default function Carousel({ block, onAction }: { block: UIBlock; onAction?: (action: any) => void }) {

    const [activeIndex, setActiveIndex] = React.useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const width = scrollRef.current.clientWidth;
            // Calculate active index based on scroll position - simplified for left alignment
            // Assuming simplified item width tracking for now
            const itemWidth = 200 + 16; // min-w-[200px] + gap-4
            const index = Math.round(scrollLeft / itemWidth);
            setActiveIndex(index);
        }
    };

    if (!block.items) return null;

    return (
        <div className="relative group">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto gap-4 p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory pb-6"
                style={{ scrollBehavior: 'smooth' }}
            >
                {block.items.map((child, idx) => (
                    <div key={idx} className="min-w-[200px] snap-center">
                        <UniversalRenderer block={child} onAction={onAction} />
                    </div>
                ))}
            </div>

            {/* Pagination Dots */}
            {block.items.length > 1 && (
                <div className="flex justify-center gap-1.5 absolute bottom-0 left-0 right-0">
                    {block.items.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex
                                ? "w-4 bg-slate-800 dark:bg-white"
                                : "w-1.5 bg-slate-300 dark:bg-slate-700"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

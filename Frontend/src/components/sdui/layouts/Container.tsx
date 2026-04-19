import React from 'react';
import { UIBlock } from '../types';

export default function Container({ block, children }: { block: UIBlock, children: React.ReactNode }) {
    const isVertical = block.variant === 'vertical_stack';
    return (
        <div className={`flex ${isVertical ? 'flex-col space-y-4' : 'flex-row space-x-4'} p-4 border rounded-lg bg-white shadow-sm`} style={block.style as any}>
            {children}
        </div>
    );
}

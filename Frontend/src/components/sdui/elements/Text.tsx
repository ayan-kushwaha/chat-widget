import React from 'react';
import { UIBlock } from '../types';

export default function Text({ block }: { block: UIBlock }) {
    const className = block.variant === 'h2_bold' ? 'text-xl font-bold text-gray-800' : 'text-base text-gray-600';
    return <div className={className}>{block.content}</div>;
}

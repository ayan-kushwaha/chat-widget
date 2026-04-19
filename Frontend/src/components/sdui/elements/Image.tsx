import React from 'react';
import { UIBlock } from '../types';

export default function Image({ block }: { block: UIBlock }) {
    return <img src={block.url} alt="SDUI Image" className="w-full object-cover rounded-md" style={block.style as any} />;
}

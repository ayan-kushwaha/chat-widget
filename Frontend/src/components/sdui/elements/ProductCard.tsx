import React from 'react';
import { UIBlock } from '../types';

export default function ProductCard({ block, onAction }: { block: UIBlock; onAction?: (action: any) => void }) {

    const { title, price, image } = block.data || {};
    return (
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
            {image && <img src={image} className="w-full h-32 object-cover" />}
            <div className="p-2">
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-gray-500 text-xs">{price}</p>
                <button
                    className="mt-2 w-full bg-black text-white text-xs py-1 rounded"
                    onClick={() => block.actions?.forEach(action => onAction?.(action))}
                >Buy Now</button>

            </div>
        </div>
    );
}

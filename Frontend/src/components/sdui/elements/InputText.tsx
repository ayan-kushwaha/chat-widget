import React from 'react';
import { UIBlock } from '../types';

export default function InputText({ block }: { block: UIBlock }) {
    return (
        <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">{block.data?.label || block.content || "Input"}</label>
            <input
                type="text"
                placeholder={block.data?.placeholder || ""}
                className="border p-2 rounded-md w-full"
            />
        </div>
    );
}

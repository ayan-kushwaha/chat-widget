import React from 'react';
import { UIBlock } from '../types';

export default function FormContainer({ block, children }: { block: UIBlock, children: React.ReactNode }) {
    return (
        <form className="p-4 border rounded-lg bg-gray-50 space-y-3" onSubmit={(e) => e.preventDefault()}>
            {children}
        </form>
    );
}

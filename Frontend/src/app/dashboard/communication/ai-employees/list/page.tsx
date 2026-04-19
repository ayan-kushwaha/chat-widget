"use client";

import React, { useState } from 'react';
import { MarketplaceHeader } from '@/components/chatbot/ai-employees-workforce/marketplace/MarketplaceHeader';
import { MarketplaceFilters } from '@/components/chatbot/ai-employees-workforce/marketplace/MarketplaceFilters';
import { MarketplaceGrid } from '@/components/chatbot/ai-employees-workforce/marketplace/MarketplaceGrid';

export default function MarketplacePage() {
    const [filter, setFilter] = useState('All');

    return (
        <div className="w-full h-full bg-black text-white overflow-y-auto no-scrollbar p-8 relative">
            <div className="max-w-7xl mx-auto mb-12">
                <MarketplaceHeader />
                <MarketplaceFilters filter={filter} setFilter={setFilter} />
            </div>

            <MarketplaceGrid filter={filter} />
        </div>
    );
}

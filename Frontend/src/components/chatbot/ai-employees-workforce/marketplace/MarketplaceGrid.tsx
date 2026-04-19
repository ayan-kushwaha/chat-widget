import React, { useState } from 'react';
import { MOCK_AGENTS } from './data';
import { AgentCard } from './AgentCard';
import { AgentPreviewModal } from './AgentPreviewModal';

interface MarketplaceGridProps {
    filter: string;
}

export const MarketplaceGrid: React.FC<MarketplaceGridProps> = ({ filter }) => {
    const [selectedAgent, setSelectedAgent] = useState<typeof MOCK_AGENTS[0] | null>(null);

    // Filter Logic
    const filteredAgents = MOCK_AGENTS.filter(agent => {
        if (filter === 'All') return true;
        if (filter === 'Technical') return agent.role.includes('Dev') || agent.role.includes('Engineer');
        return agent.role.includes(filter) || agent.name.includes(filter);
    });

    return (
        <>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAgents.map((agent, i) => (
                    <AgentCard
                        key={agent.id}
                        agent={agent}
                        index={i}
                        onPreview={setSelectedAgent}
                    />
                ))}
            </div>

            {selectedAgent && (
                <AgentPreviewModal
                    agent={selectedAgent}
                    onClose={() => setSelectedAgent(null)}
                />
            )}
        </>
    );
};

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { agents } from '@/lib/agents-data';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

import { AIWorkforceSidebar } from '@/components/workforce/ai-workforce/AIWorkforceSidebar';
import { AIWorkforceDetail } from '@/components/workforce/ai-workforce/AIWorkforceDetail';
import { AIWorkforceOverview } from '@/components/workforce/ai-workforce/AIWorkforceOverview';

// Mock DB states
export default function AIWorkforcePage() {
    const [hiredIds, setHiredIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'hired' | 'hire_new'>('hired');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [isHiring, setIsHiring] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingTeam, setIsLoadingTeam] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const response = await fetch('/api/workforce/my-team', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const result = await response.json();
                if (result.success && Array.isArray(result.data)) {
                    const ids = result.data.map((member: any) => member.agent_id);
                    setHiredIds(ids);
                    
                    // If no hired agents, default to 'hire_new' tab
                    if (ids.length === 0) {
                        setActiveTab('hire_new');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch workforce team:", error);
            } finally {
                setIsLoadingTeam(false);
            }
        };

        fetchTeam();
    }, []);

    const handleHire = async (agentId: string, bossReason: string) => {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return;

        setIsHiring(true);
        
        try {
            // Call the actual backend API
            const response = await fetch('/api/workforce/hire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    agent_id: agentId,
                    agent_blueprint: agent, // Send the full blueprint for contextualization
                    boss_reason: bossReason
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to deploy agent');
            }

            // Sync with local state - reload will fetch fresh from DB
            window.location.reload();

        } catch (error) {
            console.error("Agent Deployment Error:", error);
            alert("Failed to deploy agent. Please check console for details.");
        } finally {
            setIsHiring(false);
        }
    };

    const hiredAgents = useMemo(() => agents.filter(a => hiredIds.includes(a.id)), [hiredIds]);
    const hireListAgents = useMemo(() => agents.filter(a => !hiredIds.includes(a.id)), [hiredIds]);

    const currentList = activeTab === 'hired' ? hiredAgents : hireListAgents;

    const filteredList = useMemo(() => {
        return currentList.filter(agent =>
            agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.department.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [currentList, searchQuery]);

    const selectedAgent = useMemo(() => {
        return agents.find(a => a.id === selectedAgentId) || null;
    }, [selectedAgentId]);

    // Clear selection if switching tabs and agent not in new list
    useEffect(() => {
        if (selectedAgentId && !filteredList.find(a => a.id === selectedAgentId)) {
            setSelectedAgentId(null);
        }
    }, [filteredList, selectedAgentId]);

    return (
        <div className="relative w-full bg-white dark:bg-black text-neutral-900 dark:text-white overflow-hidden flex h-[calc(100vh-52px)] transition-colors">

            <ResizablePanelGroup direction="horizontal" className="flex-1 w-full bg-transparent overflow-hidden">
                {/* Left Sidebar List */}
                <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                    <AIWorkforceSidebar
                        activeTab={activeTab}
                        setActiveTab={(t) => {
                            setActiveTab(t);
                            setSelectedAgentId(null);
                        }}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        filteredList={filteredList}
                        selectedAgentId={selectedAgentId}
                        setSelectedAgentId={setSelectedAgentId}
                        hiredAgentsCount={hiredAgents.length}
                        unhiredAgentsCount={hireListAgents.length}
                    />
                </ResizablePanel>

                <ResizableHandle withHandle className="relative z-40 bg-neutral-200 dark:bg-[#1a1a1a] border-x border-neutral-300 dark:border-[#222] hover:bg-emerald-500/10 transition-colors w-1.5" />

                {/* Right Detail View */}
                <ResizablePanel defaultSize={75} className="flex flex-col z-10 w-full relative">
                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {selectedAgent ? (
                            <AIWorkforceDetail
                                selectedAgent={selectedAgent}
                                activeTab={activeTab}
                                isHiring={isHiring}
                                handleHire={handleHire}
                            />
                        ) : (
                            <AIWorkforceOverview 
                                hiredCount={hiredAgents.length}
                                totalAvailable={agents.length}
                            />
                        )}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

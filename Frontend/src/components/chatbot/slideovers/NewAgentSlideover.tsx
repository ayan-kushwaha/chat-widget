import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Briefcase, BadgeCheck, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { EmployeeCard, AgentProfile } from '../ai-employees-workforce/EmployeeCard';

// 🎭 Mock Data (Will be replaced by API)
const AI_AGENTS: AgentProfile[] = [
    {
        id: "sales_manager_rocky",
        name: "Rocky",
        role: "Sales Manager",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky&eyebrows=angry&mouth=smile",
        description: "Expert in high-ticket closing and negotiation. Aggressive but polite.",
        skills: ["Negotiation", "Closing", "Cold Outreach"],
        status: "available",
        premium: true,
        price: "$299/mo"
    },
    {
        id: "support_lead_sarah",
        name: "Sarah",
        role: "Support Lead",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&style=circle",
        description: "Empathetic customer success manager. Handles complaints with grace.",
        skills: ["Empathy", "Ticket Management", "Retention"],
        status: "available",
        premium: false,
        price: "$199/mo"
    },
    {
        id: "marketing_head_leo",
        name: "Leo",
        role: "Marketing Head",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
        description: "Creative strategist for viral campaigns and content planning.",
        skills: ["Copywriting", "Strategy", "Social Media"],
        status: "hired",
        premium: true,
        price: "$399/mo"
    },
    {
        id: "researcher_ava",
        name: "Ava",
        role: "Lead Researcher",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ava",
        description: "Deep dive researcher. Finds facts, summarizes papers, and market recon.",
        skills: ["Data Mining", "Summary", "Fact Checking"],
        status: "available",
        premium: false,
        price: "$149/mo"
    }
];

interface NewAgentSlideoverProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NewAgentSlideover: React.FC<NewAgentSlideoverProps> = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const { toast } = useToast();

    const filteredAgents = AI_AGENTS.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleHireClick = (agentId: string) => {
        onClose();
        // Navigate to the hiring ritual page inside dashboard
        router.push(`/dashboard/communication/ai-employees/${agentId}`);
    };

    const handleChatClick = (agentId: string) => {
        toast({ title: "Opening Chat", description: "This feature will be available soon." });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="left" className="w-[400px] sm:w-[450px] p-0 bg-neutral-50 dark:bg-black border-r border-neutral-200 dark:border-white/10 flex flex-col h-full z-[100]">

                {/* 1. Header Area (Matching Sidebar Header) */}
                <div className="p-5 pb-4 bg-white dark:bg-neutral-950/80 backdrop-blur-md border-b border-black/5 dark:border-white/10 z-10 sticky top-0">
                    <SheetHeader className="mb-4 text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Briefcase size={20} className="text-emerald-500" />
                            </div>
                            <SheetTitle className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                                Talent Pool
                            </SheetTitle>
                        </div>

                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 max-w-[95%] leading-relaxed">
                            Hire specialized AI employees to automate your business. Cost effective and 24/7 available.
                        </p>
                    </SheetHeader>

                    {/* Search Bar (Matching SidebarSearch) */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by role or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-white/5 border border-transparent focus:border-emerald-500/50 rounded-xl text-sm outline-none transition-all placeholder:text-zinc-400 font-medium"
                        />
                    </div>
                </div>

                {/* 2. Scrollable List */}
                <ScrollArea className="flex-1 p-4 bg-zinc-50/50 dark:bg-black">
                    <div className="grid grid-cols-1 gap-3 pb-8">
                        {filteredAgents.length > 0 ? (
                            filteredAgents.map((agent) => (
                                <EmployeeCard
                                    key={agent.id}
                                    agent={agent}
                                    onHire={handleHireClick}
                                    onChat={handleChatClick}
                                    layout="list"
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <AlertCircle className="w-8 h-8 text-zinc-300 mb-2" />
                                <p className="text-sm font-medium text-zinc-400">No agents found.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                        <BadgeCheck size={12} className="text-emerald-500" />
                        <span>Verified & SOC-2 Compliant</span>
                    </div>
                </div>

            </SheetContent>
        </Sheet>
    );
};

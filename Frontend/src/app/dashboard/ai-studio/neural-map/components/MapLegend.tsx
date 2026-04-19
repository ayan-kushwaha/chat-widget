import React from 'react';
import { Building2, User, Wrench, FileText, MessageSquare, Brain, Bot, Target } from 'lucide-react';

export const LABEL_ICONS: Record<string, React.ReactNode> = {
  Org: <Building2 className="w-3.5 h-3.5" />,
  Organization: <Building2 className="w-3.5 h-3.5" />,
  Person: <User className="w-3.5 h-3.5" />,
  Employee: <User className="w-3.5 h-3.5" />,
  Tool: <Wrench className="w-3.5 h-3.5" />,
  Skill: <Wrench className="w-3.5 h-3.5" />,
  Agent: <Bot className="w-3.5 h-3.5" />,
  Document: <FileText className="w-3.5 h-3.5" />,
  File: <FileText className="w-3.5 h-3.5" />,
  Goal: <Target className="w-3.5 h-3.5" />,
  ChatSession: <MessageSquare className="w-3.5 h-3.5" />,
  Memory: <Brain className="w-3.5 h-3.5" />,
};

export const getColor = (label?: string): string => {
  switch (label) {
    case 'Org':
    case 'Organization':        return '#FF0000';
    case 'Agent':
    case 'workforce_hub':       return '#FF8C00';
    case 'Skill':
    case 'Tool':                return '#FFD700';
    case 'knowledge_cognition':
    case 'Document':
    case 'File':                return '#32CD32';
    case 'Page':                return '#90EE90';
    case 'Chunk':               return '#00FA9A';
    case 'essence_context':
    case 'Goal':                return '#1E90FF';
    case 'ChatSession':         return '#FF00FF';
    case 'Memory':              return '#8b5cf6';
    case 'Person':
    case 'Employee':            return '#3b82f6';
    default:                    return '#94a3b8';
  }
};

const categories = [
  { label: 'Organization', color: '#FF0000', icon: <Building2 className="w-3 h-3" /> },
  { label: 'Agent', color: '#FF8C00', icon: <Bot className="w-3 h-3" /> },
  { label: 'Skill / Tool', color: '#FFD700', icon: <Wrench className="w-3 h-3" /> },
  { label: 'Knowledge', color: '#32CD32', icon: <FileText className="w-3 h-3" /> },
  { label: 'Goal / Context', color: '#1E90FF', icon: <Target className="w-3 h-3" /> },
  { label: 'Chat Session', color: '#FF00FF', icon: <MessageSquare className="w-3 h-3" /> },
  { label: 'Memory', color: '#8b5cf6', icon: <Brain className="w-3 h-3" /> },
];

const MapLegend = () => {
  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.07] rounded-2xl overflow-hidden shadow-2xl">
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-[0.25em] text-white/35 uppercase font-mono">Node Types</span>
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff4e00] animate-pulse" />
      </div>
      <div className="px-3 py-2 flex flex-wrap gap-x-5 gap-y-1">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color, boxShadow: `0 0 6px ${cat.color}60` }}
            />
            <span className="text-[10px] font-semibold text-white/50">{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapLegend;

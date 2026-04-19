import React, { useState, useEffect } from 'react';
import { Search, X, Zap } from 'lucide-react';
import { getColor } from './MapLegend';

interface SearchPanelProps {
  nodes: any[];
  onSelect: (node: any) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ nodes, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const lq = query.toLowerCase();
    setResults(
      nodes.filter(n =>
        n.name?.toLowerCase().includes(lq) ||
        n.label?.toLowerCase().includes(lq) ||
        n.properties?.description?.toLowerCase().includes(lq)
      ).slice(0, 8)
    );
  }, [query, nodes]);

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative group">
        {/* Glow underline */}
        <div className="absolute inset-x-0 -bottom-1.5 h-0.5 bg-[#ff4e00]/40 blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="relative flex items-center bg-white/[0.05] backdrop-blur-md border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 group-focus-within:border-[#ff4e00]/40 group-focus-within:bg-white/[0.07]">
          <div className="pl-4 text-white/30 group-focus-within:text-[#ff4e00] transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search neurons..."
            className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
              className="pr-3 text-white/20 hover:text-[#ff4e00] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-black/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden z-50">
          <div className="max-h-72 overflow-y-auto">
            {results.map((n) => (
              <button
                key={n.id}
                onClick={() => { onSelect(n); setIsOpen(false); setQuery(n.name); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/[0.05] last:border-0 group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${getColor(n.label)}20`, border: `1px solid ${getColor(n.label)}30` }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(n.label) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest font-mono mb-0.5"
                    style={{ color: `${getColor(n.label)}90` }}>
                    {n.label}
                  </div>
                  <div className="text-sm font-bold text-white/80 truncate group-hover:text-white transition-colors">
                    {n.name || "Untitled"}
                  </div>
                </div>
                <Zap className="w-3.5 h-3.5 text-[#ff4e00]/40 group-hover:text-[#ff4e00] opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
          <div className="bg-white/[0.03] px-4 py-2 border-t border-white/[0.05] text-center">
            <span className="text-[9px] text-white/20 uppercase font-mono tracking-widest">
              Click to zoom to neuron
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;

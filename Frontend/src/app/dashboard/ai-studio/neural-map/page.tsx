"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import api from "@/lib/api";
import Link from "next/link";

import NeuralGraph from "./components/NeuralGraph";
import { generateDummyGraph } from "./dummyData";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ZoomIn, ZoomOut, Layers, Database,
  RefreshCw, ChevronRight, Building2, Bot, Wrench,
  FileText, Target, MessageSquare, Brain,
  Maximize2, Info, User, FlaskConical, Zap, Link2,
  GitBranch, Shield, Cpu, Activity, BarChart2, Clock, Lock
} from "lucide-react";

// ── Node Type Config (all 40+ real neuron types) ─────────────────────────────
const NODE_TYPES = [
  // IDENTITY CLUSTER
  { key: "OrgNeuron",      label: "Organization",    icon: Building2,  color: "#FF0000", desc: "Root org node — the brain's identity core." },
  { key: "BossNeuron",     label: "Boss / Owner",    icon: User,       color: "#FF3333", desc: "Represents the Owner or Shadow Boss." },
  { key: "DeptNeuron",     label: "Department",      icon: GitBranch,  color: "#FF6622", desc: "Business departments (Sales, IT, HR…)." },
  { key: "CultureNeuron",  label: "Culture DNA",     icon: Shield,     color: "#FF8844", desc: "Defines AI tone, values, strictness." },
  { key: "VisionNeuron",   label: "Vision / Goal",   icon: Target,     color: "#FFAA55", desc: "Long-term goals and business strategy." },
  // WORKFORCE CLUSTER
  { key: "AgentNeuron",    label: "AI Agent",        icon: Bot,        color: "#FF8C00", desc: "Hired AI employees with personas." },
  { key: "SkillNeuron",    label: "Skill",           icon: Zap,        color: "#FFD700", desc: "Specific capability of an agent." },
  { key: "ToolNeuron",     label: "Tool / API",      icon: Wrench,     color: "#FFC200", desc: "External tools (WhatsApp, Canva, etc.)." },
  { key: "RoutineNeuron",  label: "Routine",         icon: Clock,      color: "#FFB300", desc: "Scheduled automation tasks." },
  { key: "SuccessNeuron",  label: "Success Pattern", icon: BarChart2,  color: "#FFA500", desc: "Positive reinforcement from wins." },
  { key: "HandoverReflex", label: "Handover",        icon: GitBranch,  color: "#FF9900", desc: "Task passing logic between agents." },
  { key: "PersonaNeuron",  label: "Persona",         icon: User,       color: "#FF7722", desc: "Agent personality archetype." },
  { key: "TrustNeuron",    label: "Trust Score",     icon: Shield,     color: "#FF6600", desc: "Agent reliability tracking." },
  // KNOWLEDGE CLUSTER
  { key: "PageNeuron",     label: "Page / Doc",      icon: FileText,   color: "#32CD32", desc: "Document page index node." },
  { key: "ChunkNeuron",    label: "Data Chunk",      icon: Database,   color: "#44DD44", desc: "Atomic knowledge fragment." },
  { key: "LinkNeuron",     label: "Cross-Reference", icon: Link2,      color: "#55EE55", desc: "Link between knowledge chunks." },
  { key: "InsightNeuron",  label: "AI Insight",      icon: Brain,      color: "#00FA9A", desc: "Autonomous deductions from data." },
  { key: "ConflictNode",   label: "Conflict",        icon: Activity,   color: "#90EE90", desc: "Contradictory information flag." },
  { key: "SourceCredNeuron",label: "Credibility",   icon: Shield,     color: "#66FF66", desc: "Source trust scoring." },
  { key: "GoldenVaultNode",label: "Golden Vault",   icon: Lock,       color: "#FFD700", desc: "Protected critical knowledge." },
  // MEMORY CLUSTER
  { key: "SessionNode",    label: "Chat Session",    icon: MessageSquare, color: "#FF00FF", desc: "Active chat window state." },
  { key: "EpisodeNode",    label: "Episode / Turn",  icon: MessageSquare, color: "#DD00DD", desc: "Single conversation turn." },
  { key: "DhagaNode",      label: "Dhaga Chain",     icon: Link2,      color: "#CC00CC", desc: "Focus chain controller." },
  { key: "MoodNeuron",     label: "Mood State",      icon: Activity,   color: "#BB00BB", desc: "User emotional tone tracking." },
  { key: "HistoryAnchor",  label: "History Anchor",  icon: Clock,      color: "#AA00AA", desc: "Chronological memory marker." },
  { key: "FocusChainNeuron",label: "Focus Chain",   icon: Link2,      color: "#9900AA", desc: "Thematic summary chain." },
  { key: "DecayAnchor",    label: "Decay Anchor",    icon: Clock,      color: "#8800BB", desc: "TTL-based memory expiry." },
  // REFLEX CLUSTER
  { key: "DecisionGate",   label: "Decision Gate",   icon: GitBranch,  color: "#1E90FF", desc: "Fast routing logic node." },
  { key: "ScorerNode",     label: "Scorer",          icon: BarChart2,  color: "#3399FF", desc: "Context relevance validator." },
  { key: "TriggerNeuron",  label: "Trigger",         icon: Zap,        color: "#4488FF", desc: "Keyword-based instant reflex." },
  { key: "PriorityNode",   label: "Priority Queue",  icon: BarChart2,  color: "#5577FF", desc: "Task priority management." },
  { key: "HandoverGate",   label: "Handover QA",     icon: Shield,     color: "#6666FF", desc: "Quality check before handover." },
  { key: "ReflexNeuron",   label: "Reflex Arc",      icon: Zap,        color: "#7755FF", desc: "Pre-computed fast response." },
  { key: "SubconsciousTrigger", label: "Subconscious", icon: Brain,   color: "#8844EE", desc: "Auto-fired deep reflex." },
  // LEARNING / METABOLISM
  { key: "HebbianUpdater", label: "Hebbian Update",  icon: Cpu,        color: "#ff4e00", desc: "Neural weight strengthening." },
  { key: "BacktrackNeuron",label: "Backtrack",       icon: RefreshCw,  color: "#ee3300", desc: "Rollback checkpoint." },
  { key: "RetentionGate",  label: "Retention Gate",  icon: Lock,       color: "#dd2200", desc: "Memory importance filter." },
  { key: "ConflictResolver",label: "Conflict Resolver",icon: Shield,   color: "#cc1100", desc: "Contradiction resolution logic." },
  { key: "SurpriseMetric", label: "Surprise Metric", icon: Activity,   color: "#bb0000", desc: "Unexpected intent detector." },
  { key: "MathematicalVoter",label: "Math Voter",   icon: Cpu,        color: "#aa0000", desc: "Weighted voting logic." },
  { key: "ConsensusArbiter",label: "Consensus",     icon: GitBranch,  color: "#990000", desc: "Decision arbitration node." },
  { key: "PolymorphicSpawner",label: "Spawner",     icon: Bot,        color: "#880000", desc: "Dynamic agent cloning." },
  { key: "TemporalLinkNeuron",label: "Temporal Link",icon: Clock,    color: "#770000", desc: "Time-decaying knowledge link." },
];

// ── Helper: get node color ───────────────────────────────────────────────────
export const getColor = (label?: string): string => {
  const found = NODE_TYPES.find(t => t.key === label || t.label === label);
  return found?.color ?? "#94a3b8";
};

export default function NeuralMapPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const orgId =
    user?.orgId ??
    (typeof window !== "undefined" ? localStorage.getItem("activeOrgId") : null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Interaction ───────────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [hoveredNode, setHoveredNode]   = useState<any | null>(null);
  const [zoomTarget, setZoomTarget]     = useState<any | null>(null);

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState<any[]>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Node Type Panel ───────────────────────────────────────────────────────
  const [layersOpen, setLayersOpen]         = useState(false);
  const [activeTypeInfo, setActiveTypeInfo] = useState<typeof NODE_TYPES[0] | null>(null);

  // ── Panel anchor Y position (from clicked button) ─────────────────────────
  const [panelY, setPanelY] = useState<number | null>(null);

  // ── Dummy Data Mode ────────────────────────────────────────────────────────
  const [useDummyMode, setUseDummyMode] = useState(false);
  const dummyData = useMemo(() => generateDummyGraph(), []);

  const graphRef = useRef<any>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchGraph = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    try {
      setLoading(true);
      const r = await api.get(`/neural/graph/visualize/${orgId}?limit=250`);
      if (r.data?.success || r.data?.status === "success") {
        const gData = r.data.data;
        gData.nodes.forEach((n: any) => {
          if (n.label === "Org" || n.label === "Organization") {
            n.fx = 0; n.fy = 0; n.isRoot = true;
          }
        });
        setData(gData);
      }
    } catch {
      setError("Neural connection timed out.");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  // ── Search Logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setHighlightedNodes(new Set()); return; }
    const lq = searchQuery.toLowerCase();
    const matches = (data?.nodes ?? []).filter((n: any) =>
      n.name?.toLowerCase().includes(lq) ||
      n.label?.toLowerCase().includes(lq)
    ).slice(0, 8);
    setSearchResults(matches);
    setHighlightedNodes(new Set(matches.map((n: any) => n.id)));
  }, [searchQuery, data]);

  const handleSelectResult = (node: any) => {
    setZoomTarget(node);
    setSelectedNode(node);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedNodes(new Set());
    setSearchOpen(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-[calc(100vh-56px)] bg-black overflow-hidden select-none">

      {/* ═══════════════  GRAPH (FULL BLEED)  ═══════════════ */}
      {!loading && !error && (
        <div className="absolute inset-0 z-0">
          <NeuralGraph
            ref={graphRef}
            data={useDummyMode ? dummyData : (data ?? { nodes: [], links: [] })}
            onNodeClick={(n) => setSelectedNode(n)}
            onNodeHover={setHoveredNode}
            selectedNode={selectedNode}
            hoveredNode={hoveredNode}
            zoomToNode={zoomTarget}
            highlightedNodes={highlightedNodes}
          />
        </div>
      )}

      {/* ═══════════════  LOADING  ═══════════════ */}
      <AnimatePresence>
        {loading && (
          <motion.div key="loader"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-[#ff4e00]/20 border-t-[#ff4e00] animate-spin" />
              <div className="absolute inset-3 rounded-full border border-[#ff4e00]/10 border-t-[#ff4e00]/50 animate-spin"
                   style={{ animationDirection: "reverse", animationDuration: "1.4s" }} />
            </div>
            <p className="mt-4 text-[10px] font-mono tracking-[0.4em] text-[#ff4e00]/50 uppercase animate-pulse">
              Syncing Neural Cortex
            </p>
          </motion.div>
        )}
        {error && !loading && (
          <motion.div key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black gap-3"
          >
            <p className="text-xs text-white/40 font-mono">{error}</p>
            <button onClick={() => { setError(null); fetchGraph(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff4e00]/10 border border-[#ff4e00]/30 text-[#ff4e00] text-xs hover:bg-[#ff4e00]/20 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════  TOP-LEFT BRAND BADGE  ═══════════════ */}
      {!loading && (
        <div className="absolute top-5 left-5 z-30 flex items-center gap-2.5 pointer-events-none">
          {/* NODE COUNT BADGE */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur border border-white/8 rounded-xl">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${useDummyMode ? 'bg-yellow-400' : 'bg-[#ff4e00]'}`} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white/50">
              {useDummyMode ? 'Demo Mode' : 'Neural OS'}
            </span>
            <span className="text-[9px] text-white/20 font-mono ml-1">
              {(useDummyMode ? dummyData : data)?.nodes?.length ?? 0}N · {(useDummyMode ? dummyData : data)?.links?.length ?? 0}L
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════  RIGHT TOOLBAR (Google Maps style)  ═══════════════ */}
      {!loading && (
        <div className="absolute top-1/2 right-5 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5">

          {/* DEMO DATA TOGGLE */}
          <ToolBtn
            icon={<FlaskConical className="w-4 h-4" />}
            onClick={(e) => {
              setUseDummyMode(m => !m);
              setSelectedNode(null);
              setHighlightedNodes(new Set());
            }}
            active={useDummyMode}
          />

          <div className="w-5 h-px bg-white/10 my-0.5" />

          {/* SEARCH */}
          <ToolBtn
            icon={<Search className="w-4 h-4" />}
            onClick={(e) => {
              setPanelY((e.currentTarget as HTMLElement).getBoundingClientRect().top);
              setLayersOpen(false);
              setSearchOpen(o => !o);
            }}
            active={searchOpen}
          />

          <div className="w-5 h-px bg-white/10 my-0.5" />

          {/* LAYERS / NODE TYPES */}
          <ToolBtn
            icon={<Layers className="w-4 h-4" />}
            onClick={(e) => {
              setPanelY((e.currentTarget as HTMLElement).getBoundingClientRect().top);
              setSearchOpen(false);
              setActiveTypeInfo(null);
              setLayersOpen(o => !o);
            }}
            active={layersOpen}
          />

          <div className="w-5 h-px bg-white/10 my-0.5" />

          {/* ZOOM IN */}
          <ToolBtn icon={<ZoomIn className="w-4 h-4" />} onClick={() => graphRef.current?.zoomIn()} />

          {/* ZOOM OUT */}
          <ToolBtn icon={<ZoomOut className="w-4 h-4" />} onClick={() => graphRef.current?.zoomOut()} />

          {/* FIT ALL */}
          <ToolBtn icon={<Maximize2 className="w-4 h-4" />} onClick={() => graphRef.current?.resetView()} />

          <div className="w-5 h-px bg-white/10 my-0.5" />

          {/* INSPECT */}
          <Link href={`/dashboard/ai-studio/neural-map/inspect/${orgId}`}>
            <ToolBtn icon={<Database className="w-4 h-4" />} onClick={() => {}} />
          </Link>

          {/* REFRESH */}
          <ToolBtn icon={<RefreshCw className="w-4 h-4" />} onClick={() => { setSelectedNode(null); fetchGraph(); }} />
        </div>
      )}

      {/* ═══════════════  SEARCH PANEL (slides from right)  ═══════════════ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div key="search-panel"
            initial={{ opacity: 0, x: 20, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="absolute right-[68px] z-40 w-72"
            style={{ top: panelY != null ? `${panelY}px` : '50%' }}
          >
            <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <Search className="w-4 h-4 text-[#ff4e00] flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search neurons..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none font-mono"
                />
                <button onClick={clearSearch} className="text-white/20 hover:text-white/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              {searchResults.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map(n => {
                    const typeConf = NODE_TYPES.find(t => t.key === n.label);
                    const Icon = typeConf?.icon ?? Brain;
                    const color = typeConf?.color ?? "#94a3b8";
                    return (
                      <button key={n.id}
                        onClick={() => handleSelectResult(n)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/[0.04] last:border-0 group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: `${color}90` }}>
                            {n.label}
                          </p>
                          <p className="text-sm font-bold text-white/80 truncate group-hover:text-white transition-colors">
                            {n.name ?? "Untitled"}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-[#ff4e00] transition-colors flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery ? (
                <p className="px-4 py-3 text-xs text-white/30 font-mono">No neurons match "{searchQuery}"</p>
              ) : (
                <p className="px-4 py-3 text-xs text-white/20 font-mono">Type to search nodes…</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════  NODE TYPES PANEL (slides from right)  ═══════════════ */}
      <AnimatePresence>
        {layersOpen && (
          <motion.div key="layers-panel"
            initial={{ opacity: 0, x: 20, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="absolute right-[68px] z-40 w-64"
            style={{ top: panelY != null ? `${panelY}px` : '50%' }}
          >
            <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white/40">Node Types</span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff4e00] animate-pulse" />
              </div>
              <div className="p-2">
                {NODE_TYPES.map(t => {
                  const Icon = t.icon;
                  const isActive = activeTypeInfo?.key === t.key;
                  return (
                    <button key={t.key}
                      onClick={() => setActiveTypeInfo(isActive ? null : t)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                        isActive ? "bg-white/8" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${t.color}18`, border: `1px solid ${t.color}30` }}>
                        <Icon className="w-4 h-4" style={{ color: t.color }} />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-white/70 text-left group-hover:text-white transition-colors">
                        {t.label}
                      </span>
                      <Info className={`w-3.5 h-3.5 transition-colors flex-shrink-0 ${isActive ? "text-[#ff4e00]" : "text-white/15 group-hover:text-white/40"}`} />
                    </button>
                  );
                })}
              </div>

              {/* Info tooltip for clicked type */}
              <AnimatePresence>
                {activeTypeInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/[0.06] overflow-hidden"
                  >
                    <div className="px-4 py-3" style={{ backgroundColor: `${activeTypeInfo.color}08` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTypeInfo.color }} />
                        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: activeTypeInfo.color }}>
                          {activeTypeInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{activeTypeInfo.desc}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════  SELECTED NODE CARD  ═══════════════ */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div key={selectedNode.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-80 pointer-events-auto"
          >
            {(() => {
              const typeConf = NODE_TYPES.find(t => t.key === selectedNode.label);
              const Icon = typeConf?.icon ?? Brain;
              const color = typeConf?.color ?? "#94a3b8";
              return (
                <div className="relative bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  {/* Top accent line */}
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} />
                  
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-0.5" style={{ color: `${color}90` }}>
                        {selectedNode.label}
                      </p>
                      <h3 className="text-sm font-black text-white truncate">{selectedNode.name}</h3>
                      {selectedNode.properties?.description && (
                        <p className="text-[11px] text-white/50 leading-relaxed mt-1 line-clamp-2 italic">
                          {selectedNode.properties.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white/60 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════  BOTTOM LEGEND (compact dot row)  ═══════════════ */}
      {!loading && !selectedNode && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="flex items-center gap-4 px-4 py-2 bg-black/60 backdrop-blur border border-white/[0.07] rounded-xl">
            {NODE_TYPES.slice(0, 6).map(t => (
              <div key={t.key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.color, boxShadow: `0 0 5px ${t.color}60` }} />
                <span className="text-[9px] font-mono text-white/40">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable Toolbar Button ──────────────────────────────────────────────────
function ToolBtn({
  icon, onClick, active = false,
}: {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border ${
        active
          ? "bg-[#ff4e00]/20 border-[#ff4e00]/50 text-[#ff4e00] shadow-[0_0_12px_rgba(255,78,0,0.2)]"
          : "bg-black/70 backdrop-blur border-white/10 text-white/40 hover:text-white hover:bg-white/[0.08] hover:border-white/20"
      }`}
    >
      {icon}
    </button>
  );
}

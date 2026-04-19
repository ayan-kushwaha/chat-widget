"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Database, ChevronLeft, Terminal, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function NeuralDataInspector() {
  const { orgId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRawData = async () => {
      try {
        setLoading(true);
        // Sync with the working endpoint from the main map page
        const r = await api.get(`/neural/graph`);
        if (r.data?.success) {
          setData(r.data.data);
        }
      } catch (err: any) {
        console.error("Data Inspector fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (orgId) fetchRawData();
  }, [orgId]);

  const copyToClipboard = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#000] text-white p-8 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
           <Link 
             href="/dashboard/ai-studio/neural-map"
             className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/60 hover:text-white"
           >
             <ChevronLeft className="w-5 h-5" />
           </Link>
           <div>
             <h1 className="text-xl font-bold flex items-center gap-3">
               <Database className="text-emerald-500 w-6 h-6" />
               Neural Data Inspector
             </h1>
             <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">
               Neo4j Raw Connection Graph â€¢ Org ID: <span className="text-emerald-400/60 font-mono">{orgId}</span>
             </p>
           </div>
        </div>

        <button 
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all font-bold text-xs uppercase tracking-widest"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy JSON"}
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-emerald-500/40">
            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Harvesting Neural Data...</p>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Column */}
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
                  <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Graph Topology</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[9px] font-bold text-white/30 uppercase mb-1">Total Nodes</p>
                      <p className="text-2xl font-bold text-emerald-400">{data?.nodes?.length || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[9px] font-bold text-white/30 uppercase mb-1">Total Links</p>
                      <p className="text-2xl font-bold text-blue-400">{data?.links?.length || 0}</p>
                    </div>
                  </div>
               </div>

               <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
                  <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Quick Insights</h3>
                  <div className="space-y-3 text-[11px] font-medium text-white/60">
                    {data?.nodes && Array.from(new Set(data.nodes.map((n: any) => n.label))).map((label: any) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span>{label}</span>
                        <span className="text-emerald-500/60">{data.nodes.filter((n: any) => n.label === label).length}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Code Column */}
            <div className="lg:col-span-2">
               <div className="bg-slate-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl h-[70vh] flex flex-col">
                  <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                     <Terminal className="w-4 h-4 text-emerald-500" />
                     <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">raw_neural_registry.json</span>
                  </div>
                  <div className="flex-1 overflow-auto p-6 custom-scrollbar bg-black/50 font-mono">
                    <pre className="text-[12px] leading-relaxed text-emerald-400/80">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-red-500/60 text-center">
             <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2 border border-red-500/20">
               <Database className="w-6 h-6" />
             </div>
             <p className="text-[10px] font-bold uppercase tracking-[0.3em]">No Data Synced</p>
             <p className="text-xs text-white/30 max-w-xs">Neural connection was established but returned no registry data for this organization ID.</p>
          </div>
        )}
      </div>
    </div>
  );
}

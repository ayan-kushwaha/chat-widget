/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NeuralGraph } from '../neural-map/components/NeuralGraph';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Brain, Cpu, Database, Network, Zap } from 'lucide-react';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#ff4e00] selection:text-white">
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="w-12 h-12 text-[#ff4e00]" />
              </motion.div>
              <span className="font-mono text-xs tracking-[0.5em] uppercase text-white/50">
                Initializing Cluaiz Core
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative w-full h-screen">
        {/* The 3D Graph */}
        <NeuralGraph />

        {/* Glass UI Panels */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Right Stats */}
          <div className="absolute top-8 right-8 pointer-events-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl w-64">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Core Metrics</span>
                <Cpu className="w-4 h-4 text-[#ff4e00]" />
              </div>
              
              <div className="space-y-4">
                <Metric label="Synaptic Load" value="42.8%" progress={42} />
                <Metric label="Neural Density" value="0.84" progress={84} />
                <Metric label="Signal Latency" value="12ms" progress={12} />
              </div>
            </div>
          </div>

          {/* Bottom Left Navigation/Info */}
          <div className="absolute bottom-8 left-8 pointer-events-auto">
            <div className="flex gap-4">
              <NavButton icon={<Brain />} label="Cognition" active />
              <NavButton icon={<Network />} label="Network" />
              <NavButton icon={<Database />} label="Memory" />
              <NavButton icon={<Zap />} label="Reflex" />
            </div>
          </div>

          {/* Left Side Vertical Text */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 vertical-rl rotate-180 flex items-center gap-4 opacity-20">
            <span className="font-mono text-[10px] uppercase tracking-[1em]">Cluaiz Neural OS — Biological Logic</span>
            <div className="w-px h-32 bg-white" />
          </div>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[11px] text-white/60">{label}</span>
        <span className="text-sm font-mono font-medium">{value}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-[#ff4e00]"
        />
      </div>
    </div>
  );
}

function NavButton({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`
      flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300
      ${active 
        ? 'bg-[#ff4e00] text-white shadow-[0_0_30px_rgba(255,78,0,0.3)]' 
        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'}
    `}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

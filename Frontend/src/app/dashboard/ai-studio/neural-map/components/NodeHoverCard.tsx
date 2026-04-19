import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NodeHoverCardProps {
  node: any;
  visible: boolean;
  x?: number;
  y?: number;
}

const NodeHoverCard: React.FC<NodeHoverCardProps> = ({ node, visible }) => {
  if (!node) return null;

  const summary = node.properties?.description || node.properties?.summary;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] max-w-xs pointer-events-none"
        >
          <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/8 rounded-2xl px-5 py-3 shadow-2xl shadow-black/80">
            <p className="text-sm font-bold text-white truncate">{node.name}</p>
            {summary && (
              <p className="text-[11px] text-white/50 mt-1 italic leading-relaxed line-clamp-2">{summary}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NodeHoverCard;

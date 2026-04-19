'use client';

import React, {
  useRef, useEffect, useCallback, useMemo,
  forwardRef, useImperativeHandle, useState
} from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import * as d3 from 'd3-force-3d';
import SpriteText from 'three-spritetext';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />,
});

// ── 5 sectors for 5 main branch separation ─────────────────────────────────
const CLUSTER_ANGLES: Record<string, number> = {
  IDENTITY:  0,
  WORKFORCE: (2 * Math.PI) / 5,
  KNOWLEDGE: (4 * Math.PI) / 5,
  MEMORY:    (6 * Math.PI) / 5,
  REFLEX:    (8 * Math.PI) / 5,
};

// ── Custom Force: Pull clusters into their own 3D wedges ───────────────────
const buildSectorForce = () => {
  let nodes: any[] = [];
  const force = (alpha: number) => {
    for (const n of nodes) {
      if (!n.cluster || n.isRoot) continue;
      const targetAngle = CLUSTER_ANGLES[n.cluster] ?? 0;
      const currentAngle = Math.atan2(n.z ?? 0, n.x ?? 0);
      const diff = targetAngle - currentAngle;
      
      // Pull towards target angle (X/Z plane)
      const strength = 0.15 * alpha;
      n.vx += Math.cos(targetAngle) * strength;
      n.vz += Math.sin(targetAngle) * strength;
    }
  };
  force.initialize = (n: any[]) => { nodes = n; };
  return force;
};

// ── Fallback color map ────────────────────────────────────────────────────────
const LABEL_COLOR: Record<string, string> = {
  OrgNeuron: '#FF2222', Organization: '#FF2222', Org: '#FF2222',
  BossNeuron: '#FF4444', DeptNeuron: '#FF6633', CultureNeuron: '#FF8844', VisionNeuron: '#FFAA55',
  AgentNeuron: '#FF8C00', Agent: '#FF8C00', workforce_hub: '#FF8C00',
  SkillNeuron: '#FFD700', Skill: '#FFD700', ToolNeuron: '#FFC200', Tool: '#FFC200',
  RoutineNeuron: '#FFB300', SuccessNeuron: '#FFA500', HandoverReflex: '#FF9900',
  PageNeuron: '#22C55E', Document: '#22C55E', File: '#22C55E', Page: '#22C55E',
  ChunkNeuron: '#4ADE80', Chunk: '#4ADE80',
  InsightNeuron: '#86EFAC', Insight: '#86EFAC',
  ConflictNode: '#BBF7D0', knowledge_cognition: '#22C55E',
  SessionNode: '#A855F7', ChatSession: '#A855F7', Session: '#A855F7',
  EpisodeNode: '#C084FC', Episode: '#C084FC',
  DhagaNode: '#D8B4FE', Dhaga: '#D8B4FE',
  MoodNeuron: '#E9D5FF', Mood: '#E9D5FF',
  HistoryAnchor: '#7C3AED', DecisionGate: '#3B82F6', Decision: '#3B82F6',
  TriggerNeuron: '#60A5FA', Trigger: '#60A5FA', ScorerNode: '#93C5FD',
  Person: '#38BDF8', Memory: '#7C3AED',
};

const getColor = (n: any): string =>
  n.color ?? LABEL_COLOR[n.label ?? ''] ?? '#64748b';

// ── Node size ─────────────────────────────────────────────────────────────────
const getSize = (n: any): number => {
  if (n.size) return n.size;
  if (n.isRoot) return 15;
  const l = n.label ?? '';
  if (l === 'OrgNeuron' || l === 'Organization') return 14;
  if (l === 'BossNeuron' || l === 'AgentNeuron' || l === 'Agent') return 9;
  return 4.5;
};

// ── Shared geometry pool ──────────────────────────────────────────────────────
const GEO: Record<string, THREE.BufferGeometry> = {
  sphere: new THREE.SphereGeometry(1, 10, 8),
  dode:   new THREE.DodecahedronGeometry(1),
  oct:    new THREE.OctahedronGeometry(1),
};
const geoOf = (label: string) => {
  if (label === 'OrgNeuron' || label === 'BossNeuron') return GEO.dode;
  if (label === 'AgentNeuron' || label === 'Agent' || label === 'DeptNeuron') return GEO.oct;
  return GEO.sphere;
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  data: any;
  onNodeClick: (n: any | null) => void;
  onNodeHover: (n: any | null) => void;
  selectedNode: any | null;
  hoveredNode: any | null;
  zoomToNode?: any;
  highlightedNodes?: Set<string>;
}

// ── Component ─────────────────────────────────────────────────────────────────
const NeuralGraph = forwardRef<any, Props>((
  { data, onNodeClick, onNodeHover, selectedNode, hoveredNode, zoomToNode, highlightedNodes = new Set() },
  ref
) => {
  const fgRef        = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const [hlLinks, setHlLinks] = useState(new Set<any>());
  const [hlNodes, setHlNodes] = useState(new Set<string>());

  const sectorForce = useMemo(() => buildSectorForce(), []);

  // ── Imperative API ────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    zoomIn:    () => { const p = fgRef.current?.cameraPosition(); if (p) fgRef.current.cameraPosition({ x: p.x * 0.75, y: p.y * 0.75, z: p.z * 0.75 }, null, 500); },
    zoomOut:   () => { const p = fgRef.current?.cameraPosition(); if (p) fgRef.current.cameraPosition({ x: p.x * 1.35, y: p.y * 1.35, z: p.z * 1.35 }, null, 500); },
    resetView: () => fgRef.current?.zoomToFit(1000, 100),
  }));

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setDim({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Galaxy stars ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fgRef.current) return;
    const scene = fgRef.current.scene?.() ?? fgRef.current.scene;
    if (!scene || scene.getObjectByName?.('stars')) return;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(8000 * 3);
    for (let i = 0; i < 8000 * 3; i++) pos[i] = (Math.random() - 0.5) * 7000;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.9, color: 0x4f46e5, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    pts.name = 'stars';
    scene.add(pts);
  }, []);

  // ── Physics (Sectors + DAG) ────────────────────────────────────────────────
  useEffect(() => {
    if (!fgRef.current || !data?.nodes?.length) return;
    const fg = fgRef.current;

    fg.d3Force('charge', d3.forceManyBody().strength(-200).distanceMax(600));
    fg.d3Force('collide', d3.forceCollide((n: any) => getSize(n) * 3));
    fg.d3Force('sector', sectorForce);
    fg.d3Force('center', null);

    fg.d3AlphaDecay?.(0.02);
    fg.d3VelocityDecay?.(0.4);
    fg.d3ReheatSimulation?.();

    const t = setTimeout(() => fgRef.current?.zoomToFit(600, 100), 2000);
    return () => clearTimeout(t);
  }, [data, sectorForce]);

  // ── Zoom to Mouse (Google Maps Style) ─────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !fgRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      const fg = fgRef.current;
      const camera = fg.camera();
      const controls = fg.controls();
      if (!camera || !controls) return;

      // Prevent default to override standard center-zoom
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Raycast against the scene to find a real target (node/link/star)
      const scene = fg.scene();
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92; // Slightly more travel
      const targetPoint = new THREE.Vector3();
      
      if (intersects.length > 0) {
        targetPoint.copy(intersects[0].point);
      } else {
        // Fallback: point on a plane at the current target distance
        const dist = camera.position.distanceTo(controls.target);
        raycaster.ray.at(dist, targetPoint);
      }

      // Move camera and target towards the 3D point
      const camPos = camera.position;
      const newCamPos = new THREE.Vector3().lerpVectors(camPos, targetPoint, 1 - zoomFactor);
      const newTarget = new THREE.Vector3().lerpVectors(controls.target, targetPoint, 1 - zoomFactor);

      fg.cameraPosition(newCamPos, newTarget, 0);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [data]);

  // ── Highlight links ────────────────────────────────────────────────────────
  const updateHighlight = useCallback((node: any | null) => {
    if (!data?.links) return;
    const nb = new Set<string>(); const lb = new Set<any>();
    if (node) {
      data.links.forEach((lk: any) => {
        const s = typeof lk.source === 'object' ? lk.source.id : lk.source;
        const t = typeof lk.target === 'object' ? lk.target.id : lk.target;
        if (s === node.id || t === node.id) { nb.add(s === node.id ? t : s); lb.add(lk); }
      });
    }
    setHlNodes(nb); setHlLinks(lb);
  }, [data]);

  useEffect(() => { updateHighlight(hoveredNode ?? selectedNode); }, [hoveredNode, selectedNode, updateHighlight]);

  // ── Zoom to node ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!zoomToNode || !fgRef.current) return;
    const dist = 120;
    const hyp = Math.hypot(zoomToNode.x ?? 1, zoomToNode.y ?? 1, zoomToNode.z ?? 1) || 1;
    fgRef.current.cameraPosition(
      { x: zoomToNode.x * (1 + dist / hyp), y: zoomToNode.y * (1 + dist / hyp), z: zoomToNode.z * (1 + dist / hyp) },
      zoomToNode, 900
    );
  }, [zoomToNode]);

  // ── Custom node ──
  const nodeThreeObject = useCallback((raw: any) => {
    const isSel = selectedNode?.id === raw.id;
    const isHov = hoveredNode?.id === raw.id;
    const isHit = highlightedNodes.has(raw.id);
    const isNb  = hlNodes.has(raw.id);
    const anyActive = hoveredNode != null || selectedNode != null || highlightedNodes.size > 0;
    const isConnected = isSel || isHov || isNb || isHit;

    // ── Label logic (CLEANED: only for active/hovered/searched nodes) ───────
    const showLabel = isConnected || isHit;
    if (!showLabel) return undefined as any;

    const hex  = getColor(raw);
    const r    = getSize(raw);
    const emI  = isConnected ? 2.5 : 0.6; // lower intensity = less white blow-out
    const geo  = geoOf(raw.label ?? '');
    const mat  = new THREE.MeshStandardMaterial({
      color: hex, emissive: hex, emissiveIntensity: emI,
      metalness: 0.5, roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(r);

    const lbl = new SpriteText(raw.name ?? raw.label ?? '');
    lbl.color           = isConnected ? '#ffffff' : `${hex}99`;
    lbl.textHeight      = (isSel || isHov) ? 12 : (isNb ? 9 : 8);
    lbl.position.y      = r + 13;
    lbl.backgroundColor = 'rgba(0,0,0,0.85)';
    lbl.padding         = [4, 8];
    lbl.borderRadius    = 6;
    lbl.fontWeight      = '700';

    const group = new THREE.Group();
    group.add(mesh, lbl);
    return group;
  }, [selectedNode, hoveredNode, hlNodes, highlightedNodes]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="w-full h-full bg-[#000007]">
      {dim.w > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={dim.w}
          height={dim.h}
          graphData={data}
          backgroundColor="#000007"
          showNavInfo={false}
          nodeLabel=""

          // ── DAG radial tree layout ────────────────────────
          dagMode="radialout"
          dagLevelDistance={150}

          // ── Node rendering ────────────────────────────────
          nodeColor={(n: any) => {
            const hex = getColor(n);
            const anyActive = hoveredNode != null || selectedNode != null || highlightedNodes.size > 0;
            const isConnected = selectedNode?.id === n.id || hoveredNode?.id === n.id || hlNodes.has(n.id) || highlightedNodes.has(n.id);
            if (anyActive && !isConnected) return `${hex}22`; // Very faded
            return hex;
          }}
          nodeVal={(n: any) => { const r = getSize(n); return r * r * 0.4; }}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}

          // ── Link rendering (Wires) ────────────────────────
          linkWidth={(lk: any) => hlLinks.has(lk) ? 2.5 : 1.2}
          linkColor={(lk: any) => {
            const srcColor = getColor(typeof lk.source === 'object' ? lk.source : { label: '' });
            if (hlLinks.has(lk)) return srcColor; // focused wire: thick & colorful
            const anyActive = hoveredNode != null || selectedNode != null || highlightedNodes.size > 0;
            return anyActive ? '#ffffff04' : srcColor + '88'; // ~50% opacity (clear idle visibility)
          }}
          linkCurvature={0.08}
          linkDirectionalParticles={(lk: any) => hlLinks.has(lk) ? 4 : 0}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.01}
          linkDirectionalParticleColor={() => '#ffffff'}

          onNodeClick={(n: any) => {
            if (selectedNode?.id === n.id) { onNodeClick(null); return; }
            onNodeClick(n);
          }}
          onNodeHover={(n: any) => onNodeHover(n)}
          onBackgroundClick={() => { onNodeClick(null); onNodeHover(null); }}

          enableNodeDrag={true}
          onNodeDragEnd={(n: any) => { n.fx = n.x; n.fy = n.y; n.fz = n.z; }}
          enableNavigationControls={true}
          warmupTicks={50}
          cooldownTicks={100}
        />
      )}
    </div>
  );
});

NeuralGraph.displayName = 'NeuralGraph';
export default NeuralGraph;

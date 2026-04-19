import React, { useMemo, useRef, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import * as d3 from 'd3-force-3d';

import { ZoomIn, ZoomOut, Maximize, Network } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  val: number;
  color?: string;
  type: 'BossNeuron' | 'OrgNeuron' | 'DeptNeuron' | 'CultureNeuron' | 'VisionNeuron' | 
        'AgentNeuron' | 'SkillNeuron' | 'ToolNeuron' | 'RoutineNeuron' | 'SuccessNeuron' | 'HandoverReflex' | 'TrustNeuron' | 'ConflictResolver' | 'ReflexNeuron' | 'PersonaNeuron' |
        'PageNeuron' | 'ChunkNeuron' | 'LinkNeuron' | 'InsightNeuron' | 'ConflictNode' | 'TemporalLinkNeuron' | 'SourceCredNeuron' | 'GoldenVaultNode' |
        'SessionNode' | 'EpisodeNode' | 'DhagaNode' | 'MoodNeuron' | 'HistoryAnchor' | 'FocusChainNeuron' | 'DecayAnchor' | 'SubconsciousTrigger' | 'ChatEpisodeNode' |
        'DecisionGate' | 'ScorerNode' | 'HandoverGate' | 'TriggerNeuron' | 'PriorityNode' | 'HebbianUpdater' | 'BacktrackNeuron' | 'RetentionGate' | 'SurpriseMetric' | 'MathematicalVoter' | 'ConsensusArbiter' | 'PolymorphicSpawner' |
        'organization' | 'workforce_hub' | 'knowledge_cognition' | 'essence_context' | 'agent' | 'skill' | 'file' | 'page' | 'chunk' | 'insight' | 'goal' | 'chat';
  level: number;
  groupId: string;
  isCollapsed?: boolean;
  isHighlighted?: boolean;
}

interface Link {
  source: string;
  target: string;
  type: 'hierarchical' | 'transversal' | 'has_agents' | 'has_knowledge' | 'has_essence' | 'has_skill' | 'contains' | 'learns' | 'triggers' | 'references' | 'aligns_with' | 'defines';
  strength?: number;
}

export const NeuralGraph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [fov, setFov] = useState(60);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [showGroups, setShowGroups] = useState(true);

  const data = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Level 0: Organization (Root Node) - Red
    const orgId = 'org-root';
    nodes.push({ 
      id: orgId, 
      name: '🌍 Organization Root', 
      val: 50, 
      color: '#FF0000', 
      type: 'organization', 
      level: 0,
      groupId: 'root'
    });

    // Level 1: Pivots
    const pivots = [
      { id: 'hub-workforce', name: 'AI Workforce Hub', color: '#FF8C00', type: 'workforce_hub' as const, rel: 'has_agents' as const },
      { id: 'hub-knowledge', name: 'Knowledge Cognition', color: '#32CD32', type: 'knowledge_cognition' as const, rel: 'has_knowledge' as const },
      { id: 'hub-essence', name: 'Essence / Context', color: '#1E90FF', type: 'essence_context' as const, rel: 'has_essence' as const }
    ];

    pivots.forEach(pivot => {
      nodes.push({ 
        id: pivot.id, 
        name: pivot.name, 
        val: 35, 
        color: pivot.color, 
        type: pivot.type, 
        level: 1, 
        groupId: pivot.id,
        isCollapsed: collapsedNodes.has(pivot.id) 
      });
      links.push({ source: orgId, target: pivot.id, type: pivot.rel });

      if (!collapsedNodes.has(pivot.id)) {
        if (pivot.type === 'workforce_hub') {
          // Level 2: Agents (10 groups)
          for (let i = 0; i < 10; i++) {
            const agentId = `agent-${i}`;
            nodes.push({ 
              id: agentId, 
              name: `Agent ${i}`, 
              val: 25, 
              color: pivot.color, 
              type: 'agent', 
              level: 2,
              groupId: agentId,
              isCollapsed: collapsedNodes.has(agentId)
            });
            links.push({ source: pivot.id, target: agentId, type: 'hierarchical' });

            if (!collapsedNodes.has(agentId)) {
              // Level 3: Skills
              for (let j = 0; j < 3; j++) {
                const skillId = `${agentId}-skill-${j}`;
                nodes.push({ 
                  id: skillId, 
                  name: `Skill ${j}`, 
                  val: 15, 
                  color: '#FFD700', 
                  type: 'skill', 
                  level: 3,
                  groupId: agentId
                });
                links.push({ source: agentId, target: skillId, type: 'has_skill' });
              }
            }
          }
        }

        if (pivot.type === 'knowledge_cognition') {
          // Level 2: Files / Documents (15 groups)
          for (let i = 0; i < 15; i++) {
            const fileId = `file-${i}`;
            nodes.push({ 
              id: fileId, 
              name: `Knowledge Base ${i}`, 
              val: 25, 
              color: pivot.color, 
              type: 'file', 
              level: 2,
              groupId: fileId,
              isCollapsed: collapsedNodes.has(fileId)
            });
            links.push({ source: pivot.id, target: fileId, type: 'hierarchical' });

            if (!collapsedNodes.has(fileId)) {
              // Level 3: Pages
              for (let j = 0; j < 2; j++) {
                const pageId = `${fileId}-page-${j}`;
                nodes.push({ 
                  id: pageId, 
                  name: `Page ${j}`, 
                  val: 18, 
                  color: '#90EE90', 
                  type: 'page', 
                  level: 3,
                  groupId: fileId,
                  isCollapsed: collapsedNodes.has(pageId)
                });
                links.push({ source: fileId, target: pageId, type: 'contains' });

                if (!collapsedNodes.has(pageId)) {
                  // Level 4: Chunks
                  for (let k = 0; k < 2; k++) {
                    const chunkId = `${pageId}-chunk-${k}`;
                    nodes.push({ 
                      id: chunkId, 
                      name: `Chunk ${k}`, 
                      val: 12, 
                      color: '#00FA9A', 
                      type: 'chunk', 
                      level: 4,
                      groupId: fileId
                    });
                    links.push({ source: pageId, target: chunkId, type: 'contains' });
                  }
                }
              }
            }
          }
        }

        if (pivot.type === 'essence_context') {
          // Level 2: Business Goals (10 groups)
          for (let i = 0; i < 10; i++) {
            const goalId = `goal-${i}`;
            nodes.push({ 
              id: goalId, 
              name: `Goal ${i}`, 
              val: 25, 
              color: pivot.color, 
              type: 'goal', 
              level: 2,
              groupId: goalId
            });
            links.push({ source: pivot.id, target: goalId, type: 'defines' });
          }
        }
      }
    });

    // Interactions: Universal Chats (5 groups)
    for (let i = 0; i < 5; i++) {
      const chatId = `chat-${i}`;
      nodes.push({ 
        id: chatId, 
        name: `Chat Session ${i}`, 
        val: 20, 
        color: '#FF00FF', 
        type: 'chat', 
        level: 2,
        groupId: chatId
      });

      // Connect to Workforce (Triggers Agent)
      const agentNodes = nodes.filter(n => n.type === 'agent');
      if (agentNodes.length > 0) {
        const targetAgent = agentNodes[Math.floor(Math.random() * agentNodes.length)];
        links.push({ source: chatId, target: targetAgent.id, type: 'triggers' });
      }

      // Connect to Knowledge (References Chunk)
      const chunkNodes = nodes.filter(n => n.type === 'chunk');
      if (chunkNodes.length > 0) {
        const targetChunk = chunkNodes[Math.floor(Math.random() * chunkNodes.length)];
        links.push({ source: chatId, target: targetChunk.id, type: 'references' });
      }

      // Connect to Essence (Aligns with Goal)
      const goalNodes = nodes.filter(n => n.type === 'goal');
      if (goalNodes.length > 0) {
        const targetGoal = goalNodes[Math.floor(Math.random() * goalNodes.length)];
        links.push({ source: chatId, target: targetGoal.id, type: 'aligns_with' });
      }
    }

    // Assign each group a target position on a large sphere
    // (Removed fixed target positions for dynamic clustering)

    return { nodes, links };
  }, [collapsedNodes]);

  const nodeTypes = [
    'BossNeuron', 'OrgNeuron', 'DeptNeuron', 'CultureNeuron', 'VisionNeuron',
    'AgentNeuron', 'SkillNeuron', 'ToolNeuron', 'RoutineNeuron', 'SuccessNeuron', 'HandoverReflex', 'TrustNeuron', 'ConflictResolver', 'ReflexNeuron', 'PersonaNeuron',
    'PageNeuron', 'ChunkNeuron', 'LinkNeuron', 'InsightNeuron', 'ConflictNode', 'TemporalLinkNeuron', 'SourceCredNeuron', 'GoldenVaultNode',
    'SessionNode', 'EpisodeNode', 'DhagaNode', 'MoodNeuron', 'HistoryAnchor', 'FocusChainNeuron', 'DecayAnchor', 'SubconsciousTrigger', 'ChatEpisodeNode',
    'DecisionGate', 'ScorerNode', 'HandoverGate', 'TriggerNeuron', 'PriorityNode', 'HebbianUpdater', 'BacktrackNeuron', 'RetentionGate', 'SurpriseMetric', 'MathematicalVoter', 'ConsensusArbiter', 'PolymorphicSpawner',
    'organization', 'workforce_hub', 'knowledge_cognition', 'essence_context', 'agent', 'skill', 'file', 'page', 'chunk', 'insight', 'goal', 'chat'
  ];

  const getColor = (type: string) => {
    // Specific overrides
    if (type === 'BossNeuron') return 'hsl(0, 80%, 60%)'; // Red
    if (type === 'OrgNeuron') return 'hsl(30, 80%, 60%)'; // Orange
    if (type === 'AgentNeuron' || type === 'agent') return 'hsl(270, 80%, 60%)'; // Purple
    if (type === 'SkillNeuron' || type === 'skill') return 'hsl(270, 80%, 30%)'; // Darker Purple

    const index = nodeTypes.indexOf(type);
    // Use golden ratio conjugate to distribute hues more effectively
    const goldenRatio = 0.618033988749895;
    const hue = (index * goldenRatio) % 1;
    return `hsl(${hue * 360}, 85%, 65%)`;
  };

  const categories = {
    identity: ['BossNeuron', 'OrgNeuron', 'DeptNeuron', 'CultureNeuron', 'VisionNeuron', 'organization'],
    workforce: ['AgentNeuron', 'SkillNeuron', 'ToolNeuron', 'RoutineNeuron', 'SuccessNeuron', 'HandoverReflex', 'TrustNeuron', 'ConflictResolver', 'ReflexNeuron', 'PersonaNeuron', 'workforce_hub', 'agent', 'skill'],
    knowledge: ['PageNeuron', 'ChunkNeuron', 'LinkNeuron', 'InsightNeuron', 'ConflictNode', 'TemporalLinkNeuron', 'SourceCredNeuron', 'GoldenVaultNode', 'knowledge_cognition', 'file', 'page', 'chunk', 'insight'],
    control: ['SessionNode', 'EpisodeNode', 'DhagaNode', 'MoodNeuron', 'HistoryAnchor', 'FocusChainNeuron', 'DecayAnchor', 'SubconsciousTrigger', 'ChatEpisodeNode', 'DecisionGate', 'ScorerNode', 'HandoverGate', 'TriggerNeuron', 'PriorityNode', 'HebbianUpdater', 'BacktrackNeuron', 'RetentionGate', 'SurpriseMetric', 'MathematicalVoter', 'ConsensusArbiter', 'PolymorphicSpawner', 'essence_context', 'goal', 'chat']
  };

  const getGeometry = (type: string, val: number, nodeCount: number) => {
    const scale = Math.max(0.5, Math.min(1, 100 / nodeCount));
    const size = (val / 2) * scale;
    
    if (categories.identity.includes(type)) return new THREE.DodecahedronGeometry(size);
    if (categories.workforce.includes(type)) return new THREE.BoxGeometry(size * 1.5, size * 1.5, size * 1.5);
    if (categories.knowledge.includes(type)) return new THREE.IcosahedronGeometry(size);
    return new THREE.TorusKnotGeometry(size, size / 3);
  };

  const forceCluster = useMemo(() => {
    const strength = 0.2; // Increased strength to keep groups tighter
    let nodes: any[];

    function force(alpha: number) {
      const centroids: { [key: string]: { x: number, y: number, z: number, count: number } } = {};

      for (const node of nodes) {
        if (!centroids[node.groupId]) {
          centroids[node.groupId] = { x: 0, y: 0, z: 0, count: 0 };
        }
        centroids[node.groupId].x += node.x;
        centroids[node.groupId].y += node.y;
        centroids[node.groupId].z += node.z;
        centroids[node.groupId].count++;
      }

      for (const key in centroids) {
        centroids[key].x /= centroids[key].count;
        centroids[key].y /= centroids[key].count;
        centroids[key].z /= centroids[key].count;
      }

      for (const node of nodes) {
        const centroid = centroids[node.groupId];
        node.vx -= (node.x - centroid.x) * strength * alpha;
        node.vy -= (node.y - centroid.y) * strength * alpha;
        node.vz -= (node.z - centroid.z) * strength * alpha;
      }
    }

    force.initialize = (_nodes: any[]) => nodes = _nodes;
    return force;
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      // Configure forces for "Minar" vs "Jaal" look
      fgRef.current.d3Force('link').distance((link: any) => {
        const type = link.type;
        // Keep hierarchical structures very tight within groups
        if (type === 'hierarchical' || type === 'has_agents' || type === 'has_knowledge' || type === 'has_essence' || type === 'contains' || type === 'defines') return 30;
        if (type === 'has_skill' || type === 'learns') return 15;
        // Push interaction layers very far away to create space between groups
        if (type === 'transversal' || type === 'chat') return 1200;
        return 800; 
      }).strength((link: any) => {
        const type = link.type;
        if (type === 'hierarchical' || type === 'has_agents' || type === 'has_knowledge' || type === 'has_essence' || type === 'contains' || type === 'defines') return 1;
        if (type === 'transversal' || type === 'chat') return 0.001;
        return 0.002; // Weaker interaction links to allow groups to stay in their target zones
      });
      
      // Strong repulsion to prevent overlap
      fgRef.current.d3Force('charge', d3.forceManyBody().strength(-1500));
      
      // Collision force to prevent node overlap
      fgRef.current.d3Force('collide', d3.forceCollide((node: any) => node.val * 4.5));
      
      // Cluster force for dynamic grouping
      fgRef.current.d3Force('cluster', forceCluster);
      
      // Disable default center force
      fgRef.current.d3Force('center', null);
      
      // Add a radial force to keep things around the root
      fgRef.current.d3Force('radial', d3.forceRadial(0, 0, 0).strength(0.005));
    }
  }, [data, forceCluster]); // Re-apply forces when data changes

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setHighlightedNodes(new Set());
      return;
    }

    const matches = new Set<string>();
    data.nodes.forEach(node => {
      if (node.name.toLowerCase().includes(query.toLowerCase())) {
        matches.add(node.id);
      }
    });
    setHighlightedNodes(matches);

    // Zoom to first match
    if (matches.size > 0 && fgRef.current) {
      const firstMatch = data.nodes.find(n => matches.has(n.id));
      if (firstMatch) {
        fgRef.current.cameraPosition(
          { x: (firstMatch as any).x, y: (firstMatch as any).y, z: (firstMatch as any).z + 100 },
          (firstMatch as any),
          2000
        );
      }
    }
  };

  useEffect(() => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [fov]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-black overflow-hidden relative">
      {dimensions.width > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={data}
          backgroundColor="#000000"
          nodeLabel="name"
          nodeColor={node => getColor((node as Node).type)}
          linkWidth={(link: any) => {
            const type = link.type;
            if (type === 'hierarchical') return 2;
            return 0.5;
          }}
          linkColor={(link: any) => {
            const type = link.type;
            if (type === 'hierarchical') return '#ffffff';
            if (type === 'transversal' || type === 'chat') return '#800080';
            return '#555555';
          }}
          nodeRelSize={8}
          showNavInfo={false}
          onNodeClick={(node: any) => {
            // Focus on the node
            const distance = 100;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
            if (fgRef.current) {
              fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
                node, // lookAt
                2000  // duration
              );
            }

            if (node.type === 'organization' || node.type === 'skill' || node.type === 'insight' || node.type === 'goal' || node.type === 'chat') return;
            setCollapsedNodes(prev => {
              const next = new Set(prev);
              if (next.has(node.id)) next.delete(node.id);
              else next.add(node.id);
              return next;
            });
          }}
          nodeThreeObject={(node) => {
            const n = node as Node;
            const isHighlighted = highlightedNodes.has(n.id);
            const isPrimary = n.level <= 1;
            const isCollapsed = n.isCollapsed;
            
            const getGeometryForNode = (node: Node) => {
              if (node.isCollapsed) return new THREE.OctahedronGeometry(node.val / 2.5, 0);
              
              return getGeometry(node.type, node.val, data.nodes.length);
            };

            const geometry = getGeometryForNode(n);
            
            // Highlighting logic: Green glow for context matches
            const baseColor = isHighlighted ? '#00FF00' : getColor(n.type);
            
            const material = new THREE.MeshStandardMaterial({
              color: baseColor,
              transparent: true,
              opacity: isHighlighted ? 1 : (highlightedNodes.size > 0 ? 0.1 : 0.9),
              metalness: 0.8,
              roughness: 0.2,
              emissive: new THREE.Color(baseColor),
              emissiveIntensity: isHighlighted ? 10 : (isPrimary ? 2 : 0.5),
            });

            const mesh = new THREE.Mesh(geometry, material);

            if (isPrimary || isCollapsed || isHighlighted) {
              const group = new THREE.Group();
              group.add(mesh);

              // Add "Neural Containment Field" (Grouping Envelope) for Pivots
              if (showGroups && (n.type === 'workforce_hub' || n.type === 'knowledge_cognition' || n.type === 'essence_context') && !isCollapsed) {
                const envelopeGeometry = new THREE.SphereGeometry(100, 16, 16);
                const envelopeMaterial = new THREE.MeshBasicMaterial({
                  color: getColor(n.type),
                  wireframe: true,
                  transparent: true,
                  opacity: 0.05,
                  blending: THREE.AdditiveBlending,
                });
                const envelope = new THREE.Mesh(envelopeGeometry, envelopeMaterial);
                group.add(envelope);

                // Add a second, pulsing shell
                const shellGeometry = new THREE.SphereGeometry(62, 8, 8);
                const shellMaterial = new THREE.MeshBasicMaterial({
                  color: n.color || '#ffffff',
                  transparent: true,
                  opacity: 0.02,
                  blending: THREE.AdditiveBlending,
                });
                const shell = new THREE.Mesh(shellGeometry, shellMaterial);
                group.add(shell);

                // Animate the envelope
                let eTime = 0;
                const animateEnvelope = () => {
                  eTime += 0.01;
                  envelope.rotation.y += 0.002;
                  envelope.rotation.x += 0.001;
                  shell.scale.setScalar(1 + Math.sin(eTime) * 0.05);
                  requestAnimationFrame(animateEnvelope);
                };
                animateEnvelope();
              }

              const canvas = document.createElement('canvas');
              canvas.width = 64;
              canvas.height = 64;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
                const color = new THREE.Color(baseColor);
                gradient.addColorStop(0, `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${isHighlighted ? 1 : 0.6})`);
                gradient.addColorStop(0.5, `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.2)`);
                gradient.addColorStop(1, `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 64, 64);
              }

              const texture = new THREE.CanvasTexture(canvas);
              const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
              });
              const sprite = new THREE.Sprite(spriteMaterial);
              sprite.scale.set(n.val * (isHighlighted ? 5 : 2.5), n.val * (isHighlighted ? 5 : 2.5), 1);
              group.add(sprite);

              let time = 0;
              const animate = () => {
                time += 0.05;
                const pulse = 1 + Math.sin(time) * (isHighlighted ? 0.4 : 0.1);
                mesh.rotation.y += isHighlighted ? 0.02 : 0.005;
                mesh.rotation.x += isHighlighted ? 0.01 : 0.002;
                mesh.rotation.z += 0.005;
                mesh.scale.set(pulse, pulse, pulse);
                sprite.scale.set(n.val * (isHighlighted ? 5 : 2.5) * pulse, n.val * (isHighlighted ? 5 : 2.5) * pulse, 1);
                requestAnimationFrame(animate);
              };
              animate();

              return group;
            }

            return mesh;
          }}
          linkWidth={(link: any) => {
            const isHighlighted = highlightedNodes.has(link.source.id) || highlightedNodes.has(link.target.id);
            if (isHighlighted) return 4;
            const type = link.type;
            if (type === 'triggers' || type === 'references' || type === 'aligns_with') return 0.5;
            return 2;
          }}
          linkColor={(link: any) => {
            const isHighlighted = highlightedNodes.has(link.source.id) || highlightedNodes.has(link.target.id);
            if (isHighlighted) return '#00FF00';
            const type = link.type;
            if (type === 'triggers' || type === 'references' || type === 'aligns_with') return 'rgba(255, 0, 255, 0.1)';
            return 'rgba(255, 255, 255, 0.2)';
          }}
          linkDirectionalParticles={(link: any) => {
            const isHighlighted = highlightedNodes.has(link.source.id) || highlightedNodes.has(link.target.id);
            if (isHighlighted) return 8;
            const type = link.type;
            if (type === 'triggers' || type === 'references' || type === 'aligns_with') return 2;
            return 4;
          }}
          linkDirectionalParticleSpeed={(link: any) => {
            const isHighlighted = highlightedNodes.has(link.source.id) || highlightedNodes.has(link.target.id);
            if (isHighlighted) return 0.02;
            return 0.008;
          }}
          linkDirectionalParticleWidth={(link: any) => {
            const isHighlighted = highlightedNodes.has(link.source.id) || highlightedNodes.has(link.target.id);
            return isHighlighted ? 3 : 1;
          }}
          linkDirectionalParticleColor={() => '#00FF00'}
          nodeThreeObjectExtend={true}
        />
      )}
      
      {/* HUD Overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic">
              CLUAIZ <span className="text-[#ff4e00]">NEURAL OS</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff4e00] animate-pulse" />
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                Biological Brain Architecture
              </span>
            </div>
            <p className="text-[9px] font-mono text-white/30 max-w-[200px] leading-relaxed mt-2">
              Stateful, learning graph of knowledge mimicking human brain connectivity.
              <br />
              <span className="text-[#ff4e00] mt-1 block">Click hubs or categories to expand/collapse.</span>
            </p>
          </div>

          {/* Search / Context Control */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Context Query</span>
            <div className="relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search neurons..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#ff4e00] transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => handleSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Optics Control</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setFov(prev => Math.max(10, prev - 5))}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                title="Zoom In (Decrease FOV)"
              >
                <ZoomIn className="w-4 h-4 text-white/60 group-hover:text-[#ff4e00]" />
              </button>
              <button 
                onClick={() => setFov(prev => Math.min(120, prev + 5))}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                title="Zoom Out (Increase FOV)"
              >
                <ZoomOut className="w-4 h-4 text-white/60 group-hover:text-[#ff4e00]" />
              </button>
              <button 
                onClick={() => setFov(60)}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                title="Reset View"
              >
                <Maximize className="w-4 h-4 text-white/60 group-hover:text-[#ff4e00]" />
              </button>
              <button 
                onClick={() => setShowGroups(!showGroups)}
                className={`p-2 border border-white/10 rounded-lg transition-colors group ${showGroups ? 'bg-[#ff4e00]/20 border-[#ff4e00]/50' : 'bg-white/5 hover:bg-white/10'}`}
                title="Toggle Neural Envelopes"
              >
                <Network className={`w-4 h-4 ${showGroups ? 'text-[#ff4e00]' : 'text-white/60 group-hover:text-[#ff4e00]'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="font-mono text-[9px] text-white/40 uppercase">FOV: {fov}°</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-10 pointer-events-none text-right">
        <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
          Nodes: {data.nodes.length} | Links: {data.links.length}
        </div>
        <div className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em] mt-1">
          System Status: Optimal
        </div>
      </div>
    </div>
  );
};

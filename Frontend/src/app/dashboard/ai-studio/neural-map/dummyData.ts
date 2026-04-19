/**
 * CLUAIZ NEURAL OS — PURE TREE DATASET
 *
 * IMPORTANT: This is a strict tree (no cycles, no cross-links).
 * This is the ONLY way dagMode="radialout" works correctly.
 *
 * Structure:
 * OrgNeuron (root)
 *   ├─ AI Workforce Hub
 *   │    ├─ Agent: Aman
 *   │    │    ├─ Skill: Script Writing → Tool
 *   │    │    └─ ...
 *   │    └─ ...8 agents
 *   ├─ Knowledge Hub
 *   │    ├─ Files → pricing.pdf → §1, §2, §3
 *   │    ├─ Website → Home → §1, §2
 *   │    └─ APIs → WhatsApp API → §1
 *   ├─ Essence & Identity
 *   │    ├─ BossNeuron
 *   │    ├─ VisionNeuron → Goals
 *   │    ├─ CultureNeuron
 *   │    └─ Departments
 *   ├─ Universal Chats
 *   │    └─ Sessions → Mood, Episodes, Dhaga
 *   └─ Reflex Layer
 *        └─ Triggers → Decision Gates
 */

interface GraphData { nodes: any[]; links: any[] }

// ── Color palette per cluster+depth ────────────────────────────────────────
type Cluster = 'IDENTITY' | 'WORKFORCE' | 'KNOWLEDGE' | 'MEMORY' | 'REFLEX';

const BASE_COLOR: Record<Cluster, string> = {
  IDENTITY:  '#FF3300',
  WORKFORCE: '#FF8C00',
  KNOWLEDGE: '#22C55E',
  MEMORY:    '#A855F7',
  REFLEX:    '#3B82F6',
};

function depthColor(cluster: Cluster, depth: number): string {
  const hex = BASE_COLOR[cluster];
  const n   = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const f = [0, 0.18, 0.36, 0.52, 0.65][Math.min(depth, 4)];
  r = Math.round(r + (255 - r) * f);
  g = Math.round(g + (255 - g) * f);
  b = Math.round(b + (255 - b) * f);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// ── ID factory ──────────────────────────────────────────────────────────────
let _n = 0;
const uid = (p: string) => `${p}_${++_n}`;

// ── Node size by depth ──────────────────────────────────────────────────────
const sizeByDepth = [18, 12, 8, 5, 3.5, 2.5];

// ── Main generator ──────────────────────────────────────────────────────────
export function generateDummyGraph(): GraphData {
  _n = 0; // reset IDs each call
  const nodes: any[] = [];
  const links: any[] = [];

  const n = (id: string, label: string, name: string, cluster: Cluster, depth: number, props: any = {}) => {
    nodes.push({
      id, label, name, cluster, depth,
      color: depthColor(cluster, depth),
      size: sizeByDepth[Math.min(depth, 5)],
      isRoot: depth === 0,
      properties: { description: `${label} — ${name}`, ...props },
    });
    return id;
  };

  const edge = (src: string, tgt: string, type: string) =>
    links.push({ source: src, target: tgt, type });

  // ══════════════════════════════════════════════════════════════════════════
  // ROOT
  // ══════════════════════════════════════════════════════════════════════════
  const root = n('org_root', 'OrgNeuron', 'Cluaiz Technologies', 'IDENTITY', 0, { mission: 'Biological AI Brain' });

  // ══════════════════════════════════════════════════════════════════════════
  // BRANCH 1 — ESSENCE & IDENTITY (top)
  // ══════════════════════════════════════════════════════════════════════════
  const essHub = uid('ess');
  n(essHub, 'VisionNeuron', 'Essence & Identity', 'IDENTITY', 1);
  edge(root, essHub, 'HAS_ESSENCE');

  // Boss
  const bossId = uid('boss');
  n(bossId, 'BossNeuron', 'Aryan Jain — Founder', 'IDENTITY', 2, { role: 'CEO' });
  edge(essHub, bossId, 'HAS_BOSS');

  // Vision
  const visId = uid('vis');
  n(visId, 'VisionNeuron', 'Vision 2028', 'IDENTITY', 2, { goal: "World's first Biological AI OS" });
  edge(essHub, visId, 'HAS_VISION');

  // Goals under Vision
  ['$1M ARR by Q4', '500 Enterprise Clients', 'Neural Map v2', '40 Neuron Types Live', 'Shadow Boss v3'].forEach(g => {
    const gi = uid('goal');
    n(gi, 'VisionNeuron', g, 'IDENTITY', 3, { priority: 'HIGH' });
    edge(visId, gi, 'GUIDES');
  });

  // Culture
  const cultId = uid('cult');
  n(cultId, 'CultureNeuron', 'Culture DNA', 'IDENTITY', 2, { tone: 'Professional Hinglish' });
  edge(essHub, cultId, 'HAS_CULTURE');

  // Departments
  ['Sales & Revenue', 'IT & Infrastructure', 'Content & Marketing', 'Customer Success', 'Research & AI'].forEach(d => {
    const di = uid('dept');
    n(di, 'DeptNeuron', d, 'IDENTITY', 3);
    edge(cultId, di, 'HAS_DEPT');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BRANCH 2 — AI WORKFORCE (left)
  // ══════════════════════════════════════════════════════════════════════════
  const wfHub = uid('wf');
  n(wfHub, 'AgentNeuron', 'AI Workforce Hub', 'WORKFORCE', 1);
  edge(root, wfHub, 'HAS_WORKFORCE');

  const agents = [
    { name: 'Aman — YouTube Manager',    skills: ['Script Writing', 'Thumbnail AI', 'SEO Optimizer', 'Comment Mgr'] },
    { name: 'Priya — Instagram Manager', skills: ['Caption Writer', 'Hashtag Engine', 'Story Scheduler', 'Reel Editor'] },
    { name: 'Raj — Chat Manager',        skills: ['Reply Bot', 'Escalation Logic', 'Sentiment Detect', 'FAQ Handler'] },
    { name: 'Dev — DevOps Agent',        skills: ['CI/CD Monitor', 'Error Tracker', 'Server Health', 'Deploy Guard'] },
    { name: 'Neha — Sales Agent',        skills: ['Lead Scorer', 'Cold Email', 'Follow-up Bot', 'CRM Updater'] },
    { name: 'Vikram — Research Bot',     skills: ['Web Scraper', 'PDF Analyzer', 'Summary Engine', 'Trend Detector'] },
    { name: 'Kavya — Marketing Brain',   skills: ['Campaign Builder', 'A/B Tester', 'Audience Segmenter', 'Ad Copywriter'] },
    { name: 'Ananya — WhatsApp Agent',   skills: ['WA Sender', 'Template Mgr', 'Broadcast Engine', 'Auto Reply'] },
  ];

  const toolNames = ['WhatsApp API', 'Canva Pro', 'Google Sheets', 'Slack API', 'Gemini API', 'Notion API'];

  agents.forEach(ag => {
    const aId = uid('agent');
    n(aId, 'AgentNeuron', ag.name, 'WORKFORCE', 2, { status: 'active' });
    edge(wfHub, aId, 'HAS_AGENT');

    // Persona under agent
    const pId = uid('persona');
    n(pId, 'PersonaNeuron', `${ag.name.split('—')[0].trim()} Profile`, 'WORKFORCE', 3, { archetype: 'Expert' });
    edge(aId, pId, 'HAS_PERSONA');

    // Trust under agent
    const tId = uid('trust');
    n(tId, 'TrustNeuron', `Trust Score`, 'WORKFORCE', 3, { score: (0.7 + Math.random() * 0.3).toFixed(2) });
    edge(aId, tId, 'HAS_TRUST');

    // Skills
    ag.skills.forEach(sk => {
      const sId = uid('skill');
      n(sId, 'SkillNeuron', sk, 'WORKFORCE', 3);
      edge(aId, sId, 'HAS_SKILL');

      // Tool
      const toolId = uid('tool');
      n(toolId, 'ToolNeuron', toolNames[Math.floor(Math.random() * toolNames.length)], 'WORKFORCE', 4);
      edge(sId, toolId, 'USES_TOOL');

      // Occasional success record
      if (Math.random() > 0.6) {
        const sucId = uid('suc');
        n(sucId, 'SuccessNeuron', `Win: ${sk}`, 'WORKFORCE', 5, { metric: 'CTR +23%' });
        edge(sId, sucId, 'REINFORCED_BY');
      }
    });

    // Routine
    const rId = uid('routine');
    n(rId, 'RoutineNeuron', `Daily Routine`, 'WORKFORCE', 3, { schedule: '09:00 IST' });
    edge(aId, rId, 'HAS_ROUTINE');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BRANCH 3 — KNOWLEDGE COGNITION (right)
  // ══════════════════════════════════════════════════════════════════════════
  const knHub = uid('kn');
  n(knHub, 'PageNeuron', 'Knowledge Cognition Hub', 'KNOWLEDGE', 1);
  edge(root, knHub, 'HAS_KNOWLEDGE');

  // Sub-hub: Files
  const filesHub = uid('files_hub');
  n(filesHub, 'InsightNeuron', 'Files & Documents', 'KNOWLEDGE', 2, { type: 'File' });
  edge(knHub, filesHub, 'HAS_FILES');

  ['pricing.pdf', 'policy.pdf', 'onboarding.pdf', 'product-guide.pdf', 'sales-playbook.pdf'].forEach(fname => {
    const pgId = uid('page');
    n(pgId, 'PageNeuron', fname, 'KNOWLEDGE', 3, { level: 'H1' });
    edge(filesHub, pgId, 'INDEXES');

    [1, 2, 3].forEach(ci => {
      const chId = uid('chunk');
      n(chId, 'ChunkNeuron', `${fname} — §${ci}`, 'KNOWLEDGE', 4, { summary: `Key fact §${ci}` });
      edge(pgId, chId, 'HAS_CONTENT');

      if (Math.random() > 0.6) {
        const insId = uid('ins');
        n(insId, 'InsightNeuron', `Insight §${ci}`, 'KNOWLEDGE', 5, { confidence: (0.7 + Math.random() * 0.3).toFixed(2) });
        edge(chId, insId, 'EVIDENCE_FROM');
      }
    });
  });

  // Sub-hub: Website
  const webHub = uid('web_hub');
  n(webHub, 'InsightNeuron', 'Website Pages', 'KNOWLEDGE', 2, { type: 'Website' });
  edge(knHub, webHub, 'HAS_WEBSITE');

  ['Home', 'Features', 'Pricing Page', 'Blog', 'Docs Hub'].forEach(pg => {
    const wpId = uid('wp');
    n(wpId, 'PageNeuron', pg, 'KNOWLEDGE', 3, { url: `https://cluaiz.com/${pg.toLowerCase()}` });
    edge(webHub, wpId, 'INDEXES');
    [1, 2].forEach(ci => {
      const cId = uid('wc');
      n(cId, 'ChunkNeuron', `${pg} — §${ci}`, 'KNOWLEDGE', 4);
      edge(wpId, cId, 'HAS_CONTENT');
    });
  });

  // Sub-hub: APIs
  const apiHub = uid('api_hub');
  n(apiHub, 'InsightNeuron', 'API Sources', 'KNOWLEDGE', 2, { type: 'API' });
  edge(knHub, apiHub, 'HAS_APIS');

  ['WhatsApp Business API', 'Stripe API', 'Google Sheets API', 'Slack Webhooks'].forEach(api => {
    const apiId = uid('api');
    n(apiId, 'PageNeuron', api, 'KNOWLEDGE', 3, { protocol: 'REST' });
    edge(apiHub, apiId, 'INDEXES');
    [1, 2].forEach(ci => {
      const cId = uid('ac');
      n(cId, 'ChunkNeuron', `${api} — §${ci}`, 'KNOWLEDGE', 4);
      edge(apiId, cId, 'HAS_CONTENT');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BRANCH 4 — UNIVERSAL CHATS / MEMORY (bottom-left)
  // ══════════════════════════════════════════════════════════════════════════
  const memHub = uid('mem');
  n(memHub, 'SessionNode', 'Universal Chats', 'MEMORY', 1);
  edge(root, memHub, 'HAS_CHATS');

  const chats = [
    { name: 'Rahul — Server Down',      mood: 'Urgent'    },
    { name: 'Sara — Sales Demo',        mood: 'Curious'   },
    { name: 'Priya — Feature Request',  mood: 'Satisfied' },
    { name: 'Vikash — Onboarding',      mood: 'Curious'   },
    { name: 'Dev — Bug Report',         mood: 'Frustrated'},
    { name: 'Meena — Pricing Query',    mood: 'Neutral'   },
  ];

  chats.forEach(ch => {
    const sId = uid('sess');
    n(sId, 'SessionNode', `Chat: ${ch.name}`, 'MEMORY', 2, { mood: ch.mood });
    edge(memHub, sId, 'HAS_SESSION');

    const moodId = uid('mood');
    n(moodId, 'MoodNeuron', `Mood: ${ch.mood}`, 'MEMORY', 3, { emotion: ch.mood });
    edge(sId, moodId, 'HAS_MOOD');

    const dhagaId = uid('dhaga');
    n(dhagaId, 'DhagaNode', 'Dhaga Focus Chain', 'MEMORY', 3, { threshold: 0.7 });
    edge(sId, dhagaId, 'HAS_DHAGA');

    const histId = uid('hist');
    n(histId, 'HistoryAnchor', 'History Anchor', 'MEMORY', 3);
    edge(dhagaId, histId, 'ANCHORS_TO');

    [1, 2, 3].forEach(ei => {
      const epId = uid('ep');
      n(epId, 'EpisodeNode', `Turn ${ei}`, 'MEMORY', 4, { turn: ei });
      edge(sId, epId, 'HAS_EPISODE');

      if (Math.random() > 0.65) {
        const surId = uid('sur');
        n(surId, 'SurpriseMetric', `Surprise T${ei}`, 'MEMORY', 5, { score: Math.random().toFixed(2) });
        edge(epId, surId, 'DETECTED');
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BRANCH 5 — REFLEX & CONTROL (bottom-right)
  // ══════════════════════════════════════════════════════════════════════════
  const rfxHub = uid('rfx');
  n(rfxHub, 'DecisionGate', 'Reflex Control Hub', 'REFLEX', 1);
  edge(root, rfxHub, 'HAS_REFLEX');

  ['urgent', 'server down', 'payment failed', 'cancel subscription', 'pricing', 'bug', 'demo request', 'help'].forEach(kw => {
    const tId = uid('trig');
    n(tId, 'TriggerNeuron', `Trigger: "${kw}"`, 'REFLEX', 2, { keyword: kw });
    edge(rfxHub, tId, 'MONITORS');

    const dgId = uid('dg');
    n(dgId, 'DecisionGate', `Gate: ${kw}`, 'REFLEX', 3, { condition: 'confidence < 0.7' });
    edge(tId, dgId, 'ROUTES_TO');

    const scId = uid('sc');
    n(scId, 'ScorerNode', `Scorer: ${kw}`, 'REFLEX', 4, { threshold: 0.7 });
    edge(dgId, scId, 'SCORED_BY');

    if (Math.random() > 0.5) {
      const subId = uid('sub');
      n(subId, 'SubconsciousTrigger', `Subconscious: ${kw}`, 'REFLEX', 4, { auto_fire: true });
      edge(tId, subId, 'HAS_SUBCONSCIOUS');
    }
  });

  // Consensus/Learning under reflex hub
  const consHub = uid('cons');
  n(consHub, 'ConsensusArbiter', 'Consensus Engine', 'REFLEX', 2);
  edge(rfxHub, consHub, 'HAS_CONSENSUS');

  ['Voter A', 'Voter B', 'Voter C'].forEach(v => {
    const vId = uid('voter');
    n(vId, 'MathematicalVoter', v, 'REFLEX', 3, { method: 'Weighted Average' });
    edge(consHub, vId, 'HAS_VOTER');
  });

  const hebHub = uid('heb');
  n(hebHub, 'HebbianUpdater', 'Learning Engine', 'REFLEX', 2);
  edge(rfxHub, hebHub, 'HAS_LEARNING');

  ['Backtrack Point', 'Retention Gate', 'Conflict Resolver'].forEach(l => {
    const lId = uid('learn');
    n(lId, l === 'Backtrack Point' ? 'BacktrackNeuron' : l === 'Retention Gate' ? 'RetentionGate' : 'ConflictResolver', l, 'REFLEX', 3);
    edge(hebHub, lId, 'HAS_MODULE');
  });

  return { nodes, links };
}

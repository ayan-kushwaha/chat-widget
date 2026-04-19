"""

    NEURON FACTORY  The Neural Spawning Hub                 
  Cluaiz Neural OS | neurons/factory.py                          
                                                                  
  Role: Central Registry for all 40+ specialized neuron types.    
        Handles polymorphic instantiation for Graph Building.     

"""

from loguru import logger
from typing import Optional, Dict, Type

# Base
from src.services.neural.neurons.base_neuron import BaseNeuron

# Identity
from src.services.neural.neurons.identity.boss import BossNeuron
from src.services.neural.neurons.identity.organization import OrganizationNeuron
from src.services.neural.neurons.identity.psychology import PsychologyNeuron
from src.services.neural.neurons.identity.department import DeptNeuron
from src.services.neural.neurons.identity.vision import VisionNeuron
from src.services.neural.neurons.identity.culture import CultureNeuron

# Workforce
from src.services.neural.neurons.workforce.agent import AgentNeuron
from src.services.neural.neurons.workforce.skill import SkillNeuron
from src.services.neural.neurons.workforce.tool import ToolNeuron
from src.services.neural.neurons.workforce.routine import RoutineNeuron
from src.services.neural.neurons.workforce.success import SuccessNeuron
from src.services.neural.neurons.workforce.handover import HandoverReflex
from src.services.neural.neurons.workforce.permission import PermissionNeuron
from src.services.neural.neurons.workforce.voice import VoiceNeuron

# Knowledge
from src.services.neural.neurons.knowledge.chunk import ChunkNeuron
from src.services.neural.neurons.knowledge.page import PageNeuron
from src.services.neural.neurons.knowledge.link import LinkNeuron
from src.services.neural.neurons.knowledge.insight import InsightNeuron
from src.services.neural.neurons.knowledge.conflict import ConflictNode
from src.services.neural.neurons.knowledge.correction import CorrectionNode
from src.services.neural.neurons.knowledge.source import SourceIndex

# Memory
from src.services.neural.neurons.memory.session import SessionNeuron
from src.services.neural.neurons.memory.episode import EpisodeNeuron
from src.services.neural.neurons.memory.topic import TopicCluster
from src.services.neural.neurons.memory.mood import MoodNeuron
from src.services.neural.neurons.memory.history import HistoryAnchor
from src.services.neural.neurons.memory.archive import ArchiveNeuron
from src.services.neural.neurons.memory.temporal import TemporalLink
from src.services.neural.neurons.memory.focus_summary import FocusSummaryNode

# Reflex
from src.services.neural.neurons.reflex.decision import DecisionNeuron
from src.services.neural.neurons.reflex.scorer import ScorerNeuron
from src.services.neural.neurons.reflex.trigger import TriggerNeuron
from src.services.neural.neurons.reflex.handover_gate import HandoverGate
from src.services.neural.neurons.reflex.trust import TrustScorer
from src.services.neural.neurons.reflex.error import ErrorCache
from src.services.neural.neurons.reflex.recovery import RecoveryNode
from src.services.neural.neurons.reflex.priority import PriorityNode
from src.services.neural.neurons.reflex.strategy import StrategyPath

NEURON_MAP: Dict[str, Type[BaseNeuron]] = {
    # Identity
    "Boss": BossNeuron, "Organization": OrganizationNeuron, "Psychology": PsychologyNeuron,
    "Department": DeptNeuron, "Vision": VisionNeuron, "Culture": CultureNeuron,
    
    # Workforce
    "Agent": AgentNeuron, "Skill": SkillNeuron, "Tool": ToolNeuron,
    "Routine": RoutineNeuron, "SuccessPattern": SuccessNeuron, "HandoverProtocol": HandoverReflex,
    "NeuralPermission": PermissionNeuron, "NeuralVoice": VoiceNeuron,
    
    # Knowledge
    "Chunk": ChunkNeuron, "Page": PageNeuron, "Link": LinkNeuron,
    "NeuralInsight": InsightNeuron, "NeuralConflict": ConflictNode, 
    "ManualCorrection": CorrectionNode, "KnowledgeSource": SourceIndex,
    
    # Memory
    "Session": SessionNeuron, "Episode": EpisodeNeuron, "NeuralTopic": TopicCluster,
    "UserMood": MoodNeuron, "NeuralAnchor": HistoryAnchor, "HistoricalArchive": ArchiveNeuron,
    "TemporalDecayLink": TemporalLink, "FocusSummary": FocusSummaryNode,
    
    # Reflex
    "Decision": DecisionNeuron, "Scorer": ScorerNeuron, "NeuralTrigger": TriggerNeuron,
    "NeuralGate": HandoverGate, "TrustProfile": TrustScorer, "NeuralError": ErrorCache,
    "RecoveryAction": RecoveryNode, "NeuralPriority": PriorityNode, "NeuralStrategy": StrategyPath
}

class NeuronFactory:
    @staticmethod
    def spawn(label: str, gid: str, org_id: str, **kwargs) -> BaseNeuron:
        """
        Instantiates the correct specialized neuron class based on the label.
        """
        import inspect
        neuron_class = NEURON_MAP.get(label.capitalize(), BaseNeuron)
        
        # Prepare all possible generic properties
        possible_args = {
            "gid": gid, "org_id": org_id, "name": kwargs.get("name", ""),
            "description": kwargs.get("description", ""), "user_id": gid, 
            "agent_id": gid, "skill_id": gid, "session_id": gid, "episode_id": gid,
            "dept_id": gid, "goal_id": gid, "doc_id": gid, "emp_id": gid,
            "focus_id": gid, "history_id": gid, "pillar": kwargs.get("pillar", "Cognition"),
            "label": label
        }
        
        # Fallback for all neuron types
        for k in ["voice_id", "tool_id", "success_id", "routine_id", "permission_id", "handover_id", "trust_id", "trigger_id", "strategy_id", "scorer_id", "recovery_id", "priority_id", "gate_id", "error_id", "decision_id", "topic_id", "link_id", "mood_id", "anchor_id", "archive_id", "source_id", "page_id", "insight_id", "correction_id", "conflict_id", "chunk_id", "vision_id", "psych_id", "culture_id", "brand_id", "kpi_id"]:
            possible_args[k] = gid
        
        # Match signatures dynamically
        sig = inspect.signature(neuron_class.__init__)
        actual_kwargs = {}
        for param_name in sig.parameters:
            if param_name == 'self':
                continue
            # If the specific arg is found in our bag of properties, fetch it
            if param_name in possible_args:
                actual_kwargs[param_name] = possible_args[param_name]
            # Fallback to general kwargs
            elif param_name in kwargs:
                actual_kwargs[param_name] = kwargs[param_name]
        
        # Try to Instantiate safely
        try:
            neuron = neuron_class(**actual_kwargs)
        except Exception as e:
            logger.error(f" [NeuronFactory] Dynamic instantiation failed for {label}: {e}. Falling back to BaseNeuron.")
            # Absolute fallback
            neuron = BaseNeuron(gid=gid, org_id=org_id, label=label, name=kwargs.get("name", ""))
        
        logger.info(f" [NeuronFactory] Spawned {neuron.__class__.__name__} (Label: {label}, GID: {gid})")
        return neuron

factory = NeuronFactory()

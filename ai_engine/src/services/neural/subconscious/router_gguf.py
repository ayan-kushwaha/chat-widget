"""

    SUBCONSCIOUS ROUTER  Local GGUF Decision Engine            
  Cluaiz Neural OS | services/neural/subconscious/router_gguf.py  
                                                                  
  Role: The 'Atma'. Merges raw BGE-M3 Language Vectors with       
        Arbiter Math to output deterministic ACTION paths         
        using a micro local model (e.g., BitNet / Llama.cpp).     

"""

import os
import json
from loguru import logger
from typing import Dict, List

try:
    # Requires: pip install llama-cpp-python
    from llama_cpp import Llama
    HAS_LLAMA = True
except ImportError:
    HAS_LLAMA = False

from src.services.neural.encoder.bge_m3_runner import universal_encoder
from src.services.neural.consensus.arbiter import neural_arbiter

class SubconsciousRouter:
    """
    The Local Brain that makes instant Action Routing decisions 
    without generating conversational text.
    """
    def __init__(self, model_path: str = "models/shadow_boss_0.8b.gguf"):
        self.model_path = model_path
        self.model = None
        self._load_model()

    def _load_model(self):
        """Loads the ultra-fast local decision model into VRAM."""
        if not HAS_LLAMA:
            logger.warning(" [Router] llama_cpp_python package missing.")
            return
            
        if not os.path.exists(self.model_path):
            logger.warning(f" [Router] Local GGUF Atma not found at {self.model_path}. Falling back to Pure Matrix Math.")
            return

        try:
            logger.info(" [Router] Loading local GGUF/BitNet Decision Adapter into VRAM...")
            self.model = Llama(
                model_path=self.model_path,
                n_gpu_layers=-1, # Max acceleration
                n_ctx=512,       # Minimal context needed for pure routing
                verbose=False
            )
            logger.info(" [Router] Atma Loaded. System capable of autonomous local routing.")
        except Exception as e:
            logger.error(f" [Router] Model initialization crashed: {e}")

    def determine_action_path(self, user_text: str, active_neurons: List[Dict]) -> Dict:
        """
        The Workflow:
        1. Universal Encoder translates text to numbers.
        2. Neural Arbiter filters out hallucination/conflict via MCES Math.
        3. Local Model (or Fallback) chooses the absolute execution path.
        """
        logger.info(" [Router] Subconscious routing initiated...")
        
        # 1. Translate Bhasha (Language) to Math
        encodings = universal_encoder.encode_text(user_text)
        
        # 2. Filter via Graph Math (The Consensus Judge)
        ranked_neurons = neural_arbiter.select_top_path(active_neurons)
        if not ranked_neurons:
            logger.warning(" [Router] Graph isolated. No active neurons found.")
            return {"action": "fallback", "reason": "no_active_neurons"}

        top_neuron = ranked_neurons[0]
        
        # 3. Decision Model Execution
        if self.model:
            # We enforce strict JSON generation. No chit-chat.
            prompt = f"""
            [INST] You are an ultra-fast deterministic routing engine. 
            User Intent Math Matched Node: {top_neuron.get('name')}
            Node Type: {top_neuron.get('type')}
            MCES Confidence: {top_neuron.get('mces_score')}
            
            Based on this struct, return ONLY a strict JSON with 'action' and 'reason'. [/INST]
            """
            try:
                out = self.model(
                    prompt,
                    max_tokens=60,
                    stop=["}", "}\n"],
                    echo=False
                )
                raw_out = out['choices'][0]['text'].strip() + "}"
                decision = json.loads(raw_out)
                logger.info(f" [Router] Local GGUF selected action: {decision.get('action')}")
                return decision
            except Exception as e:
                logger.error(f" [Router] GGUF decision crashed: {e}. Defaulting to Pure Math Routing.")
        
        # 4. Pure Matrix Math Routing (The absolute fallback if GGUF is missing)
        logger.info(f" [Router] Executing pure mathematical routing based on MCES superiority.")
        return {
            "action": f"trigger_{top_neuron.get('type').lower()}",
            "reason": f"Top topological MCES score [{top_neuron.get('mces_score')}]",
            "target_node": top_neuron.get("id")
        }

# Singleton Router instance
subconscious_router = SubconsciousRouter()

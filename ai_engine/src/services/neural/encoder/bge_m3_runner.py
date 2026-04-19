"""

    UNIVERSAL ENCODER  Multilingual Vector Translator          
  Cluaiz Neural OS | services/neural/encoder/bge_m3_runner.py     
                                                                  
  Role: Converts 100+ languages into a unified mathematical       
        vector space (Dense, Sparse, ColBERT) using BGE-M3.       
        Serves as the raw sensory input for the BitNet Router.    

"""

import os
from loguru import logger
from typing import List, Union, Dict

try:
    # Requires: pip install FlagEmbedding
    from FlagEmbedding import BGEM3FlagModel
    HAS_BGE = True
except ImportError:
    HAS_BGE = False


class UniversalEncoder:
    """
    The mathematical ears of the Cluaiz Neural OS.
    Translates raw text (Hindi, English, etc.) directly into numbers.
    """
    
    def __init__(self, model_name: str = "BAAI/bge-m3", use_fp16: bool = True):
        self.model_name = model_name
        self.use_fp16 = use_fp16
        self.model = None
        self._load_model()

    def _load_model(self):
        """Loads the BGE-M3 model into memory for extreme low-latency processing."""
        logger.info(f" [Encoder] Loading Universal Translator: {self.model_name}...")
        
        if not HAS_BGE:
            logger.warning(" [Encoder] FlagEmbedding library not found. Run: pip install FlagEmbedding")
            return
            
        try:
            # use_fp16=True significantly speeds up inference while maintaining precision
            self.model = BGEM3FlagModel(self.model_name, use_fp16=self.use_fp16)
            logger.info(" [Encoder] BGE-M3 Vector Engine Loaded Successfully. 100+ Languages Supported.")
        except Exception as e:
            logger.error(f" [Encoder] Failed to initialize BGE-M3: {e}")

    def encode_text(
        self, 
        texts: Union[str, List[str]], 
        return_dense: bool = True, 
        return_sparse: bool = False, 
        return_colbert_vecs: bool = False
    ) -> Dict:
        """
        Converts human language into mathematical vectors for the Neural Router.
        Returns a dictionary with 'dense_vecs', 'sparse_vecs', and 'colbert_vecs'.
        """
        if self.model is None:
            logger.error(" [Encoder] Model offline. Returning empty vectors.")
            return {"dense_vecs": []}

        if isinstance(texts, str):
            texts = [texts]

        logger.debug(f" [Encoder] Translating {len(texts)} segment(s) into multi-dimensional vectors...")

        try:
            # The core mathematical transformation
            embeddings = self.model.encode(
                sentences=texts,
                return_dense=return_dense,
                return_sparse=return_sparse,
                return_colbert_vecs=return_colbert_vecs
            )
            logger.debug(f" [Encoder] Translation complete. Vector dimensions: {len(embeddings['dense_vecs'][0])}")
            return embeddings
            
        except Exception as e:
            logger.error(f" [Encoder] Vector translation crashed: {e}")
            return {"dense_vecs": []}


# Singleton instance to prevent multiple heavy loads into VRAM/RAM
universal_encoder = UniversalEncoder()

if __name__ == "__main__":
    # Internal Test Run
    out = universal_encoder.encode_text(["Mera server fail ho gaya hai", "My server has crashed"])
    if out.get('dense_vecs'):
        logger.info(f"Test Dense Vectors Generated. Shape: len={len(out['dense_vecs'])}, dim={len(out['dense_vecs'][0])}")

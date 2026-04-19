"""

   NEURAL INDEXER  REFERENCE SHIM (DO NOT DELETE)             
  Cluaiz Neural OS | services/neural/indexer.py                   
                                                                  
    This file is kept ONLY for backwards compatibility.         
     All actual logic has moved to:                               
                                                                  
     services/neural/indexer/                                     
        base.py             Shared Qwen + confidence logic    
        file_indexer.py     knowledgedocuments                
        site_indexer.py     site_page_indexes                 
        manual_indexer.py   manualdocuments                   
        api_indexer.py      apisources                        
        __init__.py         neural_indexer shim               
                                                                  
     services/neural/graph/page_syncer.py   Neo4j PageNeurons   

"""

# All imports forward to the new modular package.
# Old callers: from src.services.neural.indexer import neural_indexer
# Still works  neural_indexer is exported from the indexer/ package.

from src.services.neural.indexer import (   # noqa: F401  (re-export)
    neural_indexer,
    file_indexer,
    site_indexer,
    manual_indexer,
    api_indexer,
)

#  NeuralIndexer class alias for any code that imports the class directly 
from src.services.neural.indexer import _BackwardsCompatIndexer as NeuralIndexer  # noqa: F401

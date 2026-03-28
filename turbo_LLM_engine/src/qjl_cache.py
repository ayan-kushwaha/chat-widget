import torch
import math
from transformers.cache_utils import DynamicCache

class QJLCache(DynamicCache):
    def __init__(self, head_dim: int, compression_ratio: float = 0.5, device="cuda", dtype=torch.float16):
        super().__init__()

        self.key_cache = []
        self.value_cache = []
        self.head_dim = head_dim
        self.compressed_dim = max(1, int(head_dim * compression_ratio))
        self.device = device
        self.dtype = dtype
        
        # HuggingFace Cache backend compatibility variables
        self._seen_tokens = 0
        self.conv_states = [None] * 128
        self.recurrent_states = [None] * 128
        self.sliding_window = None
        self.P = None
        self.compression_ratio = compression_ratio

    def _init_P(self, head_dim: int):
        self.head_dim = head_dim
        self.compressed_dim = max(1, int(head_dim * self.compression_ratio))
        random_matrix = torch.randn(self.head_dim, self.head_dim, device=self.device, dtype=torch.float32)
        q, _ = torch.linalg.qr(random_matrix)
        self.P = q[:, :self.compressed_dim].to(self.dtype)

    def update(self, key_states: torch.Tensor, value_states: torch.Tensor, layer_idx: int, cache_kwargs=None) -> tuple:
        if self.P is None or self.P.shape[0] != key_states.shape[-1]:
            self._init_P(key_states.shape[-1])
            
        # key_states: [batch, num_heads, seq_len, head_dim]

        # First, compress using our random projection P
        k_comp = torch.matmul(key_states, self.P)
        v_comp = torch.matmul(value_states, self.P)
        
        while len(self.key_cache) <= layer_idx:
            self.key_cache.append(None)
            self.value_cache.append(None)
            
        if self.key_cache[layer_idx] is None:
            # First time allocating cache for this layer
            self.key_cache[layer_idx] = k_comp
            self.value_cache[layer_idx] = v_comp
        else:
            # Append the compressed tokens along the seq_len dimension
            self.key_cache[layer_idx] = torch.cat([self.key_cache[layer_idx], k_comp], dim=-2)
            self.value_cache[layer_idx] = torch.cat([self.value_cache[layer_idx], v_comp], dim=-2)
            
        # Returning decompressed cache slice to the attention mechanism
        # Decompress = Compressed @ P.T
        k_decomp = torch.matmul(self.key_cache[layer_idx], self.P.transpose(0, 1))
        v_decomp = torch.matmul(self.value_cache[layer_idx], self.P.transpose(0, 1))

        
        return k_decomp, v_decomp

    def get_seq_length(self, layer_idx: int = 0) -> int:
        if len(self.key_cache) <= layer_idx or self.key_cache[layer_idx] is None:
            return 0
        return self.key_cache[layer_idx].shape[-2]

    
    def get_max_length(self) -> int:
        return 4096 # Custom target for memory constraints
    
    def reorder_cache(self, beam_idx: torch.LongTensor):
        pass

    @property
    def has_previous_state(self) -> bool:
        """Required by newer Transformers architectures like Qwen3.5 for linear attention mask"""
        return len(self.key_cache) > 0 and self.key_cache[0] is not None and self.key_cache[0].shape[-2] > 0



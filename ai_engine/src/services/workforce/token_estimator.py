"""
Token Estimator & Chunking Logic
Uses tiktoken for accurate token counting and safe chunking for >100k inputs.
"""

from typing import List, Dict, Any, Tuple
import tiktoken
from loguru import logger

class TokenEstimator:
    def __init__(self, model: str = "gpt-4"):
        """Initialize with tiktoken encoder"""
        try:
            # Use cl100k_base for Gemini/GPT-4 compatibility
            self.encoding = tiktoken.get_encoding("cl100k_base")
        except Exception as e:
            logger.warning(f"Tiktoken init failed: {e}. Using fallback.")
            self.encoding = None
    
    def count_tokens(self, text: str) -> int:
        """
        Accurate token count using tiktoken.
        Fallback to char/4 if tiktoken fails.
        """
        if not text:
            return 0
        
        if self.encoding:
            try:
                return len(self.encoding.encode(text))
            except Exception as e:
                logger.error(f"Tiktoken encoding failed: {e}")
        
        # Fallback: char / 4
        return len(text) // 4
    
    def estimate_input_output_tokens(self, input_text: str, 
                                     estimated_output_per_chunk: int = 2000) -> Tuple[int, int]:
        """
        Estimate total input and output tokens.
        Returns: (input_tokens, estimated_output_tokens)
        """
        input_tokens = self.count_tokens(input_text)
        
        # If chunking needed, multiply output by number of chunks
        num_chunks = max(1, (input_tokens // 80000))
        total_output_estimate = estimated_output_per_chunk * num_chunks
        
        return (input_tokens, total_output_estimate)
    
    def should_chunk(self, text: str, max_tokens: int = 100000) -> bool:
        """
        Check if text exceeds safe limit and needs chunking.
        Max: 100k tokens (leave 200k buffer for output + system prompt)
        """
        token_count = self.count_tokens(text)
        return token_count > max_tokens
    
    def calculate_chunks(self, text: str, chunk_size: int = 80000) -> List[str]:
        """
        Split text into chunks of ~80k tokens each.
        Tries to split on sentence boundaries for clean chunks.
        """
        total_tokens = self.count_tokens(text)
        
        if total_tokens <= chunk_size:
            return [text]  # No chunking needed
        
        # Calculate number of chunks needed
        num_chunks = (total_tokens // chunk_size) + 1
        
        # Try to split on double newlines (paragraphs) first
        paragraphs = text.split("\n\n")
        
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for para in paragraphs:
            para_tokens = self.count_tokens(para)
            
            if current_tokens + para_tokens > chunk_size:
                # Save current chunk
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    current_chunk = []
                    current_tokens = 0
            
            current_chunk.append(para)
            current_tokens += para_tokens
        
        # Add remaining chunk
        if current_chunk:
            chunks.append("\n\n".join(current_chunk))
        
        logger.info(f" Split {total_tokens} tokens into {len(chunks)} chunks")
        return chunks
    
    def get_chunk_strategy(self, total_tokens: int) -> Dict[str, Any]:
        """
        Return chunking strategy metadata for display.
        """
        if total_tokens <= 80000:
            return {
                "requires_chunking": False,
                "num_chunks": 1,
                "estimated_time": "1-2 min",
                "chunk_size": total_tokens
            }
        
        num_chunks = (total_tokens // 80000) + 1
        estimated_time = f"{num_chunks * 2}-{num_chunks * 3} min"
        
        return {
            "requires_chunking": True,
            "num_chunks": num_chunks,
            "estimated_time": estimated_time,
            "chunk_size": 80000,
            "warning": "Large dataset - will process in batches"
        }

# Singleton instance
token_estimator = TokenEstimator()

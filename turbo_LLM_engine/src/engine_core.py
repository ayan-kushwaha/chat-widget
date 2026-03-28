import torch
import os
from loguru import logger
from transformers import AutoTokenizer, AutoConfig, AutoModelForCausalLM
from awq import AutoAWQForCausalLM

class TurboEngineCore:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        try:
            logger.info(f"Loading Fast Tokenizer from {model_path}...")
            self.tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=True)
        except Exception as e:
            logger.warning(f"Fast Tokenizer failed: {e}. Attempting Slow Tokenizer...")
            self.tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=False)
        
        self.config = AutoConfig.from_pretrained(model_path)
        self.model = None
        
    def load_model(self):
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        
        logger.info(f"🚀 Loading AWQ Weights (Stable Mode for 4GB VRAM)...")
        self.model = AutoAWQForCausalLM.from_quantized(
            self.model_path,
            fuse_layers=False,
            trust_remote_code=True,
            safetensors=True,
            device="cuda"
        )
        logger.success("✅ Stable Turbo Engine Fully Loaded!")

    def generate_stream(self, prompt: str, max_tokens: int = 150, think: bool = False):
        from threading import Thread
        from transformers import TextIteratorStreamer
        
        # ✅ Official Qwen3 Thinking Control — /think or /no_think suffix
        # This is the CORRECT way Qwen3 toggles reasoning, not pre-fill hacks
        content = f"{prompt} /think" if think else f"{prompt} /no_think"
        messages = [{"role": "user", "content": content}]

        # ✅ add_generation_prompt=True — official way, no hacky assistant pre-fill
        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        inputs = self.tokenizer(text, return_tensors="pt").to("cuda")
        
        # skip_special_tokens=True auto-handles <|im_end|>, <|im_start|> etc.
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)
        
        generation_kwargs = dict(
            **inputs,
            streamer=streamer,
            max_new_tokens=max_tokens,
            do_sample=True,
            temperature=0.7,
            top_p=0.9
        )
        
        thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
        thread.start()
        
        # Stream all tokens raw — <think>/<\/think> tags passed to client for UI handling
        for new_text in streamer:
            yield new_text

    def generate(self, prompt: str, max_tokens: int = 150, think: bool = False):
        # ✅ Official Qwen3 thinking control
        content = f"{prompt} /think" if think else f"{prompt} /no_think"
        messages = [{"role": "user", "content": content}]
        text = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.tokenizer(text, return_tensors="pt").to("cuda")
        input_len = inputs["input_ids"].shape[1]
        outputs = self.model.generate(**inputs, max_new_tokens=max_tokens)
        # ✅ Decode only new tokens (not the prompt)
        return self.tokenizer.decode(outputs[0][input_len:], skip_special_tokens=True)

# Global instance
engine = None

def get_engine():
    global engine
    if engine is None:
        path = os.getenv("MODEL_PATH", "/app/models/Qwen3-4B-AWQ")
        engine = TurboEngineCore(path)
        engine.load_model()
    return engine

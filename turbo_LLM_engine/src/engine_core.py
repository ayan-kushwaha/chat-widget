import torch, os, gc, json
from loguru import logger
from threading import Thread
from transformers import AutoTokenizer, TextIteratorStreamer

# ─────────────────────────────────────────────────────────────────────────────
# Mistral-RS: Try import (Rocket Mode)
# ─────────────────────────────────────────────────────────────────────────────
try:
    from mistralrs import Runner, Which, ChatCompletionRequest, Architecture
    MISTRALRS_AVAILABLE = True
except ImportError:
    MISTRALRS_AVAILABLE = False


def _check_mistralrs_compatible(model_path: str) -> bool:
    """
    SMART PRE-CHECK (Zero VRAM).
    Mistral-RS v0.6.0 currently has a shape mismatch issue with Qwen3-AWQ 
    weight packing (expects transposed 320 vs 512 columns).
    We skip loading it if it's Qwen3 to save VRAM and time.
    """
    try:
        config_path = os.path.join(model_path, "config.json")
        if not os.path.exists(config_path):
            return True # Try anyway if no config
            
        with open(config_path) as f:
            cfg = json.load(f)
            
        archs = cfg.get("architectures", [])
        if "Qwen2" in archs or "Qwen2ForCausalLM" in archs:
            # Mistral-RS works great with Qwen2
            return True
            
        if "Qwen3" in archs or "Qwen3ForCausalLM" in archs:
            # Known shape mismatch in current Mistral-RS 
            logger.warning("⚡ Pre-check: Qwen3-AWQ detected. Mistral-RS v0.6.0 has shape-mismatch. Skipping to Tier 2 (ExLlama v2).")
            return False
            
        return True
    except Exception:
        return True # Fallback to trying if check fails


class TurboEngineCore:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=True)
        self.model = None                # AutoAWQ model
        self.mistralrs_runner = None     # Mistral-RS runner
        self.engine_name = "Not Loaded"

    # ─────────────────────────────────────────────────────────────────────────
    # LOAD MODEL
    # Tier 1: Mistral-RS (Rocket) - Skip if pre-check fails
    # Tier 2: AutoAWQ + ExLlama v2 (Turbo Stable)
    # Tier 3: AutoAWQ Default (Safety)
    # ─────────────────────────────────────────────────────────────────────────
    def load_model(self):
        # Pre-warm CUDA
        if torch.cuda.is_available():
            _d = torch.zeros(1, device="cuda"); del _d
            torch.cuda.empty_cache(); gc.collect()
            free_gb = torch.cuda.mem_get_info()[0] / 1024**3
            logger.info(f"🔥 CUDA Ready | Free VRAM: {free_gb:.2f}GB")

        # ── TIER 1: Mistral-RS (Rocket Mode) ──────────────────────────────────
        if MISTRALRS_AVAILABLE and _check_mistralrs_compatible(self.model_path):
            try:
                logger.info("🚀 Tier 1: Trying Mistral-RS (Rocket Mode)...")
                self.mistralrs_runner = Runner(
                    which=Which.Plain(
                        model_id=self.model_path,
                        arch=Architecture.Qwen2, # Using Qwen2 arch for Qwen3 if possible (mismatch happens here)
                        tokenizer_json=os.path.join(self.model_path, "tokenizer.json"),
                    ),
                    no_paged_attn=True,
                    max_seqs=1,
                    prefix_cache_n=0,
                )
                self.engine_name = "🚀 Mistral-RS (Rocket)"
                logger.success(f"✅ {self.engine_name} Activated!")
                return
            except Exception as e:
                logger.warning(f"⚠️  Mistral-RS failed: {type(e).__name__} → dropping to Tier 2.")
                self.mistralrs_runner = None
                torch.cuda.empty_cache(); gc.collect()
        else:
            logger.info("⏭️  Mistral-RS skipped (Incompatible packing / not installed) → moving to Tier 2.")

        # ── TIER 2: AutoAWQ + ExLlama v2 (Turbo Stable) ────────────────────────
        from awq import AutoAWQForCausalLM
        try:
            logger.info("⚡ Tier 2: Loading AutoAWQ + ExLlama v2 Kernels...")
            self.model = AutoAWQForCausalLM.from_quantized(
                self.model_path,
                fuse_layers=False,
                device="cuda",
                exllama_config={"version": 2}
            )
            self.engine_name = "⚡ AutoAWQ + ExLlama v2"
            logger.success(f"✅ {self.engine_name} Activated!")
            return
        except Exception as e:
            logger.warning(f"⚠️  ExLlama v2 failed: {e} → dropping to Tier 3.")
            self.model = None
            torch.cuda.empty_cache(); gc.collect()

        # ── TIER 3: AutoAWQ Default (Safety) ──────────────────────────────────
        logger.info("⚖️  Tier 3: Loading AutoAWQ Default (Safety Baseline)...")
        self.model = AutoAWQForCausalLM.from_quantized(
            self.model_path,
            fuse_layers=False,
            device="cuda"
        )
        self.engine_name = "⚖️  AutoAWQ Default"
        logger.success(f"✅ {self.engine_name} Activated.")

    def generate_stream(self, prompt: str, max_tokens: int = 250, think: bool = False):
        content = f"{prompt} /think" if think else f"{prompt} /no_think"

        if self.mistralrs_runner:
            try:
                req = ChatCompletionRequest(
                    messages=[{"role": "user", "content": content}],
                    model="mistralrs",
                    max_tokens=max_tokens,
                    temperature=0.7,
                )
                resp = self.mistralrs_runner.send_chat_completion_request(req)
                yield resp.choices[0].message.content
                return
            except Exception as e:
                logger.warning(f"Rocket glitch: {e}")

        text = self.tokenizer.apply_chat_template(
            [{"role": "user", "content": content}],
            tokenize=False,
            add_generation_prompt=True,
        )
        inputs = self.tokenizer(text, return_tensors="pt").to("cuda")
        streamer = TextIteratorStreamer(
            self.tokenizer, skip_prompt=True, skip_special_tokens=True
        )
        Thread(
            target=self.model.generate,
            kwargs=dict(**inputs, streamer=streamer, max_new_tokens=max_tokens),
        ).start()
        for token in streamer:
            yield token


# ── Singleton ─────────────────────────────────────────────────────────────────
_engine: TurboEngineCore = None

def get_engine() -> TurboEngineCore:
    global _engine
    if _engine is None:
        _engine = TurboEngineCore(os.getenv("MODEL_PATH", "/app/models/Qwen3-4B-AWQ"))
        _engine.load_model()
    return _engine

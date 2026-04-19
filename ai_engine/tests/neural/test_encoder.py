import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

try:
    from src.services.neural.encoder.bge_m3_runner import universal_encoder, HAS_BGE
except ImportError as e:
    HAS_BGE = False
    import_error = str(e)

def test_bge_m3_encoder():
    if not HAS_BGE:
        return "⚠️ SKIPPED - FlagEmbedding library not installed. Vector math offline."
    
    try:
        text = "Hello world, this is a subconscious test."
        vecs = universal_encoder.encode_text(text)
        if vecs and "dense_vecs" in vecs and len(vecs["dense_vecs"]) > 0:
            dim = len(vecs["dense_vecs"][0])
            return f"✅ SUCCESS - vectors generated successfully. Dimensions: {dim}"
        return "❌ FAILED - No dense vectors returned from model."
    except Exception as e:
        return f"❌ FAILED - Crash during translation: {str(e)}"

if __name__ == "__main__":
    print(test_bge_m3_encoder())

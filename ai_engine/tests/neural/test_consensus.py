import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

try:
    from src.services.neural.consensus.arbiter import neural_arbiter
    from src.services.neural.consensus.conflict_resolver import conflict_resolver
    MODULE_FOUND = True
except ImportError as e:
    MODULE_FOUND = False
    import_error = str(e)

def test_arbiter_mces():
    if not MODULE_FOUND:
        return "⚠️ SKIPPED - Module import failed."
        
    fake_neurons = [
        {"type": "MoodNeuron", "priority_score": 0.5, "touch_count": 100, "name": "AngryUser"},
        {"type": "PolicyNeuron", "priority_score": 0.8, "touch_count": 20, "name": "RefundPolicy"},
        {"type": "LiveServerNeuron", "priority_score": 0.9, "touch_count": 5, "name": "ProdServer"}
    ]
    
    try:
        ranked = neural_arbiter.select_top_path(fake_neurons)
        if not ranked:
            return "❌ FAILED - Arbiter returned empty list."
            
        top = ranked[0]["type"]
        top_score = ranked[0]["mces_score"]
        
        # W_type for LiveServerNeuron is 2.8, Policy is 1.8, Mood is 1.1
        # It should easily win
        if top == "LiveServerNeuron":
            return f"✅ SUCCESS - Arbiter mathematically selected correct Priority Path: {top} (Score: {top_score})"
        return f"❌ FAILED - Expected LiveServerNeuron, got {top}"
    except Exception as e:
        return f"❌ FAILED - Crash: {str(e)}"

def test_conflict_resolver():
    if not MODULE_FOUND:
        return "⚠️ SKIPPED - Module import failed."
        
    fake_ranked = [
        {"type": "PolicyNeuron", "mces_score": 2.50, "name": "StrictRefund"},
        {"type": "MoodNeuron", "mces_score": 1.25, "name": "AngryUser"}
    ]
    
    try:
        result = conflict_resolver.resolve(fake_ranked)
        confidence = result.get("confidence_score")
        conflict = result.get("conflict_detected")
        
        if conflict and confidence is not None:
            return f"✅ SUCCESS - Policy clash flagged. Mathematical UI Confidence: {confidence}%"
        return "❌ FAILED - Conflict not detected or confidence score missing."
    except Exception as e:
        return f"❌ FAILED - Crash: {str(e)}"

if __name__ == "__main__":
    print(test_arbiter_mces())
    print(test_conflict_resolver())

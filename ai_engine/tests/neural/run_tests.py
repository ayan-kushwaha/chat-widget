import os
import sys
import datetime

# Inject root project path into sys for imports to work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

def run_all_tests():
    results = []
    
    # 1. Test Encoder
    try:
        from test_encoder import test_bge_m3_encoder
        res = test_bge_m3_encoder()
        results.append(f"🎙️  [Phase 5.0 - Universal Encoder]\n   -> {res}\n")
    except Exception as e:
        results.append(f"🎙️  [Phase 5.0 - Universal Encoder]\n   -> ❌ Execution Crash: {str(e)}\n")

    # 2. Test Arbiter & Conflict Resolver
    try:
        from test_consensus import test_arbiter_mces, test_conflict_resolver
        res1 = test_arbiter_mces()
        res2 = test_conflict_resolver()
        results.append(f"⚖️  [Phase 5.2 - Neural Arbiter MCES Math]\n   -> {res1}\n")
        results.append(f"⚔️  [Phase 5.2 - Conflict Resolver Logics]\n   -> {res2}\n")
    except Exception as e:
        results.append(f"⚖️  [Phase 5.2 - Consensus Core]\n   -> ❌ Execution Crash: {str(e)}\n")

    # Construct the Final Report Formatting
    outfile = os.path.join(os.path.dirname(__file__), "cluaiz_subconscious_test_results.txt")
    
    report = "=======================================================\n"
    report += " 🧠 CLUAIZ LEVEL 4 NEURAL SUBCONSCIOUS TEST RESULTS 🧠 \n"
    report += "=======================================================\n"
    report += f"Time of Execution: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    report += "\n".join(results)
    
    report += "\n=======================================================\n"
    report += "End of Subconscious Integrity Report.\n"
    report += "=======================================================\n"

    # Write output silently
    with open(outfile, "w", encoding="utf-8") as f:
        f.write(report)
        
    print(f"✅ Validation Complete. Results saved to: {outfile}")

if __name__ == "__main__":
    run_all_tests()

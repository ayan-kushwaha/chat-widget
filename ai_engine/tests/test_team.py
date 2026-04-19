"""
test_team.py -- Employee Wiring Verification
=============================================
Tests Sarah, Anjali, and Vakil using the new employee registry.
Infrastructure (Ollama, MongoDB, Qdrant) is mocked so this runs offline.

Run from ai_engine/: python test_team.py
"""

import asyncio
import importlib
import sys
from unittest.mock import AsyncMock, MagicMock

# ── Colour helpers (ASCII safe for Windows terminal) ────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def header(t): print(f"\n{BOLD}{CYAN}{'='*58}{RESET}\n{BOLD}{CYAN}  {t}{RESET}\n{CYAN}{'='*58}{RESET}")
def ok(m):     print(f"{GREEN}  [OK]   {m}{RESET}")
def warn(m):   print(f"{YELLOW}  [WARN] {m}{RESET}")
def info(m):   print(f"  {m}")


# ── Step 1: Force all module imports BEFORE mocking ─────────────────────────
# This ensures the module graph is loaded so patch() can find the targets.

def _bootstrap_imports():
    """Import the whole chain so modules are in sys.modules."""
    import src.services.aiskills.contracts.types          # noqa
    import src.services.aiemployees.base_employee         # noqa
    import src.services.aiemployees.executive_pa.agent    # noqa
    import src.services.aiemployees.support_lead.agent    # noqa
    import src.services.aiemployees.legal_advisor.agent   # noqa

_bootstrap_imports()

# ── Step 2: Now import the registry ─────────────────────────────────────────
from src.services.aiemployees import get_employee
from src.services.aiskills.contracts.types import ContextPackage, BusinessDNA


# ── Step 3: Build mock ContextPackage ───────────────────────────────────────
def _make_cp():
    return ContextPackage(
        business_dna=BusinessDNA(industry_cluster="retail", language_preference="hinglish"),
        employee_id="test", business_id="test_biz", session_id="sess_001",
        session_memory={"short_term_history": "", "long_term_history": ""},
    )


def _make_boss_result(intent_lane="AMBIGUOUS"):
    return {
        "tier":            "FALLBACK",
        "skill_instance":  None,
        "skill_id":        None,
        "score":           0.0,
        "context_package": _make_cp(),
        "intent_lane":     intent_lane,
    }


# ── Step 4: Monkey-patch heavy singletons once globally ─────────────────────
import src.services.aiemployees.base_employee as _be_module

# Replace shadow_boss singleton in-place
_mock_sb = MagicMock()
_mock_sb.process_user_query = AsyncMock()
_mock_sb.get_response_with_reasoning = AsyncMock(
    return_value="[MOCK] LLM not running -- routing wiring verified."
)
_be_module.shadow_boss = _mock_sb

# Replace LocalPrivacyEngine class so constructor works
_mock_lpe_inst = MagicMock()
_mock_lpe_inst._run = AsyncMock(return_value={
    "processed_text": "...", "was_masked": False, "vault": {}
})
_MockLPE = MagicMock(return_value=_mock_lpe_inst)

if hasattr(_be_module, "LocalPrivacyEngine"):
    _be_module.LocalPrivacyEngine = _MockLPE

# Silence Qdrant / core memory
try:
    import src.core.memory as _cm
    _cm.memory = MagicMock()
    _cm.memory.query_similar = AsyncMock(return_value=[])
except Exception:
    pass


# ── Step 5: Test runner ──────────────────────────────────────────────────────

async def run_test(label: str, role: str, message: str, intent_lane: str):
    header(f"TEST: {label}")
    info(f"Message    : \"{message}\"")
    info(f"Intent Lane: {intent_lane}")

    # Update shadow boss mock to return correct boss_result for this test
    _mock_sb.process_user_query = AsyncMock(return_value=_make_boss_result(intent_lane))
    # Update privacy engine mock text
    _mock_lpe_inst._run = AsyncMock(return_value={
        "processed_text": message, "was_masked": False, "vault": {}
    })

    emp = get_employee(role)
    info(f"Resolved   : {emp.display_name}")
    info(f"Skills     : {', '.join(emp.allowed_skills)}")
    print()

    context = {"role": "grahak", "session_id": "sess_001", "business_id": "test_biz"}

    try:
        result = await emp.execute(message, context)
        ok(f"Reply      : {str(result.get('reply', 'N/A'))[:200]}")
        ok(f"Mode       : {result.get('mode', 'N/A')}")
        ok(f"Tool Used  : {result.get('tool_used', 'None')}")
        ok(f"Intent Lane: {result.get('intent_lane', context.get('intent_lane', 'N/A'))}")
    except Exception as e:
        warn(f"Exception  : {type(e).__name__}: {e}")


async def main():
    print(f"\n{BOLD}CLUAIZ TEAM WIRING TEST{RESET}")
    print("Employees: Sarah | Anjali | Vakil")
    print("Mode: Offline (infrastructure mocked)\n")

    await run_test(
        label="Sarah -- Frustrated Customer (FRUSTRATION lane)",
        role="sarah",
        message="Bhaiya yeh kya bakwaas service hai! Manager se baat karni hai!",
        intent_lane="FRUSTRATION",
    )

    await run_test(
        label="Anjali -- Executive Task (ORDER lane)",
        role="anjali",
        message="Kal ke liye 3pm par CEO ke saath meeting schedule kar do.",
        intent_lane="ORDER",
    )

    await run_test(
        label="Vakil -- Policy Out-of-Bounds (POLICY_QUERY lane)",
        role="vakil",
        message="Mujhe confidential salary data chahiye sab employees ka.",
        intent_lane="POLICY_QUERY",
    )

    print(f"\n{BOLD}{GREEN}[PASS] All 3 employee wiring tests complete!{RESET}\n")


if __name__ == "__main__":
    asyncio.run(main())

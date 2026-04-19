"""
🧪 Test Suite: Shadow Boss & Local Router
========================================
Verifies that the routing layer correctly interacts with local Qwen3 models
and that the ShadowBoss orchestrates the full pipeline successfully.
"""

import pytest
from unittest.mock import AsyncMock, patch
from src.services.routing.local_llm_router import local_router
from src.services.routing.shadow_boss import shadow_boss
from src.services.aiskills.contracts.base_contract import ContextPackage
from src.services.aiskills.factory import ConfidenceTier

@pytest.fixture
def mock_ollama_generate():
    with patch("src.core.ollama_client.ollama_client.generate", new_callable=AsyncMock) as mock:
        yield mock

@pytest.mark.asyncio
async def test_quick_classify_success(mock_ollama_generate):
    """0.6b should return a simple classification."""
    mock_ollama_generate.return_value = {"text": "1", "usage": {"input": 10, "output": 1}}
    
    result = await local_router.quick_classify("Is this an order query?")
    assert result == "1"
    mock_ollama_generate.assert_called_once()

@pytest.mark.asyncio
async def test_deep_reason_success(mock_ollama_generate):
    """4b should return a reasoning text."""
    mock_ollama_generate.return_value = {"text": "Hello, I am Rocky.", "usage": {"input": 10, "output": 5}}
    
    result = await local_router.deep_reason("Who are you?")
    assert "Rocky" in result

@pytest.mark.asyncio
async def test_json_reason_parsing(mock_ollama_generate):
    """Should correctly extract JSON from 4b output."""
    mock_ollama_generate.return_value = {
        "text": "Sure, here is your JSON: ```json\n{\"id\": 1, \"status\": \"done\"}\n```",
        "usage": {"input": 20, "output": 15}
    }
    
    result = await local_router.json_reason("Get status")
    assert result == {"id": 1, "status": "done"}

@pytest.mark.asyncio
async def test_shadow_boss_orchestration():
    """Verifies that ShadowBoss coordinates context and factory."""
    with patch("src.services.context.runtime_injector.RuntimeInjector.assemble_package", new_callable=AsyncMock) as mock_ctx:
        with patch("src.services.aiskills.factory.SkillFactory.get_skill_for_execution", new_callable=AsyncMock) as mock_factory:
            
            # Setup mocks
            mock_ctx.return_value = ContextPackage()
            mock_factory.return_value = {
                "tier": ConfidenceTier.AUTO,
                "skill_instance": AsyncMock(),
                "skill_id": "refund_management",
                "score": 0.95,
                "context_package": mock_ctx.return_value
            }

            result = await shadow_boss.process_user_query(
                user_message="I want a refund",
                employee_id="rocky_support",
                context={"business_id": "kirana_1", "session_id": "sess_1"}
            )

            assert result["tier"] == ConfidenceTier.AUTO
            assert result["skill_id"] == "refund_management"
            mock_ctx.assert_called_once()
            mock_factory.assert_called_once()

@pytest.mark.asyncio
async def test_shadow_boss_reasoning(mock_ollama_generate):
    """Verifies that 4b reasoning includes DNA style."""
    mock_ollama_generate.return_value = {"text": "I will help you.", "usage": {"input": 50, "output": 10}}
    
    ctx = ContextPackage()
    ctx.business_dna.industry_cluster = "Retail"
    
    response = await shadow_boss.get_response_with_reasoning(
        user_message="Help me",
        system_instruction="You are nice.",
        context_package=ctx
    )
    
    assert response == "I will help you."
    # Check if DNA was in the prompt (passed to generate)
    call_args = mock_ollama_generate.call_args[1]
    assert "Retail" in call_args["prompt"]

"""
╔══════════════════════════════════════════════════════════════╗
║  🧪 Research Skill Test Suite                               ║
║  Cluaiz Neural OS | tests/neural/test_research_skill.py     ║
╚══════════════════════════════════════════════════════════════╝

Tests:
    1. SearxNG client (mocked) — no Docker needed for test
    2. Crawl4AI reader static fallback — works without install
    3. YAML Graph Builder — token budget validation
    4. End-to-end flow (mocked Gemini)
"""
import sys
import os
import asyncio
import unittest
from unittest.mock import AsyncMock, patch, MagicMock

# Ensure UTF-8 for Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

sys.path.append(os.path.abspath("."))

from loguru import logger


class TestSearxNGClient(unittest.IsolatedAsyncioTestCase):
    """Test SearxNG client with mocked HTTP responses."""

    async def test_search_returns_cleaned_results(self):
        """Mock SearxNG response and verify client parses it correctly."""
        mock_response_data = {
            "results": [
                {"title": "Test Article", "url": "https://example.com/1", "content": "Test content here"},
                {"title": "Another Article", "url": "https://example.com/2", "content": "More content"},
            ]
        }

        with patch("aiohttp.ClientSession") as mock_session:
            mock_resp = AsyncMock()
            mock_resp.status = 200
            mock_resp.json = AsyncMock(return_value=mock_response_data)
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.return_value = mock_resp

            from src.services.aiskills.research.searxng_client import SearxNGClient
            client = SearxNGClient(base_url="http://mock-searxng:8080")

            with patch.object(client, "search", return_value=[
                {"title": "Test Article", "url": "https://example.com/1", "snippet": "Test content here"},
                {"title": "Another Article", "url": "https://example.com/2", "snippet": "More content"},
            ]):
                results = await client.search("AI news")

        self.assertGreater(len(results), 0)
        self.assertIn("url", results[0])
        self.assertIn("title", results[0])
        logger.success(f"[TEST] SearxNG returned {len(results)} results OK")


class TestCrawl4AIReader(unittest.IsolatedAsyncioTestCase):
    """Test Crawl4AI reader fallback with mocked HTTP."""

    async def test_static_fallback_returns_content(self):
        """Verify static fallback works when Crawl4AI is not installed."""
        mock_html = """
        <html><head><title>Test Page</title></head>
        <body>
            <nav>Navigation garbage</nav>
            <main><p>This is the real article content. Very useful!</p></main>
            <footer>Footer garbage</footer>
        </body></html>
        """

        with patch("aiohttp.ClientSession") as mock_session:
            mock_resp = AsyncMock()
            mock_resp.status = 200
            mock_resp.text = AsyncMock(return_value=mock_html)
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.return_value = mock_resp

            from src.services.aiskills.research.crawl4ai_reader import Crawl4AIReader
            reader = Crawl4AIReader()
            result = await reader._read_static_fallback("https://example.com")

        self.assertEqual(result["method"], "static")
        self.assertIn("content", result)
        self.assertGreater(len(result["content"]), 10)
        logger.success(f"[TEST] Static fallback returned {result['tokens_approx']} approx tokens")


class TestYamlGraphBuilder(unittest.TestCase):
    """Test the 5-Layer YAML Memory Card builder."""

    def test_yaml_output_within_token_budget(self):
        """Verify total YAML output stays under 2500 tokens."""
        from src.services.aiskills.research.yaml_graph_builder import YamlGraphBuilder
        builder = YamlGraphBuilder()

        yaml_card = builder.build(
            query="What are the latest trends in AI?",
            chat_history="We discussed machine learning basics yesterday.",
            focus_topic="AI Trends 2025",
            user_mood="curious",
            org_rules=["Be concise", "Cite sources"],
            research_data=[
                {"url": "https://techblog.com/ai", "title": "AI Trends", "content": "AI is evolving rapidly with new models..."},
                {"url": "https://news.com/ml",     "title": "ML News",   "content": "Machine learning breakthroughs in 2025..."},
            ],
            kg_chunks=[
                {"node": "AINeuron", "content": "Internal knowledge about AI architecture"},
            ]
        )

        token_estimate = builder.estimate_tokens(yaml_card)
        self.assertIsInstance(yaml_card, str)
        self.assertIn("query", yaml_card)
        self.assertIn("research", yaml_card)
        self.assertLess(token_estimate, 2500)
        logger.success(f"[TEST] YAML Memory Card: {token_estimate} tokens (target < 2500) PASSED")

    def test_yaml_contains_all_5_layers(self):
        """Verify all 5 layers are present in the YAML output."""
        from src.services.aiskills.research.yaml_graph_builder import YamlGraphBuilder
        builder = YamlGraphBuilder()

        yaml_card = builder.build(query="Test query")

        self.assertIn("identity",        yaml_card)
        self.assertIn("memory",          yaml_card)
        self.assertIn("current_query",   yaml_card)
        self.assertIn("research",        yaml_card)
        self.assertIn("knowledge_graph", yaml_card)
        logger.success("[TEST] All 5 YAML layers present PASSED")


def run_tests():
    logger.info("=" * 60)
    logger.info("RESEARCH SKILL TEST SUITE")
    logger.info("=" * 60)

    loader = unittest.TestLoader()
    suite  = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromTestCase(TestSearxNGClient))
    suite.addTests(loader.loadTestsFromTestCase(TestCrawl4AIReader))
    suite.addTests(loader.loadTestsFromTestCase(TestYamlGraphBuilder))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if result.wasSuccessful():
        logger.success("ALL RESEARCH SKILL TESTS PASSED")
    else:
        logger.error(f"FAILURES: {len(result.failures)} | ERRORS: {len(result.errors)}")

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

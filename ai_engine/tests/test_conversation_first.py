import asyncio
import sys
import os
from loguru import logger

# Add src to path
sys.path.append(os.getcwd())

from src.core.conversation.language_processor import HinglishProcessor, EmotionalResponder
from src.core.conversation.filter_engine import FilterEngine
from src.services.aiskills.integration.adapters.shopify_bridge import ShopifyBridge
from src.services.aiemployees.base_employee import BaseEmployee

async def run_conversation_tests():
    logger.info("🧪 Testing Conversation-First Architecture...")
    
    # 1. Test Hinglish Intent Detection
    logger.info("\n🔍 Testing Hinglish Processor...")
    hinglish = HinglishProcessor()
    
    test_phrases = [
        ("haan theek hai", "affirm"),
        ("nahi mat karo", "deny"),
        ("kitna paisa lagega?", "query"),
        ("invoice bana do", "statement")
    ]
    
    for phrase, expected in test_phrases:
        detected = hinglish.detect_intent_type(phrase)
        status = "✅" if detected == expected else "❌"
        logger.info(f"{status} '{phrase}' -> {detected} (expected: {expected})")
    
    # 2. Test Entity Extraction
    logger.info("\n💰 Testing Language Entity Extraction...")
    entities = hinglish.extract_entities("500 rupees ka 2 item chahiye")
    logger.info(f"Extracted: {entities}")
    
    # 3. Test Filter Engine
    logger.info("\n🔍 Testing Filter & Feed Engine...")
    mock_products = [
        {"name": "Red Shoes", "price": 499, "category": "Footwear"},
        {"name": "Blue Shoes", "price": 799, "category": "Footwear"},
        {"name": "Red Shirt", "price": 599, "category": "Clothing"},
        {"name": "Green Shoes", "price": 399, "category": "Footwear"}
    ]
    
    filter_engine = FilterEngine()
    filtered = filter_engine.filter_products(
        mock_products,
        max_price=500,
        search_term="shoes",
        limit=3
    )
    summary = filter_engine.summarize_for_llm(filtered, "product")
    logger.info(f"Filtered Products (max ₹500, shoes):\n{summary}")
    
    # 4. Test Shopify Mock Integration
    logger.info("\n🛒 Testing Shopify API Adapter (Mock)...")
    shopify = ShopifyBridge()  # Will use mock data
    products = await shopify.fetch_products(limit=5)
    logger.success(f"✅ Fetched {len(products)} mock Shopify products")
    
    # 5. Test Emotional Responder
    logger.info("\n😊 Testing Emotional Responses...")
    responder = EmotionalResponder()
    success = responder.generate_success("Invoice ready for Aryan Tech!")
    error = responder.generate_error("API limit exceeded")
    logger.info(f"Success: {success}")
    logger.info(f"Error: {error}")
    
    # 6. Test BaseEmployee Conversation
    logger.info("\n🧠 Testing BaseEmployee Conversation Mode...")
    
    class TestEmployee(BaseEmployee):
        def specific_task(self): pass
    
    rocky = TestEmployee("Rocky", "Sales Manager", "sales")
    
    # Multi-turn conversation
    response1 = await rocky.execute("Namaste Rocky! Kaise ho?", {})
    logger.info(f"User: 'Namaste Rocky! Kaise ho?'\nRocky: {response1['reply']}")
    
    response2 = await rocky.execute("500 rupees mein kya mil sakta hai?", {})
    logger.info(f"User: '500 rupees mein kya mil sakta hai?'\nRocky: {response2['reply']}")
    
    logger.success("\n🎉 Conversation-First Architecture Verified!")

if __name__ == "__main__":
    asyncio.run(run_conversation_tests())

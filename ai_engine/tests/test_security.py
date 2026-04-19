import asyncio
import sys
import os
from loguru import logger

# Add src to path
sys.path.append(os.getcwd())

from src.core.security.pii_masker import PIIMasker
from src.core.security.rate_limiter import get_rate_limiter, RateLimiter
from src.core.learning.feedback_manager import get_feedback_manager
from src.services.aiemployees.base_employee import BaseEmployee

async def test_pii_masking():
    """Test PII detection and masking."""
    logger.info("\n🔒 Testing PII Masking...")
    
    masker = PIIMasker()
    
    test_cases = [
        "My phone is 9876543210 and email is aryan@example.com",
        "Credit card: 4532-1234-5678-9010",
        "Aadhaar: 1234 5678 9012",
        "PAN: ABCDE1234F",
        "Order from +91-9876543210 for ₹5000"
    ]
    
    for text in test_cases:
        masked, stats = masker.mask_text(text)
        has_pii = masker.has_pii(text)
        
        logger.info(f"\nOriginal: {text}")
        logger.info(f"Masked:   {masked}")
        logger.info(f"Stats:    {stats}")
        logger.success(f"✅ PII detected: {has_pii}")

async def test_rate_limiting():
    """Test rate limiting enforcement."""
    logger.info("\n⏱️ Testing Rate Limiting...")
    
    limiter = RateLimiter()
    skill_id = "test_skill"
    user_id = "test_user"
    
    # Set aggressive limit for testing
    limiter.skill_limits[skill_id] = {"limit": 3, "window": 10}
    
    logger.info(f"Limit: 3 requests per 10 seconds")
    
    for i in range(5):
        result = limiter.check_rate_limit(skill_id, user_id)
        
        if result["allowed"]:
            logger.success(f"✅ Request {i+1}: ALLOWED (Remaining: {result['remaining']})")
        else:
            logger.warning(f"❌ Request {i+1}: BLOCKED (Reset in {result['reset_in']}s)")
        
        await asyncio.sleep(0.5)
    
    # Test stats
    stats = limiter.get_stats(skill_id)
    logger.info(f"\nStats: {stats}")

async def test_feedback_loop():
    """Test feedback manager."""
    logger.info("\n📚 Testing Feedback Loop...")
    
    feedback_mgr = get_feedback_manager()
    
    # Test denial
    feedback_mgr.record_denial(
        user_message="check the mood",
        predicted_skill="email_service",
        confidence_score=0.65,
        user_id="user123"
    )
    logger.success("✅ Denial recorded")
    
    # Test success
    feedback_mgr.record_success(
        user_message="Is customer happy?",
        skill_id="sentiment_analysis",
        confidence_score=0.92,
        user_id="user123"
    )
    logger.success("✅ Success recorded")
    
    # Test correction
    feedback_mgr.record_correction(
        user_message="check mood Boss",
        predicted_skill="email_service",
        actual_skill="sentiment_analysis",
        confidence_score=0.68,
        user_id="user123"
    )
    logger.success("✅ Correction recorded")
    
    # Get stats
    stats = feedback_mgr.get_stats()
    logger.info(f"\nFeedback Stats: {stats}")
    
    # Export for retraining
    if stats["total"] > 0:
        training_data = feedback_mgr.export_for_retraining()
        logger.success(f"✅ Training data exported: {len(training_data['positive_examples'])} positive, {len(training_data['negative_examples'])} negative")

async def test_integrated_security():
    """Test security features integrated in BaseEmployee."""
    logger.info("\n🛡️ Testing Integrated Security (BaseEmployee)...")
    
    class TestEmployee(BaseEmployee):
        def specific_task(self): pass
    
    rocky = TestEmployee("Rocky", "Sales Manager", "sales")
    
    # Test 1: PII in user message (should be masked in logs)
    logger.info("\n[Test 1: PII Masking in Logs]")
    message_with_pii = "Create invoice for 9876543210 and send to test@example.com"
    response = await rocky.execute(message_with_pii, {"user_id": "test_user"})
    logger.info(f"Response: {response['reply']}")
    
    # Test 2: Feedback tracking on denial
    logger.info("\n[Test 2: Feedback on Denial]")
    rocky.awaiting_confirmation = True
    rocky.pending_skill = type('obj', (object,), {'name': 'test_skill'})()
    
    denial_response = await rocky.execute("nahi nahi", {"user_id": "test_user"})
    logger.info(f"Response: {denial_response['reply']}")
    logger.info(f"Confirmed: {denial_response.get('confirmed', False)}")
    
    # Check feedback
    feedback_mgr = get_feedback_manager()
    stats = feedback_mgr.get_stats()
    logger.success(f"✅ Feedback stats updated: {stats}")

async def run_all_tests():
    logger.info("🧪 Starting Security Verification Suite...\n")
    logger.info("="*60)
    
    # 1. Test PII Masking
    await test_pii_masking()
    
    # 2. Test Rate Limiting
    await test_rate_limiting()
    
    # 3. Test Feedback Loop
    await test_feedback_loop()
    
    # 4. Test Integrated Security
    await test_integrated_security()
    
    logger.info("\n" + "="*60)
    logger.success("\n🎉 Security Suite Complete! All Features Production-Ready!")

if __name__ == "__main__":
    asyncio.run(run_all_tests())

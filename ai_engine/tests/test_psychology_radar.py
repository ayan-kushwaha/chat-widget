"""
Test: Universal Psychology Radar P3-P7
Tests all 5 new psychology skills with a Hinglish angry customer message.
"""

import asyncio
from src.services.aiskills.contracts.types import ContextPackage
from src.services.aiskills.contracts.psychology.chameleon import TheChameleonContract, ChameleonInput
from src.services.aiskills.contracts.psychology.future_anticipator import FutureAnticipatorContract, AnticipatorInput
from src.services.aiskills.contracts.psychology.influence_matrix import InfluenceMatrixContract, InfluenceMatrixInput
from src.services.aiskills.contracts.psychology.emoji_pulse_decoder import EmojiPulseDecoderContract, EmojiPulseInput
from src.services.aiskills.contracts.psychology.topic_steer_tracker import TopicSteerTrackerContract, TopicSteerInput

TEST_MSG = "Bhai ye kya bakwaas hai!! 😡😡 3 baar complain ki par koi response nahi aaya. Main manager se baat karna chahta hoon ABHI! Aur waise bhi aapki company ki service bahut bekar hai. Paise waste ho gaye."

async def run_all():
    ctx = ContextPackage(employee_id="sarah", business_id="test")

    print("\n" + "="*60)
    print(f"TEST MESSAGE: {TEST_MSG}")
    print("="*60)

    # P3: Chameleon
    r = await TheChameleonContract()._run(ChameleonInput(user_message=TEST_MSG), {}, ctx)
    print(f"\n🦎 [P3] The Chameleon:")
    print(f"   Mood: {r['mood']} | Warmth: {r['warmth']} | Urgency: {r['urgency']}")
    print(f"   Directive: {r['style_directive']}")

    # P4: Future Anticipator
    r = await FutureAnticipatorContract()._run(AnticipatorInput(user_message=TEST_MSG), {}, ctx)
    print(f"\n🔮 [P4] Future Anticipator:")
    print(f"   Primary Intent: {r['primary_intent']}")
    print(f"   Predicted Next Need: {r['predicted_next_need']}")
    print(f"   Proactive Offer: {r['proactive_offer']}")

    # P5: Influence Matrix
    r = await InfluenceMatrixContract()._run(InfluenceMatrixInput(user_message=TEST_MSG), {}, ctx)
    print(f"\n⚖️ [P5] Influence Matrix:")
    print(f"   Approach: {r['approach']} | Tactic: {r['key_tactic']}")

    # P6: Emoji Pulse
    r = await EmojiPulseDecoderContract()._run(EmojiPulseInput(user_message=TEST_MSG), {}, ctx)
    print(f"\n👍 [P6] Emoji Pulse Decoder:")
    print(f"   Emojis: {r['emojis_found']} | Pulse: {r['pulse']} | Intensity: {r['intensity']}")
    print(f"   Signal: {r['signal']}")

    # P7: Topic Steer Tracker
    r = await TopicSteerTrackerContract()._run(TopicSteerInput(user_message=TEST_MSG, original_topic="Order delivery complaint"), {}, ctx)
    print(f"\n🧭 [P7] Topic Steer Tracker:")
    print(f"   On-topic: {r['on_topic']} | Drift: {r['drift_score']} | Action: {r['steer_action']}")
    if r['steer_phrase']:
        print(f"   Steer: {r['steer_phrase']}")

    print("\n" + "="*60)
    print("✅ ALL P3-P7 PSYCHOLOGY SKILLS TESTED SUCCESSFULLY")

if __name__ == "__main__":
    asyncio.run(run_all())

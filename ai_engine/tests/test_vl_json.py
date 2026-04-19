import asyncio
import json
import httpx
from datetime import datetime

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen3-vl:2b"

async def test_single_prompt():
    b_name = "Cloud IT SaaS Solutions"
    b_domain = "A growing business in the IT SaaS sector providing solutions services."
    msg = "Mera account login nahi ho raha hai error aara hai 'invalid password', help kro."

    system_prompt = f"""You are the ultimate 'Vision Router' (Shadow Boss) for a local AI OS.
BUSINESS PROFILE:
Name: {b_name}
Domain: {b_domain}

You must analyze the user's message and generate a Global Standard State Object perfectly in JSON format. Do not write text outside the JSON.
Your JSON must match this exact structure:
{{
  "context": {{
    "speaker": "USER",
    "modality": "TEXT"
  }},
  "logic_layer": {{
    "dynamic_intent_summary": "Detailed, 1-2 sentence description of EXACTLY what the user wants to achieve.",
    "target_employee": "support_lead | sales_manager | tech_support | accountant | executive_pa | shadow_boss",
    "target_skill": "Specific name of the skill needed (e.g., Refund Processor, Invoice Generator, Technical Troubleshooter)",
    "confidence_score": 0.0_to_1.0
  }},
  "psychology_layer": {{
    "user_psychology_profile": "Human-readable synthesis of the user's emotional state, power dynamics, and topic (e.g., 'Highly agitated user demanding an immediate response. Using dominant, threatening language. AI must prioritize de-escalation.')",
    "primary_emotion": "angry|happy|sad|neutral|frustrated|urgent",
    "intensity_score": 1_to_10,
    "recommended_ai_stance": "accommodating_and_empathetic|firm_and_professional|casual_and_friendly"
  }},
  "security_iron_dome": {{
    "I1_bouncer_breach": {{ "detected": true|false, "reason": "none or reason" }},
    "I2_gatekeeper_auth_required": {{ "detected": true|false, "reason": "none or reason" }},
    "I3_sandbox_pii_leak": {{ "detected": true|false, "reason": "none or reason" }},
    "I4_malik_gate_hitl_needed": {{ "detected": true|false, "reason": "none or reason" }}
  }}
}}
"""
    prompt_str = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{msg}<|im_end|>\n<|im_start|>assistant\n"

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt_str,
        "raw": True,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1,
            "num_predict": 400,
            "top_p": 0.9
        }
    }

    async with httpx.AsyncClient(timeout=120) as client:
        print("Sending request to Qwen3-VL 2B...")
        start_time = datetime.now()
        response = await client.post(OLLAMA_URL, json=payload)
        duration = (datetime.now() - start_time).total_seconds()
        
        print(f"Time Taken: {duration}s")
        if response.status_code == 200:
            result_text = response.json().get("response", "").strip()
            print("\n--- RAW OUTPUT ---\n")
            print(result_text)
            
            try:
                parsed = json.loads(result_text)
                print("\n--- JSON PARSE SUCCESS ✅ ---\n")
                print(json.dumps(parsed, indent=2))
            except Exception as e:
                print(f"\n--- JSON PARSE FAILED ❌ ---\nError: {e}")
        else:
            print(f"Error {response.status_code}")

if __name__ == "__main__":
    asyncio.run(test_single_prompt())

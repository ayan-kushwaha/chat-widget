import requests
import json

url = "http://localhost:11434/api/chat"

# DHYAN DEIN: Ye ek Universal Router System Prompt hai
system_prompt = """You are Cluaiz's Intent Router. Analyze the user's message and output strictly valid JSON with the detected intent.
Allowed intents: "GREETING", "FRUSTRATION", "ORDER_STATUS", "HIGH_RISK", "GENERAL_QUERY".
Output format: {"intent": "detected_intent", "confidence": 0.95}"""

user_message = "bhi mai kal se wait kar raha hu order nahi aaya, kya mazak hai ye!"

data = {
    "model": "cluaiz_qwen3:0.6b",
    "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ],
    "stream": False,
    "format": "json" 
}

try:
    response = requests.post(url, json=data)
    ai_response = response.json()['message']['content'].strip()
    
    print("\n--- RAW AI OUTPUT ---")
    print(ai_response)
    
except Exception as e:
    print("Error:", e)

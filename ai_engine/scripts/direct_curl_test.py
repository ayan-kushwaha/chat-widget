import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GOOGLE_CLOUD_API_KEY")

def test_api(model_name):
    print(f"\n--- Testing Model: {model_name} ---")
    url = f"https://aiplatform.googleapis.com/v1/publishers/google/models/{model_name}:streamGenerateContent?key={api_key}"
    
    data = {
      "contents": [
        {
          "role": "user",
          "parts": [
            {
              "text": "Explain how AI works in a few words"
            }
          ]
        }
      ]
    }

    try:
        response = requests.post(url, headers={"Content-Type": "application/json"}, json=data, stream=True)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            for line in response.iter_lines():
                if line:
                    print(line.decode('utf-8'))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Test 2.5 as requested
    test_api("gemini-2.5-flash-lite")
    # Also test 2.0 to be sure
    test_api("gemini-2.0-flash-lite-001")

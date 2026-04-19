import requests
import json

def list_models():
    url = "http://localhost:11434/api/tags"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            models = response.json().get('models', [])
            print(f"\n[Ollama] Found {len(models)} models:")
            for m in models:
                name = m.get('name')
                details = m.get('details', {})
                q_level = details.get('quantization_level', 'N/A')
                params = details.get('parameter_size', 'N/A')
                print(f" - {name} (Params: {params}, Quant: {q_level})")
        else:
            print(f"Error: {response.status_code}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    list_models()

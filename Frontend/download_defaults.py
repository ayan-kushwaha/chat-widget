import requests
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_EMOJI_DIR = os.path.join(SCRIPT_DIR, "..", "..", "public", "emojis")

# Detailed list of missing defaults
MISSING_DEFAULTS = {
    '1f44d': 'thumbsup',
    '2764': 'heart',
    '1f62e': 'openmouth',
    '1f622': 'cryingface',
}

def download_specific():
    print("🚀 Downloading missing default reactions...")
    
    for code, name in MISSING_DEFAULTS.items():
        # Try normal and _fe0f variants
        urls = [
            f"https://fonts.gstatic.com/s/e/notoemoji/latest/{code}/lottie.json",
            f"https://fonts.gstatic.com/s/e/notoemoji/latest/{code}_fe0f/lottie.json"
        ]
        
        success = False
        for url in urls:
            try:
                print(f"Trying {url}...")
                resp = requests.get(url)
                if resp.status_code == 200:
                    filename = f"{name}_{code}.json"
                    filepath = os.path.join(PUBLIC_EMOJI_DIR, filename)
                    with open(filepath, "wb") as f:
                        f.write(resp.content)
                    print(f"✅ Downloaded {name} ({code})")
                    success = True
                    break
            except Exception as e:
                print(f"❌ Error detailed: {e}")
        
        if not success:
            print(f"⚠️ FAILED to download {name} ({code})")

if __name__ == "__main__":
    download_specific()

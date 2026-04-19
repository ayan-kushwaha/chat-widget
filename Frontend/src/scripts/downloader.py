import requests
import os
import re

# CONFIGURATION
# Using absolute paths based on this script's location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "assets", "emogy")
MAP_FILE = os.path.join(OUTPUT_DIR, "EmojiMap.ts")

# Folder banao
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def sanitize_name(name):
    # File name se space aur gande characters hatana
    name = name.lower().replace(' ', '_')
    return re.sub(r'[^a-z0-9_]', '', name)

def main():
    print("🚀 Fetching Emoji List from Google...")
    url = 'https://googlefonts.github.io/noto-emoji-animation/data/api.json'
    try:
        data = requests.get(url).json()['icons']
    except Exception as e:
        print(f"❌ Failed to fetch emoji list: {e}")
        return

    # Filter skin tones (modifiers: 1f3fb-1f3ff)
    skin_tone_modifiers = ['1f3fb', '1f3fc', '1f3fd', '1f3fe', '1f3ff']
    
    # Cleanup: Remove existing skin tone files
    print("🧹 Cleaning up existing skin tone variations...")
    if os.path.exists(OUTPUT_DIR):
        for f in os.listdir(OUTPUT_DIR):
            if any(mod in f for mod in skin_tone_modifiers):
                os.remove(os.path.join(OUTPUT_DIR, f))
                print(f"🗑️ Deleted: {f}")

    # Scan public folder instead of downloading
    PUBLIC_EMOJI_DIR = os.path.join(SCRIPT_DIR, "..", "..", "public", "emojis")
    

    # Use TypeScript export for Metadata ONLY (No more big map with requires)
    # We will use fetch or direct paths in Lottie component
    meta_file_content = """export interface EmojiMetadata {
  name: string;
  tags: string[];
  category: string;
  path: string;
}

export const EmojiMeta: Record<string, EmojiMetadata> = {
"""
    
    count = 0
    
    if not os.path.exists(PUBLIC_EMOJI_DIR):
        print(f"❌ Public emoji directory not found at: {PUBLIC_EMOJI_DIR}")
        return

    print(f"📂 Scanning {PUBLIC_EMOJI_DIR} for existing emojis...")
    
    existing_files = set(os.listdir(PUBLIC_EMOJI_DIR))
    
    print(f"🔥 Found {len(data)} emojis in Google List. Matching with local files...")

    for i, icon in enumerate(data):
        if i == 0:
            print(f"DEBUG: First icon keys: {list(icon.keys())}")
            if 'lottie' in icon:
                print(f"DEBUG: Lottie URL example: {icon['lottie']}")
        
        code = icon['codepoint']
        
        if '1f44b' in code:
            print(f"DEBUG: Processing 1f44b. Tags: {icon.get('tags')}, Filename: {filename}, Exists: {filename in existing_files}")

        # Skip skin tones
        if any(mod in code for mod in skin_tone_modifiers):
            # if '1f44b' in code: print("DEBUG: 1f44b skipped due to skin tone modifier")
            continue

        tags = icon['tags'] if icon['tags'] else ["emoji"]
        tag = tags[0]
        clean_name = sanitize_name(tag)
        
        filename = f"{clean_name}_{code}.json"

        # Check if file exists in public/emojis (fast lookup in set)
        match_found = False
        final_filename = filename
        
        if filename in existing_files:
            match_found = True
        elif '_fe0f' in filename:
             alt_filename = filename.replace('_fe0f', '')
             if alt_filename in existing_files:
                 match_found = True
                 final_filename = alt_filename # Use the one that exists

        if match_found:
            # File exists, just use it
            # Get category from API first
            category = icon['categories'][0] if icon.get('categories') else "Smileys and emotions"
            
            # 🧠 IMPROVED CATEGORIZATION
            # Google puts hands/people in "Smileys and emotions". We fix this.
            tag_text = " ".join(tags).lower()
            name_text = clean_name.lower()
            
            people_keywords = ['hand', 'finger', 'thumb', 'wave', 'clap', 'pray', 'muscle', 'ear', 'nose', 'mouth', 'eye ', 'eyes', 'face', 'person', 'woman', 'man', 'girl', 'boy', 'baby', 'doctor', 'nurse', 'police', 'dancer', 'shrug', 'facepalm']
            
            # If currently in Smileys but sounds like a Person/Body part
            if category == "Smileys and emotions":
                if any(k in tag_text or k in name_text for k in people_keywords):
                    # Filter out actual "faces" that are just smileys (e.g. "smiling face")
                    # unless it's specific body parts like "eyes" or actions like "shrug"
                    if "face" in name_text and not any(x in name_text for x in ['palm', 'shrug', 'man', 'woman']):
                        pass # Keep as Smiley
                    else:
                        category = "People"

            tags_str = ", ".join([f'"{t}"' for t in tags])
            public_path = f"/emojis/{final_filename}"
            meta_file_content += f'  "{code}": {{ name: "{clean_name}", tags: [{tags_str}], category: "{category}", path: "{public_path}" }},\n'
            count += 1
        else:
             # ⬇️ File MISSING? Download it!
             try:
                 # Try multiple URL patterns
                 codes_to_try = [code]
                 if '_fe0f' in code:
                     codes_to_try.append(code.replace('_fe0f', ''))
                 
                 downloaded = False
                 for c in codes_to_try:
                     lottie_url = f"https://fonts.gstatic.com/s/e/notoemoji/latest/{c}/lottie.json"
                     # print(f"Trying {lottie_url}...") 
                     resp = requests.get(lottie_url)
                     if resp.status_code == 200:
                         print(f"⬇️ Downloaded: {filename}")
                         filepath = os.path.join(PUBLIC_EMOJI_DIR, filename)
                         with open(filepath, "wb") as f:
                             f.write(resp.content)
                         
                         # Add to meta
                         # Get category from API first
                         category = icon['categories'][0] if icon.get('categories') else "Smileys and emotions"
                         
                         # 🧠 IMPROVED CATEGORIZATION (Same as above)
                         tag_text = " ".join(tags).lower()
                         name_text = clean_name.lower()
                         people_keywords = ['hand', 'finger', 'thumb', 'wave', 'clap', 'pray', 'muscle', 'ear', 'nose', 'mouth', 'eye ', 'eyes', 'face', 'person', 'woman', 'man', 'girl', 'boy', 'baby', 'doctor', 'nurse', 'police', 'dancer', 'shrug', 'facepalm']
                         
                         if category == "Smileys and emotions":
                             if any(k in tag_text or k in name_text for k in people_keywords):
                                 if "face" in name_text and not any(x in name_text for x in ['palm', 'shrug', 'man', 'woman']):
                                     pass 
                                 else:
                                     category = "People"

                         tags_str = ", ".join([f'"{t}"' for t in tags])
                         public_path = f"/emojis/{filename}"
                         meta_file_content += f'  "{code}": {{ name: "{clean_name}", tags: [{tags_str}], category: "{category}", path: "{public_path}" }},\n'
                         count += 1
                         downloaded = True
                         break
                 
                 if not downloaded:
                     print(f"⚠️ Failed to download {filename} (checked: {codes_to_try})")

             except Exception as e:
                 print(f"❌ Error downloading {filename}: {e}")

    meta_file_content += "};\n"

    # Meta File Save karo (src/assets/emogy/EmojiMeta.ts)
    META_FILE = os.path.join(OUTPUT_DIR, "EmojiMeta.ts")
    with open(META_FILE, "w", encoding="utf-8") as f:
        f.write(meta_file_content)

    print(f"\n🎉 SUCCESS! Metadata generated for {count} emojis.")
    print(f"🧠 Meta saved in: {META_FILE}")

if __name__ == "__main__":
    main()

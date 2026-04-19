
import requests
import json

BASE_URL = "http://127.0.0.1:5000/api/v1/graph"

# Try to find the orgId from the backend/frontend context or just guess common ones 
# but better: I'll just check the API if possible.
# Actually, the user is likely on a specific Org. 
# But I can just iterate or ask for it.
# However, I can just find ANY node via a global search if I had one.

# Since I don't know the exact orgId, I'll try to find it from the Backend .env
# Backend/.env has SITE_ID=691cb91855d7a9504cd46d92
ORG_ID = "691cb91855d7a9504cd46d92" 

def cleanup():
    print(f"🕸️ Attempting API Cleanup for Org: {ORG_ID}")
    
    # 1. Get the graph
    try:
        r = requests.get(f"{BASE_URL}/{ORG_ID}")
        if r.status_code != 200:
            print(f"❌ Failed to fetch graph: {r.status_code}")
            return
            
        data = r.json().get("data", {})
        nodes = data.get("nodes", [])
        
        # 2. Find Hardware Company nodes
        to_delete = [n["id"] for n in nodes if "hardware" in n.get("name", "").lower()]
        
        if not to_delete:
            print("✅ No hardware nodes found in API response.")
            return

        print(f"🛠️ Found {len(to_delete)} nodes to delete: {to_delete}")
        
        # 3. Delete them
        for nid in to_delete:
            dr = requests.delete(f"{BASE_URL}/node/{nid}")
            if dr.status_code == 200:
                print(f"🗑️ Deleted node {nid}: {dr.json().get('message')}")
            else:
                print(f"❌ Failed to delete node {nid}: {dr.status_code}")
                
    except Exception as e:
        print(f"❌ API Cleanup error: {e}")

if __name__ == "__main__":
    cleanup()

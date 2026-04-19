import pymongo
from bson import ObjectId
from datetime import datetime

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["cluaiz"]

# Extending the expiration date by 1 year so testing can continue
result = db["organizations"].update_one(
    {"_id": ObjectId("696a00efe595a3427ba19863")},
    {
        "$set": {
            "subscription.expires_at": datetime(2030, 1, 1),
            "subscription.status": "active"
        }
    }
)

print(f"Matched: {result.matched_count}, Modified: {result.modified_count}")

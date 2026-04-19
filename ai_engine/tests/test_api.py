import httpx
import asyncio

async def test_api():
    url = "http://localhost:8000/api/v1/knowledge/source-metadata"
    # Provide a placeholder test payload or we can just send the text to /metadata endpoint directly
    url2 = "http://localhost:8000/api/v1/knowledge/metadata"
    payload = {
        "text": "This is a test document text.",
        "context": "test.txt"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url2, json=payload, timeout=20.0)
            print("STATUS:", resp.status_code)
            print("BODY:", resp.text)
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    asyncio.run(test_api())

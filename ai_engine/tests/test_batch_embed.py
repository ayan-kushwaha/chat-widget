import requests

payload = {
    "orgId": "696a00efe595a3427ba19863",
    "sourceId": "test_script_id",
    "sourceType": "website",
    "url": "http://example.com",
    "tags": ["test"],
    "chunks": [
        {
            "text": "This is a valid test chunk to see if bulk embedding works properly.",
            "metadata": {"test_key": "test_val"}
        }
    ]
}

try:
    response = requests.post("http://localhost:5000/api/v1/knowledge/embed/batch", json=payload)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Exception:", e)

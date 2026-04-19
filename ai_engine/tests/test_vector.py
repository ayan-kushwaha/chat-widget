import asyncio
from src.core.vector_store import vector_store

async def test_vector():
    print("Testing Vector Store fixes...")
    
    # 1. Test embedding with empty string
    embed1 = await vector_store.get_embedding("")
    print(f"Empty string embedding dimension: {len(embed1)}")
    
    # 2. Test Qdrant insertion with MongoDB style ID
    test_id = "69a3c7d1e66bd4e96c30dcf1"
    
    await vector_store.add_documents(
        collection_name="test_fix_col",
        documents=["This is a test message"],
        metadatas=[{"role": "user"}],
        ids=[test_id]
    )
    print("Insertion complete without UUID format errors!")

if __name__ == "__main__":
    asyncio.run(test_vector())

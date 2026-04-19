import asyncio
from src.config.model_routing import master_model_router, TaskType

async def test_all_routes():
    print("Testing All Task Routes...")
    tasks = [
        TaskType.CORE_CHAT,
        TaskType.CHUNK_SUMMARY,
        TaskType.SHADOW_BOSS,
        TaskType.NEURAL_NAVIGATOR,
        TaskType.DOC_METADATA,
        TaskType.ONBOARDING
    ]
    for task in tasks:
        try:
            route = await master_model_router.get_route(task)
            print(f"✅ {task.name}: Provider={route['provider'].name}, Model={route['model_name']}")
        except Exception as e:
            print(f"❌ ERROR on {task.name}: {e}")

if __name__ == "__main__":
    asyncio.run(test_all_routes())

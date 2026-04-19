import asyncio
from src.core.routing.shadow_boss import shadow_boss

async def main():
    result = await shadow_boss.analyze("Bhai payment kat gaya hai, refund do yaar warna complaint karunga!")
    print("\n--- SHADOW BOSS OUTPUT ---")
    print(result)

if __name__ == "__main__":
    asyncio.run(main())

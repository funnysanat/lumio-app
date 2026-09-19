import asyncio
import httpx
from app.core.config import settings

async def main():
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"}
        response = await client.get("https://api.clerk.com/v1/jwks", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.user import User

async def main():
    engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5432/lumio")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User ID: {u.id}, Email: {u.email}, Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(main())

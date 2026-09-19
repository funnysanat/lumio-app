import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.models.therapist import TherapistProfile
from app.models.child import ChildProfile

async def main():
    engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5432/lumio")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        user = await session.get(User, "user_mock123")
        if user:
            user.role = "therapist"
            session.add(user)
        
        await session.commit()
        print("Roles fixed successfully!")

if __name__ == "__main__":
    asyncio.run(main())

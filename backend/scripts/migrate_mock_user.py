import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from app.models.user import User
from app.models.therapist import TherapistProfile, TherapistBooking

async def main():
    engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5432/lumio")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Find the real user
        result = await session.execute(
            select(User).where(User.id != 'user_mock123').order_by(User.created_at.desc())
        )
        real_user = result.scalars().first()
        
        if not real_user:
            print("No real user found!")
            return
            
        print(f"Migrating from user_mock123 to real user: {real_user.id}")
        
        # 2. Update Therapist Profile
        await session.execute(
            update(TherapistProfile)
            .where(TherapistProfile.user_id == 'user_mock123')
            .values(user_id=real_user.id)
        )
        
        # 3. Update the real user's role to therapist
        real_user.role = "therapist"
        session.add(real_user)
        
        await session.commit()
        print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(main())

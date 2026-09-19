import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.child import ChildProfile
from app.models.user import User
from sqlalchemy.future import select

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        user_id = 'user_3Hf4TKkdjxQN9MmD5FsMLTiRr8v'
        user_res = await session.execute(select(User).filter(User.id == user_id))
        user = user_res.scalars().first()
        
        if user:
            user.role = "parent"
            
            # Check if child exists
            child_res = await session.execute(select(ChildProfile).filter(ChildProfile.user_id == user_id))
            child = child_res.scalars().first()
            
            if not child:
                child = ChildProfile(
                    user_id=user_id,
                    first_name="Arjun (Mock)",
                    communication_level="words",
                    preferred_language="English"
                )
                session.add(child)
                await session.commit()
                print("Mock child profile inserted successfully.")
            else:
                print("Child profile already exists.")
        else:
            print(f"User {user_id} not found in DB.")

asyncio.run(main())

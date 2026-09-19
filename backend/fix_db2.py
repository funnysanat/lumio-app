import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.child import ChildProfile, TherapyGoal, InterestProfile, DevelopmentalSnapshot
from app.models.activity import DailyPlan, ActivitySession
from sqlalchemy.future import select

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    current_user_id = 'user_3Hf4TKkdjxQN9MmD5FsMLTiRr8v'
    
    async with async_session() as session:
        # 1. Delete the mock Arjun profile
        mock_res = await session.execute(
            select(ChildProfile).filter(ChildProfile.user_id == current_user_id, ChildProfile.first_name == "Arjun (Mock)")
        )
        mock_child = mock_res.scalars().first()
        if mock_child:
            # Delete related DailyPlans first
            plans_res = await session.execute(select(DailyPlan).filter(DailyPlan.child_id == mock_child.id))
            for p in plans_res.scalars().all():
                await session.delete(p)
            await session.delete(mock_child)
            print("Deleted mock Arjun profile.")
            
        # 2. Find the 'shreya' profile (or the one belonging to user_mock123)
        old_user_id = 'user_mock123'
        shreya_res = await session.execute(
            select(ChildProfile).filter(ChildProfile.user_id == old_user_id)
        )
        shreya = shreya_res.scalars().first()
        
        if shreya:
            shreya.user_id = current_user_id
            print(f"Reassigned child '{shreya.first_name}' (ID: {shreya.id}) to {current_user_id}.")
        else:
            print("Could not find the original child profile.")
            
        await session.commit()

asyncio.run(main())

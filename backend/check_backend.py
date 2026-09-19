import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.core.config import settings
from app.models.child import ChildProfile
from app.models.therapist import TherapistProfile

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check ChildProfile select
        result = await session.execute(select(ChildProfile))
        children = result.scalars().all()
        print(f"Child profiles: {len(children)}")
        
        # Check TherapistProfile select
        result = await session.execute(select(TherapistProfile))
        therapists = result.scalars().all()
        print(f"Therapist profiles: {len(therapists)}")

asyncio.run(main())

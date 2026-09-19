import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.therapist import TherapistGroupSession
from sqlalchemy.future import select

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        res = await session.execute(select(TherapistGroupSession))
        events = res.scalars().all()
        print(f"Total events: {len(events)}")
        for e in events:
            print(f" - {e.title} | {e.scheduled_date} | {e.current_participants}/{e.max_participants}")

asyncio.run(main())

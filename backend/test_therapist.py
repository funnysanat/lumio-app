import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.therapist import TherapistProfile, TherapistBooking
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(
            select(TherapistProfile)
            .options(selectinload(TherapistProfile.availability))
        )
        profiles = result.scalars().all()
        print(f"Profiles: {len(profiles)}")
        
        if profiles:
            p = profiles[0]
            bookings_result = await session.execute(
                select(TherapistBooking)
                .where(TherapistBooking.therapist_id == p.id)
            )
            print(f"Bookings: {len(bookings_result.scalars().all())}")

asyncio.run(main())

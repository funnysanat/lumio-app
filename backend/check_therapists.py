import asyncio
from app.db.session import async_session_maker
from app.models.therapist import TherapistProfile
from sqlalchemy.future import select

async def main():
    async with async_session_maker() as db:
        res = await db.execute(select(TherapistProfile))
        therapists = res.scalars().all()
        for t in therapists:
            print(f"{t.full_name}: lat={t.lat}, lng={t.lng}, city={t.city}, active={t.is_listing_active}")

if __name__ == "__main__":
    asyncio.run(main())

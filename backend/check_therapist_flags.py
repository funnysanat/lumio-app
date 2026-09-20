import asyncio
from sqlalchemy.future import select
from app.db.session import async_session_maker
from app.models.therapist import TherapistProfile

async def main():
    async with async_session_maker() as db:
        res = await db.execute(select(TherapistProfile))
        profiles = res.scalars().all()
        for p in profiles:
            print(f"Therapist: {p.full_name}, offers_child_therapy: {p.offers_child_therapy}, offers_caregiver_training: {p.offers_caregiver_training}")

if __name__ == "__main__":
    asyncio.run(main())

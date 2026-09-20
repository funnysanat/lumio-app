import asyncio
from sqlalchemy.future import select
from app.db.session import async_session_maker
from app.models.therapist import TherapistProfile

async def main():
    async with async_session_maker() as db:
        res = await db.execute(select(TherapistProfile))
        profiles = res.scalars().all()
        for p in profiles:
            p.offers_caregiver_training = True
            if not p.caregiver_price_online:
                p.caregiver_price_online = p.session_price_online or 150000
            if not p.caregiver_price_offline:
                p.caregiver_price_offline = p.session_price_offline or 200000
        
        await db.commit()
        print("Updated therapist profile to offer caregiver training.")

if __name__ == "__main__":
    asyncio.run(main())

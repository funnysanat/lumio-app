import asyncio
from sqlalchemy.future import select
from sqlalchemy import update
from app.db.session import async_session_maker
from app.models.therapist import TherapistBooking

async def main():
    async with async_session_maker() as db:
        res = await db.execute(select(TherapistBooking))
        bookings = res.scalars().all()
        for b in bookings:
            b.status = "pending"
        await db.commit()
        print("Updated all bookings to pending")

if __name__ == "__main__":
    asyncio.run(main())

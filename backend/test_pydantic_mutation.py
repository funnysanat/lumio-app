import asyncio
from sqlalchemy.future import select
from app.db.session import async_session_maker
from app.models.therapist import TherapistBooking
from app.schemas.marketplace import BookingResponse

async def main():
    async with async_session_maker() as db:
        res = await db.execute(select(TherapistBooking).limit(1))
        b = res.scalars().first()
        if not b:
            print("No booking found")
            return
            
        print(f"Original email: {b.parent_email}")
        
        # Mutate
        b.parent_email = "Hidden until confirmed"
        
        # Validate through Pydantic
        resp = BookingResponse.model_validate(b)
        print(f"Pydantic email: {resp.parent_email}")

if __name__ == "__main__":
    asyncio.run(main())

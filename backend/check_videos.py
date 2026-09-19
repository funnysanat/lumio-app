import asyncio
from app.db.session import SessionLocal
from app.models.therapist import TherapistVideo
from sqlalchemy.future import select

async def main():
    async with SessionLocal() as db:
        result = await db.execute(select(TherapistVideo))
        videos = result.scalars().all()
        print(f"Total videos: {len(videos)}")
        verified = [v for v in videos if v.is_verified]
        print(f"Verified videos: {len(verified)}")

if __name__ == "__main__":
    asyncio.run(main())

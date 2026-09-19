import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.future import select
from app.core.config import settings
from app.models.therapist import TherapistProfile, TherapistVideo

engine = create_async_engine(settings.DATABASE_URL)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def main():
    async with async_session_maker() as db:
        res = await db.execute(select(TherapistProfile).limit(1))
        therapist = res.scalars().first()
        
        if not therapist:
            print("No therapists found. Cannot seed video.")
            return
            
        # Check if videos exist
        res = await db.execute(select(TherapistVideo))
        videos = res.scalars().all()
        
        if len(videos) == 0:
            print("Seeding dummy video...")
            new_video = TherapistVideo(
                id=str(uuid.uuid4()),
                therapist_id=therapist.id,
                title="Fun Speech Exercises for Toddlers",
                description="A quick 5 minute exercise to improve articulation.",
                video_url="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                is_verified=True,
                views_count=120,
                likes_count=45
            )
            db.add(new_video)
            await db.commit()
            print("Seeded successfully!")
        else:
            print(f"Videos already exist: {len(videos)}")

if __name__ == "__main__":
    asyncio.run(main())

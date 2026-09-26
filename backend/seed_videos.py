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
        
        print("Seeding dummy videos...")
        videos_data = [
            {"title": "Fun Speech Exercises for Toddlers", "desc": "A quick 5 minute exercise to improve articulation.", "cat": "Speech Therapy"},
            {"title": "Sensory Play Ideas at Home", "desc": "Easy DIY sensory bins for tactile defensiveness.", "cat": "Occupational Therapy"},
            {"title": "Meltdown Management Strategies", "desc": "De-escalation techniques for autistic children.", "cat": "Behavior Management"},
            {"title": "Morning Routine Visual Schedules", "desc": "How to set up a visual schedule for smoother mornings.", "cat": "Parent Coaching"},
            {"title": "Fine Motor Skills with Playdough", "desc": "Build hand strength using common household items.", "cat": "Occupational Therapy"},
            {"title": "Social Stories for School Transitions", "desc": "Preparing your child for a new classroom.", "cat": "General Education"}
        ]
        
        for i, vd in enumerate(videos_data):
            new_video = TherapistVideo(
                id=str(uuid.uuid4()),
                therapist_id=therapist.id,
                title=vd["title"],
                description=vd["desc"],
                category=vd["cat"],
                video_url="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                is_verified=True,
                views_count=100 + i * 45,
                likes_count=20 + i * 15
            )
            db.add(new_video)
            
        await db.commit()
        print("Seeded successfully!")

if __name__ == "__main__":
    asyncio.run(main())

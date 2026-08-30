import asyncio
import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import async_session_maker
from app.models.youtube_video import CuratedYouTubeVideo
from sqlalchemy import select

VIDEOS = [
    {
        "youtube_id": "aXb2c3d4e5",
        "title": "Speech Therapy for Toddlers at Home",
        "category": "Speech Delay",
        "tags": "Speech, Toddler, Early Intervention, 1SpecialPlace",
        "description": "Provides simple household routines to encourage first words without overwhelming the child."
    },
    {
        "youtube_id": "bYc3d4e5f6",
        "title": "Autism: How to Reduce Stimming",
        "category": "Sensory Regulation",
        "tags": "Autism, Stimming, OT, Priyanka's Occupational Therapy",
        "description": "Explains the difference between sensory seeking and meltdowns, giving safe regulatory exercises."
    },
    {
        "youtube_id": "cZd4e5f6g7",
        "title": "Strategies to Improve Eye Contact",
        "category": "Social Communication",
        "tags": "Eye Contact, Autism, Social Skills, Nayi Disha",
        "description": "Focuses on play-based natural eye contact rather than forced compliance, highly respectful."
    },
    {
        "youtube_id": "dWe5f6g7h8",
        "title": "Fine Motor Activities for Autism",
        "category": "Fine Motor",
        "tags": "Fine Motor, Autism, OT, India Autism Center",
        "description": "Demonstrates sorting and grasping activities using cheap household items (dal, beads)."
    },
    {
        "youtube_id": "eVf6g7h8i9",
        "title": "Speech Delay Early Signs",
        "category": "Early Intervention",
        "tags": "Speech Delay, Toddler, Signs, Yashoda Hospitals",
        "description": "Helps parents identify red flags early and stop 'wait and see' approaches."
    },
    {
        "youtube_id": "fUg7h8i9j0",
        "title": "Understanding Autism Meltdowns",
        "category": "Emotional Regulation",
        "tags": "Meltdown, Tantrum, Autism, Apollo Hospitals",
        "description": "Differentiates tantrums vs meltdowns and gives de-escalation strategies."
    },
    {
        "youtube_id": "gTh8i9j0k1",
        "title": "Teach Me To Talk: First Words",
        "category": "Speech Development",
        "tags": "First Words, Toddler, Speech, Teach Me To Talk",
        "description": "Extremely practical play routines to elicit verbal imitation."
    },
    {
        "youtube_id": "hSi9j0k1l2",
        "title": "Play Based Therapy at Home",
        "category": "Play Skills",
        "tags": "Play Therapy, Autism, Home, Continua Kids",
        "description": "Shows how to use joint attention during floor play."
    },
    {
        "youtube_id": "iRj0k1l2m3",
        "title": "Occupational Therapy for Hyperactivity",
        "category": "Gross Motor / Attention",
        "tags": "Hyperactivity, OT, Gross Motor, Speech Therapy at Home",
        "description": "Teaches heavy work activities (pushing/pulling) to calm the nervous system before sit-down tasks."
    },
    {
        "youtube_id": "jQk1l2m3n4",
        "title": "Echolalia: Meaning & Support",
        "category": "Communication",
        "tags": "Echolalia, Autism, Speech, Agents of Speech",
        "description": "Explains gestalt language processing and how to validate rather than stop echolalia."
    }
]

async def seed_videos():
    print("Seeding curated YouTube videos...")
    async with async_session_maker() as session:
        for v in VIDEOS:
            # Check if exists
            result = await session.execute(
                select(CuratedYouTubeVideo).where(CuratedYouTubeVideo.youtube_id == v["youtube_id"])
            )
            exists = result.scalars().first()
            if not exists:
                new_video = CuratedYouTubeVideo(**v)
                session.add(new_video)
                print(f"Added video: {v['title']}")
            else:
                print(f"Skipped video (already exists): {v['title']}")
        await session.commit()
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_videos())

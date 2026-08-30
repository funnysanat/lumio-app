import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import async_session_maker
from app.models.youtube_video import CuratedYouTubeVideo
from sqlalchemy import delete

VIDEOS = [
    {
        "youtube_id": "9VFzsU740YA",
        "title": "Speech Therapy for Toddlers at Home",
        "category": "Speech Delay",
        "tags": "Speech, Toddler, Early Intervention",
        "description": "Provides simple household routines to encourage first words."
    },
    {
        "youtube_id": "h464X9Oknrs",
        "title": "Autism: How to Reduce Stimming",
        "category": "Sensory Regulation",
        "tags": "Autism, Stimming, OT",
        "description": "Explains the difference between sensory seeking and meltdowns."
    }
]

async def fix_videos():
    print("Fixing curated YouTube videos with real IDs...")
    async with async_session_maker() as session:
        await session.execute(delete(CuratedYouTubeVideo))
        for v in VIDEOS:
            new_video = CuratedYouTubeVideo(**v)
            session.add(new_video)
        await session.commit()
    print("Fixing complete.")

if __name__ == "__main__":
    asyncio.run(fix_videos())

import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import async_session_maker
from sqlalchemy.future import select
from app.models.child import ChildProfile, TherapyGoal, InterestProfile
from app.models.activity import ActivitySession

async def main():
    async with async_session_maker() as db:
        child_res = await db.execute(select(ChildProfile))
        child = child_res.scalars().first()
        
        if not child:
            print("No child profile found in DB.")
            return

        print(f"Child Name: {child.first_name}")
        print(f"Communication Level: {child.communication_level}")
        print(f"DOB: {child.date_of_birth}")
        
        goals_res = await db.execute(select(TherapyGoal).filter(TherapyGoal.child_id == child.id))
        goals = goals_res.scalars().all()
        print("\nGoals:")
        for g in goals:
            print(f"- {g.goal_text} ({g.status})")
            
        interests_res = await db.execute(select(InterestProfile).filter(InterestProfile.child_id == child.id))
        interest = interests_res.scalars().first()
        if interest:
            print(f"\nInterests: {interest.interests}")
            print(f"Rewards: {interest.reward_type}")
            
        sessions_res = await db.execute(select(ActivitySession).filter(ActivitySession.child_id == child.id).order_by(ActivitySession.created_at.desc()).limit(20))
        sessions = sessions_res.scalars().all()
        print("\nRecent Activities Done:")
        for s in sessions:
            print(f"- Activity: {s.activity_id} | Response: {s.response} | Note: {s.text_note}")

if __name__ == "__main__":
    asyncio.run(main())

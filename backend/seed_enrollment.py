import asyncio
import uuid
from sqlalchemy.future import select
from app.db.session import async_session_maker
from app.models.therapist import TherapistGroupSession, GroupSessionEnrollment

async def main():
    async with async_session_maker() as db:
        res = await db.execute(select(TherapistGroupSession).limit(1))
        session = res.scalars().first()
        if not session:
            print("No group sessions found.")
            return

        user_id = "user_3Hf4TKkdjxQN9MmD5FsMLTiRr8v"
        
        # Check if already enrolled
        res = await db.execute(select(GroupSessionEnrollment).where(
            GroupSessionEnrollment.group_session_id == session.id,
            GroupSessionEnrollment.parent_user_id == user_id
        ))
        existing = res.scalars().first()
        if existing:
            print("Already enrolled.")
            return
            
        enrollment = GroupSessionEnrollment(
            id=str(uuid.uuid4()),
            group_session_id=session.id,
            parent_user_id=user_id,
            parent_name="Parent Demo",
            parent_email="parent@demo.com",
            status="confirmed",
            expectation="Help my child",
            child_problem="Speech delay"
        )
        db.add(enrollment)
        
        session.current_participants += 1
        
        await db.commit()
        print("Successfully seeded enrollment!")

if __name__ == "__main__":
    asyncio.run(main())

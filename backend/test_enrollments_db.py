import asyncio
from sqlalchemy.future import select
from app.db.session import async_session_maker
from app.models.therapist import TherapistGroupSession, GroupSessionEnrollment

async def main():
    async with async_session_maker() as db:
        res = await db.execute(select(GroupSessionEnrollment))
        enrollments = res.scalars().all()
        print(f"Total enrollments in DB: {len(enrollments)}")
        for e in enrollments:
            print(f"Enrollment: session={e.group_session_id} parent={e.parent_user_id} name={e.parent_name}")
            
        res = await db.execute(select(TherapistGroupSession))
        sessions = res.scalars().all()
        print(f"Total sessions in DB: {len(sessions)}")

if __name__ == "__main__":
    asyncio.run(main())

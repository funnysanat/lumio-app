import asyncio
from sqlalchemy.future import select
from app.db.session import SessionLocal
from app.models.therapist import TherapistGroupSession, GroupSessionEnrollment
from sqlalchemy.orm import selectinload

async def main():
    async with SessionLocal() as db:
        result = await db.execute(
            select(TherapistGroupSession)
            .options(selectinload(TherapistGroupSession.enrollments))
            .join(GroupSessionEnrollment, TherapistGroupSession.id == GroupSessionEnrollment.group_session_id)
        )
        sessions = result.scalars().all()
        print(f"Total enrolled sessions in DB: {len(sessions)}")
        for s in sessions:
            print(f"Session {s.title} has {len(s.enrollments)} enrollments")

if __name__ == "__main__":
    asyncio.run(main())

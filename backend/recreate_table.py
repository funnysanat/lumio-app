import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.models.therapist import TherapistGroupSession, GroupSessionEnrollment
from app.db.base import Base

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async with engine.begin() as conn:
        print("Dropping table...")
        await conn.run_sync(GroupSessionEnrollment.__table__.drop, checkfirst=True)
        print("Creating table...")
        await conn.run_sync(GroupSessionEnrollment.__table__.create, checkfirst=True)
    print("Done!")

asyncio.run(main())

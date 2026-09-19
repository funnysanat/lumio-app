import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.therapist import TherapistGroupSession
from app.schemas.marketplace import GroupSessionResponse
from sqlalchemy.future import select

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(
            select(TherapistGroupSession)
            .where(TherapistGroupSession.current_participants < TherapistGroupSession.max_participants)
            .order_by(TherapistGroupSession.scheduled_date.asc())
        )
        sessions = result.scalars().all()
        print(f"DB returned {len(sessions)} sessions")
        
        for s in sessions:
            try:
                model = GroupSessionResponse.model_validate(s)
                print(f"Successfully validated {s.id}")
            except Exception as e:
                print(f"Validation failed for {s.id}: {e}")

asyncio.run(main())

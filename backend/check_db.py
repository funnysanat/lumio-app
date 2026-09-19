import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.core.config import settings
from app.models.child import ChildProfile
from app.models.user import User

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check ChildProfile
        result = await session.execute(select(ChildProfile))
        children = result.scalars().all()
        for c in children:
            print(f"Child: {c.id}, user_id: {c.user_id}, name: {c.name}")
            
        # Check User
        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.id}, email: {u.email}, role: {u.role}")

asyncio.run(main())

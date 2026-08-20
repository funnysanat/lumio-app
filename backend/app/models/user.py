from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    # Clerk user IDs are strings (e.g., 'user_2xyz...')
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

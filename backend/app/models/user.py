from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
import uuid
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    # Clerk user IDs are strings (e.g., 'user_2xyz...')
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    role = Column(String, nullable=True) # "parent" or "therapist"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

class InAppNotification(Base):
    __tablename__ = "in_app_notifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True) # Clerk user ID
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    type = Column(String, nullable=False, default="info") # "new_video", "booking_update"
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

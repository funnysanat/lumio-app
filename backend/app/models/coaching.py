from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base

class CoachingMessage(Base):
    __tablename__ = "coaching_messages"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    parent_id = Column(String, ForeignKey("user.id"), nullable=False, index=True)
    coach_id = Column(String, ForeignKey("therapist_profiles.id"), nullable=False, index=True)
    
    sender_type = Column(String, nullable=False) # 'parent' or 'coach'
    content = Column(Text, nullable=False)
    attachment_url = Column(String, nullable=True)
    
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

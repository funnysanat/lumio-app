from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base

class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    child_id = Column(String, ForeignKey("child_profiles.id"), nullable=False)
    plan_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Store the planned activities as JSON for MVP simplicity
    activities = Column(JSON, nullable=False)
    
    # Store the mode (standard or creative)
    mode = Column(String, nullable=False, server_default="creative")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

class ActivitySession(Base):
    __tablename__ = "activity_sessions"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    child_id = Column(String, ForeignKey("child_profiles.id"), nullable=False)
    activity_id = Column(String, nullable=False) # Refers to the hardcoded/generated activity ID
    goal_id = Column(String, ForeignKey("therapy_goals.id"), nullable=True)
    
    response = Column(String, nullable=False) # 'independent', 'prompted', 'refused'
    text_note = Column(String, nullable=True)
    voice_note_url = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

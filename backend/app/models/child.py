from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base

class ChildProfile(Base):
    __tablename__ = "child_profiles"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("user.id"), nullable=False, unique=True)
    first_name = Column(String, nullable=False)
    age_range = Column(String, nullable=False)
    primary_condition = Column(String, nullable=True)
    communication_level = Column(String, nullable=False)
    preferred_language = Column(String, nullable=False, default="English")
    
    goals = relationship("TherapyGoal", back_populates="child", cascade="all, delete-orphan")
    interests = relationship("InterestProfile", uselist=False, back_populates="child", cascade="all, delete-orphan")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

class TherapyGoal(Base):
    __tablename__ = "therapy_goals"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    child_id = Column(String, ForeignKey("child_profiles.id"), nullable=False)
    goal_text = Column(String, nullable=False)
    status = Column(String, default="active") # active, paused, achieved
    
    child = relationship("ChildProfile", back_populates="goals")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

class InterestProfile(Base):
    __tablename__ = "interest_profiles"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    child_id = Column(String, ForeignKey("child_profiles.id"), nullable=False, unique=True)
    interests = Column(String, nullable=False)
    reward_type = Column(String, nullable=False)
    
    child = relationship("ChildProfile", back_populates="interests")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

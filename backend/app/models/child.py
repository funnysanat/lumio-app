from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base

class DevelopmentalDomain(str, enum.Enum):
    GrossMotor = "GrossMotor"
    FineMotor = "FineMotor"
    ActivitiesOfDailyLiving = "ActivitiesOfDailyLiving"
    ReceptiveLanguage = "ReceptiveLanguage"
    ExpressiveLanguage = "ExpressiveLanguage"
    CognitiveSkills = "CognitiveSkills"
    SocialSkills = "SocialSkills"
    EmotionalSkills = "EmotionalSkills"

class ChildProfile(Base):
    __tablename__ = "child_profiles"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("user.id"), nullable=False, unique=True)
    first_name = Column(String, nullable=False)
    date_of_birth = Column(DateTime, nullable=True) # Using DateTime for simple YYYY-MM-DD
    communication_level = Column(String, nullable=False)
    preferred_language = Column(String, nullable=False, default="English")
    
    goals = relationship("TherapyGoal", back_populates="child", cascade="all, delete-orphan")
    interests = relationship("InterestProfile", uselist=False, back_populates="child", cascade="all, delete-orphan")
    snapshots = relationship("DevelopmentalSnapshot", back_populates="child", cascade="all, delete-orphan", order_by="desc(DevelopmentalSnapshot.assessment_date)")
    
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

class DevelopmentalSnapshot(Base):
    __tablename__ = "developmental_snapshots"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    child_id = Column(String, ForeignKey("child_profiles.id"), nullable=False)
    assessment_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    chronological_age_months = Column(Integer, nullable=False)
    
    # JSON mapping of DevelopmentalDomain strings to developmental age band strings (e.g. {"ExpressiveLanguage": "18-24 months"})
    domain_scores = Column(JSON, nullable=False, default=dict)
    
    # JSON listing specific next milestones (e.g. {"ExpressiveLanguage": ["Says names of toys", "Names 3 pictures"]})
    next_milestones = Column(JSON, nullable=False, default=dict)
    
    child = relationship("ChildProfile", back_populates="snapshots")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

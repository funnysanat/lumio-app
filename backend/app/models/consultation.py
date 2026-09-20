from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base

class ConsultationStatus(str, enum.Enum):
    pending = "pending"
    claimed = "claimed"
    answered = "answered"

class MicroConsultation(Base):
    __tablename__ = "micro_consultations"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    parent_id = Column(String, ForeignKey("user.id"), nullable=False)
    therapist_id = Column(String, ForeignKey("therapist_profiles.id"), nullable=True) # Nullable until claimed
    
    question_text = Column(Text, nullable=False)
    status = Column(String, default=ConsultationStatus.pending.value, nullable=False) # Store as string for simplicity
    price_inr = Column(Integer, default=199, nullable=False)
    answer_text = Column(Text, nullable=True)
    
    # Relationships
    parent = relationship("User", foreign_keys=[parent_id])
    therapist = relationship("TherapistProfile", foreign_keys=[therapist_id])
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    answered_at = Column(DateTime(timezone=True), nullable=True)

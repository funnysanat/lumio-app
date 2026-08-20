from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class OrgType(str, enum.Enum):
    therapy_center = "therapy_center"
    school = "school"
    family = "family"

class Organization(Base):
    # Clerk Organization IDs are strings (e.g., 'org_2xyz...')
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(OrgType), nullable=False, default=OrgType.family)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

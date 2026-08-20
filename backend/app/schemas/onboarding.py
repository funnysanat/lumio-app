from pydantic import BaseModel
from typing import Optional, List

class ChildProfileCreate(BaseModel):
    first_name: str
    age_range: str
    primary_condition: Optional[str] = None
    communication_level: str
    preferred_language: str

class TherapyGoalCreate(BaseModel):
    goals: List[str]

class InterestProfileCreate(BaseModel):
    interests: str
    reward_type: str

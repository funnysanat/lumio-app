from pydantic import BaseModel
from typing import Optional, List

class ChildProfileCreate(BaseModel):
    first_name: str
    date_of_birth: str # Format: YYYY-MM-DD
    communication_level: str
    preferred_language: str
    checked_milestone_ids: List[str] = []

class TherapyGoalCreate(BaseModel):
    goals: List[str]

class InterestProfileCreate(BaseModel):
    interests: str
    reward_type: str

class DevelopmentalSnapshotCreate(BaseModel):
    chronological_age_months: int
    domain_scores: dict
    next_milestones: dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.child import ChildProfile, TherapyGoal, InterestProfile
from app.schemas.onboarding import ChildProfileCreate, TherapyGoalCreate, InterestProfileCreate
from app.worker.tasks import generate_plan_task

router = APIRouter()

@router.get("/child")
async def get_child_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
        
    return {"status": "success", "child": {
        "first_name": child.first_name, 
        "age_range": child.age_range,
        "primary_condition": child.primary_condition,
        "communication_level": child.communication_level,
        "preferred_language": getattr(child, 'preferred_language', 'English')
    }}

@router.post("/child")
async def create_child_profile(
    data: ChildProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if exists
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if child:
        child.first_name = data.first_name
        child.age_range = data.age_range
        child.primary_condition = data.primary_condition
        child.communication_level = data.communication_level
        child.preferred_language = data.preferred_language
    else:
        child = ChildProfile(
            user_id=current_user.id,
            first_name=data.first_name,
            age_range=data.age_range,
            primary_condition=data.primary_condition,
            communication_level=data.communication_level,
            preferred_language=data.preferred_language
        )
        db.add(child)
        
    await db.commit()
    await db.refresh(child)
    return {"status": "success", "child_id": child.id}

@router.post("/goals")
async def save_therapy_goals(
    data: TherapyGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
        
    # Clear existing goals for simplicity in MVP
    existing = await db.execute(select(TherapyGoal).filter(TherapyGoal.child_id == child.id))
    for goal in existing.scalars().all():
        await db.delete(goal)
        
    # Add new goals
    for g in data.goals:
        if g.strip():
            db.add(TherapyGoal(child_id=child.id, goal_text=g.strip()))
            
    await db.commit()
    return {"status": "success"}

@router.post("/interests")
async def save_interests(
    data: InterestProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
        
    result = await db.execute(select(InterestProfile).filter(InterestProfile.child_id == child.id))
    interest = result.scalars().first()
    
    if interest:
        interest.interests = data.interests
        interest.reward_type = data.reward_type
    else:
        interest = InterestProfile(
            child_id=child.id,
            interests=data.interests,
            reward_type=data.reward_type
        )
        db.add(interest)
        
    await db.commit()
    
    # Trigger the AI agent to generate the first plan now that onboarding is complete
    task = generate_plan_task.delay(current_user.id)
    
    return {"status": "success", "task_id": task.id}

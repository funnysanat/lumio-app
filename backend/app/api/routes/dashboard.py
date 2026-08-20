from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.child import ChildProfile, TherapyGoal
from app.models.activity import DailyPlan, ActivitySession
from app.worker.tasks import generate_plan_task
from app.ai.agent import generate_progress_suggestion
import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import func

router = APIRouter()

@router.get("/plan")
async def get_daily_plan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found. Please complete onboarding.")
        
    # Check if there is a plan for today
    # For MVP, we'll just check if there is ANY plan, or return a hardcoded one for demonstration
    result = await db.execute(
        select(DailyPlan)
        .filter(DailyPlan.child_id == child.id)
        .order_by(DailyPlan.created_at.desc())
    )
    plan = result.scalars().first()
    
    if plan:
        return {"status": "success", "activities": plan.activities, "mode": plan.mode}
        
    # If no plan exists (e.g. still generating), return empty list
    return {"status": "success", "activities": []}

@router.post("/generate")
async def generate_new_plan(
    mode: str = "creative",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found. Please complete onboarding.")
        
    task = generate_plan_task.delay(current_user.id, mode)
    return {"status": "success", "task_id": task.id}

from celery.result import AsyncResult
from app.worker.celery_app import celery_app

@router.get("/generate/status/{task_id}")
async def get_task_status(task_id: str, current_user: User = Depends(get_current_user)):
    task = AsyncResult(task_id, app=celery_app)
    return {"status": task.state}

@router.get("/progress")
async def get_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found. Please complete onboarding.")
        
    # Get all goals for the child
    goals_result = await db.execute(select(TherapyGoal).filter(TherapyGoal.child_id == child.id))
    goals = goals_result.scalars().all()
    
    if not goals:
        return {"goals": [], "milestones": []}
        
    now = datetime.now(timezone.utc)
    one_week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)
    
    milestones = []
    
    # 1. Fetch DB data sequentially to avoid asyncpg 'another operation in progress' error
    goal_stats = []
    for goal in goals:
        this_week_result = await db.execute(
            select(func.count(ActivitySession.id))
            .filter(
                ActivitySession.goal_id == goal.id,
                ActivitySession.response == 'Independent',
                ActivitySession.created_at >= one_week_ago
            )
        )
        this_week = this_week_result.scalar() or 0
        
        last_week_result = await db.execute(
            select(func.count(ActivitySession.id))
            .filter(
                ActivitySession.goal_id == goal.id,
                ActivitySession.response == 'Independent',
                ActivitySession.created_at >= two_weeks_ago,
                ActivitySession.created_at < one_week_ago
            )
        )
        last_week = last_week_result.scalar() or 0
        
        goal_stats.append({
            "goal": goal,
            "this_week": this_week,
            "last_week": last_week
        })
    
    # 2. Generate AI suggestions concurrently (does not use DB connection)
    async def get_ai_suggestion(stat):
        suggestion = await asyncio.to_thread(
            generate_progress_suggestion, stat["goal"].title, stat["this_week"], stat["last_week"]
        )
        return {
            "id": stat["goal"].id,
            "name": stat["goal"].title,
            "this_week": stat["this_week"],
            "last_week": stat["last_week"],
            "ai_suggestion": suggestion
        }
    
    progress_goals = await asyncio.gather(*(get_ai_suggestion(stat) for stat in goal_stats))
    
    # Simple milestone logic
    for pg in progress_goals:
        if pg["this_week"] > pg["last_week"] and pg["this_week"] >= 2:
            milestones.append({
                "text": f"{child.name.capitalize()} had a breakthrough in '{pg['name']}' this week!",
                "date": now.isoformat()
            })
            
    # Default milestone if empty
    if not milestones and any(pg["this_week"] > 0 for pg in progress_goals):
        milestones.append({
            "text": f"{child.name.capitalize()} is making steady progress! Keep practicing.",
            "date": now.isoformat()
        })
    elif not milestones:
        milestones.append({
            "text": f"Ready to start? Complete an activity to track {child.name.capitalize()}'s progress!",
            "date": now.isoformat()
        })
        
    return {
        "goals": progress_goals,
        "milestones": milestones
    }

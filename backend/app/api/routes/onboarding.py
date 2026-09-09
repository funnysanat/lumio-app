from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from dateutil.relativedelta import relativedelta

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.child import ChildProfile, TherapyGoal, InterestProfile, DevelopmentalSnapshot
from app.schemas.onboarding import ChildProfileCreate, TherapyGoalCreate, InterestProfileCreate, DevelopmentalSnapshotCreate
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
        "date_of_birth": child.date_of_birth.strftime("%Y-%m-%d") if child.date_of_birth else None,
        "communication_level": child.communication_level,
        "preferred_language": getattr(child, 'preferred_language', 'English')
    }}

# Keystone Milestones Mapping for MVP
MILESTONES = {
    "m_gm_0_6": {"domain": "GrossMotor", "band": "0-6 months", "next": ["Sits with support"]},
    "m_gm_6_12": {"domain": "GrossMotor", "band": "6-12 months", "next": ["Stands holding on", "Crawls"]},
    "m_gm_12_18": {"domain": "GrossMotor", "band": "12-18 months", "next": ["Walks alone", "Climbs stairs on hands and knees"]},
    "m_gm_18_24": {"domain": "GrossMotor", "band": "18-24 months", "next": ["Runs well", "Kicks ball"]},
    
    "m_fm_0_6": {"domain": "FineMotor", "band": "0-6 months", "next": ["Reaches for objects"]},
    "m_fm_6_12": {"domain": "FineMotor", "band": "6-12 months", "next": ["Pincer grasp", "Bangs blocks together"]},
    "m_fm_12_18": {"domain": "FineMotor", "band": "12-18 months", "next": ["Scribbles spontaneously", "Builds tower of 2 blocks"]},
    "m_fm_18_24": {"domain": "FineMotor", "band": "18-24 months", "next": ["Builds tower of 4 blocks", "Turns pages"]},
    
    "m_rl_0_6": {"domain": "ReceptiveLanguage", "band": "0-6 months", "next": ["Turns to sound", "Reacts to own name"]},
    "m_rl_6_12": {"domain": "ReceptiveLanguage", "band": "6-12 months", "next": ["Understands 'no'", "Points to objects"]},
    "m_rl_12_18": {"domain": "ReceptiveLanguage", "band": "12-18 months", "next": ["Follows 1-step command", "Points to 1 body part"]},
    "m_rl_18_24": {"domain": "ReceptiveLanguage", "band": "18-24 months", "next": ["Follows 2-step command", "Points to 5 body parts"]},
    
    "m_el_0_6": {"domain": "ExpressiveLanguage", "band": "0-6 months", "next": ["Babbles", "Laughs aloud"]},
    "m_el_6_12": {"domain": "ExpressiveLanguage", "band": "6-12 months", "next": ["Says mama/dada", "Imitates sounds"]},
    "m_el_12_18": {"domain": "ExpressiveLanguage", "band": "12-18 months", "next": ["Uses 5-10 words", "Says 'no' meaningfully"]},
    "m_el_18_24": {"domain": "ExpressiveLanguage", "band": "18-24 months", "next": ["Uses 2-word phrases", "Has 50 word vocabulary"]},
    
    "m_ss_0_6": {"domain": "SocialSkills", "band": "0-6 months", "next": ["Smiles at people", "Enjoys playing peek-a-boo"]},
    "m_ss_6_12": {"domain": "SocialSkills", "band": "6-12 months", "next": ["Stranger anxiety", "Waves bye-bye"]},
    "m_ss_12_18": {"domain": "SocialSkills", "band": "12-18 months", "next": ["Brings toys to show", "Imitates housework"]},
    "m_ss_18_24": {"domain": "SocialSkills", "band": "18-24 months", "next": ["Parallel play", "Shows defiance"]},
}

@router.post("/child")
async def create_child_profile(
    data: ChildProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if exists
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    dob = None
    chronological_age_months = 0
    if data.date_of_birth:
        try:
            try:
                dob = datetime.strptime(data.date_of_birth, "%Y-%m-%d")
            except ValueError:
                dob = datetime.strptime(data.date_of_birth, "%Y-%m")
            delta = relativedelta(datetime.now(), dob)
            chronological_age_months = delta.years * 12 + delta.months
        except ValueError:
            pass

    if child:
        child.first_name = data.first_name
        child.date_of_birth = dob
        child.communication_level = data.communication_level
        child.preferred_language = data.preferred_language
    else:
        child = ChildProfile(
            user_id=current_user.id,
            first_name=data.first_name,
            date_of_birth=dob,
            communication_level=data.communication_level,
            preferred_language=data.preferred_language
        )
        db.add(child)
        await db.flush() # flush to get child.id
        
    # Calculate Developmental Snapshot
    domain_scores = {}
    next_milestones = {}
    
    for m_id in data.checked_milestone_ids:
        if m_id in MILESTONES:
            m = MILESTONES[m_id]
            domain = m["domain"]
            band = m["band"]
            next_m = m["next"]
            
            # Simple logic: last one checked overrides for now
            current_band = domain_scores.get(domain)
            # Add simple weighting to ensure highest band is chosen if out of order
            weights = {"0-6 months": 1, "6-12 months": 2, "12-18 months": 3, "18-24 months": 4}
            if not current_band or weights.get(band, 0) >= weights.get(current_band, 0):
                domain_scores[domain] = band
                next_milestones[domain] = next_m
                
    # Always save the raw checked IDs so the frontend can restore the exact state
    domain_scores["_checked_ids"] = data.checked_milestone_ids
            
    if domain_scores:
        snapshot = DevelopmentalSnapshot(
            child_id=child.id,
            chronological_age_months=chronological_age_months,
            domain_scores=domain_scores,
            next_milestones=next_milestones
        )
        db.add(snapshot)
        
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

@router.get("/goals")
async def get_therapy_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    if not child:
        return {"status": "success", "goals": []}
        
    result = await db.execute(select(TherapyGoal).filter(TherapyGoal.child_id == child.id))
    goals = [g.goal_text for g in result.scalars().all()]
    return {"status": "success", "goals": goals}


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

@router.get("/interests")
async def get_interests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    if not child:
        return {"status": "success", "interests": "", "reward_type": ""}
        
    result = await db.execute(select(InterestProfile).filter(InterestProfile.child_id == child.id))
    interest = result.scalars().first()
    if interest:
        return {"status": "success", "interests": interest.interests, "reward_type": interest.reward_type}
    return {"status": "success", "interests": "", "reward_type": ""}


@router.post("/assessment")
async def save_developmental_assessment(
    data: DevelopmentalSnapshotCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
        
    snapshot = DevelopmentalSnapshot(
        child_id=child.id,
        chronological_age_months=data.chronological_age_months,
        domain_scores=data.domain_scores,
        next_milestones=data.next_milestones
    )
    db.add(snapshot)
    await db.commit()
    
    return {"status": "success"}

@router.get("/assessment")
async def get_latest_assessment(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
        
    # Get the most recent snapshot
    result = await db.execute(
        select(DevelopmentalSnapshot)
        .filter(DevelopmentalSnapshot.child_id == child.id)
        .order_by(DevelopmentalSnapshot.assessment_date.desc())
    )
    snapshot = result.scalars().first()
    
    if not snapshot:
        return {"status": "success", "snapshot": None}
        
    return {"status": "success", "snapshot": {
        "assessment_date": snapshot.assessment_date,
        "chronological_age_months": snapshot.chronological_age_months,
        "domain_scores": snapshot.domain_scores,
        "next_milestones": snapshot.next_milestones
    }}

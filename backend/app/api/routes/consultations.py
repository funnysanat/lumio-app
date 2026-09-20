from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.therapist import TherapistProfile
from app.models.consultation import MicroConsultation, ConsultationStatus
from pydantic import BaseModel
from app.services.payment import calculate_platform_fees

router = APIRouter()

class AskQuestionRequest(BaseModel):
    question_text: str

class AnswerQuestionRequest(BaseModel):
    answer_text: str

@router.post("/ask")
async def ask_question(
    req: AskQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Parent submits a question (Simulates ₹199 + 5% payment)."""
    base_price = 199
    fees = calculate_platform_fees(base_price * 100) # calculate in paise
    
    # Store the base price in the DB, the frontend will show the breakdown
    consultation = MicroConsultation(
        parent_id=current_user.id,
        question_text=req.question_text,
        price_inr=base_price,
        status=ConsultationStatus.pending.value
    )
    db.add(consultation)
    await db.commit()
    return {"status": "success", "id": consultation.id, "charged_amount": fees["parent_total"] / 100}

@router.get("/board")
async def get_consultation_board(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Therapist fetches all pending questions on the platform."""
    # Ensure user is therapist (in a real app, check role)
    if current_user.role != "therapist":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(
        select(MicroConsultation)
        .where(MicroConsultation.status == ConsultationStatus.pending.value)
        .order_by(MicroConsultation.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{consultation_id}/claim")
async def claim_question(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Therapist claims a question from the board."""
    if current_user.role != "therapist":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Get therapist profile
    result = await db.execute(select(TherapistProfile).where(TherapistProfile.user_id == current_user.id))
    therapist = result.scalars().first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist profile not found")

    # Use with_for_update for transaction locking (prevents double claiming)
    result = await db.execute(
        select(MicroConsultation)
        .where(MicroConsultation.id == consultation_id)
        .with_for_update()
    )
    consultation = result.scalars().first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
        
    if consultation.status != ConsultationStatus.pending.value:
        raise HTTPException(status_code=400, detail="This question has already been claimed by another therapist.")
        
    consultation.status = ConsultationStatus.claimed.value
    consultation.therapist_id = therapist.id
    consultation.claimed_at = datetime.now(timezone.utc)
    
    await db.commit()
    return {"status": "success", "message": "Question claimed successfully"}

@router.post("/{consultation_id}/answer")
async def answer_question(
    consultation_id: str,
    req: AnswerQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Therapist submits an answer to their claimed question."""
    if current_user.role != "therapist":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(TherapistProfile).where(TherapistProfile.user_id == current_user.id))
    therapist = result.scalars().first()
    
    consultation_res = await db.execute(select(MicroConsultation).where(MicroConsultation.id == consultation_id))
    consultation = consultation_res.scalars().first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
        
    if consultation.therapist_id != therapist.id:
        raise HTTPException(status_code=403, detail="You did not claim this question.")
        
    consultation.status = ConsultationStatus.answered.value
    consultation.answer_text = req.answer_text
    consultation.answered_at = datetime.now(timezone.utc)
    
    await db.commit()
    return {"status": "success", "message": "Answer submitted"}

@router.get("/my")
async def get_my_consultations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get history of questions asked by the parent, or claimed by the therapist."""
    if current_user.role == "parent":
        result = await db.execute(
            select(MicroConsultation)
            .options(selectinload(MicroConsultation.therapist).selectinload(TherapistProfile.user))
            .where(MicroConsultation.parent_id == current_user.id)
            .order_by(MicroConsultation.created_at.desc())
        )
        return result.scalars().all()
    else:
        # For therapist, return claimed/answered
        result = await db.execute(select(TherapistProfile).where(TherapistProfile.user_id == current_user.id))
        therapist = result.scalars().first()
        if not therapist:
            return []
            
        result = await db.execute(
            select(MicroConsultation)
            .where(MicroConsultation.therapist_id == therapist.id)
            .order_by(MicroConsultation.created_at.desc())
        )
        return result.scalars().all()

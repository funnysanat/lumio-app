"""
Parent-side marketplace routes.
These endpoints are called by the parent app to discover and book therapists.
Auth: Clerk JWT from the PARENT Clerk application.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Optional

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.therapist import TherapistProfile, TherapistBooking, TherapistReview
from app.models.child import ChildProfile
from app.models.user import User
from app.schemas.marketplace import (
    TherapistPublicResponse,
    BookingCreateRequest,
    BookingCreateRequest,
    BookingResponse,
    PaymentVerifyRequest,
    ReviewCreateRequest,
    ReviewResponse,
    GroupSessionResponse,
    GroupSessionEnrollRequest,
    GroupSessionEnrollmentResponse,
)
from app.services.payment import create_booking_order, verify_payment_signature

router = APIRouter()


def calculate_match_score(therapist: TherapistProfile, child: Optional[ChildProfile]) -> float:
    """
    Score 0.0–1.0 of how well a therapist matches a child's profile.
    Used to rank search results.
    """
    if not child:
        # No child profile — fall back to rating as ranking signal
        return round((therapist.avg_rating or 0) / 5.0 * 0.5, 2)

    score = 0.0

    # Specialisation match (40% weight)
    # Map common condition names to specialisation tags
    condition_map = {
        "autism": ["autism", "asd"],
        "speech_delay": ["speech_delay", "speech", "language"],
        "adhd": ["adhd", "attention"],
        "cerebral_palsy": ["cerebral_palsy", "cp"],
        "down_syndrome": ["down_syndrome", "downs"],
    }
    child_condition = (getattr(child, "condition", None) or "").lower().replace(" ", "_")
    matched_tags = condition_map.get(child_condition, [child_condition])
    therapist_specs = [s.lower() for s in (therapist.specialisations or [])]
    if any(tag in therapist_specs for tag in matched_tags):
        score += 0.40

    # Age range match (20% weight) — calculate child age in months
    try:
        from datetime import datetime
        if child.date_of_birth:
            dob = child.date_of_birth
            age_months = (datetime.now() - dob).days // 30
            min_age = therapist.min_age_months or 0
            max_age = therapist.max_age_months or 240
            if min_age <= age_months <= max_age:
                score += 0.20
    except Exception:
        pass

    # Language match (20% weight)
    child_lang = (getattr(child, "preferred_language", None) or "English").lower()
    therapist_langs = [lang.lower() for lang in (therapist.languages or [])]
    if child_lang in therapist_langs or "english" in therapist_langs:
        score += 0.20

    # Rating quality (10% weight)
    score += ((therapist.avg_rating or 0) / 5.0) * 0.10

    # Experience (10% weight) - Max 10 years
    score += min(1.0, (therapist.experience_years or 0) / 10) * 0.10
    
    # Video Content Engagement (10% weight bonus)
    # Up to 0.10 extra for having uploaded videos and getting views
    total_videos = therapist.total_videos or 0
    total_views = therapist.total_video_views or 0
    
    video_score = 0.0
    if total_videos > 0:
        video_score += 0.05 # Base bump for being a creator
        # Up to 0.05 more based on views (e.g. 100 views = max)
        video_score += min(0.05, (total_views / 100.0) * 0.05)
        
    score += video_score

    return round(score, 2)


# ── Discovery ─────────────────────────────────────────────────────────────────

@router.get("/search", response_model=list[TherapistPublicResponse])
async def search_therapists(
    city: Optional[str] = Query(None),
    mode: Optional[str] = Query(None),       # "online" | "offline" | "both"
    specialisation: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search and rank therapists. Results are scored by child-profile match."""
    query = (
        select(TherapistProfile)
        .options(selectinload(TherapistProfile.availability))
        .where(TherapistProfile.is_listing_active == True)  # noqa: E712
    )

    # Apply filters
    if city:
        query = query.where(TherapistProfile.city.ilike(f"%{city}%"))
    if mode and mode != "both":
        query = query.where(
            (TherapistProfile.mode == mode) | (TherapistProfile.mode == "both")
        )
    if specialisation:
        query = query.where(TherapistProfile.specialisations.any(specialisation.lower()))
    if language:
        query = query.where(TherapistProfile.languages.any(language))

    result = await db.execute(query)
    therapists = result.scalars().all()

    # Load child profile for match scoring
    child_result = await db.execute(
        select(ChildProfile).filter(ChildProfile.user_id == current_user.id)
    )
    child = child_result.scalars().first()

    # Score and sort
    scored = []
    for t in therapists:
        score = calculate_match_score(t, child)
        t_dict = TherapistPublicResponse.model_validate(t)
        t_dict.match_score = score
        scored.append(t_dict)

    scored.sort(key=lambda x: x.match_score or 0, reverse=True)
    return scored


@router.get("/therapist/{therapist_id}", response_model=TherapistPublicResponse)
async def get_therapist_profile(
    therapist_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """View a specific therapist's public profile."""
    result = await db.execute(
        select(TherapistProfile)
        .options(selectinload(TherapistProfile.availability))
        .where(TherapistProfile.id == therapist_id, TherapistProfile.is_listing_active == True)  # noqa: E712
    )
    therapist = result.scalars().first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found.")

    child_result = await db.execute(
        select(ChildProfile).filter(ChildProfile.user_id == current_user.id)
    )
    child = child_result.scalars().first()

    response = TherapistPublicResponse.model_validate(therapist)
    response.match_score = calculate_match_score(therapist, child)
    return response


# ── Booking ───────────────────────────────────────────────────────────────────

@router.post("/book", response_model=BookingResponse, status_code=201)
async def book_session(
    payload: BookingCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parent requests a session booking with a therapist."""
    # Verify therapist exists and is active
    therapist_result = await db.execute(
        select(TherapistProfile)
        .options(selectinload(TherapistProfile.availability))
        .where(
            TherapistProfile.id == payload.therapist_id,
            TherapistProfile.is_listing_active == True,  # noqa: E712
        )
    )
    therapist = therapist_result.scalars().first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found or not accepting bookings.")

    from datetime import datetime
    try:
        book_date = datetime.strptime(payload.scheduled_date, "%Y-%m-%d")
        day_of_week = book_date.isoweekday() % 7 # Matches JS getDay() (0=Sun, 1=Mon...6=Sat)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
    # Find matching explicit availability slot
    valid_slot = None
    for slot in therapist.availability:
        if (slot.day_of_week == day_of_week and 
            slot.start_time == payload.scheduled_time and 
            slot.session_type == payload.session_type):
            valid_slot = slot
            break
            
    if not valid_slot:
        raise HTTPException(status_code=400, detail="Requested time slot is not available for this session type.")
        
    # Check for double bookings
    existing_booking = await db.execute(
        select(TherapistBooking).where(
            TherapistBooking.therapist_id == therapist.id,
            TherapistBooking.scheduled_date == payload.scheduled_date,
            TherapistBooking.scheduled_time == payload.scheduled_time,
            TherapistBooking.status.in_(["pending_payment", "pending", "confirmed"])
        )
    )
    if existing_booking.scalars().first():
        raise HTTPException(status_code=409, detail="This exact time slot has already been booked.")

    # Pick price based on session_type and mode
    session_price = None
    if payload.session_type == "caregiver_1on1":
        if not therapist.offers_caregiver_training:
            raise HTTPException(status_code=400, detail="Therapist does not offer caregiver training.")
        session_price = (
            therapist.caregiver_price_online if payload.mode == "online" else therapist.caregiver_price_offline
        )
    elif payload.session_type == "child_therapy":
        if not therapist.offers_child_therapy:
            raise HTTPException(status_code=400, detail="Therapist does not offer child therapy.")
        session_price = (
            therapist.session_price_online if payload.mode == "online" else therapist.session_price_offline
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid session type for direct booking.")

    booking = TherapistBooking(
        therapist_id=payload.therapist_id,
        parent_user_id=current_user.id,
        parent_name=payload.parent_name,
        parent_email=payload.parent_email,
        parent_phone=payload.parent_phone,
        child_name=payload.child_name,
        child_age_months=payload.child_age_months,
        child_condition=payload.child_condition,
        parent_notes=payload.parent_notes,
        scheduled_date=payload.scheduled_date,
        scheduled_time=payload.scheduled_time,
        duration_mins=therapist.session_duration_mins,
        mode=payload.mode,
        session_type=payload.session_type,
        session_price=session_price,
        status="pending_payment" if session_price and session_price > 0 else "pending",
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    if session_price and session_price > 0:
        therapist_account_id = therapist.razorpay_account_id
        if not therapist_account_id:
            # Fallback for testing/MVP if they haven't onboarded fully
            therapist_account_id = "acc_mock_therapist_123"
            
        order_data = create_booking_order(booking.id, session_price, therapist_account_id)
        if order_data:
            booking.razorpay_order_id = order_data.get("id")
            await db.commit()
            await db.refresh(booking)

    # TODO: send email notifications to both sides via Resend (Phase 2)

    return booking


@router.post("/book/{booking_id}/verify", response_model=BookingResponse)
async def verify_payment(
    booking_id: str,
    payload: PaymentVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify Razorpay payment and mark booking as pending (awaiting therapist confirmation)."""
    booking_result = await db.execute(
        select(TherapistBooking).where(
            TherapistBooking.id == booking_id,
            TherapistBooking.parent_user_id == current_user.id
        )
    )
    booking = booking_result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if not verify_payment_signature(payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature.")

    booking.status = "pending" # Now it awaits therapist confirmation
    booking.razorpay_payment_id = payload.razorpay_payment_id
    await db.commit()
    await db.refresh(booking)
    return booking


@router.get("/my-bookings", response_model=list[BookingResponse])
async def get_my_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parent views all their session bookings."""
    result = await db.execute(
        select(TherapistBooking)
        .where(TherapistBooking.parent_user_id == current_user.id)
        .order_by(TherapistBooking.created_at.desc())
    )
    return result.scalars().all()


# ── Group Sessions ────────────────────────────────────────────────────────────

@router.get("/group-sessions", response_model=list[GroupSessionResponse])
async def get_available_group_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parent browses all upcoming group sessions."""
    # MVP: Show all sessions where current_participants < max_participants
    # In reality, filter by date >= today
    from app.models.therapist import TherapistGroupSession
    
    result = await db.execute(
        select(TherapistGroupSession)
        .options(selectinload(TherapistGroupSession.enrollments))
        .where(TherapistGroupSession.current_participants < TherapistGroupSession.max_participants)
        .order_by(TherapistGroupSession.scheduled_date.asc())
    )
    return result.scalars().all()

@router.post("/group-sessions/{session_id}/enroll", status_code=201)
async def enroll_in_group_session(
    session_id: str,
    payload: GroupSessionEnrollRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parent enrolls in a group session/workshop."""
    from app.models.therapist import TherapistGroupSession, GroupSessionEnrollment
    
    result = await db.execute(
        select(TherapistGroupSession).where(TherapistGroupSession.id == session_id)
    )
    g_session = result.scalars().first()
    if not g_session:
        raise HTTPException(status_code=404, detail="Group session not found.")
        
    if g_session.current_participants >= g_session.max_participants:
        raise HTTPException(status_code=400, detail="Group session is full.")
        
    # Check if already enrolled
    existing = await db.execute(
        select(GroupSessionEnrollment).where(
            GroupSessionEnrollment.group_session_id == session_id,
            GroupSessionEnrollment.parent_user_id == current_user.id
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Already enrolled in this session.")

    enrollment = GroupSessionEnrollment(
        group_session_id=session_id,
        parent_user_id=current_user.id,
        parent_name=payload.parent_name,
        parent_email=payload.parent_email,
        expectation=payload.expectation,
        child_problem=payload.child_problem,
        expected_resolution=payload.expected_resolution,
        questions_for_therapist=payload.questions_for_therapist,
        status="pending_payment" if g_session.price > 0 else "confirmed"
    )
    
    db.add(enrollment)
    
    if g_session.price == 0:
        g_session.current_participants += 1
        
    await db.commit()
    await db.refresh(enrollment)
    
    response = {"enrollment_id": enrollment.id, "status": enrollment.status}
    
    if g_session.price > 0:
        # Create Razorpay order
        order_data = create_booking_order(enrollment.id, g_session.price, "acc_mock_therapist_123")
        if order_data:
            enrollment.razorpay_order_id = order_data.get("id")
            await db.commit()
            response["razorpay_order_id"] = order_data.get("id")
            
    return response

@router.get("/group-sessions/my-enrollments", response_model=list[GroupSessionResponse])
async def get_my_enrolled_group_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parent views all group sessions they are enrolled in."""
    from app.models.therapist import TherapistGroupSession, GroupSessionEnrollment
    
    result = await db.execute(
        select(TherapistGroupSession)
        .options(selectinload(TherapistGroupSession.enrollments))
        .join(GroupSessionEnrollment, TherapistGroupSession.id == GroupSessionEnrollment.group_session_id)
        .where(GroupSessionEnrollment.parent_user_id == current_user.id)
        .order_by(TherapistGroupSession.scheduled_date.asc())
    )
    return result.scalars().all()


# ── Reviews ───────────────────────────────────────────────────────────────────

@router.post("/review", response_model=ReviewResponse, status_code=201)
async def submit_review(
    payload: ReviewCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parent submits a review after a completed session."""
    # Verify the booking belongs to this parent and is completed
    booking_result = await db.execute(
        select(TherapistBooking).where(
            TherapistBooking.id == payload.booking_id,
            TherapistBooking.parent_user_id == current_user.id,
        )
    )
    booking = booking_result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="You can only review completed sessions.")

    # Check no existing review
    existing_result = await db.execute(
        select(TherapistReview).where(TherapistReview.booking_id == payload.booking_id)
    )
    if existing_result.scalars().first():
        raise HTTPException(status_code=409, detail="You have already reviewed this session.")

    review = TherapistReview(
        booking_id=payload.booking_id,
        therapist_id=booking.therapist_id,
        parent_user_id=current_user.id,
        rating=payload.rating,
        review_text=payload.review_text,
    )
    db.add(review)

    # Update therapist's denormalised rating
    therapist_result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.id == booking.therapist_id)
    )
    therapist = therapist_result.scalars().first()
    if therapist:
        total = therapist.total_reviews or 0
        current_avg = therapist.avg_rating or 0.0
        new_avg = ((current_avg * total) + payload.rating) / (total + 1)
        therapist.avg_rating = round(new_avg, 2)
        therapist.total_reviews = total + 1

    await db.commit()
    await db.refresh(review)
    return review

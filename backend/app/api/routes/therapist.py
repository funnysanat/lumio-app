"""
Therapist-side routes.
These endpoints are called by the therapist portal (/therapist/*).
Auth: Clerk JWT from the THERAPIST Clerk application (separate from parent app).
The user_id in these routes is the therapist's Clerk sub — stored in therapist_profiles.user_id.
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.config import settings

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.therapist import TherapistProfile, TherapistAvailability, TherapistBooking
from app.models.user import User
from app.services.video import create_video_room
from app.schemas.marketplace import (
    TherapistOnboardRequest,
    TherapistUpdateRequest,
    TherapistProfileResponse,
    AvailabilitySetRequest,
    AvailabilitySlotResponse,
    BookingResponse,
    BookingStatusUpdateRequest,
    GroupSessionCreateRequest,
    GroupSessionResponse,
)
from app.models.therapist import TherapistVideo, TherapistGroupSession
from app.worker.tasks import verify_video_content

router = APIRouter()


def _get_therapist_dep(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Shared dependency placeholder — returns (db, user)."""
    return db, current_user


# ── Onboarding ────────────────────────────────────────────────────────────────

@router.post("/onboard", response_model=TherapistProfileResponse, status_code=status.HTTP_201_CREATED)
async def onboard_therapist(
    payload: TherapistOnboardRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new therapist profile (first-time setup)."""
    # Check no duplicate
    existing = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Therapist profile already exists.")

    profile = TherapistProfile(
        user_id=current_user.id,
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        bio=payload.bio,
        specialisations=payload.specialisations,
        qualifications=[q.model_dump() for q in payload.qualifications],
        certifications=[c.model_dump() for c in payload.certifications],
        experience_years=payload.experience_years,
        languages=payload.languages,
        min_age_months=payload.min_age_months,
        max_age_months=payload.max_age_months,
        mode=payload.mode,
        session_duration_mins=payload.session_duration_mins,
        session_price_online=payload.session_price_online,
        session_price_offline=payload.session_price_offline,
        
        offers_child_therapy=payload.offers_child_therapy if payload.offers_child_therapy is not None else True,
        offers_caregiver_training=payload.offers_caregiver_training or False,
        offers_group_training=payload.offers_group_training or False,
        caregiver_price_online=payload.caregiver_price_online,
        caregiver_price_offline=payload.caregiver_price_offline,
        group_price_online=payload.group_price_online,
        group_price_offline=payload.group_price_offline,
        
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        address=payload.address,
        is_listing_active=True,   # Active by default; admin can deactivate
    )
    db.add(profile)
    current_user.role = "therapist"
    db.add(current_user)
    await db.commit()
    await db.refresh(profile)

    result = await db.execute(
        select(TherapistProfile)
        .options(selectinload(TherapistProfile.availability))
        .where(TherapistProfile.id == profile.id)
    )
    return result.scalars().first()


@router.get("/me", response_model=TherapistProfileResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current therapist's full profile."""
    result = await db.execute(
        select(TherapistProfile)
        .options(selectinload(TherapistProfile.availability))
        .where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found.")
    return profile


@router.patch("/me", response_model=TherapistProfileResponse)
async def update_my_profile(
    payload: TherapistUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update therapist profile fields."""
    result = await db.execute(
        select(TherapistProfile)
        .options(selectinload(TherapistProfile.availability))
        .where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ("qualifications", "certifications") and value is not None:
            value = [item.model_dump() if hasattr(item, "model_dump") else item for item in value]
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


# ── Availability ──────────────────────────────────────────────────────────────

@router.post("/availability", response_model=list[AvailabilitySlotResponse])
async def set_availability(
    payload: AvailabilitySetRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Replace all availability slots for this therapist."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found.")

    # Delete existing slots
    existing = await db.execute(
        select(TherapistAvailability).where(TherapistAvailability.therapist_id == profile.id)
    )
    for slot in existing.scalars().all():
        await db.delete(slot)

    # Insert new slots
    new_slots = []
    for s in payload.slots:
        slot = TherapistAvailability(
            therapist_id=profile.id,
            day_of_week=s.day_of_week,
            start_time=s.start_time,
            end_time=s.end_time,
            session_type=s.session_type,
        )
        db.add(slot)
        new_slots.append(slot)

    await db.commit()
    for s in new_slots:
        await db.refresh(s)
    return new_slots


# ── Bookings ──────────────────────────────────────────────────────────────────

@router.get("/bookings", response_model=list[BookingResponse])
async def get_my_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all bookings for this therapist, newest first."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found.")

    bookings_result = await db.execute(
        select(TherapistBooking)
        .where(TherapistBooking.therapist_id == profile.id)
        .order_by(TherapistBooking.created_at.desc())
    )
    bookings = bookings_result.scalars().all()
    for b in bookings:
        if b.status not in ("confirmed", "completed"):
            b.parent_email = "Hidden until confirmed"
            if getattr(b, 'parent_phone', None):
                b.parent_phone = "Hidden until confirmed"
    
    return bookings

@router.patch("/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking_status(
    booking_id: str,
    payload: BookingStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Therapist confirms or cancels a booking."""
    if payload.status not in ("confirmed", "cancelled"):
        raise HTTPException(status_code=400, detail="Status must be 'confirmed' or 'cancelled'.")

    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found.")

    booking_result = await db.execute(
        select(TherapistBooking).where(
            TherapistBooking.id == booking_id,
            TherapistBooking.therapist_id == profile.id,
        )
    )
    booking = booking_result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    booking.status = payload.status
    if payload.therapist_notes:
        booking.therapist_notes = payload.therapist_notes

    # Create video room if this is an online session being confirmed
    if booking.status == "confirmed" and booking.mode == "online" and not booking.video_room_url:
        room_data = await create_video_room(booking.id)
        if room_data:
            booking.video_room_id = room_data.get("name")
            booking.video_room_url = room_data.get("url")

    await db.commit()
    await db.refresh(booking)
    return booking

@router.post("/bookings/{booking_id}/summary", response_model=BookingResponse)
async def submit_session_summary(
    booking_id: str,
    notes: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Therapist submits post-session text notes."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found.")

    booking_result = await db.execute(
        select(TherapistBooking).where(
            TherapistBooking.id == booking_id,
            TherapistBooking.therapist_id == profile.id,
        )
    )
    booking = booking_result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if notes:
        # Append or replace notes
        if booking.therapist_notes:
            booking.therapist_notes += f"\n\nPost-Session: {notes}"
        else:
            booking.therapist_notes = notes

    # Ensure it's marked as completed
    booking.status = "completed"

    await db.commit()
    await db.refresh(booking)
    return booking

# ── Group Sessions ────────────────────────────────────────────────────────────

@router.get("/group-sessions", response_model=list[GroupSessionResponse])
async def get_my_group_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all group sessions scheduled by this therapist."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found.")

    sessions = await db.execute(
        select(TherapistGroupSession)
        .options(selectinload(TherapistGroupSession.enrollments))
        .where(TherapistGroupSession.therapist_id == profile.id)
        .order_by(TherapistGroupSession.scheduled_date.asc())
    )
    sessions_list = sessions.scalars().all()
    for session_obj in sessions_list:
        for e in session_obj.enrollments:
            if e.status not in ("confirmed", "completed"):
                e.parent_email = "Hidden until confirmed"
                
    return sessions_list

@router.post("/group-sessions", response_model=GroupSessionResponse, status_code=201)
async def create_group_session(
    payload: GroupSessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Therapist creates a new group session/workshop."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found.")

    session = TherapistGroupSession(
        therapist_id=profile.id,
        title=payload.title,
        description=payload.description,
        scheduled_date=payload.scheduled_date,
        scheduled_time=payload.scheduled_time,
        duration_mins=payload.duration_mins,
        mode=payload.mode,
        price=payload.price,
        max_participants=payload.max_participants,
    )
    
    # Pre-create video room if online
    if payload.mode == "online":
        room_data = await create_video_room(session.id)
        if room_data:
            session.video_room_id = room_data.get("name")
            session.video_room_url = room_data.get("url")

    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    # Trigger background notification to all parents
    from app.worker.tasks import notify_parents_of_new_workshop
    notify_parents_of_new_workshop.delay(session.id)
    
    return session

# ── Videos (Content Hub) ──────────────────────────────────────────────────────

@router.get("/videos")
async def get_my_videos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all videos uploaded by this therapist."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found.")

    videos_result = await db.execute(
        select(TherapistVideo)
        .where(TherapistVideo.therapist_id == profile.id)
        .order_by(TherapistVideo.created_at.desc())
    )
    return videos_result.scalars().all()

@router.post("/videos")
async def upload_video(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: str = Form("General Education"),
    video: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a new video to the content hub."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found.")

    from app.services.gcp_storage import upload_file_to_gcp
    file_bytes = await video.read()
    video_url = await upload_file_to_gcp(
        file_bytes, 
        f"content_hub/{profile.id}_{video.filename}",
        content_type=video.content_type
    )

    if not video_url:
        raise HTTPException(status_code=500, detail="Failed to upload video to GCP.")

    new_video = TherapistVideo(
        therapist_id=profile.id,
        title=title,
        description=description,
        category=category,
        video_url=video_url,
        is_verified=False
    )
    db.add(new_video)
    await db.commit()
    await db.refresh(new_video)

    # Trigger background AI verification (OpenCV / PyTorch)
    verify_video_content.delay(new_video.id)

    return new_video



from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Boolean, Text, Date, Time
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ARRAY, JSON
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class TherapistProfile(Base):
    __tablename__ = "therapist_profiles"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    # Clerk user ID from the separate therapist Clerk application
    user_id = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)

    # Identity
    full_name = Column(String, nullable=False)
    bio = Column(Text, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    # Professional details
    specialisations = Column(ARRAY(String), nullable=False, default=list)
    # e.g. ["autism", "speech_delay", "adhd", "cerebral_palsy", "down_syndrome"]
    qualifications = Column(JSON, nullable=False, default=list)
    # e.g. [{"degree": "M.Sc SLP", "institution": "AIIMS", "year": 2018}]
    certifications = Column(JSON, nullable=False, default=list)
    # e.g. [{"name": "RCI Licence", "number": "RCI-12345", "valid_until": "2026-12-31"}]
    experience_years = Column(Integer, nullable=False, default=0)
    languages = Column(ARRAY(String), nullable=False, default=list)
    # Age groups this therapist works with (in months)
    min_age_months = Column(Integer, nullable=True)
    max_age_months = Column(Integer, nullable=True)

    # Session type offerings
    offers_child_therapy = Column(Boolean, default=True)
    offers_caregiver_training = Column(Boolean, default=False)
    offers_group_training = Column(Boolean, default=False)

    mode = Column(String, nullable=False, default="both")  # "online" | "offline" | "both"
    session_duration_mins = Column(Integer, nullable=False, default=60)
    session_price_online = Column(Integer, nullable=True)   # in paise (Child Therapy base)
    session_price_offline = Column(Integer, nullable=True)  # in paise (Child Therapy base)
    
    # Specific pricing for new session types (in paise)
    caregiver_price_online = Column(Integer, nullable=True)
    caregiver_price_offline = Column(Integer, nullable=True)
    group_price_online = Column(Integer, nullable=True)
    group_price_offline = Column(Integer, nullable=True)

    # Location (for offline/near-me discovery)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    address = Column(Text, nullable=True)

    # Platform status
    is_verified = Column(Boolean, default=False)
    is_listing_active = Column(Boolean, default=False)
    listing_tier = Column(String, default="basic")          # "basic" | "growth" | "pro"
    listing_active_until = Column(Date, nullable=True)

    # Analytics (denormalised for query speed)
    avg_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)
    total_videos = Column(Integer, default=0)
    total_video_views = Column(Integer, default=0)
    razorpay_account_id = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    availability = relationship("TherapistAvailability", back_populates="therapist", cascade="all, delete-orphan")
    bookings = relationship("TherapistBooking", back_populates="therapist")
    videos = relationship("TherapistVideo", back_populates="therapist", cascade="all, delete-orphan")


class TherapistAvailability(Base):
    __tablename__ = "therapist_availability"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    therapist_id = Column(String, ForeignKey("therapist_profiles.id"), nullable=False)

    # 0=Monday, 1=Tuesday, ..., 6=Sunday
    day_of_week = Column(Integer, nullable=False)
    # Stored as "HH:MM" strings for simplicity (avoid timezone complexity)
    start_time = Column(String, nullable=False)  # e.g. "09:00"
    end_time = Column(String, nullable=False)     # e.g. "17:00"
    
    session_type = Column(String, nullable=False, default="child_therapy") # "child_therapy" | "caregiver_1on1" | "caregiver_group"

    therapist = relationship("TherapistProfile", back_populates="availability")


class TherapistBooking(Base):
    __tablename__ = "therapist_bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    therapist_id = Column(String, ForeignKey("therapist_profiles.id"), nullable=False)

    # Parent side — Clerk user ID from the parent app
    parent_user_id = Column(String, nullable=False, index=True)
    parent_name = Column(String, nullable=False)
    parent_email = Column(String, nullable=False)
    parent_phone = Column(String, nullable=True)

    # Who is the session for
    child_name = Column(String, nullable=True)
    child_age_months = Column(Integer, nullable=True)
    child_condition = Column(String, nullable=True)   # e.g. "autism"
    parent_notes = Column(Text, nullable=True)         # what parent wants to discuss

    # Session details
    session_type = Column(String, nullable=False, default="child_therapy") # "child_therapy" | "caregiver_1on1" | "caregiver_group"
    scheduled_date = Column(String, nullable=False)   # "YYYY-MM-DD"
    scheduled_time = Column(String, nullable=False)   # "HH:MM"
    duration_mins = Column(Integer, nullable=False)
    mode = Column(String, nullable=False)              # "online" | "offline"
    session_price = Column(Integer, nullable=True)     # in paise (set at booking time)

    # Status flow: pending → confirmed → completed | cancelled | no_show
    status = Column(String, nullable=False, default="pending")
    therapist_notes = Column(Text, nullable=True)      # therapist can add notes on confirm/reject

    # Future: payment & video
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    video_room_id = Column(String, nullable=True)
    video_room_url = Column(String, nullable=True)
    recording_url = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    therapist_audio_url = Column(String, nullable=True)
    therapist_audio_transcript = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    therapist = relationship("TherapistProfile", back_populates="bookings")
    review = relationship("TherapistReview", back_populates="booking", uselist=False)


class TherapistReview(Base):
    __tablename__ = "therapist_reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String, ForeignKey("therapist_bookings.id"), unique=True, nullable=False)
    therapist_id = Column(String, ForeignKey("therapist_profiles.id"), nullable=False)
    parent_user_id = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)    # 1–5
    review_text = Column(Text, nullable=True)
    is_published = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    booking = relationship("TherapistBooking", back_populates="review")


class TherapistVideo(Base):
    __tablename__ = "therapist_videos"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    therapist_id = Column(String, ForeignKey("therapist_profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False, default="General Education")
    video_url = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    views_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    therapist = relationship("TherapistProfile", back_populates="videos")
    comments = relationship("VideoComment", back_populates="video", cascade="all, delete-orphan")


class VideoComment(Base):
    __tablename__ = "video_comments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id = Column(String, ForeignKey("therapist_videos.id"), nullable=False)
    parent_user_id = Column(String, nullable=False) # not strict foreign key to user table for decoupled auth, but references Clerk ID
    text = Column(Text, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    video = relationship("TherapistVideo", back_populates="comments")


class TherapistGroupSession(Base):
    __tablename__ = "therapist_group_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    therapist_id = Column(String, ForeignKey("therapist_profiles.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    scheduled_date = Column(String, nullable=False)   # "YYYY-MM-DD"
    scheduled_time = Column(String, nullable=False)   # "HH:MM"
    duration_mins = Column(Integer, nullable=False, default=60)
    mode = Column(String, nullable=False)             # "online" | "offline"
    price = Column(Integer, nullable=False)           # in paise
    
    max_participants = Column(Integer, nullable=False, default=10)
    current_participants = Column(Integer, nullable=False, default=0)
    
    video_room_id = Column(String, nullable=True)
    video_room_url = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    therapist = relationship("TherapistProfile")
    enrollments = relationship("GroupSessionEnrollment", back_populates="group_session", cascade="all, delete-orphan")


class GroupSessionEnrollment(Base):
    __tablename__ = "group_session_enrollments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    group_session_id = Column(String, ForeignKey("therapist_group_sessions.id"), nullable=False)
    
    parent_user_id = Column(String, nullable=False, index=True)
    parent_name = Column(String, nullable=False)
    parent_email = Column(String, nullable=False)
    
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending_payment") # pending_payment -> confirmed
    
    expectation = Column(Text, nullable=True)
    child_problem = Column(Text, nullable=True)
    expected_resolution = Column(Text, nullable=True)
    questions_for_therapist = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    group_session = relationship("TherapistGroupSession", back_populates="enrollments")

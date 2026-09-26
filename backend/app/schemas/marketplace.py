from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ── Therapist onboarding / profile ───────────────────────────────────────────

class QualificationItem(BaseModel):
    degree: str
    institution: str
    year: Optional[int] = None


class CertificationItem(BaseModel):
    name: str
    number: Optional[str] = None
    valid_until: Optional[str] = None  # "YYYY-MM-DD"


class TherapistOnboardRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    bio: Optional[str] = None
    specialisations: List[str] = Field(default_factory=list)
    # e.g. ["autism", "speech_delay", "adhd", "cerebral_palsy"]
    qualifications: List[QualificationItem] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)
    experience_years: int = 0
    languages: List[str] = Field(default_factory=list)
    min_age_months: Optional[int] = None
    max_age_months: Optional[int] = None
    mode: str = "both"  # "online" | "offline" | "both"
    session_duration_mins: int = 60
    session_price_online: Optional[int] = None    # in paise (e.g. 150000 = ₹1500)
    session_price_offline: Optional[int] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    address: Optional[str] = None
    razorpay_account_id: Optional[str] = None


class TherapistUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    profile_photo_url: Optional[str] = None
    specialisations: Optional[List[str]] = None
    qualifications: Optional[List[QualificationItem]] = None
    certifications: Optional[List[CertificationItem]] = None
    experience_years: Optional[int] = None
    languages: Optional[List[str]] = None
    min_age_months: Optional[int] = None
    max_age_months: Optional[int] = None
    mode: Optional[str] = None
    session_duration_mins: Optional[int] = None
    session_price_online: Optional[int] = None
    session_price_offline: Optional[int] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    address: Optional[str] = None
    offers_child_therapy: Optional[bool] = None
    offers_caregiver_training: Optional[bool] = None
    offers_group_training: Optional[bool] = None
    caregiver_price_online: Optional[int] = None
    caregiver_price_offline: Optional[int] = None
    group_price_online: Optional[int] = None
    group_price_offline: Optional[int] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    address: Optional[str] = None


class AvailabilitySlot(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Mon, 6=Sun
    start_time: str  # "HH:MM"
    end_time: str    # "HH:MM"
    session_type: str = "child_therapy"


class AvailabilitySetRequest(BaseModel):
    slots: List[AvailabilitySlot]


class AvailabilitySlotResponse(BaseModel):
    id: str
    day_of_week: int
    start_time: str
    end_time: str
    session_type: str

    class Config:
        from_attributes = True


class TherapistProfileResponse(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: str
    bio: Optional[str]
    profile_photo_url: Optional[str]
    phone: Optional[str]
    specialisations: List[str]
    qualifications: list
    certifications: list
    experience_years: int
    languages: List[str]
    min_age_months: Optional[int]
    max_age_months: Optional[int]
    mode: str
    session_duration_mins: int
    session_price_online: Optional[int]
    session_price_offline: Optional[int]
    offers_child_therapy: Optional[bool] = None
    offers_caregiver_training: Optional[bool] = None
    offers_group_training: Optional[bool] = None
    caregiver_price_online: Optional[int] = None
    caregiver_price_offline: Optional[int] = None
    group_price_online: Optional[int] = None
    group_price_offline: Optional[int] = None
    city: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    address: Optional[str]
    is_verified: bool
    is_listing_active: bool
    listing_tier: str
    avg_rating: float
    total_reviews: int
    total_sessions: int
    availability: List[AvailabilitySlotResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


# Public version — visible to parents (hides internal fields)
class TherapistPublicResponse(BaseModel):
    id: str
    full_name: str
    bio: Optional[str]
    profile_photo_url: Optional[str]
    specialisations: List[str]
    qualifications: list
    experience_years: int
    languages: List[str]
    min_age_months: Optional[int]
    max_age_months: Optional[int]
    mode: str
    session_duration_mins: int
    session_price_online: Optional[int]
    session_price_offline: Optional[int]
    offers_child_therapy: Optional[bool] = None
    offers_caregiver_training: Optional[bool] = None
    offers_group_training: Optional[bool] = None
    caregiver_price_online: Optional[int] = None
    caregiver_price_offline: Optional[int] = None
    group_price_online: Optional[int] = None
    group_price_offline: Optional[int] = None
    city: Optional[str]
    state: Optional[str]
    address: Optional[str] = None
    is_verified: bool
    avg_rating: float
    total_reviews: int
    total_sessions: int
    total_videos: Optional[int] = 0
    total_video_views: Optional[int] = 0
    availability: List[AvailabilitySlotResponse] = []
    match_score: Optional[float] = None   # computed per search query
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True


# ── Booking ───────────────────────────────────────────────────────────────────

class BookingCreateRequest(BaseModel):
    therapist_id: str
    session_type: str = "child_therapy"
    parent_name: str
    parent_email: EmailStr
    parent_phone: Optional[str] = None
    child_name: Optional[str] = None
    child_age_months: Optional[int] = None
    child_condition: Optional[str] = None
    parent_notes: Optional[str] = None
    scheduled_date: str   # "YYYY-MM-DD"
    scheduled_time: str   # "HH:MM"
    mode: str             # "online" | "offline"


class PaymentVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


class BookingStatusUpdateRequest(BaseModel):
    status: str           # "confirmed" | "cancelled"
    therapist_notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: str
    therapist_id: str
    parent_user_id: str
    parent_name: str
    parent_email: str
    parent_phone: Optional[str]
    child_name: Optional[str]
    child_age_months: Optional[int]
    child_condition: Optional[str]
    parent_notes: Optional[str]
    scheduled_date: str
    scheduled_time: str
    duration_mins: int
    mode: str
    session_type: str
    session_price: Optional[int]
    status: str
    therapist_notes: Optional[str]
    video_room_url: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Review ────────────────────────────────────────────────────────────────────

class ReviewCreateRequest(BaseModel):
    booking_id: str
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    booking_id: str
    therapist_id: str
    rating: int
    review_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Group Sessions ─────────────────────────────────────────────────────────────

class GroupSessionCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_date: str
    scheduled_time: str
    duration_mins: int = 60
    mode: str
    price: int
    max_participants: int = 10


class GroupSessionResponse(BaseModel):
    id: str
    therapist_id: str
    title: str
    description: Optional[str]
    scheduled_date: str
    scheduled_time: str
    duration_mins: int
    mode: str
    price: int
    max_participants: int
    current_participants: int
    video_room_url: Optional[str]
    created_at: datetime
    enrollments: List['GroupSessionEnrollmentResponse'] = []

    class Config:
        from_attributes = True


class GroupSessionEnrollRequest(BaseModel):
    parent_name: str
    parent_email: EmailStr
    expectation: Optional[str] = None
    child_problem: Optional[str] = None
    expected_resolution: Optional[str] = None
    questions_for_therapist: Optional[str] = None

class GroupSessionEnrollmentResponse(BaseModel):
    id: str
    group_session_id: str
    parent_user_id: str
    parent_name: str
    parent_email: str
    status: str
    expectation: Optional[str] = None
    child_problem: Optional[str] = None
    expected_resolution: Optional[str] = None
    questions_for_therapist: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class UserRoleResponse(BaseModel):
    role: Optional[str] = None

@router.get("/me/role", response_model=UserRoleResponse)
async def get_user_role(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the strict role of the current user for frontend routing guards."""
    return {"role": current_user.role}

@router.get("/debug-env")
async def debug_env():
    from app.core.config import settings
    return {"CLERK_SECRET_KEY": settings.CLERK_SECRET_KEY}

class UserProfileResponse(BaseModel):
    id: str
    email: str
    role: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None

@router.get("/me", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get the full profile of the current user."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "city": current_user.city,
        "address": current_user.address,
        "pincode": current_user.pincode
    }

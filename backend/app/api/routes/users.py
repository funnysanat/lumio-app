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

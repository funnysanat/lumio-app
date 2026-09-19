from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, InAppNotification

router = APIRouter()

@router.get("/")
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all notifications for the current user."""
    result = await db.execute(
        select(InAppNotification)
        .filter(InAppNotification.user_id == current_user.id)
        .order_by(InAppNotification.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read."""
    result = await db.execute(
        select(InAppNotification).filter(
            InAppNotification.id == notification_id,
            InAppNotification.user_id == current_user.id
        )
    )
    notif = result.scalars().first()
    if notif:
        notif.is_read = True
        await db.commit()
    return {"status": "success"}

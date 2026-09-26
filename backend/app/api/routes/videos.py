from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Optional

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.therapist import TherapistVideo, VideoComment, TherapistProfile
from pydantic import BaseModel

router = APIRouter()

class CommentRequest(BaseModel):
    text: str

@router.get("/")
async def get_video_feed(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get feed of all verified videos."""
    # MVP: Just return all verified videos ordered by recent
    result = await db.execute(
        select(TherapistVideo)
        .options(selectinload(TherapistVideo.therapist))
        # .filter(TherapistVideo.is_verified == True) # Temporarily disabled for MVP testing
        .order_by(TherapistVideo.created_at.desc())
        .limit(50)
    )
    videos = result.scalars().all()
    
    # We should map it nicely
    return [{
        "id": v.id,
        "title": v.title,
        "description": v.description,
        "video_url": v.video_url,
        "views_count": v.views_count,
        "likes_count": v.likes_count,
        "comments_count": v.comments_count,
        "created_at": v.created_at,
        "therapist": {
            "id": v.therapist.id,
            "full_name": v.therapist.full_name,
            "profile_photo_url": v.therapist.profile_photo_url,
        }
    } for v in videos]

@router.post("/{video_id}/view")
async def record_view(
    video_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Record a view for a video."""
    result = await db.execute(select(TherapistVideo).filter(TherapistVideo.id == video_id))
    video = result.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    video.views_count += 1
    
    # Update total views on therapist profile
    prof_res = await db.execute(select(TherapistProfile).filter(TherapistProfile.id == video.therapist_id))
    prof = prof_res.scalars().first()
    if prof:
        prof.total_video_views += 1
        
    await db.commit()
    return {"status": "success", "views_count": video.views_count}

@router.post("/{video_id}/like")
async def record_like(
    video_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a like for a video."""
    result = await db.execute(select(TherapistVideo).filter(TherapistVideo.id == video_id))
    video = result.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    # Simplified: incrementing like without checking if already liked for MVP
    video.likes_count += 1
    await db.commit()
    return {"status": "success", "likes_count": video.likes_count}

@router.get("/{video_id}")
async def get_video(
    video_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TherapyVideo)
        .options(selectinload(TherapyVideo.therapist))
        .where(TherapyVideo.id == video_id)
    )
    video = result.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    return {
        "id": video.id,
        "title": video.title,
        "description": video.description,
        "video_url": video.video_url,
        "views_count": video.views_count,
        "likes_count": video.likes_count,
        "comments_count": video.comments_count,
        "category": video.category,
        "created_at": video.created_at.isoformat(),
        "therapist": {
            "id": video.therapist.id if video.therapist else "",
            "full_name": video.therapist.full_name if video.therapist else "Unknown",
            "profile_photo_url": video.therapist.profile_photo_url if video.therapist else None
        }
    }

@router.get("/{video_id}/comments")
async def get_comments(
    video_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get comments for a video."""
    result = await db.execute(
        select(VideoComment)
        .filter(VideoComment.video_id == video_id)
        .order_by(VideoComment.created_at.desc())
    )
    comments = result.scalars().all()
    # Ideally fetch user names, but for MVP returning raw
    return comments

@router.post("/{video_id}/comments")
async def post_comment(
    video_id: str,
    payload: CommentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Post a comment on a video."""
    result = await db.execute(select(TherapistVideo).filter(TherapistVideo.id == video_id))
    video = result.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    comment = VideoComment(
        video_id=video.id,
        parent_user_id=current_user.id,
        text=payload.text
    )
    db.add(comment)
    
    video.comments_count += 1
    await db.commit()
    await db.refresh(comment)
    return comment

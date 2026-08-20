from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.child import ChildProfile
from app.models.activity import ActivitySession
from app.services.storage import storage_service

router = APIRouter()

@router.post("/log")
async def log_session(
    activity_id: str = Form(...),
    response: str = Form(...),
    text_note: str = Form(None),
    audio_file: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
        
    voice_note_url = None
    if audio_file:
        content = await audio_file.read()
        file_name = f"users/{current_user.id}/audio_{uuid.uuid4().hex[:8]}.webm"
        voice_note_url = storage_service.upload_file(file_name, content, audio_file.content_type)
        
    session_log = ActivitySession(
        child_id=child.id,
        activity_id=activity_id,
        response=response,
        text_note=text_note,
        voice_note_url=voice_note_url
    )
    
    db.add(session_log)
    await db.commit()
    
    return {"status": "success", "voice_note_url": voice_note_url}

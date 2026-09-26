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
    skill_area: str = Form(None),
    independence_score: int = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == current_user.id))
    child = result.scalars().first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
        
    ai_summary = None
    voice_note_url = None
        
    session_log = ActivitySession(
        child_id=child.id,
        activity_id=activity_id,
        response=response,
        skill_area=skill_area,
        independence_score=independence_score,
        text_note=text_note,
        voice_note_url=voice_note_url,
        ai_summary=ai_summary
    )
    
    db.add(session_log)
    await db.commit()
    
    return {"status": "success", "voice_note_url": voice_note_url}

@router.post("/upload-chat-file")
async def upload_chat_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Uploads a file shared in a live session chat to GCP."""
    from app.services.gcp_storage import upload_file_to_gcp
    
    file_bytes = await file.read()
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    safe_name = f"chat_files/{current_user.id}_{uuid.uuid4().hex[:8]}.{file_ext}"
    
    try:
        url = await upload_file_to_gcp(file_bytes, safe_name, content_type=file.content_type)
        if not url:
            raise HTTPException(status_code=500, detail="Failed to upload file")
        return {"url": url, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

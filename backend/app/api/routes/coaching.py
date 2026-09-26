from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.coaching import CoachingMessage
from app.models.user import User
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/coaching", tags=["coaching"])

class MessageCreate(BaseModel):
    content: str
    attachment_url: Optional[str] = None

class MessageOut(BaseModel):
    id: str
    sender_type: str
    content: str
    attachment_url: Optional[str]
    read_at: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

@router.get("/messages", response_model=List[MessageOut])
async def get_coaching_messages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.active_coach_id:
        raise HTTPException(status_code=403, detail="No active coach assigned")
        
    result = await db.execute(
        select(CoachingMessage).filter(
            CoachingMessage.parent_id == current_user.id,
            CoachingMessage.coach_id == current_user.active_coach_id
        ).order_by(CoachingMessage.created_at.asc())
    )
    messages = result.scalars().all()
    
    # Convert datetime to string for response
    out = []
    for msg in messages:
        out.append(MessageOut(
            id=msg.id,
            sender_type=msg.sender_type,
            content=msg.content,
            attachment_url=msg.attachment_url,
            read_at=msg.read_at.isoformat() if msg.read_at else None,
            created_at=msg.created_at.isoformat()
        ))
        
    return out

@router.post("/messages", response_model=MessageOut)
async def send_coaching_message(
    payload: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.active_coach_id:
        raise HTTPException(status_code=403, detail="No active coach assigned")
        
    new_message = CoachingMessage(
        parent_id=current_user.id,
        coach_id=current_user.active_coach_id,
        sender_type="parent",
        content=payload.content,
        attachment_url=payload.attachment_url
    )
    
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    
    return MessageOut(
        id=new_message.id,
        sender_type=new_message.sender_type,
        content=new_message.content,
        attachment_url=new_message.attachment_url,
        read_at=None,
        created_at=new_message.created_at.isoformat()
    )

@router.post("/subscribe")
async def create_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a Razorpay subscription link (Mocked for now).
    """
    # TODO: Integrate real Razorpay subscriptions API here.
    # For Option B (Manual MVP), you would just return a static payment link.
    
    payment_link = "https://razorpay.com/payment-link-mock"
    
    return {"status": "success", "payment_url": payment_link}


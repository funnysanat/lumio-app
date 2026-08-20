from fastapi import APIRouter, Request, HTTPException, Depends, status
from svix.webhooks import Webhook, WebhookVerificationError
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.core.config import settings

router = APIRouter()

@router.post("/clerk")
async def clerk_webhooks(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    headers = request.headers
    
    # Check for svix headers
    svix_id = headers.get("svix-id")
    svix_timestamp = headers.get("svix-timestamp")
    svix_signature = headers.get("svix-signature")
    
    if not svix_id or not svix_timestamp or not svix_signature:
        raise HTTPException(status_code=400, detail="Missing svix headers")
        
    # Verify signature
    try:
        wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
        evt = wh.verify(payload, headers)
    except WebhookVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    event_type = evt.get("type")
    data = evt.get("data", {})
    
    if event_type == "user.created" or event_type == "user.updated":
        user_id = data.get("id")
        email_addresses = data.get("email_addresses", [])
        primary_email = ""
        if email_addresses:
            primary_email = email_addresses[0].get("email_address", "")
            
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        
        # Upsert user
        user = await db.get(User, user_id)
        if not user:
            user = User(id=user_id, email=primary_email, first_name=first_name, last_name=last_name)
            db.add(user)
        else:
            user.email = primary_email
            user.first_name = first_name
            user.last_name = last_name
            
        await db.commit()
        
    elif event_type == "user.deleted":
        user_id = data.get("id")
        user = await db.get(User, user_id)
        if user:
            await db.delete(user)
            await db.commit()
            
    return {"success": True}

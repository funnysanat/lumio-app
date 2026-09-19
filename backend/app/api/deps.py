from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.user import User
from app.core.security import verify_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = await verify_token(token)
    
    user_id = payload.get("sub")
    print(f"VERIFY_TOKEN PAYLOAD: {payload}")
    print(f"EXTRACTED USER ID: {user_id}")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token missing subject"
        )
        
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        # If user is not found (webhook delayed), create a placeholder
        # Use user_id in the email to avoid unique constraint violations if email is missing from JWT
        user = User(id=user_id, email=payload.get("email", f"{user_id}@placeholder.com"))
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    return user

import jwt
from fastapi import HTTPException, status
from app.core.config import settings
import httpx
from typing import Dict, Any

async def verify_token(token: str) -> Dict[str, Any]:
    print(f"VERIFY_TOKEN CALLED!")
    print(f"TOKEN: {token[:20]}...")
    print(f"CLERK_SECRET_KEY is: {settings.CLERK_SECRET_KEY}")
    
    # Mock token for local development without actual Clerk integration
    if token == "mock_token" or settings.CLERK_SECRET_KEY == "sk_test_mock":
        print("USING MOCK TOKEN!")
        return {"sub": "user_mock123", "roles": ["parent"]}
        
    try:
        # Fetch JWKS from Clerk
        # Ideally, cache this JWKS response in production to avoid an HTTP call per request
        jwks_url = "https://api.clerk.com/v1/jwks"
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"}
            response = await client.get(jwks_url, headers=headers)
            if response.status_code != 200:
                raise Exception("Failed to fetch JWKS")
            jwks = response.json()
            
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header["kid"]:
                rsa_key = key
                break
        
        if rsa_key:
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(rsa_key)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False} 
            )
            return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    raise HTTPException(status_code=401, detail="Invalid token")

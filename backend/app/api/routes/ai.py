from fastapi import APIRouter, Depends
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

class PromptRequest(BaseModel):
    prompt: str

class PromptResponse(BaseModel):
    response: str

@router.post("/test", response_model=PromptResponse)
async def test_ai_endpoint(request: PromptRequest, current_user: User = Depends(get_current_user)):
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
    )
    
    response = llm.invoke(request.prompt)
    return PromptResponse(response=response.content)

from app.worker.tasks import generate_plan_task

class GoalExtractionRequest(BaseModel):
    voice_note_text: str

@router.post("/trigger-agent")
async def trigger_agent(request: GoalExtractionRequest, current_user: User = Depends(get_current_user)):
    task = generate_plan_task.delay(current_user.id)
    return {"message": "Agent triggered", "task_id": task.id}

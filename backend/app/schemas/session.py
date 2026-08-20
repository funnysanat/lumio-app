from pydantic import BaseModel

class SessionLogCreate(BaseModel):
    activity_id: str
    response: str
    voice_note_url: str | None = None

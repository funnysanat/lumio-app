from sqlalchemy import Column, Integer, String, Text
from app.db.base import Base

class CuratedYouTubeVideo(Base):
    __tablename__ = "curated_youtube_videos"

    id = Column(Integer, primary_key=True, index=True)
    youtube_id = Column(String, index=True, nullable=False, unique=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    tags = Column(String)  # comma separated
    description = Column(Text)

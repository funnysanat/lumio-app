import os
import uuid
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Fetch API key (will be used in real implementation)
DAILY_API_KEY = os.environ.get("DAILY_API_KEY")

async def create_video_room(booking_id: str) -> Optional[Dict[str, Any]]:
    """
    Creates a Daily.co video room for a given booking.
    MOCKED implementation until an actual API key is provided.
    """
    # Use a dummy room URL for development/testing
    dummy_room_url = f"https://lumio-test.daily.co/mock-room-{booking_id}"
    
    logger.info(f"MOCK: Created video room for booking {booking_id}: {dummy_room_url}")
    
    return {
        "id": str(uuid.uuid4()),
        "name": f"mock-room-{booking_id}",
        "url": dummy_room_url,
        "created_at": "2023-01-01T12:00:00.000Z",
        "config": {
            "enable_recording": "cloud"
        }
    }

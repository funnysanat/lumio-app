import httpx
import logging

logger = logging.getLogger(__name__)

async def geocode_address(address: str, city: str, pincode: str) -> tuple[float | None, float | None]:
    """
    Given an address, city, and pincode, fetch the latitude and longitude
    using the free OpenStreetMap Nominatim API.
    """
    # Build a reasonable query string. Pincode and city are usually the most reliable.
    query_parts = []
    if address:
        query_parts.append(address)
    if city:
        query_parts.append(city)
    if pincode:
        query_parts.append(pincode)
    
    query = ", ".join(query_parts)
    if not query:
        return None, None

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "limit": 1
    }
    headers = {
        # Nominatim requires a valid User-Agent
        "User-Agent": "LumioAIApp/1.0 (contact@lumio.ai)"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    lat = float(data[0]["lat"])
                    lng = float(data[0]["lon"])
                    return lat, lng
    except Exception as e:
        logger.error(f"Geocoding failed for '{query}': {str(e)}")

    return None, None

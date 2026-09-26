import asyncio
import httpx
import os

async def main():
    async with httpx.AsyncClient() as client:
        # First login or just mock the DB call?
        # Or I can just test the geocoder directly
        from app.utils.geocoder import geocode_address
        lat, lng = await geocode_address(address="", city="bengaluru", pincode="560001")
        print(f"Bengaluru 560001 -> lat: {lat}, lng: {lng}")
        
        lat, lng = await geocode_address(address="MG Road", city="", pincode="")
        print(f"MG Road -> lat: {lat}, lng: {lng}")

if __name__ == "__main__":
    asyncio.run(main())

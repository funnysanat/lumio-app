import asyncio
from app.db.session import async_session_maker
from app.models.therapist import TherapistProfile
from app.models.user import User
from sqlalchemy.future import select
from app.utils.geocoder import geocode_address

async def main():
    async with async_session_maker() as db:
        # Fix Therapists
        res = await db.execute(select(TherapistProfile).where(TherapistProfile.lat.is_(None)))
        therapists = res.scalars().all()
        for t in therapists:
            lat, lng = await geocode_address(address=t.address or "", city=t.city or "", pincode=t.pincode or "")
            if lat and lng:
                print(f"Updated Therapist {t.full_name}: {lat}, {lng}")
                t.lat = lat
                t.lng = lng
        
        # Fix Users
        res = await db.execute(select(User).where(User.lat.is_(None)))
        users = res.scalars().all()
        for u in users:
            lat, lng = await geocode_address(address=u.address or "", city=u.city or "", pincode=u.pincode or "")
            if lat and lng:
                print(f"Updated User {u.email}: {lat}, {lng}")
                u.lat = lat
                u.lng = lng
                
        await db.commit()

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import async_session_maker
from sqlalchemy.future import select
from app.models.child import ChildProfile, DevelopmentalSnapshot
from app.models.activity import ActivitySession

async def simulate_progress():
    async with async_session_maker() as db:
        # Get the first child profile
        result = await db.execute(select(ChildProfile))
        child = result.scalars().first()
        
        if not child:
            print("No child profile found. Please complete onboarding first.")
            return

        print(f"Simulating progress for {child.first_name}...")

        # 1. Insert Dummy Activity Sessions
        print("Adding dummy Activity Sessions...")
        for i in range(5):
            session = ActivitySession(
                child_id=child.id,
                activity_id=f"activity_{i}",
                response="independent",
                text_note=f"Successfully completed simulated activity {i} independently!",
                created_at=datetime.utcnow() - timedelta(days=i)
            )
            db.add(session)

        # 2. Update Developmental Snapshot
        print("Fetching latest snapshot...")
        result = await db.execute(
            select(DevelopmentalSnapshot)
            .filter(DevelopmentalSnapshot.child_id == child.id)
            .order_by(DevelopmentalSnapshot.assessment_date.desc())
        )
        latest_snapshot = result.scalars().first()

        if not latest_snapshot:
            print("No snapshot found.")
            return

        # Advance Expressive Language to the next band
        domain_scores = dict(latest_snapshot.domain_scores)
        
        current_band = domain_scores.get("ExpressiveLanguage", "18-24 months")
        bands = ["0-6 months", "6-12 months", "12-18 months", "18-24 months", "24-36 months", "36-48 months"]
        
        if current_band in bands:
            current_idx = bands.index(current_band)
            if current_idx < len(bands) - 1:
                next_band = bands[current_idx + 1]
                print(f"Advancing ExpressiveLanguage from {current_band} to {next_band}")
                domain_scores["ExpressiveLanguage"] = next_band
            else:
                print("Already at max band!")
                next_band = current_band
        else:
            next_band = "24-36 months"
            domain_scores["ExpressiveLanguage"] = next_band

        # Create new snapshot
        new_snapshot = DevelopmentalSnapshot(
            child_id=child.id,
            chronological_age_months=latest_snapshot.chronological_age_months,
            domain_scores=domain_scores,
            next_milestones=latest_snapshot.next_milestones, # Keep milestones same for simplicity
            assessment_date=datetime.utcnow()
        )
        db.add(new_snapshot)
        
        await db.commit()
        print("Progress simulation complete! Refresh your frontend to see the pointer move.")

if __name__ == "__main__":
    asyncio.run(simulate_progress())

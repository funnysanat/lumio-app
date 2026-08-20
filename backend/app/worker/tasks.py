from app.worker.celery_app import celery_app
from app.ai.agent import plan_agent
from app.db.session import async_session_maker
from app.models.child import ChildProfile, TherapyGoal, InterestProfile
from app.models.activity import DailyPlan
from langchain_core.messages import HumanMessage
import asyncio
from sqlalchemy.future import select

async def _generate_and_save_plan(user_id: str, mode: str):
    async with async_session_maker() as db:
        child_res = await db.execute(select(ChildProfile).filter(ChildProfile.user_id == user_id))
        child = child_res.scalars().first()
        if not child:
            return {"error": "Child not found"}
            
        goals_res = await db.execute(select(TherapyGoal).filter(TherapyGoal.child_id == child.id))
        goals = [g.goal_text for g in goals_res.scalars().all()]
        
        int_res = await db.execute(select(InterestProfile).filter(InterestProfile.child_id == child.id))
        interest = int_res.scalars().first()
        
        # Build prompt context
        context = (
            f"Mode: {mode}\n"
            f"Age: {child.age_range}\n"
            f"Condition: {child.primary_condition}\n"
            f"Communication: {child.communication_level}\n"
            f"Language: {child.preferred_language}\n"
            f"Goals: {', '.join(goals)}\n"
            f"Interests: {interest.interests if interest else 'None'}\n"
            f"Reward: {interest.reward_type if interest else 'None'}"
        )
        
        initial_state = {"messages": [HumanMessage(content=context)]}
        result = plan_agent.invoke(initial_state)
        daily_plan_json = result.get("daily_plan", {})
        
        plan = DailyPlan(
            child_id=child.id,
            activities=daily_plan_json.get("activities", []),
            mode=mode
        )
        db.add(plan)
        await db.commit()
        
        return {"status": "completed", "plan_id": plan.id}

@celery_app.task(name="generate_plan")
def generate_plan_task(user_id: str, mode: str = "creative"):
    print(f"Generating plan for {user_id} (mode: {mode})")
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(_generate_and_save_plan(user_id, mode))

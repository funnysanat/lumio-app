from app.worker.celery_app import celery_app
from app.ai.agent import plan_agent
from app.db.session import async_session_maker
from app.models.child import ChildProfile, TherapyGoal, InterestProfile, DevelopmentalSnapshot
from app.models.activity import DailyPlan
from app.models.user import User
from langchain_core.messages import HumanMessage
import resend
import asyncio
from sqlalchemy.future import select
import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from youtubesearchpython import VideosSearch
from app.core.config import settings
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
        
        # Get the latest developmental snapshot
        snapshot_res = await db.execute(
            select(DevelopmentalSnapshot)
            .filter(DevelopmentalSnapshot.child_id == child.id)
            .order_by(DevelopmentalSnapshot.assessment_date.desc())
        )
        snapshot = snapshot_res.scalars().first()
        
        # Build prompt context
        context = (
            f"Mode: {mode}\n"
            f"Chronological Age: {snapshot.chronological_age_months if snapshot else 'Unknown'} months\n"
            f"Condition: Unspecified (infer from developmental profile)\n"
            f"Communication: {child.communication_level}\n"
            f"Language: {child.preferred_language}\n"
            f"Goals: {', '.join(goals)}\n"
            f"Interests: {interest.interests if interest else 'None'}\n"
            f"Reward: {interest.reward_type if interest else 'None'}\n"
        )
        
        if snapshot:
            context += "\n--- DEVELOPMENTAL MILESTONES (DEALL FRAMEWORK) ---\n"
            context += f"Domain Scores (Developmental Age): {snapshot.domain_scores}\n"
            context += f"Next Target Milestones (Micro-skills to focus on): {snapshot.next_milestones}\n"
            context += "CRITICAL INSTRUCTION: You MUST design the activities to specifically target the 'Next Target Milestones' listed above, using the child's 'Developmental Age' rather than their chronological age.\n"
        
        initial_state = {"messages": [HumanMessage(content=context)]}
        result = await plan_agent.ainvoke(initial_state)
        daily_plan_json = result.get("daily_plan", {})
        
        activities = daily_plan_json.get("activities", [])
        
        # Video RAG Retrieval and Fallback
        try:
            embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=settings.GEMINI_API_KEY)
            faiss_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "video_faiss_index")
            vectorstore = FAISS.load_local(faiss_path, embeddings, allow_dangerous_deserialization=True) if os.path.exists(faiss_path) else None
            
            for act in activities:
                query = act.get("video_search_query", act.get("title", ""))
                youtube_id = None
                
                # 1. Try RAG first
                if vectorstore:
                    docs_with_scores = vectorstore.similarity_search_with_score(query, k=1)
                    if docs_with_scores:
                        doc, score = docs_with_scores[0]
                        if score < 1.0: # Good match threshold (lower is better for L2 distance)
                            youtube_id = doc.metadata.get("youtube_id")
                
                # 2. Fallback to YouTube Search API
                if not youtube_id:
                    print(f"RAG missed or score too high for '{query}'. Falling back to YouTube search...")
                    try:
                        videos_search = VideosSearch(query + " therapy", limit=1)
                        results = videos_search.result()
                        if results and results.get("result"):
                            youtube_id = results["result"][0].get("id")
                    except Exception as yt_e:
                        print(f"YouTube search fallback failed: {yt_e}")
                        
                if youtube_id:
                    act["youtube_video_id"] = youtube_id
                    
        except Exception as e:
            print(f"Error retrieving video from RAG/Fallback: {e}")
        
        plan = DailyPlan(
            child_id=child.id,
            activities=activities,
            mode=mode
        )
        db.add(plan)
        await db.commit()
        
        # Trigger email notification
        user_res = await db.execute(select(User).filter(User.id == user_id))
        user = user_res.scalars().first()
        if user and user.email:
            send_daily_notification_email.delay(user.email, child.first_name or "your child")
            
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

@celery_app.task(name="send_daily_notification_email")
def send_daily_notification_email(email: str, child_name: str):
    print(f"Sending daily notification to {email} for {child_name}")
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        print("RESEND_API_KEY not found. Skipping email notification.")
        return
        
    resend.api_key = api_key
    try:
        r = resend.Emails.send({
            "from": "Lumio AI <onboarding@resend.dev>",
            "to": [email],
            "subject": f"Your daily plan for {child_name} is ready! ✨",
            "html": f"<p>Good morning!</p><p>Your child's personalized Lumio AI therapy plan is ready for today.</p><p><a href='http://localhost:3000/dashboard'>Click here to view it and start your activities!</a></p>"
        })
        print(f"Email sent successfully: {r}")
    except Exception as e:
        print(f"Failed to send email: {e}")

async def _generate_for_all():
    async with async_session_maker() as db:
        users_res = await db.execute(select(User))
        users = users_res.scalars().all()
        for u in users:
            generate_plan_task.delay(u.id, "creative")

@celery_app.task(name="generate_daily_plans_for_all_users")
def generate_daily_plans_for_all_users():
    print("Triggering daily plan generation for all users...")
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(_generate_for_all())

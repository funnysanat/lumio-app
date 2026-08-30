from app.worker.celery_app import celery_app
from app.ai.agent import plan_agent
from app.db.session import async_session_maker
from app.models.child import ChildProfile, TherapyGoal, InterestProfile
from app.models.activity import DailyPlan
from langchain_core.messages import HumanMessage
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

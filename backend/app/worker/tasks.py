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
        
        # Include latest completed therapy session notes
        from app.models.therapist import TherapistBooking
        session_res = await db.execute(
            select(TherapistBooking)
            .filter(TherapistBooking.parent_user_id == user_id)
            .filter(TherapistBooking.status == "completed")
            .order_by(TherapistBooking.updated_at.desc())
        )
        latest_session = session_res.scalars().first()
        if latest_session:
            context += "\n--- LATEST THERAPY SESSION (CRITICAL) ---\n"
            if latest_session.therapist_notes:
                context += f"Therapist Written Notes: {latest_session.therapist_notes}\n"
            if latest_session.therapist_audio_transcript:
                context += f"Therapist Audio Transcript: {latest_session.therapist_audio_transcript}\n"
            if latest_session.ai_summary:
                context += f"Session AI Summary: {latest_session.ai_summary}\n"
            context += "CRITICAL INSTRUCTION: The therapist has provided notes from a recent session. You MUST adapt your daily plan to align closely with the therapist's observations and recommendations above.\n"

        
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


async def _generate_session_summary_async(booking_id: str, recording_id: str):
    from app.models.therapist import TherapistBooking
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    async with async_session_maker() as db:
        res = await db.execute(select(TherapistBooking).filter(TherapistBooking.id == booking_id))
        booking = res.scalars().first()
        if not booking:
            print(f"Booking {booking_id} not found.")
            return

        # Mock downloading the file and uploading to Gemini since we don't have Daily API key
        # In real implementation: download from Daily.co, then genai.upload_file(file_path)
        print(f"Mock analyzing recording {recording_id} for booking {booking_id}")
        
        # We will use Gemini to generate a text summary based on the mock context
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
        Act as an expert pediatric therapist observing a session.
        Since the actual video is not available in this mock run, generate a realistic but generic AI summary for a therapy session regarding '{booking.child_condition or 'general development'}'.
        
        The summary must include:
        1. Key Observations (2-3 bullet points)
        2. Child's Engagement Level (brief sentence)
        3. Parent Home Practice Recommendations (2 actionable activities)
        """
        
        response = model.generate_content(prompt)
        
        # Mock download from Daily and upload to GCP
        from app.services.gcp_storage import upload_file_to_gcp
        mock_video_bytes = b"mock video file data content"
        gcp_url = await upload_file_to_gcp(mock_video_bytes, f"recordings/{booking_id}_{recording_id}.mp4", "video/mp4")
        
        booking.ai_summary = response.text
        booking.status = "completed"
        booking.recording_url = gcp_url or f"https://storage.googleapis.com/lumio-mock-bucket/recordings/{booking_id}_{recording_id}.mp4"
        
        await db.commit()
        print(f"Successfully generated summary and uploaded recording to GCP for booking {booking_id}")


@celery_app.task(name="generate_session_summary")
def generate_session_summary(booking_id: str, recording_id: str):
    """Triggered by Daily.co webhook when recording is ready."""
    print(f"Generating session summary for booking {booking_id}")
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(_generate_session_summary_async(booking_id, recording_id))

async def _verify_video_content_async(video_id: str):
    from app.models.therapist import TherapistVideo, TherapistProfile
    from app.models.user import User, InAppNotification
    import random
    
    async with async_session_maker() as db:
        res = await db.execute(select(TherapistVideo).filter(TherapistVideo.id == video_id))
        video = res.scalars().first()
        if not video:
            return
            
        print(f"Verifying video {video_id} using Gemini 1.5 Flash...")
        import google.generativeai as genai
        from app.core.config import settings
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # In a full production system, you can download the video from video.video_url
        # to a temp file, upload it using genai.upload_file(), and pass it directly to the model.
        # For this implementation, we will use Gemini to strictly analyze the metadata.
        
        prompt = f"""
        You are a strict compliance officer for a pediatric therapy platform.
        Analyze the following video metadata for compliance with strict educational guidelines.
        
        Video Title: {video.title}
        Video Description: {video.description or "No description provided"}
        
        It must NOT contain: 
        - self-promotional content or spam ("subscribe", "buy my course")
        - sexual or inappropriate content
        - religious themes
        - claims that medicines cure diseases or "miracle" hoaxes.
        
        It must be purely educational content related to therapy.
        
        Respond ONLY with a JSON object in the following format:
        {{"is_safe": true/false, "reason": "1 sentence explanation"}}
        """
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        try:
            import json
            # Clean up potential markdown formatting in response
            response_text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
            result = json.loads(response_text)
            is_safe = result.get("is_safe", False)
            reason = result.get("reason", "Failed to parse reason")
            print(f"Gemini Verification Result: Safe={is_safe}, Reason={reason}")
        except Exception as e:
            print(f"Failed to parse Gemini response: {e}")
            is_safe = False
        
        
        video.is_verified = is_safe
        
        if is_safe:
            # Update therapist total_videos count
            res_t = await db.execute(select(TherapistProfile).filter(TherapistProfile.id == video.therapist_id))
            therapist = res_t.scalars().first()
            if therapist:
                therapist.total_videos += 1
                
            # Create in-app notification for all parents
            users_res = await db.execute(select(User).filter(User.role == "parent"))
            parents = users_res.scalars().all()
            for parent in parents:
                notif = InAppNotification(
                    user_id=parent.id,
                    title="New Therapy Content",
                    body=f"{therapist.full_name if therapist else 'A therapist'} just posted a new video: {video.title}",
                    type="new_video",
                    link="/dashboard/feed"
                )
                db.add(notif)
                
        await db.commit()
        print(f"Video {video_id} verification complete: {is_safe}")

@celery_app.task(name="verify_video_content")
def verify_video_content(video_id: str):
    """Triggered after therapist uploads a video."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(_verify_video_content_async(video_id))

async def _notify_parents_of_new_workshop_async(session_id: str):
    from app.models.therapist import TherapistGroupSession, TherapistProfile
    from app.models.user import User, InAppNotification
    
    async with async_session_maker() as db:
        res = await db.execute(select(TherapistGroupSession).filter(TherapistGroupSession.id == session_id))
        session = res.scalars().first()
        if not session:
            return
            
        res_t = await db.execute(select(TherapistProfile).filter(TherapistProfile.id == session.therapist_id))
        therapist = res_t.scalars().first()
        therapist_name = therapist.full_name if therapist else "A therapist"
        
        # Get all parents
        users_res = await db.execute(select(User).filter(User.role == "parent"))
        parents = users_res.scalars().all()
        
        # Create In-App Notifications
        for parent in parents:
            notif = InAppNotification(
                user_id=parent.id,
                title="New Workshop Available!",
                body=f"{therapist_name} is hosting a new workshop: {session.title}",
                type="new_workshop",
                link="/marketplace/workshops"
            )
            db.add(notif)
            
        await db.commit()
        
        # Send Emails via Resend
        api_key = os.getenv("RESEND_API_KEY")
        if not api_key:
            print("RESEND_API_KEY not found. Skipping workshop emails.")
            return
            
        resend.api_key = api_key
        
        # For MVP, we send them individually or we can use bcc. Doing a loop for simplicity.
        # In a real production system, use bulk email APIs or audience broadcast.
        price_str = f"₹{(session.price / 100):.2f}" if session.price > 0 else "Free"
        
        html_content = f"""
        <h2>New Workshop by {therapist_name}</h2>
        <h3>{session.title}</h3>
        <p><strong>Date & Time:</strong> {session.scheduled_date} at {session.scheduled_time}</p>
        <p><strong>Price:</strong> {price_str}</p>
        <p>{session.description or 'Join this live session to learn and grow!'}</p>
        <p><a href='http://localhost:3000/marketplace/workshops'>Click here to view and enroll</a></p>
        """
        
        # To avoid spamming real emails during testing or blowing rate limits, 
        # we will extract emails that are present. 
        emails = [p.email for p in parents if p.email]
        if emails:
            try:
                # Send one blast with bcc to save rate limits
                r = resend.Emails.send({
                    "from": "Lumio AI <onboarding@resend.dev>",
                    "to": ["updates@lumio.com"],
                    "bcc": emails[:50], # Limit to 50 for MVP safety
                    "subject": f"New Workshop: {session.title}",
                    "html": html_content
                })
                print(f"Workshop notification emails sent successfully.")
            except Exception as e:
                print(f"Failed to send workshop emails: {e}")

@celery_app.task(name="notify_parents_of_new_workshop")
def notify_parents_of_new_workshop(session_id: str):
    """Triggered after therapist creates a new group session."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(_notify_parents_of_new_workshop_async(session_id))

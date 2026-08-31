import os
import asyncio
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()
from app.ai.agent import plan_agent

async def test_embed():
    print("Testing Agent Generation with YouTube Embedded RAG...")
    
    query = "Mode: standard. My 4 year old child has a speech delay and loves toy cars."
    initial_state = {"messages": [{"role": "user", "content": query}]}
    
    # Invoke the agent graph
    result = await plan_agent.ainvoke(initial_state)
    
    plan = result.get("daily_plan", {})
    
    print("\n--- Generated Plan ---")
    for act in plan.get("activities", []):
        print(f"Title: {act.get('title')}")
        print(f"YouTube ID: {act.get('youtube_video_id')}")
        print("---")

if __name__ == "__main__":
    asyncio.run(test_embed())

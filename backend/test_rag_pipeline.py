import os
import asyncio
from dotenv import load_dotenv

# Set pythonpath to backend
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from app.ai.agent import plan_agent, retriever

def test_rag():
    print("--- Testing Retriever ---")
    if retriever:
        query = "Mode: standard. My 4 year old child needs help with expressive language. He loves cars."
        print(f"Querying FAISS with: '{query}'")
        docs = retriever.invoke(query)
        print(f"Found {len(docs)} documents.")
        for i, d in enumerate(docs):
            print(f"\n--- Document {i+1} ---")
            print(f"Metadata: {d.metadata}")
            # Print just the first 200 chars to avoid wall of text
            print(f"Content preview: {d.page_content[:200]}...")
            
        print("\n--- Testing Agent Generation ---")
        initial_state = {"messages": [{"role": "user", "content": query}]}
        
        # Invoke the agent graph
        result = plan_agent.invoke(initial_state)
        
        plan = result.get("daily_plan", {})
        
        print("\n--- Generated Plan ---")
        for act in plan.get("activities", []):
            print(f"Title: {act.get('title')}")
            print(f"ID: {act.get('id')}")
            print(f"Reason: {act.get('reason')}")
            print("---")
            
    else:
        print("Retriever is None. FAISS index not loaded.")

if __name__ == "__main__":
    test_rag()

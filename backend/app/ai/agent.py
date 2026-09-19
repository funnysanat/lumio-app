import os
from pathlib import Path
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langgraph.graph import StateGraph, START, END
from app.ai.state import AgentState
from app.core.config import settings
from pydantic import BaseModel, Field
from typing import List

# Setup Vector Store
BASE_DIR = Path(__file__).resolve().parent.parent.parent
VECTOR_STORE_DIR = BASE_DIR / "faiss_index"

try:
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=settings.GEMINI_API_KEY)
    vector_store = FAISS.load_local(str(VECTOR_STORE_DIR), embeddings, allow_dangerous_deserialization=True)
    retriever = vector_store.as_retriever(search_kwargs={"k": 4})
    print("Successfully loaded Activity RAG index.")
except Exception as e:
    print(f"Warning: Could not load FAISS index from {VECTOR_STORE_DIR}. Ensure you run ingest_activities.py first. Error: {e}")
    retriever = None

class Activity(BaseModel):
    id: str = Field(description="A unique string ID like act_1, act_2")
    title: str = Field(description="Short engaging title of the activity")
    goal: str = Field(description="The therapy goal this activity targets")
    duration: str = Field(description="Estimated duration (e.g. '5 mins')")
    difficulty: str = Field(description="Difficulty level (e.g. 'Beginner', 'Building', 'Advanced')")
    reason: str = Field(description="A one-line explanation of why this activity was chosen today for this specific child")
    emoji: str = Field(description="A single relevant emoji representing this activity (e.g. 🚂, 💦, 🎨)")
    steps: List[str] = Field(description="A clear, numbered array of step-by-step instructions for the caregiver to follow during the activity.", default=[])
    video_search_query: str = Field(description="A 3-5 word query to search for a therapy video demonstrating this skill (e.g. 'Occupational therapy fine motor beads', 'Speech therapy bubble blowing')", default="")
    audio_lang_code: str = Field(description="The BCP-47 language code corresponding to the language this activity is written in (e.g., 'en-US' for English, 'hi-IN' for Hindi, 'es-ES' for Spanish, 'bn-IN' for Bengali).", default="en-US")

class DailyPlanOut(BaseModel):
    activities: List[Activity] = Field(description="A list of exactly 2 or 3 activities for the daily plan")

llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash-lite",
    google_api_key=settings.GEMINI_API_KEY,
)

structured_llm = llm.with_structured_output(DailyPlanOut)



async def generate_plan(state: AgentState):
    messages = state["messages"]
    prompt = messages[-1].content
    
    # Extract mode (default to creative)
    mode = "creative"
    if "Mode: standard" in prompt.lower():
        mode = "standard"
        
    mode_instructions = (
        "You MUST generate the most common, fundamental, evidence-based activities that occupational and speech therapists use for the child's specific goals. Use the retrieved activities provided in the context below. Focus on traditional, tried-and-true clinical exercises adapted for home."
        if mode == "standard" else
        "You MUST generate novel, out-of-the-box, creative activities using the child's special interests to achieve their therapy goals. Use the retrieved activities provided in the context below as a foundation, but creatively adapt them to include the child's special interests. Think outside the box and create engaging, unique scenarios that disguise the therapy."
    )
    
    # Retrieve relevant activities if RAG is available
    retrieved_context = ""
    if retriever:
        try:
            docs = retriever.invoke(prompt)
            retrieved_context = "\n\n--- RETRIEVED EVIDENCE-BASED ACTIVITIES ---\n"
            for d in docs:
                retrieved_context += f"\n{d.page_content}\n"
        except Exception as e:
            print(f"Retrieval error: {e}")
            pass
    
    system_prompt = (
        "You are an expert pediatric occupational and speech therapist. "
        "Your job is to generate a personalised daily plan of activities for a child based on their profile, goals, and interests. "
        f"{mode_instructions} "
        "The activities should use common household items, be easy for parents to execute, and directly address the stated therapy goals. "
        "Keep the reasoning positive and encouraging for the parent.\n"
        "IMPORTANT LANGUAGE INSTRUCTION: Check the 'Language' provided in the Child Context. If a language is specified, you MUST generate the title, goal, reason, and steps translated into that language. If no language is specified, default to English. HOWEVER, the `video_search_query` MUST be strictly in English ONLY. Do not translate the video search query and do not append the local language to it.\n\n"
        f"Child Context:\n{prompt}"
        f"{retrieved_context}"
    )
    
    response = await structured_llm.ainvoke(system_prompt)
    
    return {"daily_plan": response.model_dump()}

# Build the agent graph
builder = StateGraph(AgentState)
builder.add_node("generate", generate_plan)
builder.add_edge(START, "generate")
builder.add_edge("generate", END)

plan_agent = builder.compile()

class ProgressSuggestionOut(BaseModel):
    suggestion: str = Field(description="A single encouraging, actionable sentence for the parent.")

progress_llm = llm.with_structured_output(ProgressSuggestionOut)

def generate_progress_suggestion(goal_name: str, this_week: int, last_week: int) -> str:
    system_prompt = (
        "You are an expert pediatric occupational and speech therapist coaching a parent. "
        "Look at the recent progress for the therapy goal.\n"
        f"Goal: {goal_name}\n"
        f"Independent Responses This Week: {this_week}\n"
        f"Independent Responses Last Week: {last_week}\n\n"
        "Provide exactly ONE short, highly encouraging, and actionable sentence. "
        "If they are doing better this week, praise them and suggest fading prompts. "
        "If they are doing worse or the same, normalize it and suggest making the task easier or increasing motivation."
    )
    
    try:
        response = progress_llm.invoke(system_prompt)
        return response.suggestion
    except Exception as e:
        print(f"Error generating suggestion: {e}")
        return "Keep up the great work! Every interaction counts."

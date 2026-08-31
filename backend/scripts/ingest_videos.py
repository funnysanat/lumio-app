import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

def ingest_videos():
    print("Loading approved videos...")
    
    # Read the JSON file
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "approved_videos.json")
    with open(data_path, "r") as f:
        videos = json.load(f)
    
    documents = []
    for v in videos:
        # Construct the text to embed
        tags_str = ", ".join(v.get("tags", []))
        text = f"Title: {v['title']}\nCategory: {v['category']}\nTags: {tags_str}\nDescription: {v['description']}"
        
        doc = Document(
            page_content=text,
            metadata={"youtube_id": v["youtube_id"]}
        )
        documents.append(doc)
    
    print(f"Loaded {len(documents)} videos.")
    
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")
    
    print("Generating embeddings and building FAISS index...")
    # Because it's only a few videos, we can embed them all at once.
    # If the list grows large, we would need to batch and sleep to avoid 429 errors.
    
    vectorstore = FAISS.from_documents(documents, embeddings)
    
    save_path = os.path.join(os.path.dirname(__file__), "..", "data", "video_faiss_index")
    vectorstore.save_local(save_path)
    
    print(f"Saved FAISS index to {save_path}")

if __name__ == "__main__":
    ingest_videos()

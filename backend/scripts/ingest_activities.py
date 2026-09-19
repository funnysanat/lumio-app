import os
import re
import glob
from pathlib import Path
from dotenv import load_dotenv

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

# Load environment variables (for GEMINI_API_KEY)
load_dotenv()

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ACTIVITY_REPO_DIR = BASE_DIR / "activity_repository"
VECTOR_STORE_DIR = BASE_DIR / "backend" / "faiss_index"

def parse_activities():
    documents = []
    
    # Find all part*.md files
    markdown_files = glob.glob(str(ACTIVITY_REPO_DIR / "part*.md"))
    
    for file_path in markdown_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Split by ## ACT-
        # This regex looks for '## ACT-' and captures the ID up to the next '## ACT-' or end of string
        parts = re.split(r'(## ACT-\d{3})', content)
        
        # parts[0] is usually the header/preamble, so we start from index 1
        for i in range(1, len(parts), 2):
            if i + 1 < len(parts):
                act_header = parts[i]
                act_body = parts[i+1]
                
                full_act_text = act_header + act_body
                
                # Extract the Activity ID
                act_id_match = re.search(r'ACT-\d{3}', act_header)
                act_id = act_id_match.group(0) if act_id_match else "UNKNOWN"
                
                # Extract Domain for metadata (optional, but good practice)
                domain_match = re.search(r'\*\*Domain:\*\*\s*(.+)', act_body)
                domain = domain_match.group(1).strip() if domain_match else "UNKNOWN"
                
                # Extract Title
                title_match = re.search(r'## ACT-\d{3} — "([^"]+)"', act_header)
                if not title_match:
                    # Sometimes the quote format is different
                    title_match = re.search(r'## ACT-\d{3} — (.*)', act_header)
                title = title_match.group(1).strip() if title_match else "UNKNOWN"
                
                doc = Document(
                    page_content=full_act_text.strip(),
                    metadata={
                        "id": act_id,
                        "title": title,
                        "domain": domain,
                        "source": os.path.basename(file_path)
                    }
                )
                documents.append(doc)
                
    return documents

def main():
    print("Parsing activity markdown files...")
    documents = parse_activities()
    print(f"Parsed {len(documents)} activities.")
    
    if not documents:
        print("No documents found. Check your activity_repository path.")
        return

    print("Initializing Google Generative AI Embeddings...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")
    
    print("Building FAISS index (this may take a minute)...")
    
    # Process in very small batches to avoid Gemini free tier rate limits (usually 15 RPM)
    import time
    batch_size = 5
    vector_store = None
    
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i+batch_size]
        print(f"Embedding batch {i//batch_size + 1}/{(len(documents)-1)//batch_size + 1}...")
        
        # Retry logic for the batch
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if vector_store is None:
                    vector_store = FAISS.from_documents(batch, embeddings)
                else:
                    vector_store.add_documents(batch)
                break # Success, exit retry loop
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                print(f"Rate limited. Waiting 20 seconds before retry... (Attempt {attempt+1})")
                time.sleep(20)
        
        # Wait between batches to stay under the Requests Per Minute (RPM) limit
        if i + batch_size < len(documents):
            print("Waiting 15 seconds to respect API rate limits...")
            time.sleep(15)
            
    print(f"Saving index to {VECTOR_STORE_DIR}...")
    vector_store.save_local(str(VECTOR_STORE_DIR))
    print("Done! Activity RAG database is ready.")

if __name__ == "__main__":
    main()

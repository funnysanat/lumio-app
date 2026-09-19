import json
import os
from youtubesearchpython import VideosSearch

queries = [
    "Occupational therapy fine motor skills for kids",
    "Speech therapy early intervention first words",
    "Sensory processing disorder calming techniques",
    "Autism speech therapy turn taking",
    "Speech language pathology bubble blowing",
    "Occupational therapy heavy work activities",
    "Pediatric physical therapy core strength",
    "Autism joint attention activities",
    "Speech therapy imitating sounds",
    "Occupational therapy crossing midline"
]

def fetch_videos():
    results = []
    seen = set()
    for q in queries:
        try:
            search = VideosSearch(q, limit=2)
            res = search.result()["result"]
            for v in res:
                y_id = v.get("id")
                if y_id and y_id not in seen:
                    seen.add(y_id)
                    results.append({
                        "youtube_id": y_id,
                        "title": v.get("title", ""),
                        "category": "Therapy",
                        "tags": q.split(" "),
                        "description": "A curated therapy video for " + q
                    })
        except Exception as e:
            print(f"Failed for {q}: {e}")
            
    # Read existing
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "approved_videos.json")
    with open(data_path, "r") as f:
        existing = json.load(f)
        
    for ex in existing:
        seen.add(ex["youtube_id"])
        
    # Append
    existing.extend([r for r in results if r["youtube_id"] not in [e["youtube_id"] for e in existing]])
    
    with open(data_path, "w") as f:
        json.dump(existing, f, indent=2)
        
    print(f"Added {len(results)} new videos. Total is now {len(existing)}")

if __name__ == "__main__":
    fetch_videos()

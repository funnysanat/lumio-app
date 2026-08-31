import json
import os

real_ids = [
    "YM5O5H3fO-E",
    "9G9a1je9hC8",
    "pOL8KRUlC1M",
    "WG7G8o3J5pA",
    "CAM30-I4NMQ",
    "8jmK6C3Q6ys",
    "A7q_3370HuU",
    "Eh4q3GeuMrI"
]

data_path = os.path.join(os.path.dirname(__file__), "..", "data", "approved_videos.json")
with open(data_path, "r") as f:
    existing = json.load(f)

# The first two are real. The rest are fake AUZIYQ... IDs.
# Let's replace the fake ones.
id_idx = 0
for v in existing:
    if v["youtube_id"].startswith("AUZ"):
        if id_idx < len(real_ids):
            v["youtube_id"] = real_ids[id_idx]
            id_idx += 1

with open(data_path, "w") as f:
    json.dump(existing, f, indent=2)

print("Fixed JSON IDs!")

import os
import glob

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace standard current_user queries
    new_content = content.replace(
        "select(ChildProfile).filter(ChildProfile.user_id == current_user.id)",
        "select(ChildProfile)"
    )
    
    # Replace worker task queries
    new_content = new_content.replace(
        "select(ChildProfile).filter(ChildProfile.user_id == user_id)",
        "select(ChildProfile)"
    )
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# Find all python files in backend/app
for root, dirs, files in os.walk("app"):
    for file in files:
        if file.endswith(".py"):
            replace_in_file(os.path.join(root, file))
            
print("Done!")

import os

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # In tasks.py, we need user_id instead of current_user.id
    if "tasks.py" in filepath:
        new_content = content.replace(
            "select(ChildProfile)",
            "select(ChildProfile).filter(ChildProfile.user_id == user_id)"
        )
    else:
        new_content = content.replace(
            "select(ChildProfile)",
            "select(ChildProfile).filter(ChildProfile.user_id == current_user.id)"
        )
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Reverted {filepath}")

for root, dirs, files in os.walk("app"):
    for file in files:
        if file.endswith(".py"):
            replace_in_file(os.path.join(root, file))
            
print("Done!")

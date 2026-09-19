import asyncio
from app.worker.tasks import generate_plan_task

user_id = 'user_3Hf4TKkdjxQN9MmD5FsMLTiRr8v'
task = generate_plan_task.delay(user_id)
print(f"Task dispatched: {task.id}")


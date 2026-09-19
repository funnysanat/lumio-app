from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.worker.tasks"]
)

celery_app.conf.task_routes = {
    "app.worker.tasks.*": "main-queue"
}

from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    "generate-daily-plans": {
        "task": "generate_daily_plans_for_all_users",
        # Run every day at 6:00 AM UTC
        "schedule": crontab(hour=6, minute=0),
    },
}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

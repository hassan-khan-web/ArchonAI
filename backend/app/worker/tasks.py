from app.core.celery_app import celery_app
import time

@celery_app.task
def test_task(word: str):
    time.sleep(5)
    return f"Processed: {word}"

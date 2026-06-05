import threading
import time
import traceback
from app.db.session import SessionLocal
from app.pipelines.internships import run_ingestion_pipeline

# Background thread control
_scheduler_thread = None
_stop_event = threading.Event()

def _scheduler_loop(interval_seconds: int = 7200):
    """
    Main loop for background opportunity ingestion.
    Runs every 2 hours by default.
    """
    print("Background Job Scheduler Started.")
    # Run once at startup
    try:
        db = SessionLocal()
        run_ingestion_pipeline(db)
        db.close()
    except Exception as e:
        print(f"Scheduler error on startup run: {e}")
        traceback.print_exc()

    while not _stop_event.wait(interval_seconds):
        print("Scheduler: Triggering automated 2-hour opportunity refresh...")
        try:
            db = SessionLocal()
            run_ingestion_pipeline(db)
            db.close()
            print("Scheduler: Opportunity refresh completed successfully.")
        except Exception as e:
            print(f"Scheduler error in 2-hour cycle: {e}")
            traceback.print_exc()

def start_scheduler(interval_seconds: int = 7200):
    global _scheduler_thread, _stop_event
    if _scheduler_thread is not None:
        return # Already running
        
    _stop_event.clear()
    _scheduler_thread = threading.Thread(
        target=_scheduler_loop, 
        args=(interval_seconds,),
        daemon=True,
        name="EthOS-IngestionScheduler"
    )
    _scheduler_thread.start()

def stop_scheduler():
    global _scheduler_thread
    if _scheduler_thread is None:
        return
        
    _stop_event.set()
    _scheduler_thread.join(timeout=5)
    _scheduler_thread = None
    print("Background Job Scheduler Stopped.")

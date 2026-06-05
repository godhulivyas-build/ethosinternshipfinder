import sys
import os

# Set python path to backend directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.pipelines.internships import run_ingestion_pipeline

def test_pipeline():
    print("Starting automated test of the opportunity ingestion pipeline...")
    db = SessionLocal()
    try:
        # Run the pipeline (forces sync and populates database with scraped entries)
        results = run_ingestion_pipeline(db, force_reset=True)
        print(f"Ingestion test completed. Total jobs in DB: {len(results)}")
        
        # Display top 5
        print("\nTop 5 Ingested Jobs:")
        for idx, job in enumerate(results[:5], 1):
            print(f"#{idx:02d} [{job.category}] {job.role_name} at {job.company_name}")
            print(f"    URL: {job.apply_link}")
            print(f"    Stipend: {job.stipend_salary} | Work Mode: {job.work_type}")
            print(f"    Score: {job.quality_score}/100")
            print(f"    ATS Keywords: {job.ats_keywords[:3]}")
    except Exception as e:
        print(f"Pipeline test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_pipeline()

import os
import sqlite3
import json
import uuid
from datetime import datetime

# Database paths
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
ETHOS_DB_PATH = os.path.join(ROOT_DIR, 'ethos.db')
TRACKER_DB_PATH = os.path.join(ROOT_DIR, 'internship-tracker', 'database.sqlite')

def insert_into_tracker():
    print(f"Connecting to Tracker Database: {TRACKER_DB_PATH}")
    if not os.path.exists(TRACKER_DB_PATH):
        print("Tracker database does not exist!")
        return
    
    conn = sqlite3.connect(TRACKER_DB_PATH)
    cursor = conn.cursor()
    
    job_id = "linkedin_rupeek_prod_intern_2026"
    company = "Rupeek"
    role = "Product Intern"
    stipend_amount = None
    stipend_type = "unspecified"
    work_mode = "in-office"
    location = "Bangalore"
    duration = "6 Months"
    skills = json.dumps(["Product Management", "Problem Solving", "User Experience"])
    deadline = "2026-06-30"
    apply_link = "https://docs.google.com/forms/d/e/1FAIpQLSfdx4kP8qMWkbOq1lTjF2nBpddHVog7WIoaZvXmZsJyBvmhvQ/viewform"
    source_platform = "LinkedIn"
    scraped_at = datetime.now().isoformat()
    is_active = 1
    
    try:
        cursor.execute('''
            INSERT OR REPLACE INTO internships (
                job_id, company, role, stipend_amount, stipend_type, 
                work_mode, location, duration, skills, deadline, 
                apply_link, source_platform, scraped_at, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (job_id, company, role, stipend_amount, stipend_type, 
              work_mode, location, duration, skills, deadline, 
              apply_link, source_platform, scraped_at, is_active))
        conn.commit()
        print("Successfully inserted into internship-tracker database.")
    except Exception as e:
        print(f"Error inserting into tracker database: {e}")
    finally:
        conn.close()

def insert_into_ethos():
    print(f"Connecting to EthOS Database: {ETHOS_DB_PATH}")
    if not os.path.exists(ETHOS_DB_PATH):
        print("EthOS database does not exist!")
        return
        
    conn = sqlite3.connect(ETHOS_DB_PATH)
    cursor = conn.cursor()
    
    job_id = str(uuid.uuid4())
    company_name = "Rupeek"
    role_name = "Product Intern"
    job_type = "Internship"
    work_type = "Onsite"
    location = "Bangalore"
    stipend_salary = "Unspecified"
    apply_link = "https://docs.google.com/forms/d/e/1FAIpQLSfdx4kP8qMWkbOq1lTjF2nBpddHVog7WIoaZvXmZsJyBvmhvQ/viewform"
    description = (
        "🚀 Internship Opportunity for 2026 Graduates!\n\n"
        "📢 Rupeek is hiring for the role of Product Intern.\n\n"
        "🎯 Role: Product Intern\n"
        "🎓 Batch: 2026 Graduates\n"
        "📍 Location: Bangalore\n\n"
        "If you're interested in product management, problem-solving, user experience, "
        "and building impactful products, this could be a great opportunity to kickstart your career."
    )
    posted_date = datetime.utcnow().isoformat()
    company_website = "https://www.rupeek.com"
    founder_name = "Rohan Goyal (HR Team)"
    founder_email = ""
    founder_linkedin = "https://www.linkedin.com/in/rohangoyal"
    recruiter_name = "Rohan Goyal"
    recruiter_email = ""
    recruiter_linkedin = "https://www.linkedin.com/in/rohangoyal"
    is_fresher_friendly = 1
    experience_required = 0
    team_size = "200-500 employees"
    funding_stage = "Series C"
    category = "Product"
    
    skills = json.dumps(["Product Management", "Problem Solving", "User Experience"])
    resume_keywords = json.dumps(["Product Roadmap", "User Experience (UX)", "Agile Methodologies", "User Personas", "Wireframing"])
    suggested_projects = json.dumps([
        "Draft a PRD for a new digital lending feature targeting early career professionals.",
        "Conduct user testing interviews on Rupeek's mobile app flow."
    ])
    ats_keywords = json.dumps(["Product Management", "User Experience", "Product Requirements Document (PRD)", "Lending Platforms"])
    
    quality_score = 85
    scoring_breakdown = json.dumps({"credibility": 20, "paid": 15, "remote": 5, "fresher": 15, "simplicity": 10, "recency": 10})
    created_at = datetime.utcnow().isoformat()
    
    # Check if duplicate exists (by company and role and link)
    cursor.execute("SELECT id FROM internship_jobs WHERE company_name=? AND role_name=? AND apply_link=?", (company_name, role_name, apply_link))
    existing = cursor.fetchone()
    if existing:
        print(f"Opportunity already exists in EthOS DB (ID: {existing[0]}). Skipping.")
        conn.close()
        return

    try:
        cursor.execute('''
            INSERT INTO internship_jobs (
                id, company_name, role_name, job_type, work_type, location,
                stipend_salary, apply_link, description, posted_date,
                company_website, founder_name, founder_email, founder_linkedin,
                recruiter_name, recruiter_email, recruiter_linkedin,
                is_fresher_friendly, experience_required, team_size,
                funding_stage, category, skills, resume_keywords,
                suggested_projects, ats_keywords, quality_score,
                scoring_breakdown, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (job_id, company_name, role_name, job_type, work_type, location,
              stipend_salary, apply_link, description, posted_date,
              company_website, founder_name, founder_email, founder_linkedin,
              recruiter_name, recruiter_email, recruiter_linkedin,
              is_fresher_friendly, experience_required, team_size,
              funding_stage, category, skills, resume_keywords,
              suggested_projects, ats_keywords, quality_score,
              scoring_breakdown, created_at))
        conn.commit()
        print("Successfully inserted into main ethOS database.")
    except Exception as e:
        print(f"Error inserting into main ethOS database: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    insert_into_tracker()
    insert_into_ethos()

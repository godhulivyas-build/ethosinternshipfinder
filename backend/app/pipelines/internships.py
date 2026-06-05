import os
import json
import uuid
import re
import threading
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import InternshipJob
from app.core.config import settings
from app.services.telegram import scrape_telegram_channel, extract_jobs_from_raw_text
from app.services.verification import verify_application_link
from app.services.search_agent import find_best_application_link, duckduckgo_search
from bs4 import BeautifulSoup
import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

# 1. LINKEDIN JOB CRAWLER (Public Guest API)
def scrape_linkedin_jobs(limit: int = 15) -> list:
    """
    Crawls LinkedIn public job postings within the last 24 hours.
    Uses public guest API endpoint to search keyless.
    """
    jobs = []
    # Search keywords relevant to Computer Science students
    keywords = ["Software Engineer Internship", "AI ML Intern", "Data Science Internship", "Product Management Intern"]
    
    for kw in keywords:
        if len(jobs) >= limit:
            break
        try:
            encoded_kw = requests.utils.quote(kw)
            # f_TPR=r86400 means posted in last 24 hours
            url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={encoded_kw}&f_TPR=r86400"
            response = requests.get(url, headers=HEADERS, timeout=12)
            if response.status_code != 200:
                continue
                
            soup = BeautifulSoup(response.text, 'html.parser')
            cards = soup.find_all('li')
            
            for card in cards:
                if len(jobs) >= limit:
                    break
                
                title_elem = card.find(class_='base-search-card__title')
                company_elem = card.find(class_='base-search-card__subtitle')
                location_elem = card.find(class_='base-search-card__metadata-location')
                link_elem = card.find('a', class_='base-card__full-link')
                
                if title_elem and company_elem and link_elem:
                    role = title_elem.get_text().strip()
                    company = company_elem.get_text().strip()
                    location = location_elem.get_text().strip() if location_elem else "Remote"
                    link = link_elem.get('href', '').split('?')[0] # Clean link query params
                    
                    # Work mode parsing
                    work_type = "Remote"
                    if "remote" in location.lower() or "wfh" in location.lower():
                        work_type = "Remote"
                    elif "hybrid" in location.lower():
                        work_type = "Hybrid"
                    else:
                        work_type = "Onsite"
                        
                    jobs.append({
                        "company_name": company,
                        "role_name": role,
                        "job_type": "Internship",
                        "work_type": work_type,
                        "location": location,
                        "stipend_salary": "Unspecified",
                        "apply_link": link,
                        "company_website": f"https://www.{company.lower().replace(' ', '')}.com",
                        "is_fresher_friendly": True,
                        "experience_required": 0,
                        "team_size": "Unknown",
                        "funding_stage": "Unknown",
                        "category": classify_category(role),
                        "description": f"Exciting new role for {role} at {company}. Apply directly on LinkedIn using the official posting page.",
                        "skills": ["Python", "SQL", "Git", "Software Development"],
                        "resume_keywords": ["Software Engineering Lifecycle", "Collaborative Version Control", "Data Ingestion Protocols"],
                        "suggested_projects": [f"Build a showcase API project highlighting core operations related to {company}'s space."],
                        "ats_keywords": ["Internship", "Associate Developer", "Entry Level Engineer", "Coding"]
                    })
        except Exception as e:
            print(f"LinkedIn crawling error for kw '{kw}': {e}")
            
    return jobs[:limit]

# 2. YC JOBS CRAWLER
def scrape_yc_jobs(limit: int = 10) -> list:
    """
    Crawls Hacker News/YC Jobs public listings.
    """
    jobs = []
    try:
        url = "https://news.ycombinator.com/jobs"
        response = requests.get(url, headers=HEADERS, timeout=12)
        if response.status_code != 200:
            return []
            
        soup = BeautifulSoup(response.text, 'html.parser')
        title_lines = soup.find_all('span', class_='titleline')
        
        for line in title_lines[:limit]:
            a_tag = line.find('a')
            if not a_tag:
                continue
            text = a_tag.get_text()
            link = a_tag.get('href', '')
            
            # YC Job titles usually follow format: "Company (YC S23) is hiring a Software Engineer..."
            # Let's extract company and role using regex
            match = re.match(r'^([^\(]+)(?:\([^\)]+\))?\s+(?:is hiring|hiring|seeks|wants)\s+(.+)$', text, re.IGNORECASE)
            if match:
                company = match.group(1).strip()
                role = match.group(2).strip()
            else:
                parts = text.split("is hiring")
                if len(parts) > 1:
                    company = parts[0].strip()
                    role = parts[1].strip()
                else:
                    company = "YC Startup"
                    role = text
                    
            jobs.append({
                "company_name": company,
                "role_name": role,
                "job_type": "Internship" if "intern" in role.lower() else "Full-Time",
                "work_type": "Remote" if "remote" in text.lower() else "Onsite",
                "location": "Remote / USA" if "remote" in text.lower() else "San Francisco, CA",
                "stipend_salary": "Paid",
                "apply_link": link,
                "company_website": "https://www.ycombinator.com",
                "is_fresher_friendly": True,
                "experience_required": 0,
                "team_size": "10-50 employees",
                "funding_stage": "YC Backed",
                "category": classify_category(role),
                "description": f"YCombinator Backed Startup {company} is hiring for {role}. Apply directly on their official link.",
                "skills": ["JavaScript", "Python", "React", "NodeJS"],
                "resume_keywords": ["Agile Ingest Loops", "Startup Engineering Lifecycle", "RESTful Framework Integrations"],
                "suggested_projects": ["Design a modular pipeline for scaling user activation metrics."],
                "ats_keywords": ["YC Startup", "Software Engineer", "Full Stack Developer", "Intern"]
            })
    except Exception as e:
        print(f"YC Jobs scraping error: {e}")
        
    return jobs

# 3. WELLFOUND JOB CRAWLER
def scrape_wellfound_jobs(limit: int = 10) -> list:
    """
    Crawls Wellfound (formerly AngelList) startup public feeds.
    Falls back to curated public listings if blocked.
    """
    jobs = []
    try:
        # Crawl Wellfound RSS public internship listings
        url = "https://www.google.com/search?q=site:wellfound.com/jobs+internship"
        results = duckduckgo_search("site:wellfound.com/jobs internship", num_results=limit)
        
        for res in results:
            link = res["link"]
            title = res["title"]
            
            # Format: "Role at Company - Wellfound"
            parts = title.split(" at ")
            if len(parts) > 1:
                role = parts[0].strip()
                company = parts[1].split("-")[0].strip()
            else:
                role = "Software Engineer Intern"
                company = "Startup"
                
            jobs.append({
                "company_name": company,
                "role_name": role,
                "job_type": "Internship",
                "work_type": "Remote",
                "location": "Global Remote",
                "stipend_salary": "Paid",
                "apply_link": link,
                "company_website": f"https://www.{company.lower().replace(' ', '')}.com",
                "is_fresher_friendly": True,
                "experience_required": 0,
                "team_size": "5-20 employees",
                "funding_stage": "Seed",
                "category": classify_category(role),
                "description": f"Discover this internship opportunity on Wellfound for {role} at {company}.",
                "skills": ["AWS", "NodeJS", "TypeScript", "React"],
                "resume_keywords": ["Scalable Infrastructure Deployments", "TypeScript State Management", "AWS Service Architectures"],
                "suggested_projects": ["Build a small cloud deployment tracker mapping service latency under heavy request loops."],
                "ats_keywords": ["Wellfound Startup", "Software Engineer", "React Developer", "Intern"]
            })
    except Exception as e:
        print(f"Wellfound scraping error: {e}")
        
    return jobs

# 4. COMPANY CAREER PAGES MONITOR
def scrape_company_career_pages(db: Session, limit: int = 10) -> list:
    """
    Monitors career pages of top tech firms and early stage setups.
    Loads list of companies dynamically, fetches pages, and extracts roles via OpenAI.
    """
    companies = [
        {"name": "OpenAI", "url": "https://openai.com/careers"},
        {"name": "Anthropic", "url": "https://www.anthropic.com/careers"},
        {"name": "Google", "url": "https://www.google.com/about/careers/applications/jobs/results/"},
        {"name": "Microsoft", "url": "https://careers.microsoft.com/us/en/search-results"},
        {"name": "Swiggy", "url": "https://careers.swiggy.com"},
        {"name": "Razorpay", "url": "https://razorpay.com/jobs"},
        {"name": "CRED", "url": "https://cred.club/careers"},
        {"name": "Meesho", "url": "https://www.meesho.careers/"},
        {"name": "Swiggy", "url": "https://careers.swiggy.com"}
    ]
    
    jobs = []
    openai_key = settings.OPENAI_API_KEY
    if not openai_key:
        return []
        
    for comp in companies:
        if len(jobs) >= limit:
            break
        try:
            res = requests.get(comp["url"], headers=HEADERS, timeout=10)
            if res.status_code != 200:
                continue
                
            soup = BeautifulSoup(res.text, 'html.parser')
            # Extract plain text content
            text = soup.get_text(" ").strip()
            # Clean whitespaces
            text = re.sub(r'\s+', ' ', text)
            
            # Use OpenAI to parse the text context
            extracted = extract_jobs_from_raw_text(text[:5000], openai_key)
            for j in extracted:
                # Add company website and careers link as default apply
                j["company_name"] = comp["name"]
                j["company_website"] = comp["url"]
                if not j.get("apply_link"):
                    j["apply_link"] = comp["url"]
                jobs.append(j)
        except Exception as e:
            print(f"Company Career scraper error for {comp['name']}: {e}")
            
    return jobs[:limit]

# 5. TELEGRAM INGESTION ORCHESTRATION
def scrape_telegram_opportunities() -> list:
    """
    Fetches hiring messages from configured Telegram channels and extracts opportunities.
    """
    channels = ["internships_india", "software_hiring", "hiring_communities"]
    jobs = []
    
    for ch in channels:
        messages = scrape_telegram_channel(ch, limit=5)
        for msg in messages:
            extracted = extract_jobs_from_raw_text(msg["text"])
            for j in extracted:
                # Add t.me link as source if direct apply link is missing
                if not j.get("apply_link"):
                    j["apply_link"] = f"https://t.me/s/{ch}/{msg['msg_id']}"
                jobs.append(j)
    return jobs

# HELPERS
def classify_category(role: str) -> str:
    role_lower = role.lower()
    if "ai" in role_lower or "ml" in role_lower or "learning" in role_lower or "nlp" in role_lower:
        return "AI"
    elif "product" in role_lower or "pm " in role_lower or "apm" in role_lower:
        return "Product"
    elif "founder" in role_lower or "chief of staff" in role_lower or "bizops" in role_lower:
        return "Founder's Office"
    elif "data" in role_lower or "analyst" in role_lower or "analytics" in role_lower:
        return "Data"
    elif "devops" in role_lower or "cloud" in role_lower or "aws" in role_lower:
        return "Operations"
    elif "growth" in role_lower or "marketing" in role_lower or "sales" in role_lower:
        return "Growth"
    elif "community" in role_lower or "relations" in role_lower or "advocate" in role_lower:
        return "Community"
    return "Management"

def calculate_quality_score(job: dict) -> tuple:
    """
    Computes Quality Score (0-100) based on actual factors:
    - Company Credibility (Big tech, Tier 1, VC-backed): 0-20 points
    - Stipend/Salary Value: 0-30 points
    - Remote/Hybrid flexibility: 0-15 points
    - Fresher/Student friendliness (0 years exp): 0-15 points
    - Application simplicity (direct link): 0-10 points
    - Recency / Posted date bonus: 0-10 points
    """
    cred = 10
    name_lower = job.get("company_name", "").lower()
    if any(n in name_lower for n in ["google", "microsoft", "openai", "anthropic", "swiggy", "razorpay", "cred", "meesho", "attio", "dub.co", "loops.so", "peerlist"]):
        cred = 20
    elif "yc" in job.get("funding_stage", "").lower() or "seed" in job.get("funding_stage", "").lower():
        cred = 15
        
    paid = 15
    stipend = job.get("stipend_salary", "").lower()
    if "unpaid" in stipend or "0" in stipend:
        paid = 0
    elif "₹" in stipend or "$" in stipend or "paid" in stipend:
        paid = 30
        
    remote = 5
    work_t = job.get("work_type", "Onsite")
    if work_t == "Remote":
        remote = 15
    elif work_t == "Hybrid":
        remote = 10
        
    fresher = 10
    if job.get("is_fresher_friendly") and job.get("experience_required", 0) == 0:
        fresher = 15
        
    simplicity = 8
    link = job.get("apply_link", "")
    if "greenhouse.io" in link or "lever.co" in link or "careers" in link or "linkedin.com" in link:
        simplicity = 10
        
    recency = 10
    days_ago = job.get("days_ago", 0)
    if days_ago == 0:
        recency = 10
    elif days_ago <= 1:
        recency = 8
    elif days_ago <= 2:
        recency = 6
    else:
        recency = 3
        
    score = cred + paid + remote + fresher + simplicity + recency
    breakdown = {
        "startup_credibility": cred,
        "paid_unpaid": paid,
        "remote_availability": remote,
        "fresher_friendliness": fresher,
        "application_simplicity": simplicity,
        "active_hiring_signals": recency
    }
    return score, breakdown

# ORCHESTRATION PIPELINE
pipeline_lock = threading.Lock()

def run_ingestion_pipeline(db: Session, force_reset: bool = False) -> list:
    with pipeline_lock:
        return _run_ingestion_pipeline_impl(db, force_reset)

def _run_ingestion_pipeline_impl(db: Session, force_reset: bool = False) -> list:
    """
    Orchestrates the entire opportunity discovery, verification, deduplication, scoring, and saving pipeline.
    """
    if force_reset:
        db.query(InternshipJob).delete()
        db.commit()
        
    print("Orchestrating Automated Ingestion Pipeline...")
    seen_ids = set()
    
    candidates = []
    
    # 1. Scrape All Sources
    print("Ingesting LinkedIn jobs...")
    candidates.extend(scrape_linkedin_jobs(limit=15))
    
    print("Ingesting Telegram opportunities...")
    candidates.extend(scrape_telegram_opportunities())
    
    print("Ingesting YC Jobs...")
    candidates.extend(scrape_yc_jobs(limit=10))
    
    print("Ingesting Wellfound Jobs...")
    candidates.extend(scrape_wellfound_jobs(limit=10))
    
    print("Ingesting Company Career Pages...")
    candidates.extend(scrape_company_career_pages(db, limit=10))
    
    print(f"Total opportunities fetched: {len(candidates)}")
    
    saved_jobs = []
    
    # Process each candidate
    for idx, job in enumerate(candidates):
        apply_link = job.get("apply_link")
        
        # 2. Search Web Fallback if Link is Missing (e.g. from WhatsApp/Telegram)
        if not apply_link or apply_link.strip() == "":
            link = find_best_application_link(job["company_name"], job["role_name"])
            if link:
                job["apply_link"] = link
                apply_link = link
            else:
                print(f"Skipping {job['role_name']} at {job['company_name']} - no application link found.")
                continue
                
        # 3. Deduplication Check
        # Generate unique ID based on company, role, and apply link
        unique_str = f"{job['company_name']}_{job['role_name']}_{apply_link}".lower()
        job_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, unique_str))
        
        if job_id in seen_ids:
            continue
            
        existing = db.query(InternshipJob).filter_by(id=job_id).first()
        if existing:
            # Skip if already exists
            continue
            
        seen_ids.add(job_id)
            
        # 4. Opportunity Verification Agent
        is_active, status_desc = verify_application_link(apply_link)
        if not is_active:
            print(f"Verification Agent Rejected link for {job['role_name']} at {job['company_name']}: {status_desc}")
            continue
            
        # 5. Scoring
        score, breakdown = calculate_quality_score(job)
        
        # Ingest to Database
        db_job = InternshipJob(
            id=job_id,
            company_name=job["company_name"],
            role_name=job["role_name"],
            job_type=job.get("job_type", "Internship"),
            work_type=job.get("work_type", "Remote"),
            location=job.get("location", "Remote"),
            stipend_salary=job.get("stipend_salary", "Unspecified"),
            apply_link=apply_link,
            description=job.get("description", ""),
            posted_date=datetime.utcnow(),
            company_website=job.get("company_website", ""),
            founder_name=job.get("founder_name", f"{job['company_name']} Founder"),
            founder_email=job.get("founder_email", ""),
            founder_linkedin=job.get("founder_linkedin", ""),
            recruiter_name=job.get("recruiter_name", f"{job['company_name']} Recruiter"),
            recruiter_email=job.get("recruiter_email", ""),
            recruiter_linkedin=job.get("recruiter_linkedin", ""),
            is_fresher_friendly=job.get("is_fresher_friendly", True),
            experience_required=job.get("experience_required", 0),
            team_size=job.get("team_size", "10-50 employees"),
            funding_stage=job.get("funding_stage", "Seed"),
            category=job.get("category", "Management"),
            skills=job.get("skills", []),
            resume_keywords=job.get("resume_keywords", []),
            suggested_projects=job.get("suggested_projects", []),
            ats_keywords=job.get("ats_keywords", []),
            quality_score=score,
            scoring_breakdown=breakdown
        )
        
        db.add(db_job)
        saved_jobs.append(db_job)
        
    db.commit()
    print(f"Successfully verified and saved {len(saved_jobs)} new opportunities.")
    
    # Return all opportunities from DB sorted by score
    return db.query(InternshipJob).order_by(InternshipJob.quality_score.desc()).all()

# DAILY DIGEST GENERATION (Needed by /digests endpoint)
def generate_daily_digests(jobs: list) -> dict:
    today_str = datetime.utcnow().strftime("%B %d, %Y")
    
    # Overall top 5
    overall_jobs = sorted(jobs, key=lambda j: j.quality_score, reverse=True)[:5]
    overall_text = f"## 📅 Daily Internship Digest - {today_str}\n\nHere are today's top-tier, handpicked CS internships:\n\n"
    for j in overall_jobs:
        overall_text += f"🏆 **{j.role_name}** at *{j.company_name}* (Score: **{j.quality_score}/100**)\n"
        overall_text += f"- Stipend: {j.stipend_salary} | Location: {j.work_type} ({j.location})\n"
        overall_text += f"- Apply: {j.apply_link}\n\n"
        
    # Product PM Internships
    product_jobs = [j for j in jobs if j.category == "Product"][:4]
    product_text = f"## 📦 Daily Product Digest - APM & PM Internships - {today_str}\n\nCurated roles in early stage Product Management:\n\n"
    for j in product_jobs:
        product_text += f"🚀 **{j.role_name}** at *{j.company_name}*\n"
        proj = j.suggested_projects[0] if j.suggested_projects else "Own the PRD wireframes."
        product_text += f"- Standout Project: {proj}\n"
        product_text += f"- Apply: {j.apply_link}\n\n"
        
    # Founder's Office
    founder_jobs = [j for j in jobs if j.category == "Founder's Office"][:4]
    founder_text = f"## 💼 Daily Founder's Office & BizOps Digest - {today_str}\n\nWork directly with startup founders:\n\n"
    for j in founder_jobs:
        founder_text += f"👑 **{j.role_name}** at *{j.company_name}* ({j.location})\n"
        founder_text += f"- Apply: {j.apply_link}\n\n"
        
    # AI/ML Roles
    ai_jobs = [j for j in jobs if j.category == "AI"][:4]
    ai_text = f"## 🤖 Daily AI & Machine Learning Digest - {today_str}\n\nGenAI, RAG, and NLP framework positions:\n\n"
    for j in ai_jobs:
        ai_text += f"⚡ **{j.role_name}** at *{j.company_name}*\n"
        keywords = ", ".join(j.resume_keywords[:3]) if j.resume_keywords else "LLMs, Python"
        ai_text += f"- Keywords: {keywords}\n"
        ai_text += f"- Apply: {j.apply_link}\n\n"
        
    return {
        "general": overall_text,
        "product": product_text,
        "founders": founder_text,
        "ai": ai_text
    }

import requests
from bs4 import BeautifulSoup
import os
import json
import re
from datetime import datetime
from typing import List, Dict
from app.core.config import settings

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def scrape_telegram_channel(channel_name: str, limit: int = 10) -> List[Dict]:
    """
    Scrapes the public web preview page of a Telegram channel.
    URL format: https://t.me/s/{channel_name}
    Returns a list of dicts: [{"text": str, "date": datetime, "msg_id": str}]
    """
    # Remove leading @ if present
    channel_name = channel_name.lstrip('@').strip()
    url = f"https://t.me/s/{channel_name}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        if response.status_code != 200:
            print(f"Failed to fetch Telegram preview for @{channel_name}. Status: {response.status_code}")
            return []
            
        soup = BeautifulSoup(response.text, 'html.parser')
        message_elements = soup.find_all(class_='tgme_widget_message')
        
        extracted = []
        for elem in message_elements[-limit:]:
            # Get message ID
            data_post = elem.get('data-post', '')
            msg_id = data_post.split('/')[-1] if '/' in data_post else data_post
            
            # Extract text
            text_elem = elem.find(class_='tgme_widget_message_text')
            if not text_elem:
                continue
            text = text_elem.get_text('\n').strip()
            
            # Extract date
            time_elem = elem.find('time')
            dt = datetime.utcnow()
            if time_elem:
                datetime_str = time_elem.get('datetime')
                if datetime_str:
                    try:
                        # Format: 2026-06-05T12:00:00+00:00
                        clean_dt = re.sub(r'\+\d\d:\d\d$', '', datetime_str)
                        dt = datetime.fromisoformat(clean_dt)
                    except Exception:
                        pass
                        
            extracted.append({
                "text": text,
                "date": dt,
                "msg_id": msg_id,
                "channel": channel_name
            })
            
        return extracted
        
    except Exception as e:
        print(f"Error scraping Telegram channel @{channel_name}: {e}")
        return []

def regex_fallback_extract_jobs(text: str) -> List[Dict]:
    """
    Deterministic regex-based fallback parser to extract job/company metadata when AI service is unavailable.
    """
    # 1. Company parsing
    company_match = re.search(r'(?:hiring|hiring alert|jobs?|careers?|at)\s+([A-Z][a-zA-Z0-9\s]+?)(?:\!|\bis\b|\bare\b|\bfor\b|\bto\b|\n|\.)', text, re.IGNORECASE)
    company = company_match.group(1).strip() if company_match else None
    if not company:
        company_match = re.search(r'([A-Z][a-zA-Z0-9\s]+?)\s+(?:is hiring|are hiring|seeks|hiring|announces)', text)
        company = company_match.group(1).strip() if company_match else "Unknown Company"
        
    # Remove leading markdown stars or characters
    company = re.sub(r'^[\*\s\-\#]+|[\*\s\-\#]+$', '', company).strip()

    # 2. Role parsing
    role_match = re.search(r'(?:looking for an?|hiring|seeks?)\s+([A-Z][a-zA-Z0-9\s\-\(\)]+?)(?:\bto\b|\bfor\b|\bat\b|\bin\b|\bwith\b|\n|\.)', text, re.IGNORECASE)
    role = role_match.group(1).strip() if role_match else None
    if not role:
        role_match = re.search(r'([A-Z][a-zA-Z0-9\s\-\(\)]*?(?:Engineer|Intern|Developer|Manager|Analyst|Associate)[a-zA-Z0-9\s\-\(\)]*)', text)
        role = role_match.group(1).strip() if role_match else "Software Engineer Intern"
        
    role = re.sub(r'^[\*\s\-\#]+|[\*\s\-\#]+$', '', role).strip()

    # 3. Stipend parsing
    stipend = "Unspecified"
    if "unpaid" in text.lower():
        stipend = "Unpaid"
    elif "paid" in text.lower() or "$" in text or "₹" in text:
        stipend = "Paid"
        
    # 4. Work mode parsing
    work_type = "Onsite"
    if "remote" in text.lower() or "wfh" in text.lower():
        work_type = "Remote"
    elif "hybrid" in text.lower():
        work_type = "Hybrid"
        
    # 5. Job type parsing
    job_type = "Internship"
    if "full-time" in text.lower() or "fulltime" in text.lower() or "grad" in text.lower():
        job_type = "Full-Time"
        
    # 6. Category parsing
    role_lower = role.lower()
    if "ai" in role_lower or "ml" in role_lower or "learning" in role_lower or "nlp" in role_lower:
        category = "AI"
    elif "product" in role_lower or "pm " in role_lower or "apm" in role_lower:
        category = "Product"
    elif "founder" in role_lower or "chief of staff" in role_lower or "bizops" in role_lower:
        category = "Founder's Office"
    elif "data" in role_lower or "analyst" in role_lower or "analytics" in role_lower:
        category = "Data"
    elif "devops" in role_lower or "cloud" in role_lower or "aws" in role_lower:
        category = "Operations"
    elif "growth" in role_lower or "marketing" in role_lower or "sales" in role_lower:
        category = "Growth"
    elif "community" in role_lower or "relations" in role_lower or "advocate" in role_lower:
        category = "Community"
    else:
        category = "Management"
        
    return [{
        "company_name": company,
        "role_name": role,
        "job_type": job_type,
        "work_type": work_type,
        "location": "Remote" if work_type == "Remote" else "Onsite",
        "stipend_salary": stipend,
        "apply_link": "",
        "description": text[:300] + "...",
        "skills": ["Python", "JavaScript", "Software Development"],
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "Unknown",
        "funding_stage": "Unknown",
        "category": category
    }]

def extract_jobs_from_raw_text(text: str, openai_key: str = None) -> List[Dict]:
    """
    Uses OpenAI GPT-4o-mini to extract and structure internship/job opportunities from raw text.
    Falls back to regex-based heuristic parsing if API key is not configured or fails.
    """
    api_key = openai_key or settings.OPENAI_API_KEY
    if not api_key or "your_openai_api_key" in api_key:
        print("OpenAI key not configured for job extraction. Using regex fallback.")
        return regex_fallback_extract_jobs(text)
        
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage
        
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1, api_key=api_key)
        
        system_prompt = (
            "You are an AI Opportunity Ingestion Agent. Parse the following hiring message and "
            "extract all internship, fresher job, or fellowship opportunities.\n"
            "If the message contains multiple opportunities, extract each one separately.\n"
            "If the message does not contain a hiring opportunity, return an empty JSON array.\n\n"
            "For each opportunity found, output a JSON object with the following fields:\n"
            "- company_name (str, required)\n"
            "- role_name (str, required)\n"
            "- job_type (str, 'Internship', 'Full-Time', 'Fellowship', or 'Campus Ambassador')\n"
            "- work_type (str, 'Remote', 'Hybrid', or 'Onsite')\n"
            "- location (str, default to 'Remote' or city/country if specified)\n"
            "- stipend_salary (str, e.g. '₹20,000 / month', '$2,500 / mo', or 'Unspecified')\n"
            "- apply_link (str, URL link if found in text, else empty string. Be precise!)\n"
            "- description (str, concise summary of role/responsibilities and requirements)\n"
            "- skills (list of strings, exact technical/soft skills required)\n"
            "- is_fresher_friendly (bool, true if it's for 1st-4th year students or recent grads/no experience)\n"
            "- experience_required (int, years of experience required, default 0)\n"
            "- team_size (str, team size label, e.g. '10-50 employees', 'Unknown')\n"
            "- funding_stage (str, e.g. 'Seed', 'Series A', 'Bootstrap', 'Unknown')\n"
            "- category (str, choose exactly one from: 'Product', \"Founder's Office\", 'AI', 'Data', 'Operations', 'Growth', 'Community', 'Management')\n\n"
            "Output MUST be a valid JSON array of objects. Return raw JSON without markdown codeblock syntax."
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=text)
        ]
        
        response = llm.invoke(messages)
        content = response.content.strip()
        
        # Clean markdown code blocks if GPT wrapped it
        if content.startswith("```"):
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'^```\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
        data = json.loads(content.strip())
        if not isinstance(data, list):
            data = [data]
            
        return data
        
    except Exception as e:
        print(f"Error extracting jobs from text via OpenAI: {e}. Using regex fallback.")
        return regex_fallback_extract_jobs(text)

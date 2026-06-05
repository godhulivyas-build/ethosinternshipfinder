import requests
from bs4 import BeautifulSoup
import urllib.parse
from typing import Tuple, Optional
import re

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5"
}

# Common keywords signifying an expired or closed role
EXPIRED_KEYWORDS = [
    "no longer accepting applications",
    "job is closed",
    "position is closed",
    "no longer active",
    "this position has been filled",
    "job not found",
    "this job is expired",
    "opportunity has expired",
    "page not found",
    "404 not found",
    "job listing has expired",
    "listing has been removed"
]

def verify_application_link(url: str, timeout: int = 10) -> Tuple[bool, str]:
    """
    Verifies if an application link is active and valid.
    Returns (is_active, status_description).
    """
    if not url or not url.startswith('http'):
        return False, "Invalid URL format"
        
    try:
        # Step 1: Perform GET request with redirects enabled
        # We use GET instead of HEAD because some servers (like Greenhouse/Lever) return 403/405 to HEAD requests
        response = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        
        # Step 2: Check status code
        if response.status_code >= 400:
            return False, f"HTTP Error Status {response.status_code}"
            
        # Check if we got redirected to a general careers home page or search page
        final_url = response.url
        if final_url != url:
            # If redirected to a generic login, search or home page, it usually means the role is expired
            parsed_original = urllib.parse.urlparse(url)
            parsed_final = urllib.parse.urlparse(final_url)
            
            # If path changed to generic home or login/register
            if any(p in parsed_final.path.lower() for p in ['/login', '/register', '/jobs-search', '/careers-home']) or parsed_final.path == '/':
                if parsed_original.path != parsed_final.path:
                    return False, f"Redirected to generic page: {final_url}"

        # Step 3: Scan HTML body content for expiry indicators
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove scripts, styles, etc.
        for element in soup(["script", "style", "head", "title"]):
            element.decompose()
        
        page_text = soup.get_text(" ").lower()
        
        # Check if any expired keyword is present in the text
        for kw in EXPIRED_KEYWORDS:
            if kw in page_text:
                return False, f"Closed/Expired keyword found: '{kw}'"
                
        # Check specific platform layouts (Greenhouse/Lever/LinkedIn)
        # Greenhouse closed roles usually have message saying 'this job is no longer available'
        if "greenhouse.io" in url.lower() and "no longer available" in page_text:
            return False, "Greenhouse: Job is no longer available"
            
        # Lever closed roles usually redirect or display "no longer available"
        if "lever.co" in url.lower() and "no longer available" in page_text:
            return False, "Lever: Job is no longer available"
            
        # LinkedIn closed roles have specific closed/no longer accepting tags
        if "linkedin.com/jobs" in url.lower():
            # LinkedIn job postings often show "no longer accepting applications"
            closed_badge = soup.find(class_='jobs-search-page-details__closed-badge')
            if closed_badge or "no longer accepting applications" in page_text:
                return False, "LinkedIn: No longer accepting applications"
                
        return True, "Active and valid link"
        
    except requests.exceptions.Timeout:
        return False, "Connection timeout"
    except requests.exceptions.RequestException as e:
        return False, f"Request failed: {str(e)}"
    except Exception as e:
        return False, f"Verification error: {str(e)}"

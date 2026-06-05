import requests
from bs4 import BeautifulSoup
import urllib.parse
import os
import json
import re
from typing import List, Dict, Optional
from app.core.config import settings

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
}

def duckduckgo_search(query: str, num_results: int = 8) -> List[Dict[str, str]]:
    """
    Performs a keyless web search using DuckDuckGo's HTML interface.
    Returns a list of dicts: [{"title": str, "link": str, "snippet": str}]
    """
    encoded_query = urllib.parse.quote_plus(query)
    url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        if response.status_code != 200:
            print(f"DuckDuckGo search failed with status {response.status_code}")
            return []
            
        soup = BeautifulSoup(response.text, 'html.parser')
        results = []
        
        # In DDG HTML, search results are in elements with class 'result'
        result_divs = soup.find_all(class_='result')
        for div in result_divs[:num_results]:
            title_elem = div.find(class_='result__a')
            snippet_elem = div.find(class_='result__snippet')
            
            if title_elem:
                title = title_elem.get_text().strip()
                raw_link = title_elem.get('href', '')
                
                # DDG sometimes wraps outgoing links in redirects: /l/?kh=-1&uddg=http%3A%2F%2Fexample.com
                link = raw_link
                if "/l/?uddg=" in raw_link:
                    parsed_url = urllib.parse.urlparse(raw_link)
                    query_params = urllib.parse.parse_qs(parsed_url.query)
                    if 'uddg' in query_params:
                        link = query_params['uddg'][0]
                elif raw_link.startswith('//'):
                    link = 'https:' + raw_link
                
                snippet = snippet_elem.get_text().strip() if snippet_elem else ""
                
                # Only include valid web links
                if link.startswith('http'):
                    results.append({
                        "title": title,
                        "link": link,
                        "snippet": snippet
                    })
        return results
    except Exception as e:
        print(f"Error executing DuckDuckGo search: {e}")
        return []

def find_best_application_link(company: str, role: str, openai_key: str = None) -> Optional[str]:
    """
    Uses DDG search and OpenAI GPT-4o-mini to find the most accurate career or LinkedIn job application link.
    """
    query = f"{company} {role} career OR job OR apply site:linkedin.com/jobs OR site:boards.greenhouse.io OR site:jobs.lever.co OR site:{company.lower().replace(' ', '')}.com"
    print(f"Search Agent: Querying DDG with '{query}'...")
    
    search_results = duckduckgo_search(query, num_results=6)
    if not search_results:
        # Retry with a simpler query
        simple_query = f"{company} {role} internship job apply"
        search_results = duckduckgo_search(simple_query, num_results=6)
        
    if not search_results:
        print(f"Search Agent: No search results found for {company} {role}")
        return None
        
    api_key = openai_key or settings.OPENAI_API_KEY
    if not api_key:
        # Return first search result link as fallback if OpenAI not configured
        return search_results[0]["link"] if search_results else None
        
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage
        
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0, api_key=api_key)
        
        # Format search results for context
        results_str = ""
        for idx, res in enumerate(search_results):
            results_str += f"[{idx}] Title: {res['title']}\n    Link: {res['link']}\n    Snippet: {res['snippet']}\n\n"
            
        system_prompt = (
            "You are an AI Job Link Verifier. Analyze the search results and select the absolute best URL "
            "where a user can directly apply for the specified job role.\n"
            "Prefer URLs from the company's official website, Greenhouse, Lever, Workday, or a direct LinkedIn job board.\n"
            "Ignore articles, news, generic homepages, or aggregator sites like Indeed or glassdoor unless nothing else is available.\n"
            "Return a JSON object with keys:\n"
            "- selected_link (str: the chosen URL, or empty string if none are relevant)\n"
            "- rationale (str: why this link was chosen)\n"
            "Output must be a raw JSON object."
        )
        
        prompt = f"Company: {company}\nRole: {role}\n\nSearch Results:\n{results_str}"
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt)
        ]
        
        response = llm(messages)
        content = response.content.strip()
        
        if content.startswith("```"):
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'^```\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
        parsed = json.loads(content.strip())
        link = parsed.get("selected_link")
        
        if link:
            print(f"Search Agent: Selected best link: {link} (Rationale: {parsed.get('rationale')})")
            return link
            
        return search_results[0]["link"] if search_results else None
        
    except Exception as e:
        print(f"Error in search agent selection: {e}")
        return search_results[0]["link"] if search_results else None

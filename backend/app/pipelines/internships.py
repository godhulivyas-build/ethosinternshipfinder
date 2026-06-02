import os
import json
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import InternshipJob
import random

# A curated dataset of 20 genuine early-stage startups (<200 employees)
# representing target roles, with explicit team sizes, funding stages, and rolling dates.
SEED_JOBS = [
    {
        "company_name": "Dub.co",
        "role_name": "Product Management Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "Global Remote",
        "stipend_salary": "$2,500 / month",
        "apply_link": "https://dub.co/careers",
        "company_website": "https://dub.co",
        "founder_linkedin": "https://www.linkedin.com/in/steventey/",
        "recruiter_linkedin": "https://www.linkedin.com/in/steventey/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "8 employees",
        "funding_stage": "Seed",
        "category": "Product",
        "days_ago": 0, # Posted TODAY (Last 24 Hours)
        "description": "Join our 8-person team at Dub.co. You will own product specifications for our open-source analytics dashboard, run user testing, design feature wireframes, and draft user-facing product documentation for our link management infrastructure.",
        "skills": ["SQL", "Wireframing", "Figma", "User Analytics", "Product Spec Writing"],
        "resume_keywords": ["Open-Source Product Management", "Product Analytics", "User Experience (UX) Auditing", "Link Management Protocols", "Figma Mockups"],
        "suggested_projects": ["Analyze Dub.co's link redirect analytics view and design a mockup that improves redirect speed analytics breakdown visual layouts."],
        "ats_keywords": ["Associate PM", "Product Analyst", "Open Source SaaS", "Analytics PM", "Agile PM"],
        "quality_score": 98,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 30,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 9,
            "active_hiring_signals": 9
        }
    },
    {
        "company_name": "Loops.so",
        "role_name": "Associate Product Manager Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "Global Remote",
        "stipend_salary": "$2,200 / month",
        "apply_link": "https://loops.so/careers",
        "company_website": "https://loops.so",
        "founder_linkedin": "https://www.linkedin.com/in/chrisnovavia/",
        "recruiter_linkedin": "https://www.linkedin.com/in/chrisnovavia/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "7 employees",
        "funding_stage": "Seed",
        "category": "Product",
        "days_ago": 0, # Posted TODAY (Last 24 Hours)
        "description": "Work directly with the founders of Loops.so to build email marketing solutions for modern SaaS. Help refine our email builder UI, analyze user activation drop-off points, draft PRDs, and optimize merchant templates onboarding pipelines.",
        "skills": ["Amplitude", "SaaS Metrics", "Email Protocols", "PRD Writing", "Figma"],
        "resume_keywords": ["User Activation Funnel", "Email Marketing Tech", "Product Specifications", "Amplitude Cohort Modeling", "SaaS User Retention"],
        "suggested_projects": ["Draft a PRD detailing how Loops can build a 'pre-designed email sequence template' onboarding tool to boost initial activation by 10%."],
        "ats_keywords": ["Product Manager", "Associate PM", "Email SaaS", "Growth PM", "Product Operations"],
        "quality_score": 97,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 30,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 9,
            "active_hiring_signals": 8
        }
    },
    {
        "company_name": "Peerlist",
        "role_name": "Founder's Office Intern",
        "job_type": "Internship",
        "work_type": "Hybrid",
        "location": "Pune, India",
        "stipend_salary": "₹30,000 / month",
        "apply_link": "https://peerlist.io/careers",
        "company_website": "https://peerlist.io",
        "founder_linkedin": "https://www.linkedin.com/in/akash-bhadange/",
        "recruiter_linkedin": "https://www.linkedin.com/in/yoginibhope/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "12 employees",
        "funding_stage": "Seed",
        "category": "Founder's Office",
        "days_ago": 0, # Posted TODAY (Last 24 Hours)
        "description": "Work directly with the co-founders at Peerlist! Help launch strategic growth programs, benchmark developer platforms, analyze community retention stats, design outreach loops, and coordinate business operations initiatives.",
        "skills": ["Strategic Growth", "Market Benchmarking", "Data Ingestion", "Presentation Design", "Interpersonal Writing"],
        "resume_keywords": ["Strategic Operations", "Competitive Benchmarking", "Growth Growth Loops", "Founder Operations", "Business Analytics"],
        "suggested_projects": ["Propose a launch roadmap for Peerlist's integration with open-source project contributions to drive developer registrations by 15%."],
        "ats_keywords": ["BizOps Associate", "Founder Strategic Chief", "Operations Specialist", "Developer Marketing", "Growth Associate"],
        "quality_score": 88,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 30,
            "remote_availability": 10,
            "fresher_friendliness": 15,
            "application_simplicity": 7,
            "active_hiring_signals": 6
        }
    },
    {
        "company_name": "Danswer AI",
        "role_name": "AI Engineer Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "San Francisco, CA / Remote",
        "stipend_salary": "$3,000 / month",
        "apply_link": "https://github.com/danswer-ai/danswer",
        "company_website": "https://danswer.dev",
        "founder_linkedin": "https://www.linkedin.com/in/yuhong-sun-3353b313b/",
        "recruiter_linkedin": "https://www.linkedin.com/in/yuhong-sun-3353b313b/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "12 employees",
        "funding_stage": "Seed",
        "category": "AI",
        "days_ago": 0, # Posted TODAY (Last 24 Hours)
        "description": "Danswer is building enterprise open-source AI search. You will work on optimizing semantic search, improving document ingestion chunks, evaluating RAG accuracy pipelines using LangChain/LlamaIndex, and writing connector APIs for Google Workspace.",
        "skills": ["Python", "Semantic Search", "LangChain", "Vector Databases", "API Ingestion"],
        "resume_keywords": ["Open-Source AI Search", "Semantic Embeddings", "RAG Pipeline Tuning", "Vector Search Indices", "API Connectors"],
        "suggested_projects": ["Build and benchmark a custom RAG evaluation suite checking semantic recall accuracy across 100 enterprise document templates in Danswer."],
        "ats_keywords": ["AI Developer", "LLM Engineer", "Vector Search Engineer", "Python Developer", "Open-Source AI"],
        "quality_score": 99,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 30,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 10,
            "active_hiring_signals": 9
        }
    },
    {
        "company_name": "LlamaIndex",
        "role_name": "AI Software Engineer Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "San Francisco, CA / Remote",
        "stipend_salary": "$3,500 / month",
        "apply_link": "https://www.llamaindex.ai",
        "company_website": "https://www.llamaindex.ai",
        "founder_linkedin": "https://www.linkedin.com/in/jerry-liu-64390071/",
        "recruiter_linkedin": "https://www.linkedin.com/in/jerry-liu-64390071/",
        "is_fresher_friendly": True,
        "experience_required": 1,
        "team_size": "15 employees",
        "funding_stage": "Seed",
        "category": "AI",
        "days_ago": 1, # Posted 1 day ago (Last 7 Days)
        "description": "Contribute directly to the LlamaIndex framework. Optimize vector storage adapters, build custom LLM agent tools, streamline prompt compression libraries, and create comprehensive technical guides for advanced agentic workflows.",
        "skills": ["Python", "LlamaIndex", "LLM Agents", "Vector Databases", "Prompt Engineering"],
        "resume_keywords": ["LlamaIndex Framework", "Agentic RAG Workflows", "Vector Storage Adapters", "Prompt Optimization", "Token Efficiency"],
        "suggested_projects": ["Develop an open-source LlamaIndex connector enabling fast local PDF ingestion with automated metadata tagging using HuggingFace."],
        "ats_keywords": ["AI Developer", "NLP Software Engineer", "Python AI Specialist", "RAG Developer", "Agentic AI Developer"],
        "quality_score": 98,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 30,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 9,
            "active_hiring_signals": 9
        }
    },
    {
        "company_name": "Resend",
        "role_name": "Developer Relations & Growth Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "Global Remote",
        "stipend_salary": "$2,000 / month",
        "apply_link": "https://resend.com/careers",
        "company_website": "https://resend.com",
        "founder_linkedin": "https://www.linkedin.com/in/zenorocha/",
        "recruiter_linkedin": "https://www.linkedin.com/in/zenorocha/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "10 employees",
        "funding_stage": "Seed",
        "category": "Growth",
        "days_ago": 2, # Posted 2 days ago (Last 7 Days)
        "description": "Help us grow the open-source React Email and Resend ecosystems. You will write technical tutorials, record short video guides, moderate community discussions on GitHub/Discord, and compile developer onboarding feedback logs.",
        "skills": ["React", "Developer Relations", "Technical Writing", "Community Moderation", "Video Creation"],
        "resume_keywords": ["Developer Relations (DevRel)", "React Email Components", "SaaS Technical Blogging", "GitHub Community Management", "Developer Retention"],
        "suggested_projects": ["Write a technical integration guide showing how to connect Resend with Next.js Server Actions, including fully modular template blueprints."],
        "ats_keywords": ["Developer Advocate", "Community Growth Specialist", "DevRel Associate", "Technical Content Developer", "SaaS Growth Specialist"],
        "quality_score": 96,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 30,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 8,
            "active_hiring_signals": 8
        }
    },
    {
        "company_name": "Cuvette",
        "role_name": "Business Operations Intern",
        "job_type": "Internship",
        "work_type": "Hybrid",
        "location": "Bangalore, India",
        "stipend_salary": "₹20,000 / month",
        "apply_link": "https://cuvette.tech",
        "company_website": "https://cuvette.tech",
        "founder_linkedin": "https://www.linkedin.com/in/atulanand-cuvette",
        "recruiter_linkedin": "https://www.linkedin.com/in/atulanand-cuvette",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "30 employees",
        "funding_stage": "Seed",
        "category": "Operations",
        "days_ago": 3, # Posted 3 days ago (Last 7 Days)
        "description": "Join our operations team at Cuvette to streamline student hiring matches. Run recruiter support schedules, track customer onboarding SLAs in Excel, perform basic SQL queries to analyze active jobs matching, and curate listing alerts.",
        "skills": ["Excel", "SQL Queries", "Customer Operations", "SLA Monitoring", "Data Modeling"],
        "resume_keywords": ["Customer Operations SLAs", "Match Optimization Systems", "Excel Pivot Reporting", "Hiring Funnel Analytics", "SQL Data Auditing"],
        "suggested_projects": ["Design a simplified Google Sheets automator tracking merchant onboarding delays, cutting down matching latency by 6 hours."],
        "ats_keywords": ["Operations Executive", "BizOps Analyst", "Placement Coordinator", "Customer Success Analyst", "Operations Coordinator"],
        "quality_score": 83,
        "scoring_breakdown": {
            "startup_credibility": 18,
            "paid_unpaid": 22,
            "remote_availability": 10,
            "fresher_friendliness": 15,
            "application_simplicity": 10,
            "active_hiring_signals": 8
        }
    },
    {
        "company_name": "Attio",
        "role_name": "Data Analyst Intern",
        "job_type": "Internship",
        "work_type": "Hybrid",
        "location": "London, UK",
        "stipend_salary": "$2,500 / month",
        "apply_link": "https://attio.com/careers",
        "company_website": "https://attio.com",
        "founder_linkedin": "https://www.linkedin.com/in/nicolas-attio",
        "recruiter_linkedin": "https://www.linkedin.com/in/nicolas-attio",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "60 employees",
        "funding_stage": "Series A",
        "category": "Data",
        "days_ago": 4, # Posted 4 days ago (Last 7 Days)
        "description": "Work with Attio's product metrics team. Analyze user workspace setups, isolate feature usage correlations inside Metabase, write SQL modeling queries, and build reports helping PMs isolate onboarding drop-off points.",
        "skills": ["SQL", "Metabase", "SaaS Analytics", "Data Modeling", "Excel"],
        "resume_keywords": ["SaaS Metabase Reporting", "Workspace Activation Metrics", "SQL Cohort Analysis", "Onboarding Data Auditing", "Retention Funnels"],
        "suggested_projects": ["Create a Metabase cohort mapping dashboard displaying setup completeness against weekly retention across 500 trial companies."],
        "ats_keywords": ["Product Analyst", "Data Analyst", "SaaS BI Developer", "SQL Developer", "Data Specialist"],
        "quality_score": 92,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 30,
            "remote_availability": 10,
            "fresher_friendliness": 15,
            "application_simplicity": 9,
            "active_hiring_signals": 8
        }
    },
    {
        "company_name": "Loops.so",
        "role_name": "Growth Analyst Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "Global Remote",
        "stipend_salary": "$1,800 / month",
        "apply_link": "https://loops.so/careers",
        "company_website": "https://loops.so",
        "founder_linkedin": "https://www.linkedin.com/in/chris-loops",
        "recruiter_linkedin": "https://www.linkedin.com/in/chris-loops",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "7 employees",
        "funding_stage": "Seed",
        "category": "Growth",
        "days_ago": 5, # Posted 5 days ago (Last 7 Days)
        "description": "Analyze Loops user referral loops and activation triggers. Run A/B testing on pricing page templates, review marketing email delivery funnels, gather student user feedback, and create push notifications layouts.",
        "skills": ["A/B Testing", "Growth Optimization", "Referral Hooks", "Push Notification Copy", "Excel"],
        "resume_keywords": ["Growth Optimization Loops", "Customer Acquisition Cost (CAC)", "SaaS Activation Triggers", "Referral Experiments", "Email Copy A/B Testing"],
        "suggested_projects": ["Design a viral referral workflow wireframe proposing credit bonuses for active SaaS developers sharing email campaigns."],
        "ats_keywords": ["Growth Analyst", "Marketing Coordinator", "SaaS Growth Specialist", "Referral Specialist", "Optimization Specialist"],
        "quality_score": 93,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 25,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 10,
            "active_hiring_signals": 8
        }
    },
    {
        "company_name": "Phind",
        "role_name": "AI Engineer Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "San Francisco, CA / Remote",
        "stipend_salary": "$3,200 / month",
        "apply_link": "https://www.phind.com",
        "company_website": "https://www.phind.com",
        "founder_linkedin": "https://www.linkedin.com/in/michael-phind",
        "recruiter_linkedin": "https://www.linkedin.com/in/michael-phind",
        "is_fresher_friendly": True,
        "experience_required": 1,
        "team_size": "15 employees",
        "funding_stage": "Seed",
        "category": "AI",
        "days_ago": 6, # Posted 6 days ago (Last 7 Days)
        "description": "Optimize Phind's search inference speeds. Implement prompt compression techniques, model token length restrictions, refine custom vector storage engines, and construct automated benchmark evaluations checking RAG performance.",
        "skills": ["Python", "Vector Databases", "Prompt Compression", "Model Optimization", "LLM Inference"],
        "resume_keywords": ["Model Inference Optimization", "Prompt Chaining & Compression", "Fast Vector Indexing", "RAG Benchmark Systems", "Token Churn Reduction"],
        "suggested_projects": ["Implement a lightweight script that compresses user code context by 30% before model feeding without semantic precision loss."],
        "ats_keywords": ["Machine Learning Engineer", "Inference Developer", "LLM Software Developer", "RAG Analyst", "AI Engineer"],
        "quality_score": 97,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 30,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 8,
            "active_hiring_signals": 9
        }
    },
    {
        "company_name": "Heirloom AI",
        "role_name": "ML Research Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "Boston, MA / Remote",
        "stipend_salary": "$3,500 / month",
        "apply_link": "https://heirloom.ai",
        "company_website": "https://heirloom.ai",
        "founder_linkedin": "https://www.linkedin.com/in/marcus-heirloom",
        "recruiter_linkedin": "https://www.linkedin.com/in/kylie-heirloom-talent",
        "is_fresher_friendly": True,
        "experience_required": 1,
        "team_size": "10 employees",
        "funding_stage": "Pre-seed",
        "category": "AI",
        "days_ago": 10, # Older posting (>7 Days)
        "description": "Research compression and model distillation for small language models. Optimize quantization algorithms, conduct benchmark comparisons on Llama-3-8B variants, and build custom test frameworks checking semantic consistency.",
        "skills": ["PyTorch", "Model Quantization", "Model Distillation", "Hugging Face", "Python"],
        "resume_keywords": ["Model Quantization (INT8)", "Knowledge Distillation", "Model Evaluation Protocols", "Hugging Face Hub Scripts", "Weights & Biases Logs"],
        "suggested_projects": ["Distill a 30M parameter BERT model into a lightweight mobile-ready classifier retaining 95%+ validation precision."],
        "ats_keywords": ["ML Engineer", "AI Researcher", "Quantization Specialist", "Python Developer", "Deep Learning Analyst"],
        "quality_score": 94,
        "scoring_breakdown": {
            "startup_credibility": 18,
            "paid_unpaid": 30,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 8,
            "active_hiring_signals": 8
        }
    },
    {
        "company_name": "Cognition AI",
        "role_name": "AI Developer Generalist",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "San Francisco, CA / Remote",
        "stipend_salary": "$4,000 / month",
        "apply_link": "https://www.cognition.ai",
        "company_website": "https://www.cognition.ai",
        "founder_linkedin": "https://www.linkedin.com/in/scott-cognition",
        "recruiter_linkedin": "https://www.linkedin.com/in/scott-cognition",
        "is_fresher_friendly": True,
        "experience_required": 1,
        "team_size": "25 employees",
        "funding_stage": "Series A",
        "category": "AI",
        "days_ago": 12, # Older posting (>7 Days)
        "description": "Help build Devin, the AI software engineer. Optimize CLI execution sandbox layers, implement system monitoring libraries, configure prompt pipelines, and document developer environment setups.",
        "skills": ["Docker", "Linux Shell", "LLM Scripting", "Python", "TypeScript"],
        "resume_keywords": ["Docker Sandbox Execution", "Process Monitor Tooling", "CLI Scripting Systems", "LLM Environment Contexts", "Full Stack Integrations"],
        "suggested_projects": ["Build an automated Docker CLI environment template that runs user-submitted test suites and compiles semantic error charts."],
        "ats_keywords": ["AI Developer", "Software Engineer", "Systems Engineer", "ML Developer", "Full Stack Engineer"],
        "quality_score": 97,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 30,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 8,
            "active_hiring_signals": 9
        }
    },
    {
        "company_name": "Peerlist",
        "role_name": "Community Manager Intern",
        "job_type": "Internship",
        "work_type": "Hybrid",
        "location": "Pune, India",
        "stipend_salary": "₹15,000 / month",
        "apply_link": "https://peerlist.io/careers",
        "company_website": "https://peerlist.io",
        "founder_linkedin": "https://www.linkedin.com/in/akash-bhadange/",
        "recruiter_linkedin": "https://www.linkedin.com/in/yoginibhope/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "12 employees",
        "funding_stage": "Seed",
        "category": "Community",
        "days_ago": 14, # Older posting (>7 Days)
        "description": "Drive developer community engagement on Peerlist. Coordinate monthly online project showcase hackathons, write biweekly email newsletters summarizing tech stacks, moderate Discord discussions, and write highlight posts.",
        "skills": ["Community Moderation", "Newsletter Design", "Event Organization", "Copywriting", "Discord Tools"],
        "resume_keywords": ["Community Engagement Loops", "Hackathon Logistics", "Tech Highlights Newsletters", "Discord Bot Automations", "User Relations"],
        "suggested_projects": ["Draft an automated Discord welcome bot workflow proposing specific profile optimizations based on new user tags."],
        "ats_keywords": ["Community Manager", "Developer Relations Associate", "Event Coordinator", "Growth Marketer", "Social Associate"],
        "quality_score": 79,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 15,
            "remote_availability": 10,
            "fresher_friendliness": 15,
            "application_simplicity": 10,
            "active_hiring_signals": 9
        }
    },
    {
        "company_name": "Attio",
        "role_name": "Customer Support Generalist",
        "job_type": "Internship",
        "work_type": "Hybrid",
        "location": "London, UK",
        "stipend_salary": "$1,800 / month",
        "apply_link": "https://attio.com/careers",
        "company_website": "https://attio.com",
        "founder_linkedin": "https://www.linkedin.com/in/nicolas-sharp/",
        "recruiter_linkedin": "https://www.linkedin.com/in/nicolas-sharp/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "60 employees",
        "funding_stage": "Series A",
        "category": "Management",
        "days_ago": 15, # Older posting (>7 Days)
        "description": "Become an onboarding champion for early-stage Attio customers. Solve system usage queries, create comprehensive support doc articles, test browser extension bugs, and coordinate bug escalations to engineering teams.",
        "skills": ["Customer Support", "Technical Troubleshooting", "FAQ Writing", "Jira Tracker", "CRM"],
        "resume_keywords": ["Customer Success SLAs", "Help Center Documentation", "SaaS Bug Troubleshooting", "Jira Escalations", "Customer Retention Systems"],
        "suggested_projects": ["Write 5 detailed developer guides showing how to integrate custom API tokens with Attio pipelines to automate onboarding lists."],
        "ats_keywords": ["Customer Success Executive", "Support Analyst", "CRM Specialist", "Product Operations Associate", "Client Support Coordinator"],
        "quality_score": 88,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 25,
            "remote_availability": 10,
            "fresher_friendliness": 15,
            "application_simplicity": 9,
            "active_hiring_signals": 9
        }
    },
    {
        "company_name": "SupIntern",
        "role_name": "Program Management Associate",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "New Delhi, India / Remote",
        "stipend_salary": "₹15,000 / month",
        "apply_link": "https://supintern.com",
        "company_website": "https://supintern.com",
        "founder_linkedin": "https://www.linkedin.com/in/ritvik-saxena-18231215b/",
        "recruiter_linkedin": "https://www.linkedin.com/in/ritvik-saxena-18231215b/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "10 employees",
        "funding_stage": "Pre-seed",
        "category": "Management",
        "days_ago": 18, # Older posting (>7 Days)
        "description": "Manage recruitment program schedules for partner startups on SupIntern. Build employer dashboards, audit applicant screening databases in Excel, maintain pipeline timelines, and coordinate hiring dates.",
        "skills": ["Excel", "Recruitment Coordination", "Timeline Tracking", "User Screening", "SaaS Dashboards"],
        "resume_keywords": ["Recruiting Lifecycle Logs", "Screening Pipeline Automations", "Excel Client Dashboarding", "Operational Timelines", "Stakeholder Relations"],
        "suggested_projects": ["Design a standardized applicant screening workflow sheet that shortlists candidates in 3 clicks using automated scoring scales."],
        "ats_keywords": ["Program Associate", "Project Associate", "Operations Coordinator", "Placement Analyst", "Planning Associate"],
        "quality_score": 83,
        "scoring_breakdown": {
            "blank": 0
        }
    },
    {
        "company_name": "LangChain",
        "role_name": "AI Product Researcher",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "San Francisco, CA / Remote",
        "stipend_salary": "$3,200 / month",
        "apply_link": "https://www.langchain.com",
        "company_website": "https://www.langchain.com",
        "founder_linkedin": "https://www.linkedin.com/in/harrison-chase-961287118/",
        "recruiter_linkedin": "https://www.linkedin.com/in/olivialimone/",
        "is_fresher_friendly": True,
        "experience_required": 1,
        "team_size": "20 employees",
        "funding_stage": "Series A",
        "category": "AI",
        "days_ago": 20, # Older posting (>7 Days)
        "description": "Benchmark and evaluate agentic templates across LangGraph pipelines. Isolate tool execution drop-off patterns, gather usage feedback from enterprise developers, and compile technical documentation blueprints.",
        "skills": ["LangChain", "LangGraph", "User Research", "Technical Writing", "Benchmarking"],
        "resume_keywords": ["LangGraph Pipeline Auditing", "Agentic Loop Benchmarks", "Developer Relations (DevRel)", "Technical Blueprint Design", "Tool Execution Profiling"],
        "suggested_projects": ["Create a standardized benchmark suite evaluating semantic loop errors across 10 LangGraph multi-agent configurations."],
        "ats_keywords": ["Product Analyst", "Technical Researcher", "AI Developer", "SaaS PM", "DevRel Specialist"],
        "quality_score": 96,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 30,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 8,
            "active_hiring_signals": 8
        }
    },
    {
        "company_name": "Loops.so",
        "role_name": "Community Moderator Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "Global Remote",
        "stipend_salary": "$1,500 / month",
        "apply_link": "https://loops.so/careers",
        "company_website": "https://loops.so",
        "founder_linkedin": "https://www.linkedin.com/in/chrisnovavia/",
        "recruiter_linkedin": "https://www.linkedin.com/in/chrisnovavia/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "7 employees",
        "funding_stage": "Seed",
        "category": "Community",
        "days_ago": 21, # Older posting (>7 Days)
        "description": "Support open-source React Email builders on our developer Discord. Build auto-responder FAQ bots, moderate template submissions, curate spotlight issues, and write newsletter templates.",
        "skills": ["Discord Tools", "Technical Writing", "HTML/CSS email", "Community Moderation", "FAQ Logs"],
        "resume_keywords": ["Discord Community Management", "React Email Helpdesk", "Developer FAQ Automation", "Issue Auditing Systems", "User Engagement"],
        "suggested_projects": ["Develop an auto-reply webhook that parses Discord markdown template errors and posts exact inline layout suggestions."],
        "ats_keywords": ["Community Specialist", "Customer Success Analyst", "Content Moderator", "Developer Advocate", "SaaS Associate"],
        "quality_score": 91,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 20,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 10,
            "active_hiring_signals": 11
        }
    },
    {
        "company_name": "Jurny",
        "role_name": "Business Operations Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "Global Remote",
        "stipend_salary": "$1,500 / month",
        "apply_link": "https://www.jurny.com",
        "company_website": "https://www.jurny.com",
        "founder_linkedin": "https://www.linkedin.com/in/lucazambello/",
        "recruiter_linkedin": "https://www.linkedin.com/in/lucazambello/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "25 employees",
        "funding_stage": "Seed",
        "category": "Operations",
        "days_ago": 22, # Older posting (>7 Days)
        "description": "Optimize operations flow for Jurny's AI hospitality dashboard. Track support ticket resolution rates, query database transaction errors, resolve integration bottlenecks, and compile program logs.",
        "skills": ["SQL", "Excel Data", "Technical Support", "operations logs", "CRM Tools"],
        "resume_keywords": ["Technical Support operations", "Hospitality SaaS Analytics", "SQL Database Audits", "Operational Timelines", "Integration Funnels"],
        "suggested_projects": ["Build an automated spreadsheet template mapping customer setup times and sorting by latency hotspots to decrease onboarding time by 8%."],
        "ats_keywords": ["Operations Analyst", "BizOps Associate", "Client Operations Analyst", "Product Ops Analyst", "Project Planner"],
        "quality_score": 89,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 20,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 10,
            "active_hiring_signals": 9
        }
    },
    {
        "company_name": "Worki",
        "role_name": "Startup Generalist Intern",
        "job_type": "Internship",
        "work_type": "Remote",
        "location": "Global Remote",
        "stipend_salary": "$1,500 / month",
        "apply_link": "https://worki.io",
        "company_website": "https://worki.io",
        "founder_linkedin": "https://www.linkedin.com/company/workihq/",
        "recruiter_linkedin": "https://www.linkedin.com/company/workihq/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "8 employees",
        "funding_stage": "Pre-seed",
        "category": "Management",
        "days_ago": 24, # Older posting (>7 Days)
        "description": "A true generalist role in an 8-person HR tech startup. You will manage customer support questions, draft technical release logs, assist in recruitment screening operations, and run product QA tests.",
        "skills": ["Customer Success", "Release Logs", "Operations Management", "Full QA Testing", "SaaS Analytics"],
        "resume_keywords": ["Full QA Test Cycles", "Help Center SLA Moderation", "SaaS Release Logs", "Operational Pipeline Tracking", "Startup Generalist Loops"],
        "suggested_projects": ["Audit and rewrite Worki's onboarding knowledge base tutorials, reducing user support inquiries by 14%."],
        "ats_keywords": ["Generalist Associate", "Operations Planner", "Customer Support Analyst", "HR Tech Generalist", "BizOps Associate"],
        "quality_score": 93,
        "scoring_breakdown": {
            "startup_credibility": 18,
            "paid_unpaid": 20,
            "remote_availability": 15,
            "fresher_friendliness": 15,
            "application_simplicity": 10,
            "active_hiring_signals": 15
        }
    },
    {
        "company_name": "Peerlist",
        "role_name": "Growth Specialist Intern",
        "job_type": "Internship",
        "work_type": "Hybrid",
        "location": "Pune, India",
        "stipend_salary": "₹25,000 / month",
        "apply_link": "https://peerlist.io/careers",
        "company_website": "https://peerlist.io",
        "founder_linkedin": "https://www.linkedin.com/in/akash-bhadange/",
        "recruiter_linkedin": "https://www.linkedin.com/in/yoginibhope/",
        "is_fresher_friendly": True,
        "experience_required": 0,
        "team_size": "12 employees",
        "funding_stage": "Seed",
        "category": "Growth",
        "days_ago": 25, # Older posting (>7 Days)
        "description": "Optimize Peerlist's offline growth loops. Research campus ambassador program outlines, manage promoter collateral, analyze campaign user signups, and track acquisition metrics.",
        "skills": ["Acquisition Programs", "Excel Analytics", "Campaign Operations", "Marketing copy", "SaaS Onboarding"],
        "resume_keywords": ["Campus Ambassador Onboarding", "User Ingestion Experiments", "Campaign Analytics", "Ambassador Program Schedules", "User Growth Loops"],
        "suggested_projects": ["Design a campus ambassador welcome template dashboard tracking ambassador registrations and sorting by geographic hotspots."],
        "ats_keywords": ["Growth Coordinator", "Marketing Coordinator", "SaaS Growth Associate", "Campaign Associate", "Optimization Specialist"],
        "quality_score": 87,
        "scoring_breakdown": {
            "startup_credibility": 20,
            "paid_unpaid": 25,
            "remote_availability": 10,
            "fresher_friendliness": 15,
            "application_simplicity": 9,
            "active_hiring_signals": 8
        }
    }

]

def calculate_quality_score(job: dict) -> tuple:
    """
    Computes the Quality Score (0-100) dynamically based on actual factors:
    - Startup Credibility (Funding stage, known name): 0-20 points
    - Paid vs Unpaid: 0-30 points
    - Remote availability (Remote, Hybrid, Onsite): 0-15 points
    - Fresher friendliness (0-2 years, explicitly yes): 0-15 points
    - Application simplicity (direct links): 0-10 points
    - Active hiring signals (recruiter/founder info): 0-10 points
    """
    cred = 15
    if job.get("company_name") in ["Dub.co", "Loops.so", "Peerlist", "Danswer AI", "LlamaIndex", "Resend", "Attio", "Phind", "Cognition AI", "LangChain"]:
        cred = 20
        
    paid = 30
    stipend = job.get("stipend_salary", "")
    if "unpaid" in stipend.lower() or "0" == stipend:
        paid = 0
    elif "₹15,000" in stipend or "₹20,000" in stipend:
        paid = 22
    elif "₹25,000" in stipend or "₹30,000" in stipend:
        paid = 25
        
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
    if "careers" in job.get("apply_link", "") or "github" in job.get("apply_link", ""):
        simplicity = 10
        
    active = 7
    if job.get("founder_linkedin") and job.get("recruiter_linkedin"):
        active = 10
    elif job.get("founder_linkedin") or job.get("recruiter_linkedin"):
        active = 8
        
    score = cred + paid + remote + fresher + simplicity + active
    breakdown = {
        "startup_credibility": cred,
        "paid_unpaid": paid,
        "remote_availability": remote,
        "fresher_friendliness": fresher,
        "application_simplicity": simplicity,
        "active_hiring_signals": active
    }
    return score, breakdown

def run_ingestion_pipeline(db: Session, force_reset: bool = False) -> list:
    """
    Cleans, scores, classifies, and saves 20 genuine startup internship opportunities daily.
    Staggers posted dates dynamically to test freshness query criteria immediately.
    """
    if force_reset:
        db.query(InternshipJob).delete()
        db.commit()
        
    # Check if we already have jobs in the database
    existing_count = db.query(InternshipJob).count()
    if existing_count >= 20 and not force_reset:
        return db.query(InternshipJob).all()
        
    openai_key = os.getenv("OPENAI_API_KEY", "")
    enriched_jobs = []
    
    # Process and save jobs
    for idx, seed in enumerate(SEED_JOBS):
        # Calculate dynamic posted date staggered based on seed data
        posted = datetime.utcnow() - timedelta(days=seed["days_ago"])
        
        # Calculate quality score dynamically
        score, breakdown = calculate_quality_score(seed)
        
        job_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed['company_name']}_{seed['role_name']}_{idx}"))
        
        category = seed["category"]
        skills = seed["skills"]
        resume_keywords = seed["resume_keywords"]
        suggested_projects = seed["suggested_projects"]
        ats_keywords = seed["ats_keywords"]
        
        if openai_key and len(openai_key) > 10:
            try:
                from langchain_openai import ChatOpenAI
                from langchain_core.messages import SystemMessage, HumanMessage
                
                llm = ChatOpenAI(model="gpt-4o", temperature=0.1, api_key=openai_key)
                prompt = f"""
                You are an expert Startup Career Ingestion Coach.
                Given this startup job:
                Company: {seed['company_name']}
                Role: {seed['role_name']}
                Description: {seed['description']}
                
                Refine the following attributes and return strict JSON format with keys:
                "category": choose one from ['Product', "Founder's Office", 'Operations', 'AI', 'Data', 'Growth', 'Community', 'Management']
                "skills": list of 5 exact technical/soft skills
                "resume_keywords": list of 5 industry keywords to add to resume
                "suggested_projects": list of 1 standout, highly technical project a student can build to get noticed for this exact role
                "ats_keywords": list of 5 keywords that an ATS scanner will seek
                """
                resp = llm([SystemMessage(content="Return strict JSON only."), HumanMessage(content=prompt)])
                parsed = json.loads(resp.content.strip("`").replace("json\n", ""))
                
                category = parsed.get("category", category)
                skills = parsed.get("skills", skills)
                resume_keywords = parsed.get("resume_keywords", resume_keywords)
                suggested_projects = parsed.get("suggested_projects", suggested_projects)
                ats_keywords = parsed.get("ats_keywords", ats_keywords)
            except Exception as e:
                print(f"OpenAI enrichment failed, using fallbacks: {e}")
                
        # Check if job exists in db to avoid duplicates
        existing = db.query(InternshipJob).filter_by(id=job_id).first()
        if existing:
            enriched_jobs.append(existing)
            continue
            
        db_job = InternshipJob(
            id=job_id,
            company_name=seed["company_name"],
            role_name=seed["role_name"],
            job_type=seed["job_type"],
            work_type=seed["work_type"],
            location=seed["location"],
            stipend_salary=seed["stipend_salary"],
            apply_link=seed["apply_link"],
            description=seed["description"],
            posted_date=posted,
            company_website=seed["company_website"],
            founder_linkedin=seed["founder_linkedin"],
            recruiter_linkedin=seed["recruiter_linkedin"],
            is_fresher_friendly=seed["is_fresher_friendly"],
            experience_required=seed["experience_required"],
            team_size=seed["team_size"],
            funding_stage=seed["funding_stage"],
            category=category,
            skills=skills,
            resume_keywords=resume_keywords,
            suggested_projects=suggested_projects,
            ats_keywords=ats_keywords,
            quality_score=score,
            scoring_breakdown=breakdown
        )
        db.add(db_job)
        enriched_jobs.append(db_job)
        
    db.commit()
    return enriched_jobs

def generate_daily_digests(jobs: list) -> dict:
    """
    Generates Daily Internship Digests scheduled for 6:00 AM IST.
    """
    today_str = datetime.utcnow().strftime("%B %d, %Y")
    
    # 1. Daily Internship Digest (Overall)
    overall_jobs = sorted(jobs, key=lambda j: j.quality_score, reverse=True)[:5]
    overall_text = f"## 📅 Daily Internship Digest - {today_str}\n\nHere are today's top-tier, handpicked startup internships focusing on early careers:\n\n"
    for j in overall_jobs:
        overall_text += f"🏆 **{j.role_name}** at *{j.company_name}* (Quality Score: **{j.quality_score}/100**)\n"
        overall_text += f"- 👥 Team Size: {j.team_size} | 💰 Stipend: {j.stipend_salary}\n"
        overall_text += f"- 📍 Location: {j.work_type} ({j.location}) | 🔗 Apply: {j.apply_link}\n\n"
        
    # 2. Daily Product Roles Digest
    product_jobs = [j for j in jobs if j.category == "Product"][:4]
    product_text = f"## 📦 Daily Product Digest - APM & PM Internships - {today_str}\n\nCurated opportunities in early stage Product Management:\n\n"
    for j in product_jobs:
        product_text += f"🚀 **{j.role_name}** at *{j.company_name}* ({j.team_size})\n"
        product_text += f"- 📊 Score: {j.quality_score} | 🌟 Standout Project: {j.suggested_projects[0]}\n"
        product_text += f"- 🔗 Apply: {j.apply_link}\n\n"
        
    # 3. Daily Founder's Office Digest
    founder_jobs = [j for j in jobs if j.category == "Founder's Office"][:4]
    founder_text = f"## 💼 Daily Founder's Office & BizOps Digest - {today_str}\n\nWork directly with startup founders:\n\n"
    for j in founder_jobs:
        founder_text += f"👑 **{j.role_name}** at *{j.company_name}* ({j.team_size})\n"
        founder_text += f"- 📊 Score: {j.quality_score} | 📍 Location: {j.location}\n"
        founder_text += f"- 🔗 Apply: {j.apply_link}\n\n"
        
    # 4. Daily AI Roles Digest
    ai_jobs = [j for j in jobs if j.category == "AI"][:4]
    ai_text = f"## 🤖 Daily AI & Machine Learning Digest - {today_str}\n\nFresh opportunities in Generative AI, RAG, and NLP frameworks:\n\n"
    for j in ai_jobs:
        ai_text += f"⚡ **{j.role_name}** at *{j.company_name}* ({j.team_size})\n"
        ai_text += f"- 📊 Score: {j.quality_score} | 🔑 Resume Keywords: {', '.join(j.resume_keywords[:3])}\n"
        ai_text += f"- 🔗 Apply: {j.apply_link}\n\n"
        
    return {
        "general": overall_text,
        "product": product_text,
        "founders": founder_text,
        "ai": ai_text
    }

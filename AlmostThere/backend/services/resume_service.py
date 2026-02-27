"""
services/resume_service.py
Generates ATS-optimized resume JSON from raw resume + JD.
"""

import json, re, logging
from services.claude_client import call_claude

log = logging.getLogger(__name__)


def generate_resume(resume_text: str, jd_text: str) -> dict:
    raw = call_claude(_prompt(resume_text, jd_text), max_tokens=2500)
    return _parse(raw)


def _prompt(resume_text, jd_text):
    return f"""You are an expert ATS resume writer. Rewrite this resume to be perfectly tailored for the job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

RULES:
1. Use ONLY real facts from the resume. Never invent anything.
2. Missing fields get placeholders like [Start Date], [GPA], [City].
3. Every work experience bullet MUST follow: "Accomplished [X result] through [Y action] using [Z tool/technology]"
4. EXACTLY 3 bullets per work experience. EXACTLY 2 bullets per project.
5. Weave JD keywords naturally throughout. List JD-matching skills first.
6. Return ats_score (integer 75-95) and matched_keywords (6-10 phrases from JD now in resume).

Return ONLY this JSON — no markdown, no explanation:

{{
  "name": "Full Name",
  "contact": {{
    "phone": "...", "email": "...", "linkedin": "...", "github": "...", "location": "..."
  }},
  "education": [{{
    "degree": "...", "school": "...", "location": "...",
    "start": "...", "end": "...", "gpa": "...", "coursework": "..."
  }}],
  "skills": {{
    "Languages": "...", "Frameworks": "...", "Databases": "...",
    "Tools": "...", "Cloud": "...", "Other": "..."
  }},
  "experience": [{{
    "title": "...", "company": "...", "location": "...",
    "start": "...", "end": "...", "tech": "...",
    "bullets": ["Accomplished X through Y using Z", "...", "..."]
  }}],
  "projects": [{{
    "name": "...", "tech": "...", "link": "...",
    "bullets": ["Accomplished X through Y using Z", "..."]
  }}],
  "ats_score": 88,
  "matched_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"]
}}"""


def _parse(raw: str) -> dict:
    cleaned = re.sub(r"^```json\s*", "", raw.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"^```\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", cleaned)
        if not m:
            raise ValueError(f"No JSON found in response. First 200 chars: {raw[:200]}")
        data = json.loads(m.group())

    for key in ["name", "contact", "education", "skills", "experience", "projects"]:
        if key not in data:
            raise ValueError(f"Resume JSON missing key: '{key}'")

    data.setdefault("ats_score", 82)
    data.setdefault("matched_keywords", [])
    return data

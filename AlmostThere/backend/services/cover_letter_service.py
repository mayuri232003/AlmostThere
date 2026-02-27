"""
services/cover_letter_service.py
Generates a professional, personalized cover letter.
"""

import logging
from services.claude_client import call_claude

log = logging.getLogger(__name__)


def generate_cover_letter(resume_context: str, jd_text: str, company: str = "", role: str = "") -> str:
    return call_claude(_prompt(resume_context, jd_text, company, role), max_tokens=900).strip()


def _prompt(resume_context, jd_text, company, role):
    company_str = company or "[Company Name]"
    role_str    = role    or "this position"

    return f"""You are an expert cover letter writer. Write a compelling, personalized cover letter.

CANDIDATE RESUME:
{resume_context}

JOB DESCRIPTION:
{jd_text}

COMPANY: {company_str}
ROLE: {role_str}

STRUCTURE:
Paragraph 1 — HOOK: Don't start with "I am writing to express my interest". Open with something genuine and specific about why this role excites you.
Paragraph 2 — EVIDENCE: 2-3 specific quantified achievements from the resume that directly map to JD requirements.
Paragraph 3 — FIT: Show you understand what this team needs and what you uniquely bring.
Paragraph 4 — CLOSE: Confident, warm sign-off. Invite next steps.

RULES:
- 300-380 words total
- Start with: [Today's Date]\\nDear Hiring Manager,
- End with: Sincerely,\\n[Candidate Name]
- No clichés: "I am writing to", "I believe I would be a great fit", "To whom it may concern"
- Warm, direct, professional tone

Return ONLY the cover letter text. Nothing else."""

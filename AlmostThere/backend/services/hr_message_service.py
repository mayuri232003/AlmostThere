"""
services/hr_message_service.py
Generates a short, genuine LinkedIn/email cold outreach message.
Enforces the exact format the user specified.
"""

import logging
from services.claude_client import call_claude

log = logging.getLogger(__name__)


def generate_hr_message(resume_context: str, jd_text: str, recruiter_name: str = "",
                        company: str = "", role: str = "") -> str:
    return call_claude(_prompt(resume_context, jd_text, recruiter_name, company, role), max_tokens=350).strip()


def _prompt(resume_context, jd_text, recruiter_name, company, role):
    name_str    = recruiter_name or "[Recruiter Name]"
    company_str = company        or "[Company]"
    role_str    = role           or "this role"
    at_co       = f" at {company_str}" if company else ""

    return f"""Write a short cold outreach message for LinkedIn or email.

CANDIDATE RESUME:
{resume_context}

JOB DESCRIPTION:
{jd_text}

RECRUITER: {name_str}
COMPANY: {company_str}
ROLE: {role_str}

USE THIS EXACT FORMAT:

Hi {name_str},

I know you likely receive a lot of messages like this, so I'll keep it very brief — just a quick introduction.

I'm a [job title] with experience in [2-3 core skills matching JD], and I was excited to see the {role_str} role{at_co}. Here's how my experience aligns:

• [Real achievement from resume — under 20 words — matches JD requirement 1]
• [Real achievement from resume — under 20 words — matches JD requirement 2]
• [Real achievement from resume — under 20 words — matches JD requirement 3]

If helpful, I'd be happy to share more context or a project demo alongside my resume. Would that be okay?

Thank you for your time,
[Candidate Full Name]

STRICT RULES:
1. The line "I know you likely receive a lot of messages like this, so I'll keep it very brief — just a quick introduction." must appear EXACTLY as written.
2. Each bullet under 20 words.
3. Use REAL achievements from the resume.
4. Total message under 150 words.
5. Return ONLY the message. No explanation."""

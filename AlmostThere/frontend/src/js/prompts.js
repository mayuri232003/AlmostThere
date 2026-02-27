/**
 * prompts.js
 *
 * PURPOSE:
 * All AI prompt templates live here in one place.
 * This makes it easy to tune and improve each prompt
 * without touching application logic.
 *
 * WHY THIS MATTERS for the Amazon JD:
 * The role requires "framing ambiguous business problems as
 * science problems." Prompt engineering IS that skill —
 * you're defining the exact specification for what the model
 * should produce, including format, constraints, and quality bar.
 */

const PROMPTS = {

  /**
   * RESUME OPTIMIZER PROMPT
   *
   * Strategy:
   * - Parse the user's real resume content (don't invent facts)
   * - Rewrite bullets in "Accomplished X through Y using Z" format
   * - Align keywords to the JD for ATS scoring
   * - Return structured JSON so our renderer can build the visual
   * - Use placeholders for missing fields (never omit sections)
   */
  buildResumePrompt(resumeText, jdText) {
    return `You are an expert ATS-optimized resume writer and career coach.

Your job is to take the candidate's existing resume and rewrite it to be highly tailored to the job description provided.

---
CANDIDATE'S RESUME:
${resumeText}
---
JOB DESCRIPTION:
${jdText}
---

INSTRUCTIONS:

1. EXTRACT all real information from the candidate's resume. Never invent facts, companies, dates, or degrees.
2. If a field is missing (e.g., no GPA, no start date), use a placeholder like "[Start Date]" or "[GPA]".
3. REWRITE all work experience bullets in this exact format:
   "Accomplished [X result/outcome] through [Y action/method] using [Z tool/technology]"
   - Each bullet must be specific, quantified where possible, and directly relevant to the JD.
   - Use EXACTLY 3 bullets per work experience entry.
4. REWRITE all project bullets in this format — EXACTLY 2 bullets per project.
5. Prioritize and surface keywords from the JD naturally in the resume.
6. Skills section should list technologies that appear in BOTH the resume and JD first.
7. The resume must score 85%+ on ATS systems — include exact keywords from the JD.

OUTPUT FORMAT — Return ONLY valid JSON, no markdown, no explanation:

{
  "name": "Full Name",
  "contact": {
    "phone": "...",
    "email": "...",
    "linkedin": "...",
    "github": "...",
    "location": "..."
  },
  "education": [
    {
      "degree": "...",
      "school": "...",
      "location": "...",
      "start": "...",
      "end": "...",
      "gpa": "...",
      "coursework": "..."
    }
  ],
  "skills": {
    "Languages": "...",
    "Frameworks": "...",
    "Databases": "...",
    "Tools": "...",
    "Cloud": "...",
    "Other": "..."
  },
  "experience": [
    {
      "title": "...",
      "company": "...",
      "location": "...",
      "start": "...",
      "end": "...",
      "tech": "...",
      "bullets": [
        "Accomplished X through Y using Z",
        "Accomplished X through Y using Z",
        "Accomplished X through Y using Z"
      ]
    }
  ],
  "projects": [
    {
      "name": "...",
      "tech": "...",
      "link": "...",
      "bullets": [
        "Accomplished X through Y using Z",
        "Accomplished X through Y using Z"
      ]
    }
  ],
  "ats_score": 88,
  "matched_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"]
}

CRITICAL RULES:
- ats_score should be a realistic integer between 75 and 95 based on actual keyword overlap
- matched_keywords should be 6-10 exact phrases from the JD that appear in the optimized resume
- Never fabricate experience, numbers, or technologies not in the original resume
- If information is truly missing, use placeholder text like "[City, Province]"
- Preserve the candidate's authentic voice while making bullets stronger`;
  },

  /**
   * COVER LETTER PROMPT
   *
   * Strategy:
   * - Use the already-optimized resume context
   * - Reference specific JD requirements
   * - Professional but warm tone, not generic
   * - ~350 words, 4 paragraphs
   */
  buildCoverLetterPrompt(resumeText, jdText, company, role) {
    const companyStr = company || '[Company Name]';
    const roleStr = role || 'this position';

    return `You are an expert cover letter writer. Write a compelling, personalized cover letter.

CANDIDATE'S RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}

COMPANY: ${companyStr}
ROLE: ${roleStr}

INSTRUCTIONS:
1. Opening paragraph: Hook with a specific, genuine reason why this role at ${companyStr} is exciting. Reference something specific from the JD or company.
2. Second paragraph: 2-3 specific achievements from the resume that directly map to key JD requirements. Use numbers/impact where possible.
3. Third paragraph: Show understanding of what the team/company is trying to accomplish and how you uniquely contribute.
4. Closing: Confident, not desperate. Express enthusiasm for next steps.

FORMAT:
- Length: 300-380 words
- Tone: Professional but human — not stiff or generic
- Do NOT use clichés like "I am writing to express my interest"
- Start with something compelling, not your name
- Include: [Date], [Hiring Manager / Hiring Team], Dear Hiring Manager,
- End with: Sincerely, [Candidate Name]

Return ONLY the cover letter text. No JSON. No extra explanation.`;
  },

  /**
   * HR MESSAGE PROMPT
   *
   * Strategy:
   * - Short (under 150 words)
   * - Immediately acknowledge you know they're busy
   * - 3 punchy achievement bullets, each under 20 words
   * - Soft ask, not pushy
   * - Based on the example format provided
   */
  buildHRMessagePrompt(resumeText, jdText, recruiterName, company, role) {
    const nameStr = recruiterName || '[Recruiter Name]';
    const companyStr = company || '[Company]';
    const roleStr = role || 'this role';

    return `You are writing a short, genuine LinkedIn/email cold outreach message to a recruiter.

CANDIDATE'S RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}

RECRUITER NAME: ${nameStr}
COMPANY: ${companyStr}  
ROLE: ${roleStr}

EXACT FORMAT TO FOLLOW:
Hi ${nameStr},

I know you likely receive a lot of messages like this, so I'll keep it very brief — just a quick introduction.

I'm a [job title] with experience in [2-3 core skills from resume matching JD], and I was excited to see the ${roleStr} role${companyStr !== '[Company]' ? ` at ${companyStr}` : ''}. Here's how my experience aligns:

• [Achievement 1] — must be under 20 words, quantified, matches JD requirement 1
• [Achievement 2] — must be under 20 words, quantified, matches JD requirement 2  
• [Achievement 3] — must be under 20 words, quantified, matches JD requirement 3

If helpful, I'd be happy to share more context or a project demo alongside my resume. Would that be okay?

Thank you for your time,
[Candidate Full Name]

RULES:
- Keep the EXACT opening line: "I know you likely receive a lot of messages like this, so I'll keep it very brief"
- Each bullet must be under 20 words
- Bullets must use real achievements from the resume
- Total message under 150 words
- Warm but not desperate tone
- Return ONLY the message text. No JSON. No explanation.`;
  }

};

/**
 * api.js
 *
 * PURPOSE:
 * All Claude API communication lives here.
 * Separating API logic from UI logic means:
 * - Easy to swap models or update API version
 * - Easy to add error handling, retries, or rate limiting
 * - Clean separation of concerns (interviewers love this)
 *
 * HOW IT WORKS:
 * We call the Anthropic /v1/messages endpoint directly from
 * the browser (same as the Artifacts setup). Three separate
 * calls — one per output — run sequentially with progress updates.
 */

const API = {

  async generateResume(resumeText, jdText) {
    const response = await fetch("/api/resume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        resume_text: resumeText,
        jd_text: jdText
      })
    });

    if (!response.ok) {
      throw new Error("Resume generation failed");
    }

    return await response.json();
  },

  async generateCoverLetter(resumeContext, jdText, company, role) {
    const response = await fetch("/api/cover-letter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        resume_context: resumeContext,   // ✅ FIXED
        jd_text: jdText,
        company,
        role
      })
    });

    if (!response.ok) {
      throw new Error("Cover letter generation failed");
    }

    return await response.json();
  },

  async generateHRMessage(resumeContext, jdText, recruiterName, company, role) {
    const response = await fetch("/api/hr-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        resume_context: resumeContext,   // ✅ FIXED
        jd_text: jdText,
        recruiter_name: recruiterName,
        company,
        role
      })
    });

    if (!response.ok) {
      throw new Error("HR message generation failed");
    }

    return await response.json();
  }

};

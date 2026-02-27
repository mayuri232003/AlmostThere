"""
app.py  —  AlmostThere Flask Backend
======================================
This is the main entry point for the backend server.

WHY A BACKEND?
- Your Anthropic API key must NEVER be in frontend JavaScript
  (anyone can open DevTools and steal it)
- Flask acts as a secure middleman:
    Browser → Flask (your server) → Claude API → Flask → Browser
- Flask also handles CORS so the browser allows cross-origin requests

HOW TO RUN:
    pip install -r requirements.txt
    cp .env.example .env          # then add your API key
    python app.py

The server starts at http://localhost:5000
"""
print("APP FILE LOADED")
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging

# Import our service modules
from services.resume_service import generate_resume
from services.cover_letter_service import generate_cover_letter
from services.hr_message_service import generate_hr_message

# ── Setup ──────────────────────────────────────────────
load_dotenv()   # reads .env file into os.environ
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path=""
)

@app.route("/")
def serve():
    return app.send_static_file("index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(FRONTEND_DIR, path)

# Allow requests from your frontend (localhost dev + production)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            # Add your production domain here if deploying:
            # "https://yourdomain.com"
        ]
    }
})



# Logging: shows request info in your terminal while developing
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)


# ── Health check ───────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    """Simple check — lets the frontend verify the server is running."""
    return jsonify({"status": "ok", "message": "AlmostThere backend running"})


# ── Route 1: Generate optimized resume ────────────────
@app.route("/api/resume", methods=["POST"])
def resume_route():
    """
    Receives resume text + JD text.
    Returns structured JSON with optimized resume data.

    Request body (JSON):
        resume_text  : str  — candidate's raw resume
        jd_text      : str  — full job description

    Response (JSON):
        name, contact, education, skills,
        experience, projects, ats_score, matched_keywords
    """
    data = request.get_json()

    # Validate required fields
    error = _validate(data, required=["resume_text", "jd_text"])
    if error:
        return error

    resume_text = data["resume_text"].strip()
    jd_text     = data["jd_text"].strip()

    logger.info(f"[/api/resume] resume={len(resume_text)} chars | jd={len(jd_text)} chars")

    try:
        result = generate_resume(resume_text, jd_text)
        return jsonify({"success": True, "data": result})

    except ValueError as e:
        # ValueError = bad AI output (e.g. JSON parse failed)
        logger.warning(f"[/api/resume] ValueError: {e}")
        return jsonify({"success": False, "error": str(e)}), 422

    except Exception as e:
        logger.error(f"[/api/resume] Unexpected error: {e}")
        return jsonify({"success": False, "error": "Resume generation failed. Please try again."}), 500


# ── Route 2: Generate cover letter ────────────────────
@app.route("/api/cover-letter", methods=["POST"])
def cover_letter_route():
    """
    Receives optimized resume context + JD + optional extras.
    Returns a plain-text cover letter.

    Request body (JSON):
        resume_context : str  — optimized resume as text
        jd_text        : str  — full job description
        company        : str  — (optional) company name
        role           : str  — (optional) role title
    """
    data = request.get_json()
    print("COVER LETTER REQUEST BODY:", data)
    
    error = _validate(data, required=["resume_context", "jd_text"])
    if error:
        return error

    resume_context = data["resume_context"].strip()
    jd_text        = data["jd_text"].strip()
    company        = data.get("company", "").strip()
    role           = data.get("role", "").strip()

    logger.info(f"[/api/cover-letter] company={company!r} role={role!r}")

    try:
        letter = generate_cover_letter(resume_context, jd_text, company, role)
        return jsonify({"success": True, "data": letter})

    except Exception as e:
        logger.error(f"[/api/cover-letter] Error: {e}")
        return jsonify({"success": False, "error": "Cover letter generation failed."}), 500


# ── Route 3: Generate HR cold message ─────────────────
@app.route("/api/hr-message", methods=["POST"])
def hr_message_route():
    """
    Receives resume context + JD + optional recruiter/company info.
    Returns a short plain-text LinkedIn/email cold outreach message.

    Request body (JSON):
        resume_context  : str  — optimized resume as text
        jd_text         : str  — full job description
        recruiter_name  : str  — (optional) recruiter's first name
        company         : str  — (optional) company name
        role            : str  — (optional) role title
    """
    data = request.get_json()

    error = _validate(data, required=["resume_context", "jd_text"])
    if error:
        return error

    resume_context = data["resume_context"].strip()
    jd_text        = data["jd_text"].strip()
    recruiter_name = data.get("recruiter_name", "").strip()
    company        = data.get("company", "").strip()
    role           = data.get("role", "").strip()

    logger.info(f"[/api/hr-message] recruiter={recruiter_name!r} company={company!r}")

    try:
        message = generate_hr_message(resume_context, jd_text, recruiter_name, company, role)
        return jsonify({"success": True, "data": message})

    except Exception as e:
        logger.error(f"[/api/hr-message] Error: {e}")
        return jsonify({"success": False, "error": "HR message generation failed."}), 500


# ── Route 4: Generate ALL three at once ───────────────
@app.route("/api/generate-all", methods=["POST"])
def generate_all_route():
    """
    Convenience endpoint: generates resume + cover letter + HR message
    in one request. The frontend calls this so it only needs one
    HTTP request instead of three.

    Request body (JSON):
        resume_text    : str  — candidate's raw resume
        jd_text        : str  — full job description
        recruiter_name : str  — (optional)
        company        : str  — (optional)
        role           : str  — (optional)

    Response (JSON):
        resume         : dict — structured resume data
        cover_letter   : str  — plain text
        hr_message     : str  — plain text
    """
    data = request.get_json()

    error = _validate(data, required=["resume_text", "jd_text"])
    if error:
        return error

    resume_text    = data["resume_text"].strip()
    jd_text        = data["jd_text"].strip()
    recruiter_name = data.get("recruiter_name", "").strip()
    company        = data.get("company", "").strip()
    role           = data.get("role", "").strip()

    logger.info(f"[/api/generate-all] Starting full generation pipeline")

    results = {}
    errors  = []

    # Step 1: Resume (must succeed — used as context for steps 2 & 3)
    try:
        logger.info("[/api/generate-all] Step 1: resume")
        resume_data = generate_resume(resume_text, jd_text)
        results["resume"] = resume_data

        # Build text context from the structured resume for steps 2 & 3
        resume_context = _build_resume_context(resume_data)

    except Exception as e:
        logger.error(f"[/api/generate-all] Resume failed: {e}")
        return jsonify({
            "success": False,
            "error": f"Resume generation failed: {e}"
        }), 500

    # Step 2: Cover letter
    try:
        logger.info("[/api/generate-all] Step 2: cover letter")
        results["cover_letter"] = generate_cover_letter(
            resume_context, jd_text, company, role
        )
    except Exception as e:
        logger.warning(f"[/api/generate-all] Cover letter failed: {e}")
        errors.append("Cover letter generation failed.")
        results["cover_letter"] = ""

    # Step 3: HR message
    try:
        logger.info("[/api/generate-all] Step 3: HR message")
        results["hr_message"] = generate_hr_message(
            resume_context, jd_text, recruiter_name, company, role
        )
    except Exception as e:
        logger.warning(f"[/api/generate-all] HR message failed: {e}")
        errors.append("HR message generation failed.")
        results["hr_message"] = ""

    logger.info("[/api/generate-all] Pipeline complete")

    return jsonify({
        "success": True,
        "data":    results,
        "warnings": errors   # partial failures reported, not fatal
    })


# ── Helpers ────────────────────────────────────────────

def _validate(data, required: list):
    """
    Returns a JSON error response if any required key is missing
    or empty, otherwise returns None (no error).
    """
    if not data:
        return jsonify({"success": False, "error": "Request body is empty"}), 400

    for key in required:
        if not data.get(key) or not str(data[key]).strip():
            return jsonify({
                "success": False,
                "error": f"Missing required field: '{key}'"
            }), 400

    return None   # no error


def _build_resume_context(resume_data: dict) -> str:
    """
    Converts the structured resume JSON into a plain-text string
    for use as context in the cover letter and HR message prompts.
    """
    lines = []

    lines.append(f"Name: {resume_data.get('name', '')}")

    contact = resume_data.get("contact", {})
    if contact:
        lines.append(f"Contact: {contact}")

    education = resume_data.get("education", [])
    if education:
        lines.append("\nEDUCATION:")
        for e in education:
            lines.append(
                f"  {e.get('degree')} at {e.get('school')} "
                f"({e.get('start')}–{e.get('end')}) "
                f"GPA: {e.get('gpa', 'N/A')}"
            )

    skills = resume_data.get("skills", {})
    if skills:
        lines.append("\nSKILLS:")
        for k, v in skills.items():
            if v:
                lines.append(f"  {k}: {v}")

    experience = resume_data.get("experience", [])
    if experience:
        lines.append("\nEXPERIENCE:")
        for exp in experience:
            lines.append(
                f"  {exp.get('title')} at {exp.get('company')} "
                f"({exp.get('start')}–{exp.get('end')})"
            )
            for bullet in exp.get("bullets", []):
                lines.append(f"    • {bullet}")

    projects = resume_data.get("projects", [])
    if projects:
        lines.append("\nPROJECTS:")
        for p in projects:
            lines.append(f"  {p.get('name')} ({p.get('tech', '')})")
            for bullet in p.get("bullets", []):
                lines.append(f"    • {bullet}")

    return "\n".join(lines)


# ── Run ────────────────────────────────────────────────
if __name__ == "__main__":
    # Check API key is set
    if not os.getenv("GROQ_API_KEY"):
        print("\n❌  ERROR: GROQ_API_KEY not set in .env file")
        print("   Copy .env.example → .env and add your Groq key")
        print("   Get a free key at: https://console.groq.com\n")
        exit(1)

    print("\n✅  AlmostThere backend starting...")
    print("   API: http://localhost:5000/api/health\n")

    app.run(
        host="0.0.0.0",   # accessible from any device on local network
        port=5000,
        debug=True        # set to False in production
    )

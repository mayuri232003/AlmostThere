# AlmostThere 🎯
### AI-Powered Resume Optimizer — Tailored Resumes, Cover Letters & HR Messages in Seconds

![Python](https://img.shields.io/badge/Python-3.9%2B-brown?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-orange?style=flat-square&logo=flask)
![Groq](https://img.shields.io/badge/Groq-Llama%203.3-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## What is AlmostThere?

**AlmostThere** is a full-stack AI web application that takes your existing resume and any job description, then instantly generates three job-application assets tailored specifically to that role:

| Output | What you get |
|--------|-------------|
| 📄 **Tailored Resume** | ATS-optimized, JD-aligned resume with bullets rewritten in *"Accomplished X through Y using Z"* format |
| ✉️ **Cover Letter** | Professional, personalized ~350-word cover letter that references the specific JD |
| 💬 **HR Cold Message** | Short (<150 words) LinkedIn/email message with 3 punchy value bullets — ready to copy-paste |

Built with **Flask** (backend) + **Vanilla HTML/CSS/JS** (frontend) + **Groq AI** (Llama 3.3 70B).

---

## Features

- ✅ **ATS Score** — estimates your keyword match score and highlights matched keywords
- ✅ **X→Y→Z Bullets** — every bullet follows *"Accomplished [result] through [action] using [tool]"*
- ✅ **Placeholder-safe** — missing resume fields show as `[placeholder]` instead of breaking
- ✅ **Download** — resume as PDF, cover letter as .doc
- ✅ **Copy buttons** — one-click copy for all three outputs
- ✅ **Warm editorial design** — orange · cream · brown palette with smooth animations
- ✅ **Free AI** — powered by Groq (free tier, no credit card needed)
- ✅ **Single command** — just `python app.py` and everything runs at `localhost:5000`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.9+, Flask, Flask-CORS |
| **AI** | [Groq API](https://console.groq.com) — Llama 3.3 70B (free) |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Fonts** | Cormorant Garamond + Plus Jakarta Sans |

---

## Project Structure

```
AlmostThere/
│
├── backend/
│   ├── app.py                      ← Flask server — serves frontend + API routes
│   ├── requirements.txt            ← Python dependencies
│   ├── .env.example                ← Template for your API key
│   │
│   └── services/
│       ├── claude_client.py        ← Groq API wrapper (Llama 3.3 70B)
│       ├── resume_service.py       ← Resume prompt engineering + JSON parsing
│       ├── cover_letter_service.py ← Cover letter prompt + generation
│       └── hr_message_service.py   ← HR cold message prompt + generation
│
└── frontend/
    ├── index.html                  ← Main page (served by Flask at localhost:5000)
    └── src/
        ├── styles/
        │   └── main.css            ← All styling — orange/cream/brown theme
        └── js/
            ├── api.js              ← Calls Flask backend endpoints
            ├── app.js              ← Main app logic + UI state management
            ├── render.js           ← Builds formatted resume HTML from AI JSON
            └── download.js         ← PDF + .doc download logic
```

---

## Getting Started

### Prerequisites
- Python 3.9 or higher
- A free Groq API key → [console.groq.com](https://console.groq.com)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/AlmostThere.git
cd AlmostThere/backend
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Add your API key**
```bash
cp .env.example .env
```
Open `.env` and replace the placeholder with your real key:
```
GROQ_API_KEY=your_groq_api_key_here
```

### Run

```bash
python app.py
```

Open your browser and go to:
```
http://localhost:5000
```

The full app is running — frontend and backend together. ✅

---

## How It Works

```
Browser  →  POST /api/generate-all  →  Flask (app.py)
                                              │
                                    ┌─────────┼─────────┐
                                    ▼         ▼         ▼
                              resume_    cover_     hr_message_
                              service    letter_    service
                                    │    service         │
                                    └─────────┬──────────┘
                                              │
                                        Groq API
                                    (Llama 3.3 70B)
                                              │
                              ┌───────────────┴────────────────┐
                              ▼               ▼                ▼
                        Resume JSON     Cover Letter      HR Message
                         + ATS Score    (plain text)      (plain text)
                              │
                        render.js builds
                        visual resume HTML
```

### Resume Optimization Rules

Every resume follows these rules for maximum ATS compatibility:

- **Section order:** Name → Contact → Education → Skills → Experience → Projects
- **Bullet format:** *"Accomplished [X result] through [Y action] using [Z technology]"*
- **Work experience:** Exactly 3 bullets per role
- **Projects:** Exactly 2 bullets per project
- **Missing fields:** Shown as `[placeholder]` — sections never omitted
- **Keywords:** JD keywords woven naturally throughout

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/health` | Health check — returns `{"status": "ok"}` |
| `POST` | `/api/generate-all` | Generate all 3 outputs in one request |

### POST `/api/generate-all`

**Request body:**
```json
{
  "resume_text":    "Your full resume text...",
  "jd_text":        "Full job description...",
  "recruiter_name": "Alex",
  "company":        "Amazon",
  "role":           "Data Scientist"
}
```
`recruiter_name`, `company`, and `role` are optional — they personalize the HR message.

**Response:**
```json
{
  "success": true,
  "data": {
    "resume": {
      "name": "...",
      "contact": {},
      "education": [],
      "skills": {},
      "experience": [],
      "projects": [],
      "ats_score": 88,
      "matched_keywords": ["keyword1", "..."]
    },
    "cover_letter": "Dear Hiring Manager, ...",
    "hr_message":   "Hi Alex, I know you likely receive..."
  }
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Free API key from [console.groq.com](https://console.groq.com) |

---

## Why Groq?

- **Free tier** — no credit card required, generous rate limits
- **Fast** — Groq's custom hardware (LPU) makes inference significantly faster than GPU-based alternatives
- **Quality** — Llama 3.3 70B handles structured writing and JSON output reliably

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `GROQ_API_KEY not set` | `.env` file missing or key not added | Create `.env` from `.env.example` and add your key |
| `ModuleNotFoundError` | Dependencies not installed | Run `pip install -r requirements.txt` |
| Page not loading at 5000 | Flask not running | Make sure `python app.py` is running with no errors |
| `401 Unauthorized` | Invalid API key | Double-check your key at [console.groq.com](https://console.groq.com) |
| `429 Rate Limited` | Too many requests | Wait 30 seconds and try again |
| JSON parse error | Model response format issue | Rare — just click Optimize again |

---

## Contributing

Pull requests are welcome! To contribute:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Ideas for contributions: better prompt tuning, additional output formats, dark/light theme toggle, multi-language support.

---

## License

MIT License — free to use, modify, and distribute.

---

## Acknowledgements

- [Groq](https://groq.com) for the fast, free LLM API
- [Meta AI](https://ai.meta.com) for the Llama 3.3 70B model
- Built as a portfolio project for Data Science / ML Engineering roles

---

*Made with ☕ and a lot of resume pain.*

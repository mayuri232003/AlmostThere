# AlmostThere — How to Run

## Folder Structure
```
AlmostThere/
├── frontend/           ← The website (HTML/CSS/JS)
│   ├── index.html      ← Open this in your browser
│   └── src/
│       ├── styles/main.css
│       └── js/ (api.js, app.js, render.js, download.js)
│
└── backend/            ← The Python server
    ├── app.py          ← Run this with: python app.py
    ├── requirements.txt
    ├── .env.example    ← Copy to .env, add your key
    └── services/       ← AI logic lives here
```

## First Time Setup

1. cd backend
2. pip install -r requirements.txt
3. Copy .env.example → .env, add your Groq key from console.groq.com

## Every Time

Step 1 — In a terminal inside the backend folder:
  python app.py
  (keep this running!)

Step 2 — visit this link in browser "http://127.0.0.1:5000/"

Done!

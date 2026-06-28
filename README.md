# ⚡ VoltWatch

**Crowdsourced AI-powered power outage tracker for DHA Lahore**

> Know before the dark.

VoltWatch lets residents of DHA Lahore Phases 1–8 report power outages with one tap, see live outage status on a map, and get AI-predicted warnings before outages hit — based on real community data.

---

## The Problem

Pakistan faces daily load shedding affecting millions. Official LESCO schedules are unreliable, hard to find, and frequently ignored. There is no community-driven, real-time system that learns and predicts local outage patterns.

---

## The Solution

VoltWatch crowdsources outage reports from residents, detects recurring patterns using frequency analysis, and generates confidence-scored predictions per neighborhood — so you can charge your devices, save your work, and plan your day before the lights go out.

---

## Features

- One-tap outage and restoration reporting — no login required
- Live map showing real-time outage status per DHA phase
- AI pattern engine — detects recurring outage hours per area
- Confidence-scored predictions (e.g. "86% chance of outage at 11pm")
- 7-day outage history with stats per phase
- Auto-refresh every 30 seconds

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python + FastAPI |
| Database | SQLite (MVP) → PostgreSQL |
| AI Engine | Pandas frequency analysis + confidence scoring |
| Frontend | React + Vite |
| Maps | Leaflet.js + CartoDB dark tiles |
| Hosting | Railway (backend) + Vercel (frontend) |

---

## Project Structure

```
voltwatch/
├── backend/
│   ├── main.py            # FastAPI app + all endpoints
│   ├── database.py        # SQLAlchemy models
│   ├── pattern_engine.py  # AI prediction logic
│   ├── seed.py            # Synthetic data generator
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        ├── config.js
        ├── hooks/
        │   └── useApi.js
        └── components/
            ├── LiveMap.jsx
            ├── PhasePanel.jsx
            ├── ReportButton.jsx
            ├── Header.jsx
            └── Legend.jsx
```

---

## Running Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API docs at http://localhost:8000/docs
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/map | All phases status + next prediction |
| GET | /api/status | Current outage status per phase |
| GET | /api/predictions/{phase} | AI predictions for a phase |
| GET | /api/history/{phase} | 7/14/21 day outage stats |
| POST | /api/report | Submit outage or restoration report |
| POST | /api/subscribe | Register for push alerts |

---

## Future Roadmap

```
VoltWatch MVP (Now)
        │
        ▼
┌───────────────────────┐
│  Phase 1 — Alerts     │
│  SMS via Twilio        │
│  Browser push notify   │
│  10–15 min warnings    │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Phase 2 — Mobile App │
│  Flutter iOS + Android │
│  Offline support       │
│  Background alerts     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Phase 3 — Expand     │
│  All of Lahore         │
│  Karachi, Islamabad    │
│  Nigeria, Bangladesh   │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Phase 4 — B2B Data   │
│  Utility partnerships  │
│  Official schedule API │
│  Grid analytics        │
└───────────────────────┘
```

---

## Built By

**Yousuf Ali** — Solo  
Computational Physics, University of the Punjab Lahore  
[GitHub](https://github.com/ch-yousafali) · [LinkedIn](https://linkedin.com/in/ch-yousafali)

Built for **ImpactForge Hackathon** on Devpost — July 2026

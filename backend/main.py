"""
VoltWatch — FastAPI Backend
Endpoints:
  POST /api/report              — Submit outage/restoration report
  GET  /api/status              — Current outage status per phase
  GET  /api/predictions/{phase} — AI predictions for a phase
  GET  /api/history/{phase}     — Outage history stats for a phase
  GET  /api/map                 — All phases status for map view
  POST /api/subscribe           — Register browser push subscription
  GET  /api/health              — Health check
"""

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional
import json

from database import get_db, init_db, OutageReport, Prediction, PushSubscription
from pattern_engine import run_pattern_engine, get_todays_predictions
from seed import generate_seed_data

app = FastAPI(title="VoltWatch API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DHA_PHASES = list(range(1, 9))  # 1–8


# ── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    init_db()
    db = next(get_db())
    try:
        # Seed if DB is empty
        count = db.query(OutageReport).count()
        if count == 0:
            print("📦 Empty DB detected — seeding synthetic data...")
            generate_seed_data()

        # Run pattern engine on startup
        run_pattern_engine(db)
        print("🚀 VoltWatch backend ready.")
    finally:
        db.close()


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class ReportIn(BaseModel):
    phase: int
    report_type: str  # "OUT" or "BACK"


class SubscribeIn(BaseModel):
    phase: int
    subscription: dict  # Full Web Push subscription object


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_current_phase_status(db: Session, phase: int) -> dict:
    """
    Determine if a phase is currently OUT or ON based on the last report.
    """
    last_report = (
        db.query(OutageReport)
        .filter(OutageReport.phase == phase)
        .order_by(OutageReport.timestamp.desc())
        .first()
    )

    if not last_report:
        return {"phase": phase, "status": "unknown", "since": None, "report_count_today": 0}

    # Count today's reports for credibility
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0)
    today_count = (
        db.query(OutageReport)
        .filter(
            OutageReport.phase == phase,
            OutageReport.timestamp >= today_start
        )
        .count()
    )

    return {
        "phase": phase,
        "status": "out" if last_report.report_type == "OUT" else "on",
        "since": last_report.timestamp.isoformat(),
        "report_count_today": today_count,
    }


def get_phase_stats(db: Session, phase: int, days: int = 7) -> dict:
    """
    Compute outage frequency, average duration, worst hours for a phase.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)

    out_reports = (
        db.query(OutageReport)
        .filter(
            OutageReport.phase == phase,
            OutageReport.report_type == "OUT",
            OutageReport.timestamp >= cutoff
        )
        .order_by(OutageReport.timestamp)
        .all()
    )

    back_reports = (
        db.query(OutageReport)
        .filter(
            OutageReport.phase == phase,
            OutageReport.report_type == "BACK",
            OutageReport.timestamp >= cutoff
        )
        .order_by(OutageReport.timestamp)
        .all()
    )

    # Count outages per day
    day_counts: dict[str, int] = defaultdict(int)
    hour_counts: dict[int, int] = defaultdict(int)
    durations = []

    for out in out_reports:
        day_key = out.timestamp.strftime("%Y-%m-%d")
        day_counts[day_key] += 1
        hour_counts[out.timestamp.hour] += 1

        for back in back_reports:
            if back.timestamp > out.timestamp:
                delta = (back.timestamp - out.timestamp).total_seconds() / 3600
                if 0.25 <= delta <= 6:
                    durations.append(delta)
                break

    worst_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]

    return {
        "phase": phase,
        "period_days": days,
        "total_outages": len(out_reports),
        "avg_outages_per_day": round(len(out_reports) / days, 1),
        "avg_duration_hours": round(sum(durations) / len(durations), 1) if durations else None,
        "worst_hours": [{"hour": h, "count": c} for h, c in worst_hours],
        "daily_breakdown": [
            {"date": d, "outages": c}
            for d, c in sorted(day_counts.items())
        ],
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/report")
def submit_report(
    body: ReportIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if body.phase not in DHA_PHASES:
        raise HTTPException(status_code=400, detail="Phase must be between 1 and 8.")

    if body.report_type not in ("OUT", "BACK"):
        raise HTTPException(status_code=400, detail="report_type must be OUT or BACK.")

    report = OutageReport(
        phase=body.phase,
        report_type=body.report_type,
        timestamp=datetime.utcnow(),
        is_synthetic=False
    )
    db.add(report)
    db.commit()

    # Re-run pattern engine in background after new real report
    background_tasks.add_task(run_pattern_engine, db)

    return {
        "success": True,
        "message": f"Phase {body.phase} reported as {body.report_type}.",
        "timestamp": report.timestamp.isoformat()
    }


@app.get("/api/status")
def all_status(db: Session = Depends(get_db)):
    """Return current status for all 8 phases — used by the map."""
    return [get_current_phase_status(db, phase) for phase in DHA_PHASES]


@app.get("/api/status/{phase}")
def phase_status(phase: int, db: Session = Depends(get_db)):
    if phase not in DHA_PHASES:
        raise HTTPException(status_code=404, detail="Invalid phase.")
    return get_current_phase_status(db, phase)


@app.get("/api/predictions/{phase}")
def phase_predictions(phase: int, db: Session = Depends(get_db)):
    if phase not in DHA_PHASES:
        raise HTTPException(status_code=404, detail="Invalid phase.")
    predictions = get_todays_predictions(db, phase)
    return {"phase": phase, "predictions": predictions}


@app.get("/api/predictions")
def all_predictions(db: Session = Depends(get_db)):
    """Return upcoming predictions for all phases — for map overlay."""
    now = datetime.utcnow()
    all_preds = []

    for phase in DHA_PHASES:
        preds = get_todays_predictions(db, phase)
        upcoming = [p for p in preds if p["is_upcoming"] and p["confidence_score"] >= 0.5]
        if upcoming:
            all_preds.append({
                "phase": phase,
                "next_predicted": upcoming[0]
            })

    return all_preds


@app.get("/api/history/{phase}")
def phase_history(phase: int, days: int = 7, db: Session = Depends(get_db)):
    if phase not in DHA_PHASES:
        raise HTTPException(status_code=404, detail="Invalid phase.")
    if days not in (7, 14, 21):
        raise HTTPException(status_code=400, detail="days must be 7, 14, or 21.")
    return get_phase_stats(db, phase, days)


@app.get("/api/map")
def map_data(db: Session = Depends(get_db)):
    """
    Combined endpoint for the map view:
    - Current status per phase
    - Next predicted outage per phase
    """
    now = datetime.utcnow()
    result = []

    for phase in DHA_PHASES:
        status = get_current_phase_status(db, phase)
        predictions = get_todays_predictions(db, phase)
        upcoming = [p for p in predictions if p["is_upcoming"]]

        result.append({
            **status,
            "next_prediction": upcoming[0] if upcoming else None,
        })

    return result


@app.post("/api/subscribe")
def subscribe(body: SubscribeIn, db: Session = Depends(get_db)):
    if body.phase not in DHA_PHASES:
        raise HTTPException(status_code=400, detail="Invalid phase.")

    sub = PushSubscription(
        phase=body.phase,
        subscription_json=json.dumps(body.subscription),
        created_at=datetime.utcnow()
    )
    db.add(sub)
    db.commit()

    return {"success": True, "message": f"Subscribed to alerts for DHA Phase {body.phase}."}


@app.post("/api/admin/reseed")
def reseed(db: Session = Depends(get_db)):
    """Dev endpoint — reseed synthetic data and rerun pattern engine."""
    generate_seed_data()
    run_pattern_engine(db)
    return {"success": True, "message": "Reseeded and patterns regenerated."}


@app.post("/api/admin/rerun-patterns")
def rerun_patterns(db: Session = Depends(get_db)):
    """Dev endpoint — rerun pattern engine manually."""
    count = run_pattern_engine(db)
    return {"success": True, "predictions_generated": count}
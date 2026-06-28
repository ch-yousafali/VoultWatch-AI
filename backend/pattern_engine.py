"""
Pattern Engine — analyzes outage_reports and generates predictions per DHA phase.
Logic:
  1. Group OUT reports by phase + hour of day
  2. Count frequency per hour over the last 21 days
  3. Hours exceeding frequency threshold → generate prediction with confidence score
  4. Estimate duration from historical OUT→BACK pairs
"""

from datetime import datetime, timedelta
from collections import defaultdict
from sqlalchemy.orm import Session
from database import OutageReport, Prediction


LOOKBACK_DAYS = 21
MIN_OCCURRENCES = 3       # Minimum times an outage must appear in that hour to predict
HIGH_CONFIDENCE = 0.75    # Threshold for high confidence


def run_pattern_engine(db: Session):
    """
    Analyze historical data and write fresh predictions to DB.
    Call this on app startup and periodically (e.g. every 6 hours).
    """
    cutoff = datetime.utcnow() - timedelta(days=LOOKBACK_DAYS)

    reports = (
        db.query(OutageReport)
        .filter(OutageReport.timestamp >= cutoff)
        .filter(OutageReport.report_type == "OUT")
        .all()
    )

    # Group by phase → hour → count
    phase_hour_counts: dict[int, dict[int, int]] = defaultdict(lambda: defaultdict(int))

    for report in reports:
        hour = report.timestamp.hour
        phase_hour_counts[report.phase][hour] += 1

    # Clear old predictions
    db.query(Prediction).delete()

    predictions_generated = 0

    for phase, hour_counts in phase_hour_counts.items():
        # Estimate average outage duration for this phase
        avg_duration = _estimate_duration(db, phase, cutoff)

        for hour, count in hour_counts.items():
            if count < MIN_OCCURRENCES:
                continue

            # Confidence: how often did it happen out of possible days
            confidence = min(count / LOOKBACK_DAYS, 1.0)

            # Boost confidence if it's consistently high
            if count >= LOOKBACK_DAYS * 0.7:
                confidence = min(confidence * 1.2, 0.97)

            prediction = Prediction(
                phase=phase,
                predicted_hour=hour,
                confidence_score=round(confidence, 2),
                estimated_duration_hours=avg_duration,
                generated_at=datetime.utcnow()
            )
            db.add(prediction)
            predictions_generated += 1

    db.commit()
    print(f"✅ Pattern engine: generated {predictions_generated} predictions.")
    return predictions_generated


def _estimate_duration(db: Session, phase: int, cutoff: datetime) -> float:
    """
    Estimate average outage duration by pairing OUT and BACK reports.
    Falls back to 1.5 hours if insufficient data.
    """
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

    durations = []

    for out in out_reports:
        # Find the nearest BACK report after this OUT
        for back in back_reports:
            if back.timestamp > out.timestamp:
                delta_hours = (back.timestamp - out.timestamp).total_seconds() / 3600
                if 0.25 <= delta_hours <= 6:  # Sanity check: 15min to 6 hours
                    durations.append(delta_hours)
                break

    if not durations:
        return 1.5  # Default fallback

    return round(sum(durations) / len(durations), 1)


def get_todays_predictions(db: Session, phase: int) -> list[dict]:
    """
    Return today's predictions for a given phase, sorted by hour.
    """
    now = datetime.utcnow()

    predictions = (
        db.query(Prediction)
        .filter(Prediction.phase == phase)
        .order_by(Prediction.predicted_hour)
        .all()
    )

    result = []
    for p in predictions:
        # Build a datetime for today at the predicted hour
        predicted_time = now.replace(
            hour=p.predicted_hour,
            minute=0,
            second=0,
            microsecond=0
        )

        result.append({
            "phase": p.phase,
            "predicted_hour": p.predicted_hour,
            "predicted_time": predicted_time.isoformat(),
            "confidence_score": p.confidence_score,
            "estimated_duration_hours": p.estimated_duration_hours,
            "is_upcoming": predicted_time > now,
        })

    return result
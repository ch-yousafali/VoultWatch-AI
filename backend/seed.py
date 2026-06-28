"""
Seed script — generates 21 days of synthetic outage data for DHA Lahore Phases 1-8.
Patterns are based on real LESCO load shedding behavior:
- Peak outage hours: 2pm–4pm, 7pm–9pm, 11pm–1am
- Each phase has slightly different timing to feel realistic
- Weekdays heavier than weekends
"""

from datetime import datetime, timedelta
import random
from database import SessionLocal, OutageReport, init_db

# Realistic outage windows per phase (hour_start, hour_end, probability)
PHASE_PATTERNS = {
    1: [(14, 16, 0.85), (19, 21, 0.75), (23, 25, 0.60)],
    2: [(13, 15, 0.80), (20, 22, 0.70), (0,  2,  0.55)],
    3: [(15, 17, 0.90), (18, 20, 0.65), (22, 24, 0.50)],
    4: [(14, 16, 0.75), (21, 23, 0.80), (1,  3,  0.45)],
    5: [(12, 14, 0.85), (19, 21, 0.70), (23, 25, 0.60)],
    6: [(13, 15, 0.70), (20, 22, 0.85), (0,  2,  0.50)],
    7: [(15, 17, 0.80), (18, 20, 0.75), (22, 24, 0.55)],
    8: [(14, 16, 0.90), (21, 23, 0.65), (23, 25, 0.45)],
}

OUTAGE_DURATIONS = [1, 1, 1.5, 2, 2, 2.5, 3]  # weighted toward 1-2 hours


def generate_seed_data(days: int = 21):
    init_db()
    db = SessionLocal()

    try:
        # Clear existing synthetic data
        db.query(OutageReport).filter(OutageReport.is_synthetic == True).delete()
        db.commit()

        reports = []
        now = datetime.utcnow()
        start_date = now - timedelta(days=days)

        for phase, windows in PHASE_PATTERNS.items():
            current = start_date

            while current < now:
                is_weekend = current.weekday() >= 5
                day_multiplier = 0.6 if is_weekend else 1.0

                for (hour_start, hour_end, base_prob) in windows:
                    prob = base_prob * day_multiplier

                    if random.random() < prob:
                        # Pick a random minute within the window
                        outage_hour = hour_start % 24
                        outage_minute = random.randint(0, 59)
                        outage_time = current.replace(
                            hour=outage_hour,
                            minute=outage_minute,
                            second=0,
                            microsecond=0
                        )

                        if outage_time > now:
                            continue

                        # Log outage start
                        reports.append(OutageReport(
                            phase=phase,
                            report_type="OUT",
                            timestamp=outage_time,
                            is_synthetic=True
                        ))

                        # Log restoration after duration
                        duration = random.choice(OUTAGE_DURATIONS)
                        restore_time = outage_time + timedelta(hours=duration)

                        if restore_time < now:
                            reports.append(OutageReport(
                                phase=phase,
                                report_type="BACK",
                                timestamp=restore_time,
                                is_synthetic=True
                            ))

                current += timedelta(days=1)

        db.bulk_save_objects(reports)
        db.commit()
        print(f"✅ Seeded {len(reports)} synthetic reports across {days} days for DHA Phases 1-8.")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    generate_seed_data()
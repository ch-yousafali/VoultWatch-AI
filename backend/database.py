from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./voltwatch.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class OutageReport(Base):
    __tablename__ = "outage_reports"

    id = Column(Integer, primary_key=True, index=True)
    phase = Column(Integer, nullable=False)          # DHA Phase 1-8
    report_type = Column(String, nullable=False)     # "OUT" or "BACK"
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_synthetic = Column(Boolean, default=False)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    phase = Column(Integer, nullable=False)
    predicted_hour = Column(Integer, nullable=False)  # 0-23
    confidence_score = Column(Float, nullable=False)  # 0.0 - 1.0
    estimated_duration_hours = Column(Float, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    phase = Column(Integer, nullable=False)
    subscription_json = Column(Text, nullable=False)  # Full Web Push subscription object
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
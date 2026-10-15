import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = os.path.join(os.path.dirname(__file__), "machinasense.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class AlertRecord(Base):
    __tablename__ = "alert_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    alert_code = Column(String(50), unique=True, index=True)
    machine_id = Column(String(50), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    severity = Column(String(20), index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    fault_class = Column(Integer)  # 0 to 4
    fault_name = Column(String(100))
    confidence = Column(Float)
    anomaly_score = Column(Float)
    rpm = Column(Float)
    health_index = Column(Float)
    estimated_rul_hours = Column(Float)
    recommended_action = Column(Text)
    status = Column(String(30), default="PENDING")  # PENDING, APPROVED, DISMISSED, RECLASSIFIED
    operator_notes = Column(Text, nullable=True)
    top_z_features_json = Column(Text)  # JSON list of top deviation metrics
    sensor_snapshot_json = Column(Text)  # JSON dict of raw sensor windows
    fft_spectrum_json = Column(Text)  # JSON dict with freqs and amplitudes

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    accuracy = Column(Float)
    macro_precision = Column(Float)
    macro_recall = Column(Float)
    macro_f1 = Column(Float)
    roc_auc = Column(Float)
    false_alarm_rate = Column(Float)
    mean_detection_latency_ms = Column(Float)
    confusion_matrix_json = Column(Text)
    per_class_metrics_json = Column(Text)
    dataset_split_info = Column(Text)

class FeedbackLog(Base):
    __tablename__ = "feedback_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    alert_id = Column(Integer, index=True)
    action = Column(String(50))  # APPROVE_MAINTENANCE_ORDER, DISMISS_FALSE_POSITIVE, RECLASSIFY_AND_RETRAIN
    previous_class = Column(Integer)
    new_class = Column(Integer)
    operator_id = Column(String(50), default="OPERATOR-CHRIS")
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

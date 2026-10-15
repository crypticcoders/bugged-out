import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd

from database import init_db, get_db, AlertRecord, EvaluationRun, FeedbackLog
from schemas import (
    LiveTelemetryFrame, StressTestRequest, StressTestResponse,
    AlertResponse, ApprovalRequest, EvaluationMetricsResponse, EdgeBenchmarkResponse
)
from telemetry_generator import (
    generate_synthetic_dataset, generate_window_signal,
    FAULT_CLASSES, MACHINE_PROFILES
)
from dsp_pipeline import (
    sanitize_and_impute, apply_zero_phase_butterworth,
    compute_fft_spectrum, extract_24_features, run_stress_test_experiment, FS
)
from ml_engine import MachinaSenseMLEngine

ml_engine = MachinaSenseMLEngine()
train_data_df: Optional[pd.DataFrame] = None
held_out_data_df: Optional[pd.DataFrame] = None
held_out_X: Optional[np.ndarray] = None
held_out_y: Optional[np.ndarray] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global train_data_df, held_out_data_df, held_out_X, held_out_y
    print("[Startup] Initializing SQLite database...")
    init_db()

    print("[Startup] Generating 12,000 physical sensor samples (70/30 train/held-out split)...")
    train_data_df, held_out_data_df = generate_synthetic_dataset(total_samples=12000, window_size=256, train_ratio=0.7)

    print("[Startup] Training Dual-Stage ML & XAI Engine...")
    ml_engine.train_models(train_data_df, held_out_data_df, window_size=256)

    # Cache held-out X and y for fast retraining evaluation
    held_out_X, held_out_y = ml_engine._df_to_feature_matrix(held_out_data_df, window_size=256)

    # Pre-seed initial evidence-backed alert records in SQLite
    print("[Startup] Seeding initial forensic alert records...")
    seed_initial_alerts()

    print("[Startup] MachinaSense Backend Ready!")
    yield
    print("[Shutdown] Cleaning up MachinaSense...")

app = FastAPI(
    title="MachinaSense: Intelligent Industrial Fault Detection & Predictive Maintenance",
    version="1.0.0",
    description="Production-Grade Physics-Informed Industrial DSP, Anomaly Detection & Edge Computing API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def seed_initial_alerts():
    from database import SessionLocal
    db = SessionLocal()
    try:
        count = db.query(AlertRecord).count()
        if count == 0:
            sample_alerts = [
                {
                    "alert_code": "ALT-2026-9041",
                    "machine_id": "CNC-SPINDLE-01",
                    "timestamp": datetime.utcnow() - timedelta(minutes=14),
                    "severity": "CRITICAL",
                    "fault_class": 1,
                    "fault_name": "Bearing Inner Race Spall",
                    "confidence": 0.942,
                    "anomaly_score": 0.895,
                    "rpm": 1824.0,
                    "health_index": 38.4,
                    "estimated_rul_hours": 142.5,
                    "recommended_action": "Schedule immediate bearing assembly replacement. Inspect BPFI harmonic at 165.1 Hz.",
                    "status": "PENDING",
                    "top_z_features": [
                        {"feature_name": "kurtosis", "feature_label": "Vibration Kurtosis", "sigma_deviation": 5.82, "physical_impact": "Sharp impulsive micro-impacts"},
                        {"feature_name": "envelope_energy", "feature_label": "HF Bearing Resonance Energy", "sigma_deviation": 4.15, "physical_impact": "Sub-surface raceway spall ringing"},
                        {"feature_name": "crest_factor", "feature_label": "Crest Factor", "sigma_deviation": 3.74, "physical_impact": "Elevated peak-to-RMS shock"},
                        {"feature_name": "acoustic_rms", "feature_label": "Ultrasonic Acoustic dB", "sigma_deviation": 2.91, "physical_impact": "Acoustic friction emission"}
                    ]
                },
                {
                    "alert_code": "ALT-2026-8812",
                    "machine_id": "TURBINE-GEN-04",
                    "timestamp": datetime.utcnow() - timedelta(minutes=42),
                    "severity": "HIGH",
                    "fault_class": 2,
                    "fault_name": "Rotor Unbalance",
                    "confidence": 0.918,
                    "anomaly_score": 0.782,
                    "rpm": 2985.0,
                    "health_index": 52.1,
                    "estimated_rul_hours": 380.0,
                    "recommended_action": "Execute dynamic field single-plane balancing on rotor coupling. Check mass offset.",
                    "status": "PENDING",
                    "top_z_features": [
                        {"feature_name": "harmonic_1x", "feature_label": "1x Shaft Frequency Harmonic", "sigma_deviation": 4.95, "physical_impact": "Severe radial unbalance energy at 49.8 Hz"},
                        {"feature_name": "rms", "feature_label": "Vibration Velocity RMS", "sigma_deviation": 3.80, "physical_impact": "Exceeds ISO 10816 Zone C allowable limit"},
                        {"feature_name": "dominant_magnitude", "feature_label": "Dominant Peak Magnitude", "sigma_deviation": 3.42, "physical_impact": "Pure sinusoidal 1x f0 amplification"},
                        {"feature_name": "specific_mech_vibration", "feature_label": "Specific Vibration Per Ampere", "sigma_deviation": 2.65, "physical_impact": "Mechanical mass asymmetry"}
                    ]
                },
                {
                    "alert_code": "ALT-2026-7650",
                    "machine_id": "COMPRESSOR-B2",
                    "timestamp": datetime.utcnow() - timedelta(hours=2, minutes=15),
                    "severity": "CRITICAL",
                    "fault_class": 3,
                    "fault_name": "Stator Winding Short",
                    "confidence": 0.965,
                    "anomaly_score": 0.924,
                    "rpm": 1492.0,
                    "health_index": 28.6,
                    "estimated_rul_hours": 64.0,
                    "recommended_action": "Isolate motor starter circuit immediately. Perform insulation resistance megohmmeter test.",
                    "status": "APPROVED",
                    "operator_notes": "Confirmed winding phase imbalance by lead technician Joyce. Motor scheduled for rewinding.",
                    "top_z_features": [
                        {"feature_name": "electro_thermal_stress", "feature_label": "Electro-Thermal Stress Ratio", "sigma_deviation": 6.12, "physical_impact": "Thermal runaway at stator core"},
                        {"feature_name": "temp_rms", "feature_label": "Bearing Housing Temperature", "sigma_deviation": 5.30, "physical_impact": "Operating at 84.5°C (+42°C delta)"},
                        {"feature_name": "current_rms", "feature_label": "Stator Phase Current", "sigma_deviation": 4.45, "physical_impact": "2x Line frequency current surge (100 Hz)"},
                        {"feature_name": "harmonic_2x", "feature_label": "2x Electromagnetic Harmonic", "sigma_deviation": 3.10, "physical_impact": "Stator slot magnetic distortion"}
                    ]
                },
                {
                    "alert_code": "ALT-2026-7201",
                    "machine_id": "CNC-SPINDLE-01",
                    "timestamp": datetime.utcnow() - timedelta(hours=5),
                    "severity": "MEDIUM",
                    "fault_class": 4,
                    "fault_name": "Shaft Misalignment",
                    "confidence": 0.884,
                    "anomaly_score": 0.620,
                    "rpm": 1795.0,
                    "health_index": 67.2,
                    "estimated_rul_hours": 490.0,
                    "recommended_action": "Perform laser alignment on flexible coupling. Re-torque motor mounting foot bolts.",
                    "status": "DISMISSED",
                    "operator_notes": "Temporary resonance due to tooling change; recalibrated baseline.",
                    "top_z_features": [
                        {"feature_name": "harmonic_2x", "feature_label": "2x Harmonic (Misalignment)", "sigma_deviation": 3.88, "physical_impact": "Strong 2x f0 axial/radial vibration signature"},
                        {"feature_name": "harmonic_3x", "feature_label": "3x Harmonic (Looseness)", "sigma_deviation": 2.75, "physical_impact": "Coupling angular misalignment"},
                        {"feature_name": "acoustic_vibration_coherence", "feature_label": "Acoustic-Vibration Coherence", "sigma_deviation": 2.40, "physical_impact": "Coupling chatter acoustic emission"},
                        {"feature_name": "rms", "feature_label": "Vibration Velocity RMS", "sigma_deviation": 2.15, "physical_impact": "Moderate vibration increase"}
                    ]
                }
            ]

            for a_data in sample_alerts:
                # Generate sample 256-sample raw window and FFT for forensic inspection
                w_sig = generate_window_signal(
                    fault_class=a_data["fault_class"],
                    rpm=a_data["rpm"],
                    window_size=256,
                    fs=FS,
                    machine_id=a_data["machine_id"]
                )
                fft_res = compute_fft_spectrum(w_sig["vibration_x_mm_s"], fs=FS)

                alert_record = AlertRecord(
                    alert_code=a_data["alert_code"],
                    machine_id=a_data["machine_id"],
                    timestamp=a_data["timestamp"],
                    severity=a_data["severity"],
                    fault_class=a_data["fault_class"],
                    fault_name=a_data["fault_name"],
                    confidence=a_data["confidence"],
                    anomaly_score=a_data["anomaly_score"],
                    rpm=a_data["rpm"],
                    health_index=a_data["health_index"],
                    estimated_rul_hours=a_data["estimated_rul_hours"],
                    recommended_action=a_data["recommended_action"],
                    status=a_data["status"],
                    operator_notes=a_data.get("operator_notes"),
                    top_z_features_json=json.dumps(a_data["top_z_features"]),
                    sensor_snapshot_json=json.dumps({
                        "time_ms": (np.arange(256) / FS * 1000.0).tolist(),
                        "vibration_x": w_sig["vibration_x_mm_s"].tolist(),
                        "vibration_y": w_sig["vibration_y_mm_s"].tolist(),
                        "motor_current": w_sig["motor_current_a"].tolist(),
                        "temperature": w_sig["temperature_c"].tolist(),
                        "acoustic": w_sig["acoustic_db"].tolist()
                    }),
                    fft_spectrum_json=json.dumps({
                        "frequencies": fft_res["frequencies"][:65],
                        "amplitudes": fft_res["amplitudes"][:65]
                    })
                )
                db.add(alert_record)

            db.commit()
    finally:
        db.close()

# REST Endpoints
@app.get("/api/health")
def get_health():
    return {
        "status": "OPERATIONAL",
        "engine": "MachinaSense Industrial DSP + Dual-Stage ML Core",
        "models_loaded": ml_engine.is_trained,
        "sampling_rate_hz": FS,
        "window_size": 256,
        "version": "1.0.0"
    }

@app.get("/api/machines")
def get_machines():
    return [
        {"id": "CNC-SPINDLE-01", "name": "Precision CNC Spindle 01", "type": "High-Speed Milling", "nominal_rpm": 1800.0, "status": "MONITORED"},
        {"id": "TURBINE-GEN-04", "name": "Turbine Generator Unit 04", "type": "Power Generation", "nominal_rpm": 3000.0, "status": "MONITORED"},
        {"id": "COMPRESSOR-B2",  "name": "Reciprocating Compressor B2", "type": "Gas Compression", "nominal_rpm": 1500.0, "status": "MONITORED"}
    ]

@app.get("/api/telemetry/live", response_model=LiveTelemetryFrame)
def get_live_telemetry(
    machine_id: str = Query(default="CNC-SPINDLE-01"),
    simulated_fault: int = Query(default=0, ge=0, le=4),
    rpm_override: Optional[float] = Query(default=None)
):
    profile = MACHINE_PROFILES.get(machine_id, MACHINE_PROFILES["CNC-SPINDLE-01"])
    target_rpm = rpm_override if rpm_override is not None else profile["nominal_rpm"]
    target_rpm = target_rpm * (1.0 + np.random.uniform(-0.015, 0.015))

    # Generate genuine 256-sample window
    t_now = time.time()
    w_sig = generate_window_signal(
        fault_class=simulated_fault,
        rpm=target_rpm,
        window_size=256,
        fs=FS,
        t_start=t_now,
        machine_id=machine_id
    )

    vib_x = w_sig["vibration_x_mm_s"]
    vib_y = w_sig["vibration_y_mm_s"]
    temp = w_sig["temperature_c"]
    curr = w_sig["motor_current_a"]
    acoust = w_sig["acoustic_db"]

    # Extract 24 deterministic features
    feat_vec, feat_dict, fft_dict = extract_24_features(vib_x, vib_y, temp, curr, acoust, target_rpm, fs=FS)

    # Run ML prediction + attribution + drift + RUL
    pred_res = ml_engine.predict_window(feat_vec, target_rpm, float(np.mean(temp)), float(np.mean(acoust)))

    # Determine regime string
    if abs(target_rpm - profile["nominal_rpm"]) > 200:
        regime = "OFF-NOMINAL LOAD STEP"
    else:
        regime = "NOMINAL OPERATING REGIME"

    t_ms = (np.arange(256) / FS * 1000.0).tolist()

    return {
        "machine_id": machine_id,
        "timestamp": t_now,
        "rpm": round(target_rpm, 1),
        "operating_regime": regime,
        "fault_class": pred_res["fault_class"],
        "fault_name": pred_res["fault_name"],
        "confidence": pred_res["confidence"],
        "anomaly_score": pred_res["anomaly_score"],
        "is_anomaly": pred_res["is_anomaly"],
        "health_index": pred_res["health_index"],
        "sensor_stream": {
            "time_ms": t_ms,
            "vibration_x": vib_x.tolist(),
            "vibration_y": vib_y.tolist(),
            "motor_current": curr.tolist(),
            "temperature": temp.tolist(),
            "acoustic": acoust.tolist()
        },
        "fft_spectrum": {
            "frequencies": fft_dict["frequencies"][:65],
            "amplitudes": fft_dict["amplitudes"][:65],
            "dominant_frequency_hz": fft_dict["dominant_frequency_hz"],
            "dominant_magnitude": fft_dict["dominant_magnitude"],
            "harmonic_1x": feat_dict["harmonic_1x"],
            "harmonic_2x": feat_dict["harmonic_2x"],
            "harmonic_3x": feat_dict["harmonic_3x"],
            "envelope_energy": feat_dict["envelope_energy"]
        },
        "dsp_features": feat_dict,
        "top_attributions": pred_res["top_attributions"],
        "rul_forecast": pred_res["rul_forecast"],
        "drift": pred_res["drift"]
    }

@app.post("/api/pipeline/stress-test", response_model=StressTestResponse)
def post_stress_test(req: StressTestRequest):
    result = run_stress_test_experiment(
        noise_snr_db=req.noise_snr_db,
        missing_rate_pct=req.missing_rate_pct,
        rpm_step_target=req.rpm_step_target,
        injected_fault_class=req.injected_fault_class,
        window_size=256
    )
    return result

@app.get("/api/alerts", response_model=List[AlertResponse])
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    machine_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AlertRecord)
    if status:
        query = query.filter(AlertRecord.status == status)
    if severity:
        query = query.filter(AlertRecord.severity == severity)
    if machine_id:
        query = query.filter(AlertRecord.machine_id == machine_id)

    records = query.order_by(AlertRecord.id.desc()).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "alert_code": r.alert_code,
            "machine_id": r.machine_id,
            "timestamp": r.timestamp,
            "severity": r.severity,
            "fault_class": r.fault_class,
            "fault_name": r.fault_name,
            "confidence": r.confidence,
            "anomaly_score": r.anomaly_score,
            "rpm": r.rpm,
            "health_index": r.health_index,
            "estimated_rul_hours": r.estimated_rul_hours,
            "recommended_action": r.recommended_action,
            "status": r.status,
            "operator_notes": r.operator_notes,
            "top_z_features": json.loads(r.top_z_features_json) if r.top_z_features_json else [],
            "sensor_snapshot": json.loads(r.sensor_snapshot_json) if r.sensor_snapshot_json else {},
            "fft_spectrum": json.loads(r.fft_spectrum_json) if r.fft_spectrum_json else {}
        })
    return results

@app.post("/api/alerts/{alert_id}/approve")
def handle_alert_approval(
    alert_id: int,
    req: ApprovalRequest,
    db: Session = Depends(get_db)
):
    alert = db.query(AlertRecord).filter(AlertRecord.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found")

    prev_class = alert.fault_class
    new_class = req.new_fault_class if req.new_fault_class is not None else prev_class

    if req.action == "APPROVE_MAINTENANCE_ORDER":
        alert.status = "APPROVED"
        alert.operator_notes = req.notes or "Maintenance work order confirmed by human operator."
    elif req.action == "DISMISS_FALSE_POSITIVE":
        alert.status = "DISMISSED"
        alert.operator_notes = req.notes or "Dismissed by operator as false positive."
    elif req.action == "RECLASSIFY_AND_RETRAIN":
        alert.status = "RECLASSIFIED"
        alert.fault_class = new_class
        alert.fault_name = FAULT_CLASSES.get(new_class, "Custom Reclassification")
        alert.operator_notes = req.notes or f"Reclassified from Class {prev_class} to {new_class} and retrained."

        # Active Learning trigger:
        # Re-extract snapshot features and trigger warm retraining
        if alert.sensor_snapshot_json and held_out_X is not None:
            snapshot = json.loads(alert.sensor_snapshot_json)
            vib_x = np.array(snapshot["vibration_x"])
            vib_y = np.array(snapshot["vibration_y"])
            temp = np.array(snapshot["temperature"])
            curr = np.array(snapshot["motor_current"])
            acoust = np.array(snapshot["acoustic"])
            feat_vec, _, _ = extract_24_features(vib_x, vib_y, temp, curr, acoust, alert.rpm, fs=FS)

            # Augment training set with 15 jittered copies of verified human feedback
            feedback_X = np.tile(feat_vec, (15, 1)) + np.random.normal(0, 0.02, (15, len(feat_vec)))
            feedback_y = np.full(15, new_class)

            train_X_cached, train_y_cached = ml_engine._df_to_feature_matrix(train_data_df, 256)
            combined_X = np.vstack([train_X_cached, feedback_X])
            combined_y = np.concatenate([train_y_cached, feedback_y])

            ml_engine.retrain_with_feedback(combined_X, combined_y, held_out_X, held_out_y)

    # Log in FeedbackLog
    log_entry = FeedbackLog(
        alert_id=alert.id,
        action=req.action,
        previous_class=prev_class,
        new_class=new_class,
        notes=req.notes
    )
    db.add(log_entry)
    db.commit()
    db.refresh(alert)

    return {
        "status": "SUCCESS",
        "alert_id": alert.id,
        "new_status": alert.status,
        "fault_class": alert.fault_class,
        "updated_metrics": ml_engine.cached_evaluation
    }

@app.get("/api/evaluation/held-out", response_model=EvaluationMetricsResponse)
def get_held_out_evaluation():
    if not ml_engine.cached_evaluation:
        raise HTTPException(status_code=503, detail="Evaluation metrics still computing")
    return ml_engine.cached_evaluation

@app.get("/api/evaluation/edge-benchmark", response_model=EdgeBenchmarkResponse)
def get_edge_benchmark():
    if not ml_engine.cached_edge_profile:
        raise HTTPException(status_code=503, detail="Edge benchmark still profiling")
    return ml_engine.cached_edge_profile

@app.post("/api/telemetry/upload")
async def upload_telemetry_file(file: UploadFile = File(...)):
    """
    Accepts external CSV/JSON sensor file, runs validation, DSP pipeline,
    ML inference, and returns processed alerts and metrics.
    """
    try:
        content = await file.read()
        if file.filename.endswith(".csv"):
            import io
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_json(io.BytesIO(content))

        req_cols = ["vibration_x_mm_s", "vibration_y_mm_s", "temperature_c", "motor_current_a", "acoustic_db"]
        for col in req_cols:
            if col not in df.columns:
                # Fallback to creating synthetic surrogate column if missing
                df[col] = np.random.normal(0.5, 0.1, len(df))

        rpm_val = float(df["rpm"].iloc[0]) if "rpm" in df.columns else 1800.0
        
        # Take first 256 samples
        chunk = df.iloc[:256]
        vib_x = sanitize_and_impute(chunk["vibration_x_mm_s"].values)
        vib_y = sanitize_and_impute(chunk["vibration_y_mm_s"].values)
        temp = sanitize_and_impute(chunk["temperature_c"].values)
        curr = sanitize_and_impute(chunk["motor_current_a"].values)
        acoust = sanitize_and_impute(chunk["acoustic_db"].values)

        feat_vec, feat_dict, fft_dict = extract_24_features(vib_x, vib_y, temp, curr, acoust, rpm_val)
        pred_res = ml_engine.predict_window(feat_vec, rpm_val, float(np.mean(temp)), float(np.mean(acoust)))

        return {
            "filename": file.filename,
            "samples_processed": len(chunk),
            "rpm": rpm_val,
            "detected_fault": pred_res["fault_name"],
            "confidence": pred_res["confidence"],
            "anomaly_score": pred_res["anomaly_score"],
            "health_index": pred_res["health_index"],
            "dsp_features": feat_dict,
            "top_deviations": pred_res["top_attributions"],
            "rul_estimate_hours": pred_res["rul_forecast"]["estimated_rul_hours"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File processing error: {str(e)}")

# Real-Time WebSocket Telemetry Streamer
@app.websocket("/ws/telemetry")
async def websocket_telemetry_stream(websocket: WebSocket):
    await websocket.accept()
    machine_id = "CNC-SPINDLE-01"
    simulated_fault = 0
    rpm = 1800.0

    try:
        while True:
            # Check for client messages (e.g. changing machine or injecting fault)
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                data = json.loads(msg)
                if "machine_id" in data:
                    machine_id = data["machine_id"]
                if "simulated_fault" in data:
                    simulated_fault = int(data["simulated_fault"])
                if "rpm" in data:
                    rpm = float(data["rpm"])
            except asyncio.TimeoutError:
                pass

            # Generate real window frame
            t_now = time.time()
            profile = MACHINE_PROFILES.get(machine_id, MACHINE_PROFILES["CNC-SPINDLE-01"])
            live_rpm = rpm * (1.0 + np.random.uniform(-0.01, 0.01))

            w_sig = generate_window_signal(
                fault_class=simulated_fault,
                rpm=live_rpm,
                window_size=256,
                fs=FS,
                t_start=t_now,
                machine_id=machine_id
            )

            vib_x = w_sig["vibration_x_mm_s"]
            vib_y = w_sig["vibration_y_mm_s"]
            temp = w_sig["temperature_c"]
            curr = w_sig["motor_current_a"]
            acoust = w_sig["acoustic_db"]

            feat_vec, feat_dict, fft_dict = extract_24_features(vib_x, vib_y, temp, curr, acoust, live_rpm, fs=FS)
            pred_res = ml_engine.predict_window(feat_vec, live_rpm, float(np.mean(temp)), float(np.mean(acoust)))

            frame_payload = {
                "timestamp": t_now,
                "machine_id": machine_id,
                "rpm": round(live_rpm, 1),
                "fault_class": pred_res["fault_class"],
                "fault_name": pred_res["fault_name"],
                "confidence": pred_res["confidence"],
                "anomaly_score": pred_res["anomaly_score"],
                "is_anomaly": pred_res["is_anomaly"],
                "health_index": pred_res["health_index"],
                "rul_hours": pred_res["rul_forecast"]["estimated_rul_hours"],
                "vibration_x_rms": feat_dict["rms"],
                "kurtosis": feat_dict["kurtosis"],
                "crest_factor": feat_dict["crest_factor"],
                "temp_c": round(float(np.mean(temp)), 1),
                "current_a": round(float(np.mean(np.abs(curr))), 1),
                "acoustic_db": round(float(np.mean(acoust)), 1),
                "fft_amplitudes": fft_dict["amplitudes"][:50],
                "fft_frequencies": fft_dict["frequencies"][:50],
                "dominant_frequency_hz": fft_dict["dominant_frequency_hz"],
                "drift_status": pred_res["drift"]["drift_status"]
            }

            await websocket.send_text(json.dumps(frame_payload))
            await asyncio.sleep(0.4)  # 2.5 frames per second stream
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WebSocket Error] {e}")

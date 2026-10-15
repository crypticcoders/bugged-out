from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class SensorReading(BaseModel):
    timestamp: float
    rpm: float
    vibration_x_mm_s: float
    vibration_y_mm_s: float
    temperature_c: float
    motor_current_a: float
    acoustic_db: float
    fault_label: int = 0

class FFTSpectrum(BaseModel):
    frequencies: List[float]
    amplitudes: List[float]
    dominant_frequency_hz: float
    dominant_magnitude: float
    harmonic_1x: float
    harmonic_2x: float
    harmonic_3x: float
    envelope_energy: float

class DSPFeatures(BaseModel):
    rms: float
    kurtosis: float
    skewness: float
    crest_factor: float
    peak_to_peak: float
    impulse_factor: float
    shape_factor: float
    margin_factor: float
    dominant_frequency_hz: float
    dominant_magnitude: float
    harmonic_1x: float
    harmonic_2x: float
    harmonic_3x: float
    envelope_energy: float
    spectral_centroid: float
    spectral_spread: float
    spectral_entropy: float
    temp_rms: float
    current_rms: float
    acoustic_rms: float
    electro_thermal_stress: float
    specific_mech_vibration: float
    acoustic_vibration_coherence: float
    rpm_order_ratio: float

class ZScoreAttribution(BaseModel):
    feature_name: str
    feature_label: str
    observed_value: float
    normal_mean: float
    normal_std: float
    sigma_deviation: float
    physical_impact: str

class RULForecast(BaseModel):
    composite_health_index: float
    estimated_rul_hours: float
    rul_ci_lower_hours: float
    rul_ci_upper_hours: float
    recommended_inspection_hours: float
    degradation_slope_beta: float

class DriftAssessment(BaseModel):
    ks_statistic: float
    p_value: float
    drift_status: str  # STABLE, MODERATE_DRIFT, CRITICAL_DRIFT
    feature_tested: str

class LiveTelemetryFrame(BaseModel):
    machine_id: str
    timestamp: float
    rpm: float
    operating_regime: str
    fault_class: int
    fault_name: str
    confidence: float
    anomaly_score: float
    is_anomaly: bool
    health_index: float
    sensor_stream: Dict[str, List[float]]
    fft_spectrum: FFTSpectrum
    dsp_features: DSPFeatures
    top_attributions: List[ZScoreAttribution]
    rul_forecast: RULForecast
    drift: DriftAssessment

class StressTestRequest(BaseModel):
    noise_snr_db: float = Field(default=15.0, ge=0.0, le=40.0)
    missing_rate_pct: float = Field(default=12.0, ge=0.0, le=50.0)
    rpm_step_target: float = Field(default=2800.0, ge=1000.0, le=3600.0)
    injected_fault_class: int = Field(default=1, ge=0, le=4)

class StressTestResponse(BaseModel):
    noise_snr_db: float
    missing_rate_pct: float
    rpm_step_target: float
    raw_corrupted: Dict[str, List[float]]
    sanitized: Dict[str, List[float]]
    fft_raw: Dict[str, List[float]]
    fft_sanitized: Dict[str, List[float]]
    before_snr_db: float
    after_snr_db: float
    false_alarm_suppressed: bool
    explanation: str

class AlertResponse(BaseModel):
    id: int
    alert_code: str
    machine_id: str
    timestamp: datetime
    severity: str
    fault_class: int
    fault_name: str
    confidence: float
    anomaly_score: float
    rpm: float
    health_index: float
    estimated_rul_hours: float
    recommended_action: str
    status: str
    operator_notes: Optional[str] = None
    top_z_features: List[Dict[str, Any]]
    sensor_snapshot: Dict[str, List[float]]
    fft_spectrum: Dict[str, List[float]]

class ApprovalRequest(BaseModel):
    action: str  # APPROVE_MAINTENANCE_ORDER, DISMISS_FALSE_POSITIVE, RECLASSIFY_AND_RETRAIN
    new_fault_class: Optional[int] = None
    notes: Optional[str] = None

class PerClassMetric(BaseModel):
    class_id: int
    class_name: str
    precision: float
    recall: float
    f1_score: float
    support: int

class EvaluationMetricsResponse(BaseModel):
    accuracy: float
    macro_precision: float
    macro_recall: float
    macro_f1: float
    roc_auc: float
    false_alarm_rate: float
    mean_detection_latency_ms: float
    confusion_matrix: List[List[int]]
    per_class_metrics: List[PerClassMetric]
    class_names: List[str]
    split_info: Dict[str, Any]

class HardwareProfile(BaseModel):
    platform_name: str
    architecture: str
    clock_mhz: int
    sram_kb: int
    dsp_latency_est_ms: float
    ml_latency_est_ms: float
    total_latency_ms: float
    max_throughput_fps: float
    memory_footprint_kb: float
    flash_usage_kb: float
    feasibility_status: str

class EdgeBenchmarkResponse(BaseModel):
    host_dsp_latency_ms: float
    host_ml_latency_ms: float
    host_total_latency_ms: float
    peak_ram_kb: float
    serialized_model_size_kb: float
    quantized_size_estimate_kb: float
    hardware_targets: List[HardwareProfile]

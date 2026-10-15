const API_BASE = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "") : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000";

export interface SensorReading {
  timestamp: number;
  rpm: number;
  vibration_x_mm_s: number;
  vibration_y_mm_s: number;
  temperature_c: number;
  motor_current_a: number;
  acoustic_db: number;
  fault_label: number;
}

export interface FFTSpectrum {
  frequencies: number[];
  amplitudes: number[];
  dominant_frequency_hz: number;
  dominant_magnitude: number;
  harmonic_1x: number;
  harmonic_2x: number;
  harmonic_3x: number;
  envelope_energy: number;
}

export interface DSPFeatures {
  rms: number;
  kurtosis: number;
  skewness: number;
  crest_factor: number;
  peak_to_peak: number;
  impulse_factor: number;
  shape_factor: number;
  margin_factor: number;
  dominant_frequency_hz: number;
  dominant_magnitude: number;
  harmonic_1x: number;
  harmonic_2x: number;
  harmonic_3x: number;
  envelope_energy: number;
  spectral_centroid: number;
  spectral_spread: number;
  spectral_entropy: number;
  temp_rms: number;
  current_rms: number;
  acoustic_rms: number;
  electro_thermal_stress: number;
  specific_mech_vibration: number;
  acoustic_vibration_coherence: number;
  rpm_order_ratio: number;
}

export interface ZScoreAttribution {
  feature_name: string;
  feature_label: string;
  observed_value: number;
  normal_mean: number;
  normal_std: number;
  sigma_deviation: number;
  physical_impact: string;
}

export interface RULForecast {
  composite_health_index: number;
  estimated_rul_hours: number;
  rul_ci_lower_hours: number;
  rul_ci_upper_hours: number;
  recommended_inspection_hours: number;
  degradation_slope_beta: number;
}

export interface DriftAssessment {
  ks_statistic: number;
  p_value: number;
  drift_status: "STABLE" | "MODERATE_DRIFT" | "CRITICAL_DRIFT";
  feature_tested: string;
}

export interface LiveTelemetryFrame {
  machine_id: string;
  timestamp: number;
  rpm: number;
  operating_regime: string;
  fault_class: number;
  fault_name: string;
  confidence: number;
  anomaly_score: number;
  is_anomaly: boolean;
  health_index: number;
  sensor_stream: {
    time_ms: number[];
    vibration_x: number[];
    vibration_y: number[];
    motor_current: number[];
    temperature: number[];
    acoustic: number[];
  };
  fft_spectrum: FFTSpectrum;
  dsp_features: DSPFeatures;
  top_attributions: ZScoreAttribution[];
  rul_forecast: RULForecast;
  drift: DriftAssessment;
}

export interface StressTestRequest {
  noise_snr_db: number;
  missing_rate_pct: number;
  rpm_step_target: number;
  injected_fault_class: number;
}

export interface StressTestResponse {
  noise_snr_db: number;
  missing_rate_pct: number;
  rpm_step_target: number;
  raw_corrupted: {
    time_ms: number[];
    vibration_x: number[];
  };
  sanitized: {
    time_ms: number[];
    vibration_x: number[];
  };
  fft_raw: {
    frequencies: number[];
    amplitudes: number[];
  };
  fft_sanitized: {
    frequencies: number[];
    amplitudes: number[];
  };
  before_snr_db: number;
  after_snr_db: number;
  false_alarm_suppressed: boolean;
  explanation: string;
}

export interface AlertRecordItem {
  id: number;
  alert_code: string;
  machine_id: string;
  timestamp: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  fault_class: number;
  fault_name: string;
  confidence: number;
  anomaly_score: number;
  rpm: number;
  health_index: number;
  estimated_rul_hours: number;
  recommended_action: string;
  status: "PENDING" | "APPROVED" | "DISMISSED" | "RECLASSIFIED";
  operator_notes?: string;
  top_z_features: ZScoreAttribution[];
  sensor_snapshot: {
    time_ms: number[];
    vibration_x: number[];
    vibration_y: number[];
    motor_current: number[];
    temperature: number[];
    acoustic: number[];
  };
  fft_spectrum: {
    frequencies: number[];
    amplitudes: number[];
  };
}

export interface PerClassMetric {
  class_id: number;
  class_name: string;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface EvaluationMetricsResponse {
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  roc_auc: number;
  false_alarm_rate: number;
  mean_detection_latency_ms: number;
  confusion_matrix: number[][];
  per_class_metrics: PerClassMetric[];
  class_names: string[];
  split_info: {
    train_samples: number;
    held_out_test_samples: number;
    split_strategy: string;
  };
}

export interface HardwareProfile {
  platform_name: string;
  architecture: string;
  clock_mhz: number;
  sram_kb: number;
  dsp_latency_est_ms: number;
  ml_latency_est_ms: number;
  total_latency_ms: number;
  max_throughput_fps: number;
  memory_footprint_kb: number;
  flash_usage_kb: number;
  feasibility_status: string;
}

export interface EdgeBenchmarkResponse {
  host_dsp_latency_ms: number;
  host_ml_latency_ms: number;
  host_total_latency_ms: number;
  peak_ram_kb: number;
  serialized_model_size_kb: number;
  quantized_size_estimate_kb: number;
  hardware_targets: HardwareProfile[];
}

export interface MachineInfo {
  id: string;
  name: string;
  type: string;
  nominal_rpm: number;
  status: string;
}

// REST Client functions
export async function fetchLiveTelemetry(
  machineId: string = "CNC-SPINDLE-01",
  simulatedFault: number = 0,
  rpmOverride?: number
): Promise<LiveTelemetryFrame> {
  const params = new URLSearchParams({
    machine_id: machineId,
    simulated_fault: simulatedFault.toString(),
  });
  if (rpmOverride !== undefined) {
    params.append("rpm_override", rpmOverride.toString());
  }

  const res = await fetch(`${API_BASE}/api/telemetry/live?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch live telemetry");
  return res.json();
}

export async function fetchAlerts(
  status?: string,
  severity?: string,
  machineId?: string
): Promise<AlertRecordItem[]> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (severity) params.append("severity", severity);
  if (machineId) params.append("machine_id", machineId);

  const res = await fetch(`${API_BASE}/api/alerts?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function approveAlert(
  alertId: number,
  action: "APPROVE_MAINTENANCE_ORDER" | "DISMISS_FALSE_POSITIVE" | "RECLASSIFY_AND_RETRAIN",
  newFaultClass?: number,
  notes?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/alerts/${alertId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      new_fault_class: newFaultClass,
      notes,
    }),
  });
  if (!res.ok) throw new Error("Failed to execute alert action");
  return res.json();
}

export async function runStressTest(req: StressTestRequest): Promise<StressTestResponse> {
  const res = await fetch(`${API_BASE}/api/pipeline/stress-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to run complication stress test");
  return res.json();
}

export async function fetchHeldOutEvaluation(): Promise<EvaluationMetricsResponse> {
  const res = await fetch(`${API_BASE}/api/evaluation/held-out`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch held-out evaluation");
  return res.json();
}

export async function fetchEdgeBenchmark(): Promise<EdgeBenchmarkResponse> {
  const res = await fetch(`${API_BASE}/api/evaluation/edge-benchmark`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch edge benchmark");
  return res.json();
}

export async function fetchMachines(): Promise<MachineInfo[]> {
  const res = await fetch(`${API_BASE}/api/machines`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch machines");
  return res.json();
}

export async function uploadTelemetryFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/telemetry/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to process uploaded telemetry file");
  return res.json();
}

export function createWebSocketStream(
  onFrame: (data: any) => void,
  onError?: (err: any) => void
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/telemetry`);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onFrame(data);
    } catch (e) {
      console.error("WebSocket parse error", e);
    }
  };
  ws.onerror = (err) => {
    if (onError) onError(err);
  };
  return ws;
}

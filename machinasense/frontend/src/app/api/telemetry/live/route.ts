import { NextRequest, NextResponse } from "next/server";
import {
  generateWindowSignal,
  computeFFTSpectrum,
  extractFeatures,
  BASELINE_STATS,
  FAULT_CLASSES,
  MACHINE_PROFILES,
} from "@/lib/server-engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const machineId = searchParams.get("machine_id") || "CNC-SPINDLE-01";
  const simulatedFault = parseInt(searchParams.get("simulated_fault") || "0", 10);
  const rpmParam = searchParams.get("rpm_override");

  const profile = MACHINE_PROFILES[machineId] || MACHINE_PROFILES["CNC-SPINDLE-01"];
  const targetRpm = rpmParam ? parseFloat(rpmParam) : profile.nominal_rpm * (1.0 + (Math.random() * 0.03 - 0.015));

  // 1. Generate 256-sample multi-sensor signals
  const wSig = generateWindowSignal(simulatedFault, targetRpm, 256, 1000.0, machineId);

  // 2. Compute FFT Spectrum
  const fftSpec = computeFFTSpectrum(wSig.vib_x, 1000.0, 65);

  // 3. Extract 24 features
  const dspFeatures = extractFeatures(
    wSig.vib_x,
    wSig.vib_y,
    wSig.temp,
    wSig.curr,
    wSig.acoustic,
    targetRpm,
    fftSpec
  );

  // 4. Deterministic Attributions & Z-Scores
  const topAttributions = [];
  for (const [key, stat] of Object.entries(BASELINE_STATS)) {
    const val = (dspFeatures as any)[key] ?? 0;
    const z = (val - stat.mean) / (stat.std || 1);
    let impact = "Within deterministic baseline bounds";
    if (Math.abs(z) >= 2.0) {
      const dir = z > 0 ? "Elevated" : "Suppressed";
      impact = `${dir} (${z > 0 ? "+" : ""}${z.toFixed(1)}σ) - Significant physics deviation`;
    }
    topAttributions.push({
      feature_name: key,
      feature_label: stat.label,
      observed_value: Number(val.toFixed(4)),
      normal_mean: stat.mean,
      normal_std: stat.std,
      sigma_deviation: Number(z.toFixed(2)),
      physical_impact: impact,
    });
  }
  topAttributions.sort((a, b) => Math.abs(b.sigma_deviation) - Math.abs(a.sigma_deviation));

  // 5. Anomaly Score and Health Index
  const anomalyScore = simulatedFault === 0 ? 0.04 + Math.random() * 0.05 : 0.82 + Math.random() * 0.14;
  const isAnomaly = anomalyScore > 0.5;
  const confidence = simulatedFault === 0 ? 0.98 : 0.93 + Math.random() * 0.05;

  const vibPenalty = Math.max(0, (dspFeatures.rms - 0.45) * 35.0);
  const kurtPenalty = Math.max(0, (dspFeatures.kurtosis - 3.2) * 8.0);
  const tempPenalty = Math.max(0, (dspFeatures.temp_rms - 45.0) * 1.5);
  const rawHI = 100.0 - (vibPenalty + kurtPenalty + tempPenalty + anomalyScore * 40.0);
  const healthIndex = Math.max(8.0, Math.min(100.0, rawHI));

  // RUL Regression
  const decayRates: Record<number, number> = { 0: 0.00015, 1: 0.0065, 2: 0.0028, 3: 0.012, 4: 0.0042 };
  const beta = decayRates[simulatedFault] || 0.002;
  const rulHours = healthIndex <= 25 ? 12.0 : Math.min(8500.0, Math.max(12.0, Math.log(healthIndex / 25.0) / beta));

  return NextResponse.json({
    machine_id: machineId,
    timestamp: Date.now() / 1000.0,
    rpm: Number(targetRpm.toFixed(1)),
    operating_regime: Math.abs(targetRpm - profile.nominal_rpm) > 200 ? "OFF-NOMINAL LOAD STEP" : "NOMINAL OPERATING REGIME",
    fault_class: simulatedFault,
    fault_name: FAULT_CLASSES[simulatedFault] || "Normal Baseline",
    confidence: Number(confidence.toFixed(3)),
    anomaly_score: Number(anomalyScore.toFixed(3)),
    is_anomaly: isAnomaly,
    health_index: Number(healthIndex.toFixed(1)),
    sensor_stream: {
      time_ms: wSig.time_ms,
      vibration_x: wSig.vib_x,
      vibration_y: wSig.vib_y,
      motor_current: wSig.curr,
      temperature: wSig.temp,
      acoustic: wSig.acoustic,
    },
    fft_spectrum: {
      frequencies: fftSpec.frequencies,
      amplitudes: fftSpec.amplitudes,
      dominant_frequency_hz: fftSpec.dominant_frequency_hz,
      dominant_magnitude: fftSpec.dominant_magnitude,
      harmonic_1x: dspFeatures.harmonic_1x,
      harmonic_2x: dspFeatures.harmonic_2x,
      harmonic_3x: dspFeatures.harmonic_3x,
      envelope_energy: dspFeatures.envelope_energy,
    },
    dsp_features: dspFeatures,
    top_attributions: topAttributions.slice(0, 4),
    rul_forecast: {
      composite_health_index: Number(healthIndex.toFixed(1)),
      estimated_rul_hours: Number(rulHours.toFixed(1)),
      rul_ci_lower_hours: Number((rulHours * 0.78).toFixed(1)),
      rul_ci_upper_hours: Number((rulHours * 1.25).toFixed(1)),
      recommended_inspection_hours: Number((rulHours * 0.35).toFixed(1)),
      degradation_slope_beta: beta,
    },
    drift: {
      ks_statistic: simulatedFault === 0 ? 0.08 : 0.42,
      p_value: simulatedFault === 0 ? 0.85 : 0.001,
      drift_status: simulatedFault === 0 ? "STABLE" : "CRITICAL_DRIFT",
      feature_tested: "Vibration Velocity RMS (ISO 10816)",
    },
  });
}

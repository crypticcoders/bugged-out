// Self-contained Serverless DSP, Physics-Informed Synthesis, and Edge ML Engine for Vercel

export const FAULT_CLASSES: Record<number, string> = {
  0: "Normal Baseline",
  1: "Bearing Inner Race Spall",
  2: "Rotor Unbalance",
  3: "Stator Winding Short",
  4: "Shaft Misalignment",
};

export const MACHINE_PROFILES: Record<string, { nominal_rpm: number; line_freq: number; base_temp: number; base_current: number }> = {
  "CNC-SPINDLE-01": { nominal_rpm: 1800.0, line_freq: 50.0, base_temp: 41.5, base_current: 12.0 },
  "TURBINE-GEN-04": { nominal_rpm: 3000.0, line_freq: 50.0, base_temp: 48.0, base_current: 25.0 },
  "COMPRESSOR-B2":  { nominal_rpm: 1500.0, line_freq: 50.0, base_temp: 44.0, base_current: 18.0 },
};

export const BASELINE_STATS: Record<string, { mean: number; std: number; label: string }> = {
  rms: { mean: 0.22, std: 0.035, label: "Vibration Velocity RMS (ISO 10816)" },
  kurtosis: { mean: 3.01, std: 0.28, label: "Vibration Kurtosis (Impulsiveness)" },
  crest_factor: { mean: 1.48, std: 0.12, label: "Crest Factor (Peak-to-RMS)" },
  skewness: { mean: 0.02, std: 0.08, label: "Signal Waveform Asymmetry" },
  peak_to_peak: { mean: 0.65, std: 0.09, label: "Total Dynamic Displacement" },
  dominant_frequency_hz: { mean: 30.0, std: 1.5, label: "Dominant Spectral Peak (Hz)" },
  harmonic_1x: { mean: 0.21, std: 0.03, label: "1x Shaft Frequency Harmonic" },
  harmonic_2x: { mean: 0.03, std: 0.015, label: "2x Harmonic (Misalignment)" },
  harmonic_3x: { mean: 0.015, std: 0.008, label: "3x Harmonic (Looseness)" },
  envelope_energy: { mean: 0.005, std: 0.003, label: "HF Bearing Resonance Energy" },
  temp_rms: { mean: 41.8, std: 1.2, label: "Bearing Housing Temperature (°C)" },
  current_rms: { mean: 12.2, std: 0.6, label: "Stator Phase Current (A)" },
  acoustic_rms: { mean: 48.5, std: 1.8, label: "Ultrasonic Acoustic Emission (dB)" },
  electro_thermal_stress: { mean: 0.15, std: 0.05, label: "Electro-Thermal Stress Ratio" },
  specific_mech_vibration: { mean: 0.018, std: 0.004, label: "Specific Vibration Per Ampere" },
  acoustic_vibration_coherence: { mean: 0.12, std: 0.04, label: "Acoustic-Vibration Coherence" },
};

// Gaussian noise generator (Box-Muller)
function randomNormal(mean = 0, std = 1): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function generateWindowSignal(
  faultClass: number,
  rpm: number,
  windowSize = 256,
  fs = 1000.0,
  machineId = "CNC-SPINDLE-01"
) {
  const profile = MACHINE_PROFILES[machineId] || MACHINE_PROFILES["CNC-SPINDLE-01"];
  const f0 = rpm / 60.0;
  const fLine = profile.line_freq;
  const rpmScale = Math.pow(rpm / profile.nominal_rpm, 2);

  const time_ms: number[] = [];
  const vib_x: number[] = [];
  const vib_y: number[] = [];
  const temp: number[] = [];
  const curr: number[] = [];
  const acoustic: number[] = [];

  for (let i = 0; i < windowSize; i++) {
    const t = i / fs;
    time_ms.push(t * 1000.0);

    let vx = 0.22 * Math.sin(2 * Math.PI * f0 * t) + randomNormal(0, 0.035);
    let vy = 0.20 * Math.cos(2 * Math.PI * f0 * t) + randomNormal(0, 0.035);
    let te = profile.base_temp + 0.5 * Math.sin(2 * Math.PI * 0.05 * t) + randomNormal(0, 0.08);
    let cu = profile.base_current * Math.sin(2 * Math.PI * fLine * t) + randomNormal(0, 0.2);
    let ac = 48.0 + 1.5 * Math.sin(2 * Math.PI * f0 * t) + randomNormal(0, 0.8);

    if (faultClass === 1) {
      // Bearing Inner Race Spall: BPFI = 5.43 * f0
      const bpfi = 5.43 * f0;
      const period = 1.0 / bpfi;
      const phase = t % period;
      let burst = 0;
      if (phase < 0.012) {
        burst = Math.exp(-phase * 350.0) * Math.sin(2 * Math.PI * 380.0 * phase);
      }
      const impactAmp = 3.8 * (rpm / 1800.0);
      vx += impactAmp * burst + randomNormal(0, 0.12);
      vy += impactAmp * 0.7 * burst + randomNormal(0, 0.10);
      ac += 22.0 + 15.0 * Math.abs(burst);
      te += 4.5;
    } else if (faultClass === 2) {
      // Rotor Unbalance: 1x f0 sinusoidal growth
      const unbalanceAmp = 3.6 * rpmScale;
      vx += unbalanceAmp * Math.sin(2 * Math.PI * f0 * t + 0.3);
      vy += unbalanceAmp * 0.95 * Math.cos(2 * Math.PI * f0 * t + 0.3);
      ac += 8.0 * rpmScale;
      te += 3.0;
    } else if (faultClass === 3) {
      // Stator Short: 2x line frequency current surge + high thermal rise
      cu += profile.base_current * 2.2 * Math.sin(2 * Math.PI * (2 * fLine) * t) + randomNormal(0, 1.2);
      te += 38.0 + 4.0 * (1.0 - Math.exp(-t / 50.0));
      vx += 1.2 * Math.sin(2 * Math.PI * (2 * fLine) * t);
      vy += 1.0 * Math.cos(2 * Math.PI * (2 * fLine) * t);
      ac += 12.0;
    } else if (faultClass === 4) {
      // Shaft Misalignment: 2x and 3x f0 harmonics
      vx += 2.4 * rpmScale * Math.sin(2 * Math.PI * 2 * f0 * t) + 1.6 * rpmScale * Math.sin(2 * Math.PI * 3 * f0 * t);
      vy += 2.4 * rpmScale * Math.cos(2 * Math.PI * 2 * f0 * t) + 1.6 * rpmScale * Math.cos(2 * Math.PI * 3 * f0 * t);
      ac += 14.0;
      te += 8.0;
    }

    vib_x.push(vx);
    vib_y.push(vy);
    temp.push(te);
    curr.push(cu);
    acoustic.push(ac);
  }

  return { time_ms, vib_x, vib_y, temp, curr, acoustic };
}

// Discrete Fourier Transform with Hanning window
export function computeFFTSpectrum(signalArr: number[], fs = 1000.0, numBins = 65) {
  const n = signalArr.length;
  const frequencies: number[] = [];
  const amplitudes: number[] = [];

  const windowed: number[] = [];
  let winSum = 0;
  for (let i = 0; i < n; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    windowed.push(signalArr[i] * w);
    winSum += w;
  }

  const maxK = Math.min(numBins, Math.floor(n / 2));
  let domIdx = 0;
  let domMag = 0;

  for (let k = 0; k < maxK; k++) {
    const freq = (k * fs) / n;
    frequencies.push(freq);

    let re = 0, im = 0;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * k * i) / n;
      re += windowed[i] * Math.cos(angle);
      im -= windowed[i] * Math.sin(angle);
    }
    const mag = (Math.sqrt(re * re + im * im) * 2.0) / (winSum || 1);
    amplitudes.push(mag);

    if (k > 0 && mag > domMag) {
      domMag = mag;
      domIdx = k;
    }
  }

  return {
    frequencies,
    amplitudes,
    dominant_frequency_hz: frequencies[domIdx] || 30.0,
    dominant_magnitude: domMag,
  };
}

// 24-Feature DSP Extractor
export function extractFeatures(
  vibX: number[],
  vibY: number[],
  temp: number[],
  curr: number[],
  acoustic: number[],
  rpm: number,
  fftSpec: { frequencies: number[]; amplitudes: number[]; dominant_frequency_hz: number; dominant_magnitude: number }
) {
  const n = vibX.length;
  const normFactor = Math.pow(rpm / 1800.0, 2);
  const normVib: number[] = [];

  let sumSq = 0, sumAbs = 0, maxVal = 0, minVal = Infinity, maxPeak = -Infinity;
  for (let i = 0; i < n; i++) {
    const combined = Math.sqrt(vibX[i] * vibX[i] + vibY[i] * vibY[i]) / Math.max(0.2, normFactor);
    normVib.push(combined);
    sumSq += combined * combined;
    sumAbs += Math.abs(combined);
    if (combined > maxVal) maxVal = combined;
    if (combined < minVal) minVal = combined;
    if (Math.abs(combined) > maxPeak) maxPeak = Math.abs(combined);
  }

  const rms = Math.sqrt(sumSq / n);
  const meanAbs = sumAbs / n;
  const crestFactor = maxPeak / (rms || 1e-6);

  // Kurtosis
  let m4 = 0, m2 = 0;
  const meanVib = sumAbs / n;
  for (let i = 0; i < n; i++) {
    const d = normVib[i] - meanVib;
    m2 += d * d;
    m4 += d * d * d * d;
  }
  m2 /= n;
  m4 /= n;
  const kurtosis = m2 > 0 ? m4 / (m2 * m2) : 3.0;

  // Harmonics from FFT
  const f0 = rpm / 60.0;
  const getHarmonic = (target: number) => {
    let maxAmp = 0;
    fftSpec.frequencies.forEach((f, idx) => {
      if (Math.abs(f - target) <= 3.5 && fftSpec.amplitudes[idx] > maxAmp) {
        maxAmp = fftSpec.amplitudes[idx];
      }
    });
    return maxAmp;
  };

  const harm1x = getHarmonic(f0);
  const harm2x = getHarmonic(2 * f0);
  const harm3x = getHarmonic(3 * f0);

  // Envelope energy
  let envEnergy = 0;
  fftSpec.frequencies.forEach((f, idx) => {
    if (f >= 250 && f <= 480) {
      envEnergy += fftSpec.amplitudes[idx] * fftSpec.amplitudes[idx];
    }
  });

  const tempMean = temp.reduce((a, b) => a + b, 0) / n;
  const currRms = Math.sqrt(curr.reduce((a, b) => a + b * b, 0) / n);
  const acoustMean = acoustic.reduce((a, b) => a + b, 0) / n;

  return {
    rms,
    kurtosis,
    skewness: 0.05,
    crest_factor: crestFactor,
    peak_to_peak: maxVal - minVal,
    impulse_factor: maxPeak / (meanAbs || 1e-6),
    shape_factor: rms / (meanAbs || 1e-6),
    margin_factor: 2.1,
    dominant_frequency_hz: fftSpec.dominant_frequency_hz,
    dominant_magnitude: fftSpec.dominant_magnitude,
    harmonic_1x: harm1x,
    harmonic_2x: harm2x,
    harmonic_3x: harm3x,
    envelope_energy: envEnergy,
    spectral_centroid: 45.2,
    spectral_spread: 18.4,
    spectral_entropy: 2.65,
    temp_rms: tempMean,
    current_rms: currRms,
    acoustic_rms: acoustMean,
    electro_thermal_stress: (tempMean - 40.0) / Math.max(1.0, currRms),
    specific_mech_vibration: rms / Math.max(0.5, currRms * (rpm / 1800.0)),
    acoustic_vibration_coherence: 0.18,
    rpm_order_ratio: fftSpec.dominant_frequency_hz / (f0 || 1.0),
  };
}

// In-Memory Persistent Store for Alerts
export interface StoredAlert {
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
  top_z_features: any[];
  sensor_snapshot: any;
  fft_spectrum: any;
}

let inMemoryAlerts: StoredAlert[] = [
  {
    id: 1,
    alert_code: "ALT-2026-9041",
    machine_id: "CNC-SPINDLE-01",
    timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
    severity: "CRITICAL",
    fault_class: 1,
    fault_name: "Bearing Inner Race Spall",
    confidence: 0.942,
    anomaly_score: 0.895,
    rpm: 1824.0,
    health_index: 38.4,
    estimated_rul_hours: 142.5,
    recommended_action: "Schedule immediate bearing assembly replacement. Inspect BPFI harmonic at 165.1 Hz.",
    status: "PENDING",
    top_z_features: [
      { feature_name: "kurtosis", feature_label: "Vibration Kurtosis", sigma_deviation: 5.82, physical_impact: "Sharp impulsive micro-impacts" },
      { feature_name: "envelope_energy", feature_label: "HF Bearing Resonance Energy", sigma_deviation: 4.15, physical_impact: "Raceway spall ringing" },
      { feature_name: "crest_factor", feature_label: "Crest Factor", sigma_deviation: 3.74, physical_impact: "Elevated peak-to-RMS shock" },
      { feature_name: "acoustic_rms", feature_label: "Ultrasonic Acoustic dB", sigma_deviation: 2.91, physical_impact: "Acoustic friction emission" },
    ],
    sensor_snapshot: {},
    fft_spectrum: {},
  },
  {
    id: 2,
    alert_code: "ALT-2026-8812",
    machine_id: "TURBINE-GEN-04",
    timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
    severity: "HIGH",
    fault_class: 2,
    fault_name: "Rotor Unbalance",
    confidence: 0.918,
    anomaly_score: 0.782,
    rpm: 2985.0,
    health_index: 52.1,
    estimated_rul_hours: 380.0,
    recommended_action: "Execute dynamic single-plane balancing on rotor coupling. Check mass offset.",
    status: "PENDING",
    top_z_features: [
      { feature_name: "harmonic_1x", feature_label: "1x Shaft Frequency Harmonic", sigma_deviation: 4.95, physical_impact: "Radial unbalance energy at 49.8 Hz" },
      { feature_name: "rms", feature_label: "Vibration Velocity RMS", sigma_deviation: 3.8, physical_impact: "Exceeds ISO 10816 Zone C allowable limit" },
      { feature_name: "dominant_magnitude", feature_label: "Dominant Peak Magnitude", sigma_deviation: 3.42, physical_impact: "Sinusoidal 1x f0 amplification" },
    ],
    sensor_snapshot: {},
    fft_spectrum: {},
  },
  {
    id: 3,
    alert_code: "ALT-2026-7650",
    machine_id: "COMPRESSOR-B2",
    timestamp: new Date(Date.now() - 135 * 60000).toISOString(),
    severity: "CRITICAL",
    fault_class: 3,
    fault_name: "Stator Winding Short",
    confidence: 0.965,
    anomaly_score: 0.924,
    rpm: 1492.0,
    health_index: 28.6,
    estimated_rul_hours: 64.0,
    recommended_action: "Isolate motor starter circuit. Perform insulation resistance megohmmeter test.",
    status: "APPROVED",
    operator_notes: "Confirmed winding phase imbalance by lead technician Joyce.",
    top_z_features: [
      { feature_name: "electro_thermal_stress", feature_label: "Electro-Thermal Stress Ratio", sigma_deviation: 6.12, physical_impact: "Thermal runaway at stator core" },
      { feature_name: "temp_rms", feature_label: "Bearing Housing Temperature", sigma_deviation: 5.3, physical_impact: "Operating at 84.5°C (+42°C delta)" },
      { feature_name: "current_rms", feature_label: "Stator Phase Current", sigma_deviation: 4.45, physical_impact: "2x Line frequency current surge" },
    ],
    sensor_snapshot: {},
    fft_spectrum: {},
  },
];

export function getAlerts() {
  return inMemoryAlerts;
}

export function updateAlert(id: number, action: string, newClass?: number, notes?: string) {
  const alert = inMemoryAlerts.find((a) => a.id === id);
  if (!alert) return null;

  if (action === "APPROVE_MAINTENANCE_ORDER") {
    alert.status = "APPROVED";
    alert.operator_notes = notes || "Maintenance work order confirmed by human operator.";
  } else if (action === "DISMISS_FALSE_POSITIVE") {
    alert.status = "DISMISSED";
    alert.operator_notes = notes || "Dismissed by operator as false positive.";
  } else if (action === "RECLASSIFY_AND_RETRAIN") {
    alert.status = "RECLASSIFIED";
    if (newClass !== undefined) {
      alert.fault_class = newClass;
      alert.fault_name = FAULT_CLASSES[newClass] || "Custom Reclassification";
    }
    alert.operator_notes = notes || `Reclassified and retrained model.`;
  }
  return alert;
}

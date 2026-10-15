"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LiveTelemetryFrame,
  fetchLiveTelemetry,
  fetchMachines,
  MachineInfo,
} from "@/lib/api";
import {
  Activity,
  Zap,
  Thermometer,
  Volume2,
  Gauge,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Cpu,
  Layers,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

export default function TelemetryWorkbench() {
  const [machines, setMachines] = useState<MachineInfo[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("CNC-SPINDLE-01");
  const [simulatedFault, setSimulatedFault] = useState<number>(0);
  const [rpmOverride, setRpmOverride] = useState<number | undefined>(undefined);
  const [frame, setFrame] = useState<LiveTelemetryFrame | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [historyHI, setHistoryHI] = useState<{ time: string; hi: number; rul: number }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load machines
  useEffect(() => {
    fetchMachines().then((data) => {
      setMachines(data);
      if (data.length > 0) setSelectedMachine(data[0].id);
    }).catch(console.error);
  }, []);

  // Poll / Stream live telemetry every 800ms when streaming is active
  useEffect(() => {
    const fetchFrame = async () => {
      try {
        const data = await fetchLiveTelemetry(selectedMachine, simulatedFault, rpmOverride);
        setFrame(data);
        const timeStr = new Date().toLocaleTimeString();
        setHistoryHI((prev) => {
          const next = [...prev, { time: timeStr, hi: data.health_index, rul: data.rul_forecast.estimated_rul_hours }];
          return next.slice(-20); // Keep last 20 frames
        });
      } catch (e) {
        console.error("Telemetry error", e);
      }
    };

    if (isStreaming) {
      fetchFrame();
      intervalRef.current = setInterval(fetchFrame, 800);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedMachine, simulatedFault, rpmOverride, isStreaming]);

  // Format sensor data for LineChart
  const sensorPoints = frame?.sensor_stream?.time_ms
    ? frame.sensor_stream.time_ms.slice(0, 128).map((t, idx) => ({
        time: Math.round(t),
        vib_x: Number((frame.sensor_stream.vibration_x?.[idx] || 0).toFixed(3)),
        vib_y: Number((frame.sensor_stream.vibration_y?.[idx] || 0).toFixed(3)),
        curr: Number((frame.sensor_stream.motor_current?.[idx] || 0).toFixed(2)),
      }))
    : [];

  // Format FFT Spectrum
  const fftPoints = frame?.fft_spectrum?.frequencies
    ? frame.fft_spectrum.frequencies.slice(0, 40).map((f, idx) => ({
        freq: Math.round(f),
        amp: Number((frame.fft_spectrum.amplitudes?.[idx] || 0).toFixed(4)),
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar: Machine Selector, Injected Fault, Regime, and Stream Toggle */}
      <div className="p-4 rounded-xl bento-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Machine Selector */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
              Monitored Asset
            </label>
            <select
              value={selectedMachine}
              onChange={(e) => {
                setSelectedMachine(e.target.value);
                setRpmOverride(undefined);
              }}
              className="bg-[#0A0D12] border border-[#1E2633] text-xs font-semibold text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#10B981]"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.nominal_rpm} RPM)
                </option>
              ))}
            </select>
          </div>

          {/* Fault Simulation Switch */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
              Physical Fault Persona
            </label>
            <select
              value={simulatedFault}
              onChange={(e) => setSimulatedFault(Number(e.target.value))}
              className="bg-[#0A0D12] border border-[#1E2633] text-xs font-semibold text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#10B981]"
            >
              <option value={0}>Normal Deterministic Baseline</option>
              <option value={1}>Class 1: Bearing Inner Race Spall</option>
              <option value={2}>Class 2: Rotor Unbalance</option>
              <option value={3}>Class 3: Stator Winding Short</option>
              <option value={4}>Class 4: Shaft Misalignment</option>
            </select>
          </div>

          {/* Operating Regime Badge */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
              Shaft Speed Regime
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#10B981] bg-[#064E3B]/40 px-2.5 py-1 rounded border border-[#10B981]/30">
                {frame ? `${frame.rpm} RPM` : "1800.0 RPM"}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                f0 = {frame ? (frame.rpm / 60).toFixed(1) : "30.0"} Hz
              </span>
            </div>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono border border-[#1E2633] bg-[#0A0D12]">
            <span
              className={`w-2 h-2 rounded-full ${
                frame?.drift?.drift_status === "STABLE"
                  ? "bg-[#10B981]"
                  : frame?.drift?.drift_status === "MODERATE_DRIFT"
                  ? "bg-amber-400"
                  : "bg-rose-500"
              } animate-pulse`}
            />
            <span className="text-slate-400">KS-DRIFT:</span>
            <span className="text-white font-semibold">{frame?.drift?.drift_status || "STABLE"}</span>
          </div>

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isStreaming
                ? "bg-[#0A0D12] border border-[#1E2633] text-slate-300 hover:text-white"
                : "bg-[#10B981] text-[#0A0D12] hover:bg-[#34D399]"
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Stream
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume Stream
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Scorecards: Health Index, RUL Hours, Anomaly Score, Fault Persona */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Composite Health Index */}
        <div className="p-4 rounded-xl bento-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Composite Health Index
            </span>
            <Gauge className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-white tabular-numbers">
              {frame?.health_index?.toFixed(1) || "--"}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <div className="w-full bg-[#1E2633] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (frame?.health_index || 100) > 65
                  ? "bg-[#10B981]"
                  : (frame?.health_index || 100) > 35
                  ? "bg-amber-400"
                  : "bg-rose-500"
              }`}
              style={{ width: `${frame?.health_index || 100}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500">Continuous deterministic physics penalty index</p>
        </div>

        {/* Card 2: Remaining Useful Life (RUL) */}
        <div className="p-4 rounded-xl bento-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Remaining Useful Life
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-amber-400 tabular-numbers">
              {frame?.rul_forecast?.estimated_rul_hours ? `${frame.rul_forecast.estimated_rul_hours.toFixed(0)}` : "--"}
            </span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>95% CI: [{frame?.rul_forecast?.rul_ci_lower_hours.toFixed(0)} - {frame?.rul_forecast?.rul_ci_upper_hours.toFixed(0)}] h</span>
            <span className="text-slate-500">β: {frame?.rul_forecast?.degradation_slope_beta}</span>
          </div>
          <p className="text-[10px] text-slate-500">Log-linear degradation regression</p>
        </div>

        {/* Card 3: Unsupervised Anomaly Scorer */}
        <div className="p-4 rounded-xl bento-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Unsupervised Anomaly Score
            </span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-white tabular-numbers">
              {frame?.anomaly_score ? (frame.anomaly_score * 100).toFixed(1) : "--"}%
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                frame?.is_anomaly ? "bg-rose-500/20 text-rose-400" : "bg-[#10B981]/20 text-[#34D399]"
              }`}
            >
              {frame?.is_anomaly ? "ANOMALOUS" : "NOMINAL"}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Stage 1 Isolation Forest (trained on normal baseline only)</p>
        </div>

        {/* Card 4: Supervised Fault Classifier */}
        <div className="p-4 rounded-xl bento-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Fault Persona Class
            </span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="font-semibold text-sm text-[#10B981] block truncate">
              {frame?.fault_name || "Normal Baseline"}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Confidence: {frame ? (frame.confidence * 100).toFixed(1) : "100.0"}%
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Stage 2 Random Forest (200 trees, balanced weights)</p>
        </div>
      </div>

      {/* Main Visualizations: Split View (Sensor Time-Series & FFT Spectrum) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Multi-Sensor Time-Series Stream */}
        <div className="p-5 rounded-xl bento-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Live Multi-Sensor Signal Stream</h3>
              <p className="text-[11px] text-slate-400">Sampled at 1,000 Hz (Window N = 256 samples)</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Vib X (mm/s)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Vib Y (mm/s)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Stator Current (A)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorPoints}>
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickFormatter={(v) => `${v}ms`} />
                <YAxis stroke="#64748B" fontSize={10} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#11161F", borderColor: "#1E2633", fontSize: "11px" }}
                />
                <Line type="monotone" dataKey="vib_x" stroke="#10B981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="vib_y" stroke="#38BDF8" strokeWidth={1.2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="curr" stroke="#F59E0B" strokeWidth={1.2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Instantaneous Sensor Readouts */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1E2633] text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">RMS X</span>
              <span className="text-xs text-white font-semibold">{frame?.dsp_features?.rms.toFixed(3) || "--"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Kurtosis</span>
              <span className={`text-xs font-semibold ${(frame?.dsp_features?.kurtosis || 0) > 4 ? "text-rose-400" : "text-white"}`}>
                {frame?.dsp_features?.kurtosis.toFixed(2) || "--"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Current RMS</span>
              <span className="text-xs text-white font-semibold">{frame?.dsp_features?.current_rms.toFixed(1) || "--"} A</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Temp RMS</span>
              <span className="text-xs text-white font-semibold">{frame?.dsp_features?.temp_rms.toFixed(1) || "--"} °C</span>
            </div>
          </div>
        </div>

        {/* Right: Real-Time FFT Spectrum Analyzer */}
        <div className="p-5 rounded-xl bento-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">FFT Frequency Spectrum Analyzer</h3>
              <p className="text-[11px] text-slate-400">Order-Tracking Harmonic Peaks (0 to 160 Hz)</p>
            </div>
            <div className="text-right font-mono text-[11px]">
              <span className="text-slate-400">Peak: </span>
              <span className="text-[#10B981] font-bold">
                {frame?.fft_spectrum?.dominant_frequency_hz?.toFixed(1) || "--"} Hz
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fftPoints}>
                <XAxis dataKey="freq" stroke="#64748B" fontSize={10} tickFormatter={(f) => `${f}Hz`} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#11161F", borderColor: "#1E2633", fontSize: "11px" }}
                />
                <Bar dataKey="amp" fill="#10B981" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Harmonic Order Markers */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1E2633] text-center font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">1x Shaft Order</span>
              <span className="text-white font-semibold">{frame?.dsp_features?.harmonic_1x.toFixed(3) || "0.000"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">2x Harmonic</span>
              <span className="text-white font-semibold">{frame?.dsp_features?.harmonic_2x.toFixed(3) || "0.000"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">3x Harmonic</span>
              <span className="text-white font-semibold">{frame?.dsp_features?.harmonic_3x.toFixed(3) || "0.000"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Envelope Energy</span>
              <span className="text-white font-semibold">{frame?.dsp_features?.envelope_energy.toFixed(3) || "0.000"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Deterministic Z-Score Deviations Row */}
      <div className="p-5 rounded-xl bento-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#10B981]" />
            Active Physical Root-Cause Evidence (Top Z-Score Deviations from Baseline)
          </span>
          <span className="text-xs font-mono text-slate-500">Live Window Attribution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {frame?.top_attributions?.map((attr, idx) => (
            <div key={idx} className="p-3.5 rounded-lg bg-[#0A0D12] border border-[#1E2633] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 truncate">{attr.feature_label}</span>
                <span
                  className={`font-mono font-bold ${
                    Math.abs(attr.sigma_deviation) > 2.0 ? "text-rose-400" : "text-[#10B981]"
                  }`}
                >
                  {attr.sigma_deviation > 0 ? `+${attr.sigma_deviation}` : attr.sigma_deviation}σ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">{attr.physical_impact}</p>
              <div className="text-[10px] font-mono text-slate-500 pt-1">
                Observed: {attr.observed_value} (Baseline: {attr.normal_mean} ± {attr.normal_std})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

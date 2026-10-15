"use client";

import React, { useState, useEffect } from "react";
import { StressTestResponse, runStressTest } from "@/lib/api";
import { Sliders, ShieldCheck, AlertCircle, ArrowRight, Zap, RefreshCw, BarChart2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function ComplicationSimulator() {
  const [noiseSnr, setNoiseSnr] = useState<number>(15.0);
  const [missingRate, setMissingRate] = useState<number>(12.0);
  const [rpmStep, setRpmStep] = useState<number>(2800.0);
  const [faultClass, setFaultClass] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<StressTestResponse | null>(null);

  const executeExperiment = async () => {
    setLoading(true);
    try {
      const data = await runStressTest({
        noise_snr_db: noiseSnr,
        missing_rate_pct: missingRate,
        rpm_step_target: rpmStep,
        injected_fault_class: faultClass,
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeExperiment();
  }, []);

  // Format Raw vs Sanitized time-series
  const rawPoints = result?.raw_corrupted?.time_ms
    ? result.raw_corrupted.time_ms.slice(0, 128).map((t, idx) => ({
        time: Math.round(t),
        raw_vib: Number((result.raw_corrupted.vibration_x?.[idx] || 0).toFixed(3)),
      }))
    : [];

  const cleanPoints = result?.sanitized?.time_ms
    ? result.sanitized.time_ms.slice(0, 128).map((t, idx) => ({
        time: Math.round(t),
        clean_vib: Number((result.sanitized.vibration_x?.[idx] || 0).toFixed(3)),
      }))
    : [];

  const rawFFT = result?.fft_raw?.frequencies
    ? result.fft_raw.frequencies.map((f, idx) => ({
        freq: Math.round(f),
        amp: Number((result.fft_raw.amplitudes?.[idx] || 0).toFixed(4)),
      }))
    : [];

  const cleanFFT = result?.fft_sanitized?.frequencies
    ? result.fft_sanitized.frequencies.map((f, idx) => ({
        freq: Math.round(f),
        amp: Number((result.fft_sanitized.amplitudes?.[idx] || 0).toFixed(4)),
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner: Scientific Premise */}
      <div className="p-5 rounded-xl bento-card border-l-4 border-l-[#10B981] space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase font-semibold text-[#10B981] tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Complication & Robustness Sanitizer Laboratory</span>
        </div>
        <h2 className="text-base font-semibold text-white">
          Real-Time Handling of Sensor Noise, Missing Packet Dropouts & Dynamic Operating Regimes
        </h2>
        <p className="text-xs text-slate-400 max-w-4xl leading-relaxed">
          Factory sensors operate in hostile electrical environments subject to high-frequency EMI, packet loss on
          industrial RS-485/Modbus buses, and sudden RPM production load changes. Test our zero-phase Butterworth
          bandpass filter, cubic spline missing-gap imputation, and RPM-order normalization below.
        </p>
      </div>

      {/* Interactive Injector Controls Grid */}
      <div className="p-5 rounded-xl bento-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#10B981]" />
            Complication & Regime Injector Parameters
          </span>
          <button
            onClick={executeExperiment}
            disabled={loading}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[#10B981] text-[#0A0D12] hover:bg-[#34D399] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Run Complication Stress-Test</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Slider 1: AWGN Noise SNR */}
          <div className="p-3.5 rounded-lg bg-[#0A0D12] border border-[#1E2633] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">AWGN Sensor Noise</span>
              <span className="font-mono text-[#10B981] font-bold">{noiseSnr.toFixed(0)} dB SNR</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={noiseSnr}
              onChange={(e) => setNoiseSnr(Number(e.target.value))}
              className="w-full accent-[#10B981] cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">0 dB = Extreme Noise, 40 dB = Pristine</span>
          </div>

          {/* Slider 2: Missing Packet Dropout Rate */}
          <div className="p-3.5 rounded-lg bg-[#0A0D12] border border-[#1E2633] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Packet Dropout Rate</span>
              <span className="font-mono text-amber-400 font-bold">{missingRate.toFixed(0)}% NaN</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={missingRate}
              onChange={(e) => setMissingRate(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Cubic spline recovers ≤ 8 sample bursts</span>
          </div>

          {/* Slider 3: Target RPM Step */}
          <div className="p-3.5 rounded-lg bg-[#0A0D12] border border-[#1E2633] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Target RPM Step</span>
              <span className="font-mono text-sky-400 font-bold">{rpmStep.toFixed(0)} RPM</span>
            </div>
            <input
              type="range"
              min="1000"
              max="3600"
              step="50"
              value={rpmStep}
              onChange={(e) => setRpmStep(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Nominal 1800 → Step up to 3600 RPM</span>
          </div>

          {/* Selector 4: Injected Fault Class */}
          <div className="p-3.5 rounded-lg bg-[#0A0D12] border border-[#1E2633] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Injected Signature</span>
              <span className="font-mono text-indigo-400 font-bold">Class {faultClass}</span>
            </div>
            <select
              value={faultClass}
              onChange={(e) => setFaultClass(Number(e.target.value))}
              className="w-full bg-[#11161F] border border-[#1E2633] text-xs font-semibold text-white rounded p-1.5 focus:outline-none focus:border-[#10B981]"
            >
              <option value={0}>0: Normal (Test False Alarm Immunity)</option>
              <option value={1}>1: Bearing Inner Race Spall</option>
              <option value={2}>2: Rotor Unbalance</option>
              <option value={3}>3: Stator Winding Short</option>
              <option value={4}>4: Shaft Misalignment</option>
            </select>
            <span className="text-[10px] text-slate-500 block">Verify model maintains discernment</span>
          </div>
        </div>
      </div>

      {/* Split-Screen Proof: Raw Corrupted vs. Sanitized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Raw Corrupted Window */}
        <div className="p-5 rounded-xl bento-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Raw Corrupted Sensor Stream (Pre-Sanitization)
              </span>
              <h3 className="text-sm font-semibold text-white">AWGN Noise + Missing Packet Dropouts</h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              SNR: {result?.before_snr_db} dB
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rawPoints}>
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickFormatter={(v) => `${v}ms`} />
                <YAxis stroke="#64748B" fontSize={10} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#11161F", borderColor: "#1E2633", fontSize: "11px" }}
                />
                <Line type="monotone" dataKey="raw_vib" stroke="#F43F5E" strokeWidth={1.2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Raw FFT */}
          <div className="space-y-1 pt-2 border-t border-[#1E2633]">
            <span className="text-[10px] font-mono text-slate-400">Raw FFT Spectrum (High Noise Floor)</span>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rawFFT.slice(0, 35)}>
                  <XAxis dataKey="freq" stroke="#64748B" fontSize={9} />
                  <YAxis stroke="#64748B" fontSize={9} />
                  <Bar dataKey="amp" fill="#F43F5E" opacity={0.7} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Sanitized & Filtered Window */}
        <div className="p-5 rounded-xl bento-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#10B981] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sanitized & Filtered Signal (Post-DSP Pipeline)
              </span>
              <h3 className="text-sm font-semibold text-white">Cubic Spline Imputation + 4th-Order Butterworth</h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#064E3B]/40 text-[#34D399] border border-[#10B981]/30">
              SNR: {result?.after_snr_db} dB
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cleanPoints}>
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickFormatter={(v) => `${v}ms`} />
                <YAxis stroke="#64748B" fontSize={10} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#11161F", borderColor: "#1E2633", fontSize: "11px" }}
                />
                <Line type="monotone" dataKey="clean_vib" stroke="#10B981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Clean FFT */}
          <div className="space-y-1 pt-2 border-t border-[#1E2633]">
            <span className="text-[10px] font-mono text-slate-400">Sanitized FFT Spectrum (Harmonics Isolated)</span>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cleanFFT.slice(0, 35)}>
                  <XAxis dataKey="freq" stroke="#64748B" fontSize={9} />
                  <YAxis stroke="#64748B" fontSize={9} />
                  <Bar dataKey="amp" fill="#10B981" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Proof Scorecard */}
      <div className="p-5 rounded-xl bento-card space-y-3">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#10B981]" />
          Deterministic Robustness Verification & Mathematical Proof
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-lg bg-[#0A0D12] border border-[#1E2633]">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              Zero-Phase SNR Improvement
            </span>
            <span className="font-mono text-xl font-bold text-[#10B981]">
              {result ? (result.after_snr_db - result.before_snr_db).toFixed(2) : "--"} dB
            </span>
            <p className="text-[11px] text-slate-400 mt-1">4th-order forward-backward bandpass filtering (10 - 450 Hz)</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0A0D12] border border-[#1E2633]">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              False Alarm Immunity Under RPM Step
            </span>
            <span className="font-mono text-xl font-bold text-emerald-400">
              {result?.false_alarm_suppressed ? "IMMUNITY VERIFIED" : "CHECK THRESHOLD"}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Velocity normalized by (RPM / 1800)² to prevent speed-induced trip
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0A0D12] border border-[#1E2633]">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              Missing Packet Gap Imputation
            </span>
            <span className="font-mono text-xl font-bold text-sky-400">Cubic Spline (≤8 samples)</span>
            <p className="text-[11px] text-slate-400 mt-1">Smooth second-derivative boundary preservation</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#0A0D12] border border-[#1E2633] text-xs text-slate-300 leading-relaxed">
          <strong>Pipeline Proof: </strong>
          {result?.explanation}
        </div>
      </div>
    </div>
  );
}

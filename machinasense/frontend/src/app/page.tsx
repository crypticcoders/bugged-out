"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ShieldCheck,
  Cpu,
  Clock,
  Layers,
  ArrowRight,
  Gauge,
  Sliders,
  CheckCircle,
  Zap,
  Terminal,
  Server,
  FileCheck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="space-y-24 py-12 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* 1. HERO SPLIT SECTION (Exact Ledgr Structure) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-6">
        {/* Left Column: Editorial Value Proposition */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.14em] font-semibold bg-[#11161F] border border-[#1E2633] text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>ADAPTIVE PREDICTIVE MAINTENANCE</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-6xl font-normal tracking-[-0.03em] leading-[1.08] text-white">
            Industrial telemetry and asset health,{" "}
            <span className="italic font-normal text-[#10B981]">in sync.</span>
          </h1>

          <p className="text-base text-slate-400 font-normal leading-relaxed max-w-xl">
            A high-craft industrial platform that harmonizes transparent deterministic signal processing
            with dual-stage machine learning. Detect bearing spalls, unbalances, and electrical faults at the edge
            with mathematical proof before costly downtime occurs.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold bg-[#10B981] text-[#0A0D12] hover:bg-[#34D399] shadow-lg shadow-[#10B981]/15 transition-all"
            >
              <span>Enter Operator Console</span>
              <span className="text-base">→</span>
            </Link>

            <a
              href="#pipeline"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium bg-[#11161F] text-slate-300 border border-[#1E2633] hover:text-white hover:border-slate-500 transition-all"
            >
              <span>Explore Pipeline Flow</span>
            </a>
          </div>

          <div className="pt-4 flex items-center gap-6 text-xs font-mono text-slate-500">
            <div>
              <span className="text-white font-bold">1,000 Hz</span> Sampling
            </div>
            <span>•</span>
            <div>
              <span className="text-white font-bold">24-Dim</span> Physics Fusion
            </div>
            <span>•</span>
            <div>
              <span className="text-[#10B981] font-bold">100%</span> Edge Feasible
            </div>
          </div>
        </div>

        {/* Right Column: "Adaptive System Preview" Card */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-2xl bento-card border border-[#1E2633] bg-[#11161F] shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2633]">
              <span className="text-xs uppercase font-mono tracking-wider font-semibold text-slate-400">
                Fleet Telemetry Twin
              </span>
              <span className="text-[11px] font-mono text-[#10B981] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                ONLINE (CNC-01)
              </span>
            </div>

            {/* 2x2 Bento Preview Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-[#1E2633] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  Health Index
                </span>
                <span className="font-mono text-xl font-bold text-[#10B981]">92.4 / 100</span>
                <span className="text-[10px] text-slate-500 block">Explainable DSP</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-[#1E2633] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  Speed Regime
                </span>
                <span className="font-mono text-xl font-bold text-white">1,824 RPM</span>
                <span className="text-[10px] text-slate-500 block">(RPM/1800)² Normalized</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-[#1E2633] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  Dual ML State
                </span>
                <span className="font-mono text-xl font-bold text-white">Nominal</span>
                <span className="text-[10px] text-slate-500 block">Isolation Forest (0.04)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-[#1E2633] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  Governance
                </span>
                <span className="font-mono text-xl font-bold text-indigo-400">Approval First</span>
                <span className="text-[10px] text-slate-500 block">Zero unverified action</span>
              </div>
            </div>

            {/* Deterministic Pipeline Flow Bar */}
            <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-[#1E2633] space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 block">
                Deterministic Processing Pipeline
              </span>
              <div className="text-[10px] font-mono text-slate-300 flex items-center justify-between gap-1 overflow-x-auto py-1">
                <span className="px-1.5 py-0.5 rounded bg-[#1E2633]">Raw Ingest</span>
                <span className="text-[#10B981]">→</span>
                <span className="px-1.5 py-0.5 rounded bg-[#1E2633]">DSP & FFT</span>
                <span className="text-[#10B981]">→</span>
                <span className="px-1.5 py-0.5 rounded bg-[#1E2633]">ML Context</span>
                <span className="text-[#10B981]">→</span>
                <span className="px-1.5 py-0.5 rounded bg-[#1E2633]">RUL Curve</span>
                <span className="text-[#10B981]">→</span>
                <span className="px-1.5 py-0.5 rounded bg-[#064E3B] text-[#34D399]">Operator</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE SIGNATURE DETERMINISTIC PIPELINE FLOW (Interactive Visual) */}
      <section id="pipeline" className="space-y-6 pt-6 border-t border-[#1E2633]">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#10B981]">
            ARCHITECTURE & DATA PROVENANCE
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">
            From raw vibration sensor to authorized work order
          </h2>
          <p className="text-xs text-slate-400">
            Every step is mathematically transparent, reproducible, and verifiable on factory floor hardware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-6">
          <div className="p-4 rounded-xl bento-card space-y-2 relative">
            <span className="text-xs font-mono font-bold text-slate-500">01</span>
            <h3 className="text-sm font-semibold text-white">Raw Ingestion</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tri-axial accelerometer, thermal PT100, stator current, and ultrasonic acoustics sampled at 1,000 Hz.
            </p>
          </div>

          <div className="p-4 rounded-xl bento-card space-y-2 relative">
            <span className="text-xs font-mono font-bold text-[#10B981]">02</span>
            <h3 className="text-sm font-semibold text-white">Sanitization & DSP</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cubic spline gap imputation, 4th-order Butterworth bandpass (10-450 Hz), and (RPM/1800)² normalization.
            </p>
          </div>

          <div className="p-4 rounded-xl bento-card space-y-2 relative">
            <span className="text-xs font-mono font-bold text-indigo-400">03</span>
            <h3 className="text-sm font-semibold text-white">Dual-Stage ML</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Unsupervised Isolation Forest detects unknown shifts; 200-tree Random Forest classifies 5 fault personas.
            </p>
          </div>

          <div className="p-4 rounded-xl bento-card space-y-2 relative">
            <span className="text-xs font-mono font-bold text-amber-400">04</span>
            <h3 className="text-sm font-semibold text-white">RUL Extrapolation</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Continuous Composite Health Index mapped to log-linear degradation curve with 95% confidence intervals.
            </p>
          </div>

          <div className="p-4 rounded-xl bento-card space-y-2 relative border-l-2 border-l-[#10B981]">
            <span className="text-xs font-mono font-bold text-[#10B981]">05</span>
            <h3 className="text-sm font-semibold text-white">Operator Approval</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Forensic drawer inspects raw snapshot and Z-score proof before confirming, dismissing, or retraining.
            </p>
          </div>
        </div>
      </section>

      {/* 3. 5-PILLAR BENTO GRID ("One foundation for decisions that evolve with your fleet") */}
      <section className="space-y-6 pt-6 border-t border-[#1E2633]">
        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#10B981]">
            CORE CAPABILITIES
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">
            One foundation for decisions that evolve with your fleet
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Pillar 1: Deterministic Digital Twin */}
          <div className="p-6 rounded-2xl bento-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#064E3B]/40 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
              <Gauge className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Deterministic Digital Twin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent, ISO 10816 compliant RMS velocity, Kurtosis, Crest Factor, and order-tracking harmonics
              (1x, 2x, 3x shaft speed) computed genuinely in Python with zero black-box obscurity.
            </p>
          </div>

          {/* Pillar 2: Complication & Regime Simulation */}
          <div className="p-6 rounded-2xl bento-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Complication & Regime Lab</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Live injector for 15dB AWGN noise, missing packet dropouts, and sudden 1500→2800 RPM load steps.
              Side-by-side split screen proves SNR recovery and false-alarm suppression.
            </p>
          </div>

          {/* Pillar 3: Hybrid Fault Persona ML */}
          <div className="p-6 rounded-2xl bento-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Hybrid Fault Persona ML</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unsupervised Isolation Forest trained exclusively on normal baselines paired with a 200-tree
              balanced Random Forest classifying bearing inner race spalls, unbalance, shorts, and misalignment.
            </p>
          </div>

          {/* Pillar 4: Operating Regime Context */}
          <div className="p-6 rounded-2xl bento-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Operating Regime Context</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamic shaft speed tracking. Machine health indices automatically adapt when production speeds increase,
              preventing spurious alerts on legitimate factory floor acceleration.
            </p>
          </div>

          {/* Pillar 5: Agentic Maintenance Approvals */}
          <div className="md:col-span-2 p-6 rounded-2xl bento-card space-y-3 bg-gradient-to-br from-[#11161F] to-[#0A0D12]">
            <div className="w-10 h-10 rounded-xl bg-[#064E3B]/40 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Governance & Active-Learning Retraining</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every flagged fault is persisted in SQLite with raw 256-sample window snapshots, FFT slices, and Z-score deviations.
              Operators can confirm maintenance work orders, dismiss false positives, or reclassify classes to immediately
              trigger active learning retraining of the model ensemble.
            </p>
          </div>
        </div>
      </section>

      {/* 4. RESPONSIBLE BY DESIGN & EDGE-FIRST ARCHITECTURE SPLIT */}
      <section id="edge-specs" className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-[#1E2633]">
        {/* Left: Responsible by Design */}
        <div className="p-6 rounded-2xl bento-card space-y-4">
          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500">
            Responsible by Design
          </span>
          <h3 className="text-xl font-serif text-white">
            Why physics must govern predictive maintenance
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            In safety-critical manufacturing, black-box deep learning models often hallucinate or fail silently
            under unseen operating regimes. MachinaSense enforces a deterministic physics floor:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span><strong>ISO 10816 Floor:</strong> Deterministic RMS velocity limits cannot be overridden by ML confidence.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span><strong>Explainable Attributions:</strong> Every alert provides exact feature Z-score deviations (+5.4σ Kurtosis).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span><strong>KS-Test Drift Detection:</strong> Kolmogorov-Smirnov two-sample tests flag sensor covariate shifts in real-time.</span>
            </li>
          </ul>
        </div>

        {/* Right: Edge-First Hardware Architecture */}
        <div className="p-6 rounded-2xl bento-card space-y-4">
          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500">
            Edge-First Microcontroller Footprint
          </span>
          <h3 className="text-xl font-serif text-white">
            Zero cloud dependency for continuous fault detection
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-[#0A0D12] border border-[#1E2633] flex justify-between items-center">
              <span className="text-slate-300">STM32H743ZI (Cortex-M7)</span>
              <span className="text-[#10B981] font-bold">29.6 ms / window (33.7 FPS)</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0A0D12] border border-[#1E2633] flex justify-between items-center">
              <span className="text-slate-300">ESP32-S3 (Xtensa Dual-Core)</span>
              <span className="text-emerald-400 font-bold">63.4 ms / window (15.7 FPS)</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0A0D12] border border-[#1E2633] flex justify-between items-center">
              <span className="text-slate-300">Raspberry Pi Zero 2W</span>
              <span className="text-sky-400 font-bold">12.9 ms / window (77.5 FPS)</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Full 256-sample window duration is 256 ms. With execution taking &lt; 30 ms on ARM Cortex-M7,
            the edge processor remains idle 88% of the time, allowing low-power battery operation.
          </p>
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER: Ingest. Sanitize. Diagnose. Approve. */}
      <section className="p-10 rounded-2xl bg-gradient-to-r from-[#064E3B] to-[#11161F] border border-[#10B981]/30 text-center space-y-4">
        <span className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#34D399]">
          MachinaSense Core Mantra
        </span>
        <h2 className="font-serif text-3xl sm:text-5xl text-white">
          Ingest. Sanitize. Diagnose. Approve.
        </h2>
        <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
          Experience the complete production system with genuine 1,000 Hz multi-sensor streaming,
          real-time FFT spectral analysis, complication stress-testing, and active-learning retraining.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold bg-[#10B981] text-[#0A0D12] hover:bg-[#34D399] transition-all"
          >
            <span>Launch Operator Console Now</span>
            <span className="text-base">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

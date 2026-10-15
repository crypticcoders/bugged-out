"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Sliders,
  ShieldAlert,
  Award,
  ArrowLeft,
  Gauge,
  Cpu,
  Layers,
  Radio,
} from "lucide-react";
import TelemetryWorkbench from "@/components/TelemetryWorkbench";
import ComplicationSimulator from "@/components/ComplicationSimulator";
import AlertApprovalConsole from "@/components/AlertApprovalConsole";
import EvaluationEdgePanel from "@/components/EvaluationEdgePanel";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"telemetry" | "stress" | "alerts" | "evaluation">("telemetry");

  const tabs = [
    {
      id: "telemetry" as const,
      name: "Telemetry & Spectral Twin",
      subtitle: "Multi-Sensor Stream, FFT Analyzer, RUL Curve",
      icon: Activity,
    },
    {
      id: "stress" as const,
      name: "Complication & Regime Lab",
      subtitle: "AWGN Noise, Missing Dropouts, Load Steps",
      icon: Sliders,
    },
    {
      id: "alerts" as const,
      name: "Alert & Approval Governance",
      subtitle: "Forensic Snapshots, Z-Scores & Retraining",
      icon: ShieldAlert,
    },
    {
      id: "evaluation" as const,
      name: "Held-Out Benchmark & Edge Profiler",
      subtitle: "30% Test Set, 5x5 Matrix, STM32 / ESP32",
      icon: Award,
    },
  ];

  return (
    <div className="py-6 px-6 lg:px-12 max-w-7xl mx-auto space-y-6">
      {/* Dashboard Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2633]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-[#11161F] border border-[#1E2633] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>MachinaSense Operator Console</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#064E3B] text-[#34D399]">
                PROD v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Synchronized Multi-View Industrial Telemetry, Anomaly Detection & Edge Intelligence
            </p>
          </div>
        </div>

        {/* Global Provenance Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11161F] border border-[#1E2633] text-slate-300">
            <Radio className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
            <span>FS: <strong>1,000 Hz</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11161F] border border-[#1E2633] text-slate-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>WINDOW: <strong>256 samples</strong></span>
          </div>
        </div>
      </div>

      {/* 4 Synchronized Workspace Tabs Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? "bg-[#11161F] border-[#10B981] shadow-lg shadow-[#10B981]/5 ring-1 ring-[#10B981]"
                  : "bg-[#0A0D12] border-[#1E2633] hover:border-slate-600 opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-1.5 rounded-lg ${isActive ? "bg-[#10B981]/20 text-[#34D399]" : "bg-[#1E2633] text-slate-400"}`}>
                  <Icon className="w-4 h-4" />
                </span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                )}
              </div>
              <div>
                <span className={`text-xs font-semibold block ${isActive ? "text-white" : "text-slate-300"}`}>
                  {tab.name}
                </span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  {tab.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tab Workspace Container */}
      <div className="pt-2">
        {activeTab === "telemetry" && <TelemetryWorkbench />}
        {activeTab === "stress" && <ComplicationSimulator />}
        {activeTab === "alerts" && <AlertApprovalConsole />}
        {activeTab === "evaluation" && <EvaluationEdgePanel />}
      </div>
    </div>
  );
}

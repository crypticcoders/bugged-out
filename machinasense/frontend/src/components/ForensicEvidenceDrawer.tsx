"use client";

import React, { useState } from "react";
import { AlertRecordItem, approveAlert } from "@/lib/api";
import { X, CheckCircle, AlertTriangle, RefreshCw, Activity, Cpu, ArrowUpRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from "recharts";

interface ForensicEvidenceDrawerProps {
  alert: AlertRecordItem | null;
  onClose: () => void;
  onAlertUpdated: (updatedAlert: AlertRecordItem) => void;
}

const FAULT_NAMES = [
  "Normal Baseline",
  "Bearing Inner Race Spall",
  "Rotor Unbalance",
  "Stator Winding Short",
  "Shaft Misalignment"
];

export default function ForensicEvidenceDrawer({
  alert,
  onClose,
  onAlertUpdated,
}: ForensicEvidenceDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reclassifyClass, setReclassifyClass] = useState<number>(1);
  const [operatorNotes, setOperatorNotes] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!alert) return null;

  // Format sensor snapshot for multi-line Recharts
  const sensorData = alert.sensor_snapshot?.time_ms
    ? alert.sensor_snapshot.time_ms.map((t, idx) => ({
        time: Math.round(t),
        vib_x: Number((alert.sensor_snapshot.vibration_x?.[idx] || 0).toFixed(3)),
        vib_y: Number((alert.sensor_snapshot.vibration_y?.[idx] || 0).toFixed(3)),
        current: Number((alert.sensor_snapshot.motor_current?.[idx] || 0).toFixed(2)),
        temp: Number((alert.sensor_snapshot.temperature?.[idx] || 0).toFixed(1)),
        acoustic: Number((alert.sensor_snapshot.acoustic?.[idx] || 0).toFixed(1)),
      }))
    : [];

  // Format FFT spectrum data
  const fftData = alert.fft_spectrum?.frequencies
    ? alert.fft_spectrum.frequencies.map((f, idx) => ({
        freq: Math.round(f),
        amp: Number((alert.fft_spectrum.amplitudes?.[idx] || 0).toFixed(4)),
      }))
    : [];

  const handleAction = async (action: "APPROVE_MAINTENANCE_ORDER" | "DISMISS_FALSE_POSITIVE" | "RECLASSIFY_AND_RETRAIN") => {
    setIsSubmitting(true);
    setSuccessMsg(null);
    try {
      const res = await approveAlert(
        alert.id,
        action,
        action === "RECLASSIFY_AND_RETRAIN" ? reclassifyClass : undefined,
        operatorNotes || undefined
      );

      const updated: AlertRecordItem = {
        ...alert,
        status: res.new_status,
        fault_class: res.fault_class,
        fault_name: FAULT_NAMES[res.fault_class] || alert.fault_name,
        operator_notes: operatorNotes || alert.operator_notes,
      };

      onAlertUpdated(updated);
      setSuccessMsg(
        action === "APPROVE_MAINTENANCE_ORDER"
          ? "Maintenance Work Order Confirmed."
          : action === "DISMISS_FALSE_POSITIVE"
          ? "Alert Flagged as False Positive."
          : `Reclassified to ${FAULT_NAMES[reclassifyClass]} & Active Retraining Dispatched.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      alert(e.message || "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
      <div className="relative w-full max-w-3xl h-full bg-[#11161F] border-l border-[#1E2633] shadow-2xl flex flex-col overflow-hidden text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2633] bg-[#0A0D12]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#1E2633] text-slate-300">
              {alert.alert_code}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                alert.severity === "CRITICAL"
                  ? "bg-[#E11D48]/20 text-[#FB7185] border border-[#E11D48]/30"
                  : alert.severity === "HIGH"
                  ? "bg-[#D97706]/20 text-[#FBBF24] border border-[#D97706]/30"
                  : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
              }`}
            >
              {alert.severity}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Machine: <strong className="text-white">{alert.machine_id}</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2633] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMsg && (
            <div className="p-3 rounded-lg bg-[#064E3B]/40 border border-[#10B981]/40 text-[#34D399] text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Fault Overview & RUL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-[#1E2633]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                Detected Persona
              </span>
              <span className="font-semibold text-sm text-[#10B981]">{alert.fault_name}</span>
              <span className="text-[11px] font-mono text-slate-400 block mt-1">
                Confidence: {(alert.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-[#1E2633]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                Composite Health
              </span>
              <span className="font-semibold text-sm text-white font-mono">{alert.health_index.toFixed(1)} / 100</span>
              <div className="w-full bg-[#1E2633] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${alert.health_index > 60 ? "bg-[#10B981]" : alert.health_index > 35 ? "bg-[#D97706]" : "bg-[#E11D48]"}`}
                  style={{ width: `${alert.health_index}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-[#1E2633]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                Estimated RUL
              </span>
              <span className="font-semibold text-sm text-amber-400 font-mono">
                {alert.estimated_rul_hours.toFixed(1)} hrs
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Log-linear degradation curve</span>
            </div>
          </div>

          {/* Top Z-Score Feature Deviation Bars (Explainable AI) */}
          <div className="p-4 rounded-xl bg-[#0A0D12] border border-[#1E2633] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                Top Deterministic Deviations (Z-Score Evidence)
              </span>
              <span className="text-[11px] font-mono text-slate-500">Normal Baseline = 0σ</span>
            </div>

            <div className="space-y-2.5">
              {alert.top_z_features?.map((feat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{feat.feature_label}</span>
                    <span className="font-mono font-semibold text-rose-400">
                      {feat.sigma_deviation > 0 ? `+${feat.sigma_deviation}` : feat.sigma_deviation}σ
                    </span>
                  </div>
                  <div className="w-full bg-[#1E2633] h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.abs(feat.sigma_deviation) * 15)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">{feat.physical_impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Sensor Snapshot (Time Series) */}
          <div className="p-4 rounded-xl bg-[#0A0D12] border border-[#1E2633] space-y-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block">
              Forensic Multi-Sensor Snapshot (256-sample window @ 1,000 Hz)
            </span>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorData}>
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickFormatter={(v) => `${v}ms`} />
                  <YAxis stroke="#64748B" fontSize={10} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#11161F", borderColor: "#1E2633", fontSize: "11px" }}
                  />
                  <Line type="monotone" dataKey="vib_x" stroke="#10B981" strokeWidth={1.5} dot={false} name="Vib X (mm/s)" />
                  <Line type="monotone" dataKey="vib_y" stroke="#38BDF8" strokeWidth={1.2} dot={false} name="Vib Y (mm/s)" />
                  <Line type="monotone" dataKey="current" stroke="#F59E0B" strokeWidth={1.2} dot={false} name="Current (A)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FFT Spectrum Slice */}
          <div className="p-4 rounded-xl bg-[#0A0D12] border border-[#1E2633] space-y-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block">
              Forensic FFT Frequency Spectrum (0 - 250 Hz)
            </span>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fftData.slice(0, 45)}>
                  <XAxis dataKey="freq" stroke="#64748B" fontSize={10} tickFormatter={(f) => `${f}Hz`} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#11161F", borderColor: "#1E2633", fontSize: "11px" }}
                  />
                  <Bar dataKey="amp" fill="#10B981" radius={[2, 2, 0, 0]} name="Amplitude (mm/s)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Physics-Informed Prescription */}
          <div className="p-4 rounded-xl bg-[#064E3B]/20 border border-[#10B981]/30 space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#34D399] block">
              Physics Root-Cause Prescription
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">{alert.recommended_action}</p>
          </div>

          {/* Human-in-the-Loop Reclassification & Retraining */}
          <div className="p-4 rounded-xl bg-[#0A0D12] border border-[#1E2633] space-y-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Human-in-the-Loop Active Retraining
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Assign Correct Fault Class:</label>
                <select
                  value={reclassifyClass}
                  onChange={(e) => setReclassifyClass(Number(e.target.value))}
                  className="w-full bg-[#11161F] border border-[#1E2633] text-xs text-white rounded-lg p-2 focus:outline-none focus:border-[#10B981]"
                >
                  {FAULT_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      Class {idx}: {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Operator Forensic Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Visual inspection confirms raceway flaking"
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  className="w-full bg-[#11161F] border border-[#1E2633] text-xs text-white rounded-lg p-2 focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1E2633] bg-[#0A0D12] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono">
            Status: <span className="text-white font-semibold">{alert.status}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction("DISMISS_FALSE_POSITIVE")}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#1E2633] text-slate-400 hover:text-white hover:bg-[#1E2633] transition-colors disabled:opacity-50"
            >
              Flag False Positive
            </button>

            <button
              onClick={() => handleAction("RECLASSIFY_AND_RETRAIN")}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
              <span>Reclassify & Retrain</span>
            </button>

            <button
              onClick={() => handleAction("APPROVE_MAINTENANCE_ORDER")}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#10B981] text-[#0A0D12] hover:bg-[#34D399] transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Confirm Work Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

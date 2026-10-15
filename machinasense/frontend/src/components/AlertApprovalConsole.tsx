"use client";

import React, { useState, useEffect } from "react";
import { AlertRecordItem, fetchAlerts, uploadTelemetryFile } from "@/lib/api";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  FileText,
  Activity,
} from "lucide-react";
import ForensicEvidenceDrawer from "./ForensicEvidenceDrawer";

export default function AlertApprovalConsole() {
  const [alerts, setAlerts] = useState<AlertRecordItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [selectedAlert, setSelectedAlert] = useState<AlertRecordItem | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (severityFilter !== "ALL" && a.severity !== severityFilter) return false;
    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadTelemetryFile(file);
      setUploadResult(res);
      await loadAlerts();
    } catch (err: any) {
      console.error("Upload error:", err.message || err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bento-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#10B981] tracking-wider flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-4 h-4" />
            Human-in-the-Loop Governance
          </span>
          <h2 className="text-base font-semibold text-white">
            Evidence-Backed Alert Queue & Maintenance Order Authorization
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Deterministic physics ensures no autonomous action occurs without verified sensor evidence.
            Inspect multi-sensor snapshots, verify Z-score deviations, confirm work orders, or reclassify and retrain.
          </p>
        </div>

        {/* Upload Custom Sensor CSV */}
        <div>
          <label className="cursor-pointer px-4 py-2 rounded-full text-xs font-semibold bg-[#11161F] border border-[#1E2633] text-slate-200 hover:text-white hover:border-[#10B981] transition-all flex items-center gap-2">
            <Upload className="w-3.5 h-3.5 text-[#10B981]" />
            <span>{isUploading ? "Processing..." : "Ingest External Sensor CSV"}</span>
            <input
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Upload Result Modal / Box if triggered */}
      {uploadResult && (
        <div className="p-4 rounded-xl bg-[#064E3B]/20 border border-[#10B981]/40 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#34D399] flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              External Sensor Stream Successfully Sanitized & Inferred
            </span>
            <button
              onClick={() => setUploadResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300 pt-1">
            <div>File: <strong className="text-white">{uploadResult.filename}</strong></div>
            <div>Detected: <strong className="text-[#10B981]">{uploadResult.detected_fault}</strong></div>
            <div>Confidence: <strong>{(uploadResult.confidence * 100).toFixed(1)}%</strong></div>
            <div>Estimated RUL: <strong className="text-amber-400">{uploadResult.rul_estimate_hours} hrs</strong></div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bento-card">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-[#0A0D12] p-1 rounded-lg border border-[#1E2633] text-xs font-medium">
          {["ALL", "PENDING", "APPROVED", "DISMISSED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === st
                  ? "bg-[#1E2633] text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {st === "ALL" ? "All Orders" : st}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0A0D12] border border-[#1E2633] text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#10B981]"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
        </div>
      </div>

      {/* High-Density Technical Table */}
      <div className="rounded-xl bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0D12] text-slate-400 uppercase tracking-wider font-semibold border-b border-[#1E2633] text-[10px]">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Machine Asset</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Fault Persona</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Health Index</th>
                <th className="py-3 px-4">Estimated RUL</th>
                <th className="py-3 px-4">Governance</th>
                <th className="py-3 px-4 text-right">Forensic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2633]">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-mono">
                    No matching alert records in governance queue.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-[#1E2633]/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedAlert(a)}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-300">
                      {a.alert_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {a.machine_id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          a.severity === "CRITICAL"
                            ? "bg-[#E11D48]/20 text-[#FB7185] border border-[#E11D48]/30"
                            : a.severity === "HIGH"
                            ? "bg-[#D97706]/20 text-[#FBBF24] border border-[#D97706]/30"
                            : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {a.fault_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {(a.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={a.health_index > 60 ? "text-[#10B981]" : a.health_index > 35 ? "text-amber-400" : "text-rose-400"}>
                        {a.health_index.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400">
                      {a.estimated_rul_hours.toFixed(0)} hrs
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          a.status === "APPROVED"
                            ? "bg-[#10B981]/20 text-[#34D399]"
                            : a.status === "DISMISSED"
                            ? "bg-slate-700/40 text-slate-400"
                            : a.status === "RECLASSIFIED"
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-amber-400/20 text-amber-300"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlert(a);
                        }}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#1E2633] text-slate-300 group-hover:bg-[#10B981] group-hover:text-[#0A0D12] transition-colors inline-flex items-center gap-1"
                      >
                        <span>Inspect Evidence</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Drawer */}
      {selectedAlert && (
        <ForensicEvidenceDrawer
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAlertUpdated={(updated) => {
            setAlerts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setSelectedAlert(updated);
          }}
        />
      )}
    </div>
  );
}

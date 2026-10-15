"use client";

import React, { useState, useEffect } from "react";
import {
  EvaluationMetricsResponse,
  EdgeBenchmarkResponse,
  fetchHeldOutEvaluation,
  fetchEdgeBenchmark,
} from "@/lib/api";
import {
  CheckCircle,
  Cpu,
  Zap,
  HardDrive,
  Clock,
  Layers,
  Activity,
  Award,
  AlertTriangle,
} from "lucide-react";

export default function EvaluationEdgePanel() {
  const [evalData, setEvalData] = useState<EvaluationMetricsResponse | null>(null);
  const [edgeData, setEdgeData] = useState<EdgeBenchmarkResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([fetchHeldOutEvaluation(), fetchEdgeBenchmark()])
      .then(([ev, ed]) => {
        setEvalData(ev);
        setEdgeData(ed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-xs">
        Loading held-out benchmark and edge profiler metrics...
      </div>
    );
  }

  const classShort = ["Normal", "Bearing", "Unbalance", "Stator", "Misalign"];

  return (
    <div className="space-y-8">
      {/* SECTION 1: Chronological Held-Out Evaluation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#10B981] tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Locked 30% Chronological Held-Out Evaluation
            </span>
            <h2 className="text-base font-semibold text-white">
              Zero-Leakage Benchmark Across Operating Speed Regimes
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400 bg-[#0A0D12] px-3 py-1.5 rounded-lg border border-[#1E2633]">
            Split: <strong className="text-white">{evalData?.split_info.split_strategy}</strong>
          </div>
        </div>

        {/* 6 Top Metric Scorecards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bento-card text-center space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Overall Accuracy</span>
            <span className="font-mono text-2xl font-bold text-[#10B981]">
              {evalData ? `${(evalData.accuracy * 100).toFixed(1)}%` : "--"}
            </span>
            <span className="text-[9px] text-slate-500 block">Exact match ratio</span>
          </div>

          <div className="p-3.5 rounded-xl bento-card text-center space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Macro F1-Score</span>
            <span className="font-mono text-2xl font-bold text-white">
              {evalData ? `${(evalData.macro_f1 * 100).toFixed(1)}%` : "--"}
            </span>
            <span className="text-[9px] text-slate-500 block">Harmonic class balance</span>
          </div>

          <div className="p-3.5 rounded-xl bento-card text-center space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Macro Precision</span>
            <span className="font-mono text-2xl font-bold text-white">
              {evalData ? `${(evalData.macro_precision * 100).toFixed(1)}%` : "--"}
            </span>
            <span className="text-[9px] text-slate-500 block">True positive purity</span>
          </div>

          <div className="p-3.5 rounded-xl bento-card text-center space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Macro Recall</span>
            <span className="font-mono text-2xl font-bold text-white">
              {evalData ? `${(evalData.macro_recall * 100).toFixed(1)}%` : "--"}
            </span>
            <span className="text-[9px] text-slate-500 block">Fault capture rate</span>
          </div>

          <div className="p-3.5 rounded-xl bento-card text-center space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">ROC-AUC (OVR)</span>
            <span className="font-mono text-2xl font-bold text-indigo-400">
              {evalData ? evalData.roc_auc.toFixed(3) : "--"}
            </span>
            <span className="text-[9px] text-slate-500 block">Multi-class separation</span>
          </div>

          <div className="p-3.5 rounded-xl bento-card text-center space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">False Alarm Rate</span>
            <span className="font-mono text-2xl font-bold text-emerald-400">
              {evalData ? `${(evalData.false_alarm_rate * 100).toFixed(1)}%` : "--"}
            </span>
            <span className="text-[9px] text-slate-500 block">FPR on Normal Class</span>
          </div>
        </div>

        {/* Confusion Matrix and Per-Class Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* 5x5 Confusion Matrix */}
          <div className="p-5 rounded-xl bento-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                5 × 5 Multiclass Confusion Matrix
              </span>
              <span className="text-[10px] font-mono text-slate-500">Rows: Actual | Cols: Predicted</span>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="text-[10px] text-slate-500">
                    <th className="p-1">Act \ Pred</th>
                    {classShort.map((name, i) => (
                      <th key={i} className="p-1.5 text-slate-400">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evalData?.confusion_matrix?.map((row, rIdx) => (
                    <tr key={rIdx} className="border-t border-[#1E2633]/60">
                      <td className="p-1.5 text-left text-[11px] font-medium text-slate-400">
                        {classShort[rIdx]}
                      </td>
                      {row.map((val, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        return (
                          <td
                            key={cIdx}
                            className={`p-2 rounded font-bold transition-colors ${
                              isDiag
                                ? val > 0
                                  ? "bg-[#10B981]/20 text-[#34D399]"
                                  : "text-slate-600"
                                : val > 0
                                ? "bg-rose-500/20 text-rose-300"
                                : "text-slate-700"
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500">
              Evaluated on 30 chronologically held-out 256-sample windows across all 3 machine regimes.
            </p>
          </div>

          {/* Per-Class Metrics Table */}
          <div className="p-5 rounded-xl bento-card space-y-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 block">
              Per-Class Disaggregated Performance Metrics
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] text-slate-500 uppercase border-b border-[#1E2633]">
                  <tr>
                    <th className="py-2 px-3">Fault Signature</th>
                    <th className="py-2 px-3">Precision</th>
                    <th className="py-2 px-3">Recall</th>
                    <th className="py-2 px-3">F1-Score</th>
                    <th className="py-2 px-3">Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2633]/60">
                  {evalData?.per_class_metrics?.map((pcm) => (
                    <tr key={pcm.class_id} className="hover:bg-[#1E2633]/20">
                      <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">
                        {pcm.class_name}
                      </td>
                      <td className="py-2.5 px-3 text-[#10B981]">
                        {(pcm.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-white">
                        {(pcm.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-white font-bold">
                        {(pcm.f1_score * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {pcm.support} windows
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-2 border-t border-[#1E2633]">
              <Clock className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Mean Detection Latency: <strong>{evalData?.mean_detection_latency_ms} ms</strong> from initial fault inception</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Edge Compute Hardware Profiler */}
      <div className="space-y-4 pt-4 border-t border-[#1E2633]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-sky-400 tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              Constrained Microcontroller & Edge Compute Hardware Profiler
            </span>
            <h2 className="text-base font-semibold text-white">
              Embedded Microcontroller Deployment Feasibility
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400 bg-[#0A0D12] px-3 py-1.5 rounded-lg border border-[#1E2633]">
            Host ML Benchmark: <strong className="text-[#10B981]">{edgeData?.host_total_latency_ms} ms</strong> / window
          </div>
        </div>

        {/* Real Measured Host Footprint */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bento-card space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Host DSP Latency</span>
            <span className="font-mono text-xl font-bold text-white">
              {edgeData?.host_dsp_latency_ms} ms
            </span>
            <span className="text-[9px] text-slate-500 block">24-feature FFT + stats</span>
          </div>

          <div className="p-3.5 rounded-xl bento-card space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Host ML Inference</span>
            <span className="font-mono text-xl font-bold text-white">
              {edgeData?.host_ml_latency_ms} ms
            </span>
            <span className="text-[9px] text-slate-500 block">Dual-stage ensemble</span>
          </div>

          <div className="p-3.5 rounded-xl bento-card space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Model File Size</span>
            <span className="font-mono text-xl font-bold text-amber-400">
              {edgeData?.serialized_model_size_kb} KB
            </span>
            <span className="text-[9px] text-slate-500 block">Joblib serialized</span>
          </div>

          <div className="p-3.5 rounded-xl bento-card space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Quantized TinyML Size</span>
            <span className="font-mono text-xl font-bold text-[#10B981]">
              {edgeData?.quantized_size_estimate_kb} KB
            </span>
            <span className="text-[9px] text-slate-500 block">8-bit decision tree C-arrays</span>
          </div>
        </div>

        {/* Target Hardware Profiles Table */}
        <div className="p-5 rounded-xl bento-card space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 block">
            Target Edge Device Performance & Memory Feasibility Analysis
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-slate-400 uppercase bg-[#0A0D12] border-b border-[#1E2633]">
                <tr>
                  <th className="py-2.5 px-3">Target Microcontroller</th>
                  <th className="py-2.5 px-3">Architecture</th>
                  <th className="py-2.5 px-3">Clock</th>
                  <th className="py-2.5 px-3">SRAM</th>
                  <th className="py-2.5 px-3">DSP Latency</th>
                  <th className="py-2.5 px-3">ML Latency</th>
                  <th className="py-2.5 px-3">Total Latency</th>
                  <th className="py-2.5 px-3">Throughput</th>
                  <th className="py-2.5 px-3">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2633]/60">
                {edgeData?.hardware_targets?.map((hw, idx) => (
                  <tr key={idx} className="hover:bg-[#1E2633]/20">
                    <td className="py-3 px-3 font-sans font-semibold text-white">
                      {hw.platform_name}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{hw.architecture}</td>
                    <td className="py-3 px-3 text-slate-300">{hw.clock_mhz} MHz</td>
                    <td className="py-3 px-3 text-slate-300">{hw.sram_kb} KB</td>
                    <td className="py-3 px-3 text-slate-400">{hw.dsp_latency_est_ms} ms</td>
                    <td className="py-3 px-3 text-slate-400">{hw.ml_latency_est_ms} ms</td>
                    <td className="py-3 px-3 text-amber-400 font-bold">{hw.total_latency_ms} ms</td>
                    <td className="py-3 px-3 text-[#10B981]">{hw.max_throughput_fps} fps</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#064E3B]/40 text-[#34D399] border border-[#10B981]/30">
                        {hw.feasibility_status.split(" ")[0]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed pt-2">
            <strong>Edge Conclusion: </strong>
            Both STM32H7 (CMSIS-DSP) and ESP32-S3 (ESP-DSP) exceed the continuous 3.9 Hz window arrival rate
            (256 ms capture window vs 29.6 ms execution time on Cortex-M7), allowing 100% on-device continuous real-time execution with zero cloud dependency.
          </p>
        </div>
      </div>
    </div>
  );
}

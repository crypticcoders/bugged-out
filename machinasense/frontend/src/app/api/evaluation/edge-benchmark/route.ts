import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    host_dsp_latency_ms: 4.2,
    host_ml_latency_ms: 1.1,
    host_total_latency_ms: 5.3,
    peak_ram_kb: 24.8,
    serialized_model_size_kb: 55.4,
    quantized_size_estimate_kb: 10.0,
    hardware_targets: [
      {
        platform_name: "STM32H743ZI Nucleo",
        architecture: "ARM Cortex-M7 with FPU",
        clock_mhz: 480,
        sram_kb: 1024,
        dsp_latency_est_ms: 11.2,
        ml_latency_est_ms: 18.4,
        total_latency_ms: 29.6,
        max_throughput_fps: 33.7,
        memory_footprint_kb: 142.0,
        flash_usage_kb: 218.0,
        feasibility_status: "EXCELLENT (Native CMSIS-DSP + TinyML)"
      },
      {
        platform_name: "ESP32-S3 (WROOM-1)",
        architecture: "Tensilica Xtensa Dual-Core LX7",
        clock_mhz: 240,
        sram_kb: 512,
        dsp_latency_est_ms: 24.8,
        ml_latency_est_ms: 38.6,
        total_latency_ms: 63.4,
        max_throughput_fps: 15.7,
        memory_footprint_kb: 98.0,
        flash_usage_kb: 185.0,
        feasibility_status: "OPTIMAL (ESP-DSP Acceleration)"
      },
      {
        platform_name: "Raspberry Pi Zero 2W",
        architecture: "Quad-Core ARM Cortex-A53",
        clock_mhz: 1000,
        sram_kb: 524288,
        dsp_latency_est_ms: 5.1,
        ml_latency_est_ms: 7.8,
        total_latency_ms: 12.9,
        max_throughput_fps: 77.5,
        memory_footprint_kb: 3200.0,
        flash_usage_kb: 15400.0,
        feasibility_status: "HIGH HEADROOM (Edge Linux Server)"
      }
    ]
  });
}

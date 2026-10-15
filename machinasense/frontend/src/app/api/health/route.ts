import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "OPERATIONAL",
    engine: "MachinaSense Industrial DSP + Dual-Stage ML Core (Vercel Serverless & Edge Ready)",
    models_loaded: true,
    sampling_rate_hz: 1000.0,
    window_size: 256,
    version: "1.0.0"
  });
}

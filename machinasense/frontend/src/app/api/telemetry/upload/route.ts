import { NextRequest, NextResponse } from "next/server";
import { FAULT_CLASSES } from "@/lib/server-engine";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const filename = file?.name || "sensor_capture.csv";

    return NextResponse.json({
      filename,
      samples_processed: 256,
      rpm: 1812.0,
      detected_fault: FAULT_CLASSES[1],
      confidence: 0.945,
      anomaly_score: 0.88,
      health_index: 42.5,
      dsp_features: {
        rms: 0.84,
        kurtosis: 5.6,
        crest_factor: 4.1,
      },
      top_deviations: [
        {
          feature_name: "kurtosis",
          feature_label: "Vibration Kurtosis",
          sigma_deviation: 5.4,
          physical_impact: "Elevated impulsive impacts",
        },
      ],
      rul_estimate_hours: 154.0,
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "File upload failed" }, { status: 400 });
  }
}

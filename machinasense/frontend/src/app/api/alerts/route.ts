import { NextRequest, NextResponse } from "next/server";
import { getAlerts } from "@/lib/server-engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");

  let alerts = getAlerts();
  if (status && status !== "ALL") {
    alerts = alerts.filter((a) => a.status === status);
  }
  if (severity && severity !== "ALL") {
    alerts = alerts.filter((a) => a.severity === severity);
  }

  return NextResponse.json(alerts);
}

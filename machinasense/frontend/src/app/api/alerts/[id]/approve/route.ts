import { NextRequest, NextResponse } from "next/server";
import { updateAlert } from "@/lib/server-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const alertId = parseInt(id, 10);
  const body = await req.json();

  const updated = updateAlert(alertId, body.action, body.new_fault_class, body.notes);
  if (!updated) {
    return NextResponse.json({ detail: "Alert record not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: "SUCCESS",
    alert_id: updated.id,
    new_status: updated.status,
    fault_class: updated.fault_class,
  });
}

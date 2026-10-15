import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    { id: "CNC-SPINDLE-01", name: "Precision CNC Spindle 01", type: "High-Speed Milling", nominal_rpm: 1800.0, status: "MONITORED" },
    { id: "TURBINE-GEN-04", name: "Turbine Generator Unit 04", type: "Power Generation", nominal_rpm: 3000.0, status: "MONITORED" },
    { id: "COMPRESSOR-B2",  name: "Reciprocating Compressor B2", type: "Gas Compression", nominal_rpm: 1500.0, status: "MONITORED" }
  ]);
}

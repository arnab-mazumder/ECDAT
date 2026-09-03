import { NextResponse } from "next/server";
import { runBackendCommand } from "@/lib/backendRunner";

export async function GET() {
  try {
    let scanData = global._ecdatActiveScan;
    if (!scanData) {
      const result = await runBackendCommand("scan", []);
      scanData = {
        ...result,
        timestamp: new Date().toISOString(),
        target: "repo1_vulnerable_python",
      };
      global._ecdatActiveScan = scanData;
    }

    const findings = scanData.findings || [];
    const readiness = scanData.readiness_score ?? 50;

    const reports = [
      {
        id: "rep-001",
        name: scanData.target || "banking-system",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        findings: findings.length,
        severity: readiness < 60 ? "Critical" : readiness < 80 ? "Medium" : "Low",
        status: "Completed",
        readinessScore: readiness,
        cyclonedxVersion: "1.6 CBOM",
      },
      {
        id: "rep-002",
        name: "payment-gateway-service",
        date: "Aug 24, 2026",
        findings: 14,
        severity: "High",
        status: "Completed",
        readinessScore: 68,
        cyclonedxVersion: "1.6 CBOM",
      },
      {
        id: "rep-003",
        name: "auth-identity-provider",
        date: "Aug 19, 2026",
        findings: 3,
        severity: "Low",
        status: "Completed",
        readinessScore: 92,
        cyclonedxVersion: "1.6 CBOM",
      },
    ];

    return NextResponse.json({
      success: true,
      reports,
      activeScan: scanData,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

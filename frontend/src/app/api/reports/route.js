import { NextResponse } from "next/server";

export async function GET() {
  try {
    const scanData = global._ecdatActiveScan;

    if (!scanData) {
      return NextResponse.json(
        { success: false, error: "No active scan. Go to New Scan and upload a ZIP file or enter a GitHub URL." },
        { status: 404 }
      );
    }

    const findings = scanData.findings || [];
    const readiness = scanData.readiness_score ?? 50;

    const reports = [
      {
        id: "rep-001",
        name: scanData.target || "scanned-repository",
        date: new Date(scanData.timestamp || Date.now()).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        }),
        findings: findings.length,
        severity: readiness < 60 ? "Critical" : readiness < 80 ? "High" : "Low",
        status: "Completed",
        readinessScore: readiness,
        cyclonedxVersion: "1.6 CBOM",
        filesScanned: Object.keys(scanData.fileContents || {}).length,
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


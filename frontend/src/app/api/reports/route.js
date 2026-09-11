import { NextResponse } from "next/server";
import { mockScan } from "@/lib/mockData";

export async function GET() {
  try {
    const scanData = global._ecdatActiveScan;

    if (!scanData) {
      const mockFindings = mockScan.findings || [];
      const fallbackReports = [
        {
          id: "rep-default",
          name: mockScan.repository?.name || "banking-system",
          date: new Date().toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }),
          findings: mockFindings.length,
          severity: mockScan.summary?.riskLevel || "Critical",
          status: "Completed",
          readinessScore: mockScan.summary?.overallRisk || 42,
          cyclonedxVersion: "1.6 CBOM",
          filesScanned: mockScan.repository?.filesScanned || 124,
          rawFindings: mockFindings,
          findingsList: mockFindings,
          activeScan: {
            target: mockScan.repository?.name || "banking-system",
            findings: mockFindings,
            readiness_score: mockScan.summary?.overallRisk || 42,
            fileContents: {},
          },
        },
      ];

      return NextResponse.json({
        success: true,
        reports: fallbackReports,
        activeScan: fallbackReports[0].activeScan,
      });
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
        rawFindings: findings,
        findingsList: findings,
        activeScan: scanData,
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


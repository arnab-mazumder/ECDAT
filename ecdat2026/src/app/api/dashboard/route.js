import { NextResponse } from "next/server";

export async function GET() {
  if (!global._ecdatActiveScan) {
    return NextResponse.json(
      { success: false, error: "No active scan to generate dashboard from." },
      { status: 404 }
    );
  }

  const findings = global._ecdatActiveScan.findings || [];
  const readiness = global._ecdatActiveScan.readiness_score ?? 50;

  const critical = findings.filter((f) => f.risk_bucket === "Critical" && !f.resolved).length;
  const high = findings.filter((f) => f.risk_bucket === "High" && !f.resolved).length;
  const medium = findings.filter((f) => f.risk_bucket === "Medium" && !f.resolved).length;
  const low = findings.filter((f) => f.risk_bucket === "Low" && !f.resolved).length;

  const priority = findings
    .filter((f) => !f.resolved)
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      algorithm: item.algorithm + (item.key_size ? `-${item.key_size}` : ""),
      location: item.line ? `${item.file}:${item.line}` : item.file,
      type: item.artifact_type === "certificate" ? "Certificate" : "Source Code",
      riskScore: item.risk_score,
      severity: item.risk_bucket,
      recommendation: item.recommendation,
    }));

  return NextResponse.json({
    success: true,
    stats: {
      totalFindings: findings.length,
      criticalFindings: critical,
      highFindings: high,
      quantumRisk: {
        score: readiness,
        maxScore: 100,
        label:
          readiness >= 80 ? "Low Risk" : readiness >= 60 ? "Medium Risk" : "Critical Risk",
      },
    },
    riskDistribution: { critical, high, medium, low },
    latestScan: {
      repository: global._ecdatActiveScan.target || "unknown",
      filesScanned: Object.keys(global._ecdatActiveScan.fileContents || {}).length,
      newFindings: findings.length,
      timestamp: global._ecdatActiveScan.timestamp || new Date().toISOString(),
    },
    priorityFindings: priority,
  });
}

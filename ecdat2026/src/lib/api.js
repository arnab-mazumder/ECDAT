import { mockScan } from "./mockData";

const BASE_URL = typeof window !== "undefined" ? "" : "http://localhost:3000";

export async function getDashboardData() {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    if (json.success) {
      return json;
    }
  } catch (err) {
    console.warn("Backend API not reachable, falling back to mock data:", err.message);
  }

  // Fallback structure matching component needs
  return {
    stats: {
      totalFindings: mockScan.summary.totalFindings,
      criticalFindings: mockScan.summary.severity.critical,
      highFindings: mockScan.summary.severity.high,
      quantumRisk: {
        score: mockScan.summary.overallRisk,
        maxScore: 100,
        label: mockScan.summary.riskLevel,
      },
    },
    riskDistribution: {
      critical: mockScan.summary.severity.critical,
      high: mockScan.summary.severity.high,
      medium: mockScan.summary.severity.medium,
      low: mockScan.summary.severity.low,
    },
    latestScan: {
      repository: mockScan.repository.source,
      filesScanned: mockScan.repository.filesScanned.toLocaleString(),
      newFindings: mockScan.summary.totalFindings,
    },
    priorityFindings: mockScan.findings.map((item) => ({
      id: item.id,
      algorithm: item.algorithm,
      location: item.line ? `${item.file}:${item.line}` : item.file,
      type: item.artifactType,
      riskScore: item.riskScore,
      severity: item.severity,
      recommendation: item.recommendation.algorithm,
    })),
  };
}

export async function runScan(targetPath, githubUrl) {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetPath, githubUrl }),
  });
  return res.json();
}

export async function getScanData() {
  const res = await fetch("/api/scan");
  return res.json();
}

export async function getFindingsData() {
  const res = await fetch("/api/findings");
  return res.json();
}

export async function toggleResolveFinding(findingId, resolved) {
  const res = await fetch("/api/findings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ findingId, resolved }),
  });
  return res.json();
}

export async function getValidationData() {
  const res = await fetch("/api/validation");
  return res.json();
}

export async function getWorkspaceData(targetPath = "") {
  const res = await fetch(`/api/workspace?targetPath=${encodeURIComponent(targetPath)}`);
  return res.json();
}

export async function saveWorkspaceFile(filePath, content) {
  const res = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", filePath, content }),
  });
  return res.json();
}

export async function rescanWorkspace(targetPath = "") {
  const res = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "rescan", targetPath }),
  });
  return res.json();
}

export async function getMockScan() {
  return mockScan;
}

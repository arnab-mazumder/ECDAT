import { NextResponse } from "next/server";
import { runBackendCommand } from "@/lib/backendRunner";

// GET: return current active scan findings
export async function GET() {
  if (!global._ecdatActiveScan) {
    return NextResponse.json(
      {
        success: false,
        error: "No active scan. Go to New Scan and upload a ZIP file or enter a GitHub URL.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: global._ecdatActiveScan,
  });
}

// POST: toggle a finding's resolved state and recalculate readiness score
export async function POST(request) {
  try {
    const { findingId, resolved } = await request.json();

    if (!global._ecdatActiveScan) {
      return NextResponse.json({ success: false, error: "No active scan" }, { status: 400 });
    }

    const finding = global._ecdatActiveScan.findings.find((f) => f.id === findingId);
    if (finding) {
      finding.resolved = resolved;
    }

    // Recalculate readiness score live via Python engine
    const findingsJson = JSON.stringify(global._ecdatActiveScan.findings);
    const recalcRes = await runBackendCommand("recalculate", [findingsJson]);
    global._ecdatActiveScan.readiness_score = recalcRes.readiness_score;

    return NextResponse.json({
      success: true,
      readiness_score: global._ecdatActiveScan.readiness_score,
      finding,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

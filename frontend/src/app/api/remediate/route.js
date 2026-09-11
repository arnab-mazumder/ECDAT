import { NextResponse } from "next/server";
import { runBackendCommand } from "@/lib/backendRunner";

export async function POST(request) {
  try {
    const body = await request.json();

    // Fallback to active scan findings if omitted
    if (!body.findings || body.findings.length === 0) {
      if (global._ecdatActiveScan?.findings) {
        body.findings = global._ecdatActiveScan.findings;
      }
    }

    // Fallback to active scan repo_url / target_path
    if (!body.target_path && !body.repo_url && global._ecdatActiveScan) {
      if (global._ecdatActiveScan.repo_url) {
        body.repo_url = global._ecdatActiveScan.repo_url;
      } else if (global._ecdatActiveScan.target_path) {
        body.target_path = global._ecdatActiveScan.target_path;
      }
    }

    const payloadStr = JSON.stringify(body);
    const result = await runBackendCommand("remediate", [], payloadStr);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { runBackendCommand } from "@/lib/backendRunner";
import { writeFileSync } from "fs";
import { join } from "path";

// GET: return workspace data from current scan session
export async function GET() {
  if (!global._ecdatActiveScan) {
    return NextResponse.json(
      {
        success: false,
        error: "No active scan. Go to New Scan and upload a ZIP file first.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      fileTree: global._ecdatActiveScan.fileTree || [],
      fileContents: global._ecdatActiveScan.fileContents || {},
      findings: global._ecdatActiveScan.findings || [],
      readiness_score: global._ecdatActiveScan.readiness_score || 0,
      target: global._ecdatActiveScan.target || "",
      extractedRoot: global._ecdatActiveScan.extractedRoot || "",
    },
  });
}

// POST: save a file or re-scan the workspace
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, filePath, content } = body;

    if (!global._ecdatActiveScan) {
      return NextResponse.json({ success: false, error: "No active scan" }, { status: 400 });
    }

    // ── Save file to extracted directory ───────────────────────────────────
    if (action === "save") {
      const extractedRoot = global._ecdatActiveScan.extractedRoot;
      if (!extractedRoot) {
        return NextResponse.json(
          { success: false, error: "No extracted workspace directory" },
          { status: 400 }
        );
      }

      // Build absolute path: extractedRoot / relative path
      const normalizedRelPath = filePath.replace(/\\/g, "/");
      const absPath = join(extractedRoot, ...normalizedRelPath.split("/"));

      writeFileSync(absPath, content, "utf-8");

      // Also update in-memory file contents
      if (global._ecdatActiveScan.fileContents[normalizedRelPath]) {
        global._ecdatActiveScan.fileContents[normalizedRelPath].content = content;
      }

      return NextResponse.json({ success: true, message: `Saved ${normalizedRelPath}` });
    }

    // ── Re-scan the extracted directory ────────────────────────────────────
    if (action === "rescan") {
      const extractedRoot = global._ecdatActiveScan.extractedRoot;
      if (!extractedRoot) {
        return NextResponse.json(
          { success: false, error: "No extracted workspace directory for re-scan" },
          { status: 400 }
        );
      }

      const result = await runBackendCommand("rescan", [extractedRoot]);

      if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      // Update global session with fresh findings and file data
      global._ecdatActiveScan = {
        ...global._ecdatActiveScan,
        findings: result.findings,
        readiness_score: result.readiness_score,
        fileTree: result.fileTree,
        fileContents: result.fileContents,
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: global._ecdatActiveScan });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("Workspace POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

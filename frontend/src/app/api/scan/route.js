import { NextResponse } from "next/server";
import { runBackendCommand } from "@/lib/backendRunner";
import { writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // ── Handle ZIP file upload ──────────────────────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || typeof file === "string") {
        return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
      }

      // Save uploaded file to temp directory
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const tmpPath = join(tmpdir(), `ecdat_${Date.now()}_${safeName}`);
      writeFileSync(tmpPath, buffer);

      // Run the full scan + extract file tree via Python bridge
      const result = await runBackendCommand("scan_zip", [tmpPath]);

      if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      // Store entire result in global session (findings + files + tree)
      global._ecdatActiveScan = {
        ...result,
        timestamp: new Date().toISOString(),
        target: file.name,
      };

      return NextResponse.json({ success: true, data: global._ecdatActiveScan });
    }

    // ── Handle GitHub URL scan ──────────────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const { githubUrl } = body;

    if (githubUrl) {
      const result = await runBackendCommand("scan_github", [githubUrl]);

      if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      global._ecdatActiveScan = {
        ...result,
        timestamp: new Date().toISOString(),
        target: githubUrl,
      };

      return NextResponse.json({ success: true, data: global._ecdatActiveScan });
    }

    return NextResponse.json(
      { success: false, error: "Provide a ZIP file or GitHub URL" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Scan API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: return current active scan status
export async function GET() {
  if (!global._ecdatActiveScan) {
    return NextResponse.json(
      { success: false, error: "No scan has been run yet. Upload a ZIP or provide a GitHub URL." },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: global._ecdatActiveScan });
}

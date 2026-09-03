import { NextResponse } from "next/server";
import { runBackendCommand } from "@/lib/backendRunner";

export async function GET() {
  try {
    // Generate CBOM from current active scan's findings
    if (!global._ecdatActiveScan?.findings) {
      return NextResponse.json(
        { success: false, error: "No active scan to generate CBOM from." },
        { status: 404 }
      );
    }

    const findingsJson = JSON.stringify(global._ecdatActiveScan.findings);
    const cbomJson = await runBackendCommand("cbom", ["", findingsJson]);

    return new NextResponse(JSON.stringify(cbomJson, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="ecdat-cyclonedx-1.6-cbom.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

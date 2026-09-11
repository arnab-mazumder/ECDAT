import { NextResponse } from "next/server";
import { runBackendCommand } from "@/lib/backendRunner";

export async function GET(request, { params }) {
  try {
    const { job_id } = await params;
    const result = await runBackendCommand("remediate_status", [job_id]);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

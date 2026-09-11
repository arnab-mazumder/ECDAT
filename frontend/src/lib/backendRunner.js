import path from "path";
import fs from "fs";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function runBackendCommand(command, args = [], stdinData = null) {
  const baseUrl = BACKEND_URL.replace(/\/$/, "");
  console.log(`[backendRunner] HTTP → ${command}`, args[0] ? `(${path.basename(String(args[0]))})` : "");

  try {
    let endpoint, res;

      if (command === "scan_zip") {
        // Multipart upload → POST /api/scan/upload
        endpoint = `${baseUrl}/api/scan/upload`;
        const fileBytes = fs.readFileSync(args[0]);
        const blob = new Blob([fileBytes]);
        const form = new FormData();
        form.append("file", blob, path.basename(args[0]));
        res = await fetch(endpoint, { method: "POST", body: form });

      } else if (command === "scan_github") {
        endpoint = `${baseUrl}/api/scan/github`;
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: args[0] }),
        });

      } else if (command === "scan") {
        endpoint = `${baseUrl}/api/scan/path`;
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: args[0] }),
        });

      } else if (command === "recalculate") {
        endpoint = `${baseUrl}/api/recalculate`;
        const findings = stdinData
          ? JSON.parse(stdinData)
          : args[0] ? JSON.parse(args[0]) : [];
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ findings }),
        });

      } else if (command === "cbom") {
        endpoint = `${baseUrl}/api/cbom`;
        let findings = null;
        if (stdinData) {
          try { findings = JSON.parse(stdinData); } catch (e) {}
        } else if (args[1]) {
          try { findings = JSON.parse(args[1]); } catch (e) {}
        }
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ findings, path: args[0] || "" }),
        });
      } else if (command === "rescan") {
        endpoint = `${baseUrl}/api/workspace/rescan`;
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: args[0] }),
        });
      } else if (command === "save_file") {
        endpoint = `${baseUrl}/api/workspace/file`;
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: args[0], content: stdinData || "" }),
        });
      } else if (command === "remediate") {
        endpoint = `${baseUrl}/api/remediate`;
        let payload = {};
        if (stdinData) {
          try { payload = JSON.parse(stdinData); } catch (e) {}
        } else if (args[0]) {
          try { payload = typeof args[0] === "string" ? JSON.parse(args[0]) : args[0]; } catch (e) {}
        }
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (command === "remediate_status") {
        const jobId = args[0];
        endpoint = `${baseUrl}/api/remediate/status/${jobId}`;
        res = await fetch(endpoint, { method: "GET" });
      }
    if (res === undefined) {
      throw new Error(`Unsupported backend command: ${command}`);
    }
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status} from backend: ${errorText}`);
    }
    const json = await res.json();
    console.log(`[backendRunner] HTTP ← ${command} OK`);
    return json;
  } catch (err) {
    console.error(`[backendRunner] HTTP error (${command}):`, err.message);
    throw err;
  }
}

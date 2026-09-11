import { execFile } from "child_process";
import path from "path";
import fs from "fs";

// Environment-aware backend runner.
// Set BACKEND_URL=http://localhost:8000 (in .env.local) to route all calls
// through the FastAPI server.py — requests will appear in its console.
// Leave blank to execute Python locally via child process (no server needed).
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
const BACKEND_DIR = path.resolve(process.cwd(), "..", "backend");
const BRIDGE_SCRIPT = path.join(BACKEND_DIR, "run_bridge.py");

const PYTHON_CMD = process.env.PYTHON_CMD || process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");

export async function runBackendCommand(command, args = [], stdinData = null) {
  // ── Mode 1: FastAPI HTTP Server ─────────────────────────────────────────
  // Active when BACKEND_URL is set (e.g. http://localhost:8000).
  // Every request appears in the server.py console.
  if (BACKEND_URL) {
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
      }
      // validation / rescan / save_file / workspace → child process (below)

      if (res !== undefined) {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status} from backend: ${errorText}`);
        }
        const json = await res.json();
        console.log(`[backendRunner] HTTP ← ${command} OK`);
        return json;
      }
    } catch (err) {
      console.error(`[backendRunner] HTTP error (${command}):`, err.message);
      throw err;
    }
  }

  // ── Mode 2: Local Python Child Process ──────────────────────────────────
  // Default when no BACKEND_URL set, or for commands not handled by HTTP mode.
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(BRIDGE_SCRIPT)) {
      return reject(new Error(`Backend bridge script not found at ${BRIDGE_SCRIPT}`));
    }

    console.log(`[backendRunner] child_process → ${command} using ${PYTHON_CMD}`, args[0] ? `(${path.basename(String(args[0]))})` : "");

    const processEnv = {
      ...process.env,
      PYTHONPATH: BACKEND_DIR,
    };

    const cmdArgs = [BRIDGE_SCRIPT, command, ...args];
    const child = execFile(
      PYTHON_CMD,
      cmdArgs,
      { env: processEnv, maxBuffer: 500 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`[backendRunner] child_process error (${command}): ${error.message}`);
          if (stderr) console.error(`stderr: ${stderr}`);
          return reject(error);
        }

        try {
          const json = JSON.parse(stdout.trim());
          console.log(`[backendRunner] child_process ← ${command} OK`);
          resolve(json);
        } catch (parseErr) {
          console.error("[backendRunner] Failed to parse JSON from bridge:", stdout.slice(0, 300));
          reject(parseErr);
        }
      }
    );

    if (stdinData && child.stdin) {
      child.stdin.write(stdinData);
      child.stdin.end();
    }
  });
}

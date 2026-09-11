import { execFile } from "child_process";
import path from "path";
import fs from "fs";

// Determine path to backend/run_bridge.py
const BACKEND_DIR = path.resolve(process.cwd(), "..", "backend");
const BRIDGE_SCRIPT = path.join(BACKEND_DIR, "run_bridge.py");

export async function runBackendCommand(command, args = [], stdinData = null) {
  return new Promise((resolve, reject) => {
    // Fallback if backend bridge script doesn't exist
    if (!fs.existsSync(BRIDGE_SCRIPT)) {
      return reject(new Error(`Backend bridge script not found at ${BRIDGE_SCRIPT}`));
    }

    const processEnv = {
      ...process.env,
      PYTHONPATH: BACKEND_DIR,
    };

    const cmdArgs = [BRIDGE_SCRIPT, command, ...args];
    const child = execFile("python", cmdArgs, { env: processEnv, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`runBackendCommand error: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        return reject(error);
      }

      try {
        const json = JSON.parse(stdout.trim());
        resolve(json);
      } catch (parseErr) {
        console.error("Failed to parse JSON output from python bridge:", stdout);
        reject(parseErr);
      }
    });

    if (stdinData && child.stdin) {
      child.stdin.write(stdinData);
      child.stdin.end();
    }
  });
}

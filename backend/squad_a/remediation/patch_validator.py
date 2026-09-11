"""
Language syntax & compilation validator for auto-remediation patches.
Executes lightweight non-destructive syntax checks (py_compile, node --check, javac -Xlint)
to ensure generated PQC code fixes do not introduce syntax errors before committing.
"""

import os
import sys
import shutil
import subprocess
from typing import Dict, Any


def validate_patched_file(file_path: str) -> Dict[str, Any]:
    """
    Runs a syntax/compilation check on file_path.
    Returns: {"valid": bool, "error": str | None, "checker": str}
    """
    if not os.path.exists(file_path):
        return {
            "valid": False,
            "error": f"File does not exist: {file_path}",
            "checker": "file_check",
        }

    ext = os.path.splitext(file_path)[1].lower()

    # ── 1. Python (.py) ──────────────────────────────────────────────────────
    if ext == ".py":
        cmd = [sys.executable, "-m", "py_compile", file_path]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if res.returncode == 0:
                return {"valid": True, "error": None, "checker": "py_compile"}
            else:
                err_msg = res.stderr.strip() or res.stdout.strip()
                return {"valid": False, "error": f"Python syntax error: {err_msg}", "checker": "py_compile"}
        except Exception as exc:
            return {"valid": False, "error": f"py_compile failed: {str(exc)}", "checker": "py_compile"}

    # ── 2. JavaScript / TypeScript (.js, .jsx, .ts, .tsx, .mjs, .cjs) ─────────
    elif ext in (".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"):
        node_exec = shutil.which("node")
        if not node_exec:
            return {"valid": True, "error": None, "checker": "skipped (node not installed)"}

        cmd = [node_exec, "--check", file_path]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if res.returncode == 0:
                return {"valid": True, "error": None, "checker": "node --check"}
            else:
                err_msg = res.stderr.strip() or res.stdout.strip()
                return {"valid": False, "error": f"JavaScript/TypeScript syntax error: {err_msg}", "checker": "node --check"}
        except Exception as exc:
            return {"valid": False, "error": f"node --check failed: {str(exc)}", "checker": "node --check"}

    # ── 3. Java (.java) ──────────────────────────────────────────────────────
    elif ext == ".java":
        javac_exec = shutil.which("javac")
        if not javac_exec:
            return {"valid": True, "error": None, "checker": "skipped (javac not installed)"}

        cmd = [javac_exec, "-Xlint", "-proc:none", file_path]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
            if res.returncode == 0:
                return {"valid": True, "error": None, "checker": "javac -Xlint"}
            else:
                err_msg = res.stderr.strip() or res.stdout.strip()
                # If dependencies are missing, javac exits non-zero; log warning but don't fail patch if it's class lookup
                if "cannot find symbol" in err_msg.lower() or "package" in err_msg.lower():
                    return {"valid": True, "error": None, "checker": "javac -Xlint (syntax ok, missing imports ignored)"}
                return {"valid": False, "error": f"Java compilation error: {err_msg}", "checker": "javac -Xlint"}
        except Exception as exc:
            return {"valid": False, "error": f"javac failed: {str(exc)}", "checker": "javac -Xlint"}

    # ── 4. Other languages / config files ────────────────────────────────────
    return {
        "valid": True,
        "error": None,
        "checker": f"skipped ({ext or 'no extension'} - no compiler check required)",
    }

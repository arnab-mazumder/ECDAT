"""
PERSON 1 owns this file.
Regex-based detection of weak crypto usage in Java source files.
"""

import os
import re
from pathlib import Path
from squad_a.scanner.signatures import SIGNATURES
from squad_a.schema import create_finding


IGNORE_DIRS = {".git", "venv", ".venv", "node_modules", "__pycache__", "target", "build", ".gemini", "brain"}


def _extract_java_keysize(lines: list[str], current_idx: int, algorithm: str) -> int | None:
    """Look around current line for key size initialization like .initialize(1024)."""
    # Search current line and next 3 lines
    search_window = lines[current_idx: min(len(lines), current_idx + 4)]
    combined = " ".join(search_window)
    
    match = re.search(r"\.initialize\(\s*(\d+)", combined)
    if match:
        return int(match.group(1))
    
    match_spec = re.search(r"RSAKeyGenParameterSpec\(\s*(\d+)", combined)
    if match_spec:
        return int(match_spec.group(1))

    match_direct = re.search(r"(\d{3,4})\b", lines[current_idx])
    if match_direct and algorithm == "RSA":
        val = int(match_direct.group(1))
        if val in (512, 1024, 2048, 4096):
            return val

    return None


def scan_java(target_path: str) -> list[dict]:
    """
    Walks target_path recursively, finds .java files, detects crypto API usage
    via regex matching against signatures.py, returns list of findings.
    """
    findings = []
    target_dir = Path(target_path).resolve()

    if not target_dir.exists():
        return findings

    java_files = []
    if target_dir.is_file() and target_dir.suffix == ".java":
        java_files.append(target_dir)
    else:
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                if f.endswith(".java"):
                    java_files.append(Path(root) / f)

    seen_findings = set()
    for java_file in java_files:
        rel_path = str(java_file.relative_to(target_dir) if java_file.is_relative_to(target_dir) else java_file)
        try:
            with open(java_file, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
        except Exception:
            continue

        for idx, line_content in enumerate(lines):
            line_str = line_content.strip()
            if not line_str or line_str.startswith("//") or line_str.startswith("/*") or line_str.startswith("*"):
                continue

            for sig in SIGNATURES:
                java_pattern = sig.get("java_pattern")
                if not java_pattern:
                    continue

                if re.search(java_pattern, line_str, re.IGNORECASE):
                    key_size = _extract_java_keysize(lines, idx, sig["algorithm"])
                    
                    if sig["algorithm"] == "RSA" and key_size and key_size >= 2048:
                        continue

                    dedup_key = (rel_path, idx + 1, sig["algorithm"])
                    if dedup_key in seen_findings:
                        continue
                    seen_findings.add(dedup_key)

                    finding = create_finding(
                        algorithm=sig["algorithm"],
                        file=rel_path,
                        line=idx + 1,
                        artifact_type="source_code",
                        language="java",
                        detected_pattern=sig["id"],
                        original_code=line_str,
                        key_size=key_size,
                    )
                    findings.append(finding)

    return findings



if __name__ == "__main__":
    import sys
    print(scan_java(sys.argv[1] if len(sys.argv) > 1 else "."))


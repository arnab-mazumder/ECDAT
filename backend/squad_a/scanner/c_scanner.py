"""
C / C++ scanner.
Detects weak crypto usage in .c, .cpp, .cc, .h, .hpp files via regex
against the shared signatures list (c_pattern).
Targets OpenSSL legacy API calls (MD5_Init, RSA_generate_key, DES_*, etc.)
and EVP interface misuse.
"""

import os
import re
from pathlib import Path
from squad_a.config import IGNORE_SCAN_DIRS
from squad_a.scanner.signatures import SIGNATURES
from squad_a.schema import create_finding

IGNORE_DIRS = IGNORE_SCAN_DIRS

EXTENSIONS = {".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".hxx"}


def scan_c(target_path: str) -> list[dict]:
    """
    Walks target_path recursively, finds C/C++ files, detects weak
    crypto OpenSSL API calls via regex, returns findings matching schema.
    """
    findings = []
    target_dir = Path(target_path).resolve()

    if not target_dir.exists():
        return findings

    c_files = []
    if target_dir.is_file() and target_dir.suffix in EXTENSIONS:
        c_files.append(target_dir)
    else:
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                if Path(f).suffix in EXTENSIONS:
                    c_files.append(Path(root) / f)

    seen_findings: set = set()

    for c_file in c_files:
        rel_path = str(
            c_file.relative_to(target_dir)
            if c_file.is_relative_to(target_dir)
            else c_file
        ).replace("\\", "/")

        try:
            with open(c_file, "r", encoding="utf-8", errors="ignore") as fh:
                lines = fh.readlines()
        except Exception:
            continue

        for idx, raw_line in enumerate(lines, start=1):
            line_str = raw_line.strip()
            # Skip blank lines and C/C++ comments
            if not line_str or line_str.startswith("//") or line_str.startswith("*"):
                continue

            for sig in SIGNATURES:
                pattern = sig.get("c_pattern")
                if not pattern:
                    continue
                if re.search(pattern, line_str):
                    dedup = (rel_path, idx, sig["algorithm"])
                    if dedup in seen_findings:
                        continue
                    seen_findings.add(dedup)

                    ext = c_file.suffix.lstrip(".")
                    language = "cpp" if ext in ("cpp", "cc", "cxx", "hpp", "hxx") else "c"
                    findings.append(create_finding(
                        algorithm=sig["algorithm"],
                        file=rel_path,
                        line=idx,
                        artifact_type="source_code",
                        language=language,
                        detected_pattern=sig["id"],
                        original_code=line_str,
                    ))

    return findings


if __name__ == "__main__":
    import sys, json
    print(json.dumps(scan_c(sys.argv[1] if len(sys.argv) > 1 else "."), indent=2))

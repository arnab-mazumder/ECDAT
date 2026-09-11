"""
Go scanner.
Detects weak crypto usage in .go files via regex against the shared
signatures list (go_pattern). Also flags deprecated import paths directly.
"""

import os
import re
from pathlib import Path
from squad_a.config import IGNORE_SCAN_DIRS
from squad_a.scanner.signatures import SIGNATURES
from squad_a.schema import create_finding

IGNORE_DIRS = IGNORE_SCAN_DIRS

# Import-level patterns: if the file imports these packages, flag the import line.
WEAK_IMPORTS = {
    '"crypto/md5"':    ("MD5",      "hashing"),
    '"crypto/sha1"':   ("SHA1",     "hashing"),
    '"crypto/des"':    ("DES",      "symmetric"),
    '"crypto/rc4"':    ("RC4",      "symmetric"),
    '"crypto/rsa"':    ("RSA",      "asymmetric"),
    '"crypto/ecdsa"':  ("ECDSA",    "asymmetric"),
}


def scan_go(target_path: str) -> list[dict]:
    """
    Walks target_path recursively, finds .go files, detects weak crypto
    via regex and import analysis, returns findings matching schema.
    """
    findings = []
    target_dir = Path(target_path).resolve()

    if not target_dir.exists():
        return findings

    go_files = []
    if target_dir.is_file() and target_dir.suffix == ".go":
        go_files.append(target_dir)
    else:
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                if f.endswith(".go"):
                    go_files.append(Path(root) / f)

    seen_findings: set = set()

    for go_file in go_files:
        rel_path = str(
            go_file.relative_to(target_dir)
            if go_file.is_relative_to(target_dir)
            else go_file
        ).replace("\\", "/")

        try:
            with open(go_file, "r", encoding="utf-8", errors="ignore") as fh:
                lines = fh.readlines()
        except Exception:
            continue

        for idx, raw_line in enumerate(lines, start=1):
            line_str = raw_line.strip()
            if not line_str or line_str.startswith("//"):
                continue

            # Check import-level weak package detection
            for import_str, (algo, _) in WEAK_IMPORTS.items():
                if import_str in line_str:
                    dedup = (rel_path, idx, algo)
                    if dedup not in seen_findings:
                        seen_findings.add(dedup)
                        findings.append(create_finding(
                            algorithm=algo,
                            file=rel_path,
                            line=idx,
                            artifact_type="source_code",
                            language="go",
                            detected_pattern=f"import {import_str}",
                            original_code=line_str,
                        ))

            # Check call-site patterns from signatures
            for sig in SIGNATURES:
                pattern = sig.get("go_pattern")
                if not pattern:
                    continue
                if re.search(pattern, line_str):
                    dedup = (rel_path, idx, sig["algorithm"])
                    if dedup in seen_findings:
                        continue
                    seen_findings.add(dedup)
                    findings.append(create_finding(
                        algorithm=sig["algorithm"],
                        file=rel_path,
                        line=idx,
                        artifact_type="source_code",
                        language="go",
                        detected_pattern=sig["id"],
                        original_code=line_str,
                    ))

    return findings


if __name__ == "__main__":
    import sys, json
    print(json.dumps(scan_go(sys.argv[1] if len(sys.argv) > 1 else "."), indent=2))

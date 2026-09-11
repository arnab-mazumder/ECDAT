"""
JavaScript / TypeScript scanner.
Detects weak crypto usage in .js, .jsx, .ts, .tsx files via regex
against the shared signatures list. Uses line-by-line scanning
(no AST — JS AST parsers are not available in pure Python without
additional dependencies).
"""

import os
import re
from pathlib import Path
from squad_a.config import IGNORE_SCAN_DIRS
from squad_a.scanner.signatures import SIGNATURES
from squad_a.schema import create_finding

IGNORE_DIRS = IGNORE_SCAN_DIRS

EXTENSIONS = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"}


def scan_js(target_path: str) -> list[dict]:
    """
    Walks target_path recursively, finds JS/TS files, detects weak crypto
    via regex against signatures.js_pattern, returns findings matching schema.
    """
    findings = []
    target_dir = Path(target_path).resolve()

    if not target_dir.exists():
        return findings

    js_files = []
    if target_dir.is_file() and target_dir.suffix in EXTENSIONS:
        js_files.append(target_dir)
    else:
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                if Path(f).suffix in EXTENSIONS:
                    js_files.append(Path(root) / f)

    seen_findings: set = set()

    for js_file in js_files:
        rel_path = str(
            js_file.relative_to(target_dir)
            if js_file.is_relative_to(target_dir)
            else js_file
        ).replace("\\", "/")

        try:
            with open(js_file, "r", encoding="utf-8", errors="ignore") as fh:
                lines = fh.readlines()
        except Exception:
            continue

        for idx, raw_line in enumerate(lines, start=1):
            line_str = raw_line.strip()
            # Skip blank lines and single-line comments
            if not line_str or line_str.startswith("//") or line_str.startswith("*"):
                continue

            for sig in SIGNATURES:
                pattern = sig.get("js_pattern")
                if not pattern:
                    continue
                if re.search(pattern, line_str, re.IGNORECASE):
                    dedup = (rel_path, idx, sig["algorithm"])
                    if dedup in seen_findings:
                        continue
                    seen_findings.add(dedup)

                    language = "typescript" if js_file.suffix in (".ts", ".tsx") else "javascript"
                    finding = create_finding(
                        algorithm=sig["algorithm"],
                        file=rel_path,
                        line=idx,
                        artifact_type="source_code",
                        language=language,
                        detected_pattern=sig["id"],
                        original_code=line_str,
                    )
                    findings.append(finding)

    return findings


if __name__ == "__main__":
    import sys, json
    print(json.dumps(scan_js(sys.argv[1] if len(sys.argv) > 1 else "."), indent=2))

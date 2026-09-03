"""
PERSON 1 owns this file.
AST-based and pattern-based detection of weak crypto usage in Python source files.
"""

import os
import ast
import re
from pathlib import Path
from squad_a.scanner.signatures import SIGNATURES
from squad_a.schema import create_finding


IGNORE_DIRS = {".git", "venv", ".venv", "node_modules", "__pycache__", ".pytest_cache", ".gemini", "brain"}


def _extract_keysize_from_line(line: str, algorithm: str) -> int | None:
    """Helper to extract key size numbers from Python crypto calls like RSA.generate(1024)."""
    if algorithm == "RSA":
        match = re.search(r"(?:generate|newkeys)\s*\(\s*(\d+)", line)
        if match:
            return int(match.group(1))
    elif algorithm == "ECDSA":
        match = re.search(r"secp(\d+)|prime(\d+)", line)
        if match:
            return int(match.group(1) or match.group(2))
    return None


def scan_python(target_path: str) -> list[dict]:
    """
    Walks target_path recursively, finds .py files, detects crypto API usage
    matching signatures.py, returns list of findings matching schema.py.
    """
    findings = []
    target_dir = Path(target_path).resolve()

    if not target_dir.exists():
        return findings

    py_files = []
    if target_dir.is_file() and target_dir.suffix == ".py":
        py_files.append(target_dir)
    else:
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                if f.endswith(".py"):
                    py_files.append(Path(root) / f)

    seen_findings = set()
    for py_file in py_files:
        rel_path = str(py_file.relative_to(target_dir) if py_file.is_relative_to(target_dir) else py_file)
        try:
            with open(py_file, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
        except Exception:
            continue

        file_content = "".join(lines)
        
        # Try AST parsing first for syntactic detection
        try:
            tree = ast.parse(file_content, filename=str(py_file))
            for node in ast.walk(tree):
                lineno = getattr(node, "lineno", None)
                if not lineno or lineno > len(lines):
                    continue
                code_line = lines[lineno - 1].strip()

                for sig in SIGNATURES:
                    py_pattern = sig.get("python_pattern")
                    if not py_pattern:
                        continue
                    
                    if re.search(py_pattern, code_line):
                        key_size = _extract_keysize_from_line(code_line, sig["algorithm"])
                        
                        # Filter out safe RSA keys (>= 2048) if explicitly specified
                        if sig["algorithm"] == "RSA" and key_size and key_size >= 2048:
                            continue

                        dedup_key = (rel_path, lineno, sig["algorithm"])
                        if dedup_key in seen_findings:
                            continue
                        seen_findings.add(dedup_key)

                        finding = create_finding(
                            algorithm=sig["algorithm"],
                            file=rel_path,
                            line=lineno,
                            artifact_type="source_code",
                            language="python",
                            detected_pattern=sig["id"],
                            original_code=code_line,
                            key_size=key_size,
                        )
                        findings.append(finding)
        except SyntaxError:
            pass  # Fall back to line regex scanning below if AST parse fails

        # Line-by-line fallback regex scanning
        for idx, line_content in enumerate(lines, start=1):
            line_str = line_content.strip()
            if not line_str or line_str.startswith("#"):
                continue

            for sig in SIGNATURES:
                py_pattern = sig.get("python_pattern")
                if not py_pattern:
                    continue

                if re.search(py_pattern, line_str):
                    key_size = _extract_keysize_from_line(line_str, sig["algorithm"])
                    if sig["algorithm"] == "RSA" and key_size and key_size >= 2048:
                        continue

                    dedup_key = (rel_path, idx, sig["algorithm"])
                    if dedup_key in seen_findings:
                        continue
                    seen_findings.add(dedup_key)

                    finding = create_finding(
                        algorithm=sig["algorithm"],
                        file=rel_path,
                        line=idx,
                        artifact_type="source_code",
                        language="python",
                        detected_pattern=sig["id"],
                        original_code=line_str,
                        key_size=key_size,
                    )
                    findings.append(finding)

    return findings



if __name__ == "__main__":
    import sys
    print(scan_python(sys.argv[1] if len(sys.argv) > 1 else "."))


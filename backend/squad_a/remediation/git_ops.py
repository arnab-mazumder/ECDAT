"""
Git workspace & patching operations engine.
Clones repository, checks out isolated remediation branch ecdat/pqc-fix-<hash>,
applies line-exact AST code replacements with line drift protection, runs patch validation,
and commits clean git diffs.
"""

import os
import re
import shutil
import hashlib
import subprocess
from typing import List, Dict, Any, Tuple

from squad_a.remediation.patch_validator import validate_patched_file


def _get_git_executable() -> str:
    """Finds system git executable."""
    git_bin = shutil.which("git")
    if not git_bin and os.name == "nt":
        candidate = os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"), "Git", "cmd", "git.exe")
        if os.path.isfile(candidate):
            return candidate
    return git_bin or "git"


def generate_branch_name(findings: List[Dict[str, Any]], prefix: str = "ecdat/pqc-fix") -> str:
    """Generates a deterministic short hash branch name."""
    raw_str = "-".join(sorted([f.get("id", str(idx)) for idx, f in enumerate(findings)]))
    short_hash = hashlib.sha256(raw_str.encode("utf-8")).hexdigest()[:8]
    return f"{prefix}-{short_hash}"


def apply_finding_patches(
    repo_dir: str,
    findings: List[Dict[str, Any]],
    branch_name: str,
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Applies PQC fixes to repo_dir on branch_name.

    Returns:
        (results, committed_files)
        results: list of {"finding_id": str, "status": "fixed" | "failed", "error": str | None}
    """
    git_bin = _get_git_executable()

    # 1. Checkout new isolated branch (use -B to force reset if exists)
    subprocess.run([git_bin, "checkout", "-B", branch_name], cwd=repo_dir, capture_output=True, text=True, check=True)

    results: List[Dict[str, Any]] = []
    modified_files: set[str] = set()

    for f in findings:
        fid = f.get("id", f"{f.get('file')}:{f.get('line')}")
        rel_file = f.get("file", "").replace("\\", "/")
        target_line = f.get("line", 1)
        suggested_fix = f.get("suggested_fix") or f.get("replacement_code") or ""

        if not rel_file or not suggested_fix:
            results.append({
                "finding_id": fid,
                "status": "failed",
                "error": "Missing target file path or suggested fix code.",
                "file": rel_file,
                "line": target_line,
            })
            continue

        abs_file = os.path.join(repo_dir, rel_file)
        if not os.path.isfile(abs_file):
            results.append({
                "finding_id": fid,
                "status": "failed",
                "error": f"Target file not found in repository: {rel_file}",
                "file": rel_file,
                "line": target_line,
            })
            continue

        # Read file contents
        try:
            with open(abs_file, "r", encoding="utf-8", errors="replace") as fh:
                file_lines = fh.readlines()
        except Exception as exc:
            results.append({
                "finding_id": fid,
                "status": "failed",
                "error": f"Failed reading file: {str(exc)}",
                "file": rel_file,
                "line": target_line,
            })
            continue

        # Line-drift check & exact replacement
        line_idx = target_line - 1
        applied = False
        error_reason = None

        # Check if line_idx is within range
        if 0 <= line_idx < len(file_lines):
            curr_line = file_lines[line_idx]

            # If original snippet specified, check for drift
            if original_snippet and original_snippet.strip() not in curr_line:
                # Search +/- 5 lines for drift window
                found_idx = None
                for offset in range(-5, 6):
                    check_idx = line_idx + offset
                    if 0 <= check_idx < len(file_lines):
                        if original_snippet.strip() in file_lines[check_idx]:
                            found_idx = check_idx
                            break

                if found_idx is not None:
                    line_idx = found_idx
                    curr_line = file_lines[line_idx]
                else:
                    error_reason = (
                        f"Code drift detected: line L{target_line} content ('{curr_line.strip()[:40]}') "
                        f"does not match scan pattern ('{original_snippet.strip()[:40]}')."
                    )

        else:
            error_reason = f"Target line L{target_line} is out of bounds (file has {len(file_lines)} lines)."

        if error_reason:
            results.append({
                "finding_id": fid,
                "status": "failed",
                "error": error_reason,
                "file": rel_file,
                "line": target_line,
            })
            continue

        # Backup current file before mutating
        with open(abs_file + ".bak", "w", encoding="utf-8") as bak:
            bak.writelines(file_lines)

        # Replace line with suggested fix
        indent = len(file_lines[line_idx]) - len(file_lines[line_idx].lstrip())
        indent_str = file_lines[line_idx][:indent]

        # Format replacement fix with preserved indentation
        fix_lines = [
            (indent_str + l if l.strip() else l) + ("\n" if not l.endswith("\n") else "")
            for l in suggested_fix.splitlines()
        ]
        if not fix_lines:
            fix_lines = [indent_str + suggested_fix + "\n"]

        file_lines[line_idx : line_idx + 1] = fix_lines

        # Write mutated file
        try:
            with open(abs_file, "w", encoding="utf-8") as fh:
                fh.writelines(file_lines)
        except Exception as exc:
            # Restore backup
            shutil.move(abs_file + ".bak", abs_file)
            results.append({
                "finding_id": fid,
                "status": "failed",
                "error": f"Failed writing file patch: {str(exc)}",
                "file": rel_file,
                "line": target_line,
            })
            continue

        # Run patch_validator on mutated file
        val_res = validate_patched_file(abs_file)
        if not val_res["valid"]:
            # Revert from backup
            shutil.move(abs_file + ".bak", abs_file)
            results.append({
                "finding_id": fid,
                "status": "failed",
                "error": f"Patch failed syntax validation ({val_res['checker']}): {val_res['error']}",
                "file": rel_file,
                "line": target_line,
            })
            continue

        # Clean backup file
        if os.path.exists(abs_file + ".bak"):
            os.remove(abs_file + ".bak")

        modified_files.add(rel_file)
        results.append({
            "finding_id": fid,
            "status": "fixed",
            "error": None,
            "file": rel_file,
            "line": target_line,
        })

    # Commit changes if any files modified
    committed: List[str] = list(modified_files)
    if committed:
        subprocess.run([git_bin, "add"] + committed, cwd=repo_dir, capture_output=True, text=True, check=True)
        commit_msg = f"refactor(pqc): ECDAT automated remediation patch for {len(committed)} file(s)"
        subprocess.run([git_bin, "commit", "-m", commit_msg], cwd=repo_dir, capture_output=True, text=True, check=True)

    return results, committed

"""
CLI bridge script for ECDAT analysis, CBOM generation, and auto-remediation PR creation.
Commands: scan | scan_zip | scan_github | cbom | remediate
"""

import sys
import os
import json
import traceback

# Ensure backend root is on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from squad_a.pipeline import run_pipeline, run_pipeline_from_github, recalculate_readiness
from squad_a.cbom_exporter import export_to_cyclonedx_json
from squad_a.remediation.git_ops import apply_finding_patches, generate_branch_name
from squad_a.remediation.pr_description import generate_pr_content
from squad_a.remediation.github_client import create_github_pull_request


def handle_remediate(repo_url=None, target_path=None, findings_json="[]", grouping="per_file", github_token=None):
    """CLI handler for auto-remediation PR generation."""
    try:
        findings = json.loads(findings_json) if isinstance(findings_json, str) else findings_json
    except Exception:
        findings = []

    if not findings and target_path and os.path.exists(target_path):
        res = run_pipeline(target_path)
        findings = res.get("findings", [])

    if not findings:
        return {"error": "No findings available to remediate."}

    work_dir = target_path or current_dir
    branch_name = generate_branch_name(findings)

    results, committed = apply_finding_patches(work_dir, findings, branch_name)
    pr_content = generate_pr_content(findings, grouping=grouping)

    pr_res = create_github_pull_request(
        repo_dir=work_dir,
        github_url=repo_url or "https://github.com/ecdat-demo/target-repo",
        branch_name=branch_name,
        title=pr_content["title"],
        body=pr_content["body"],
        github_token=github_token,
    )

    return {
        "status": "success",
        "branch": branch_name,
        "results": results,
        "committed_files": committed,
        "pr": pr_res,
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    cmd = sys.argv[1]

    try:
        if cmd == "scan":
            target = sys.argv[2] if len(sys.argv) > 2 else "."
            res = run_pipeline(target)
            print(json.dumps(res))

        elif cmd == "scan_github":
            url = sys.argv[2]
            res = run_pipeline_from_github(url)
            print(json.dumps(res))

        elif cmd == "cbom":
            target = sys.argv[2] if len(sys.argv) > 2 else "."
            res = run_pipeline(target)
            print(export_to_cyclonedx_json(res))

        elif cmd == "remediate":
            repo_url = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2].startswith("http") else None
            path = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("http") else (sys.argv[3] if len(sys.argv) > 3 else None)
            findings_str = sys.argv[4] if len(sys.argv) > 4 else "[]"
            res = handle_remediate(repo_url=repo_url, target_path=path, findings_json=findings_str)
            print(json.dumps(res))

        else:
            print(json.dumps({"error": f"Unknown command: {cmd}"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc(),
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()

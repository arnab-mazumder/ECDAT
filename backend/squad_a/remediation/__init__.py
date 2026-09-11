"""
ECDAT Squad A — Auto-Remediation Engine Package.
Handles automated code patch application, syntax validation,
Git operations, and GitHub Pull Request (PR) generation.
"""

from squad_a.remediation.patch_validator import validate_patched_file
from squad_a.remediation.pr_description import generate_pr_content
from squad_a.remediation.git_ops import apply_finding_patches
from squad_a.remediation.github_client import create_github_pull_request, parse_github_repo_info

__all__ = [
    "validate_patched_file",
    "generate_pr_content",
    "apply_finding_patches",
    "create_github_pull_request",
    "parse_github_repo_info",
]

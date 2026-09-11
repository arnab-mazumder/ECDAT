"""
Integration & Unit Test Suite for ECDAT Auto-Remediation Engine.
Verifies git branch creation, line-exact patching, patch validation,
and PR title/body generation against a local repository.
"""

import os
import sys
import shutil
import tempfile
import unittest
import subprocess

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from squad_a.remediation.patch_validator import validate_patched_file
from squad_a.remediation.pr_description import generate_pr_content
from squad_a.remediation.git_ops import apply_finding_patches, generate_branch_name
from squad_a.remediation.github_client import parse_github_repo_info, create_github_pull_request


class TestRemediationEngine(unittest.TestCase):

    def setUp(self):
        """Create a temporary git repository with sample vulnerable files."""
        self.temp_dir = tempfile.mkdtemp(prefix="test_ecdat_rem_")
        self.git_bin = shutil.which("git") or "git"

        # Init git repo
        subprocess.run([self.git_bin, "init"], cwd=self.temp_dir, capture_output=True, check=True)
        subprocess.run([self.git_bin, "config", "user.name", "Test Runner"], cwd=self.temp_dir, capture_output=True)
        subprocess.run([self.git_bin, "config", "user.email", "test@ecdat.local"], cwd=self.temp_dir, capture_output=True)

        # Write sample Python file
        self.py_file = os.path.join(self.temp_dir, "crypto_service.py")
        with open(self.py_file, "w", encoding="utf-8") as f:
            f.write(
                "import hashlib\n"
                "\n"
                "def hash_password(data):\n"
                "    return hashlib.md5(data.encode()).hexdigest()\n"
            )

        subprocess.run([self.git_bin, "add", "."], cwd=self.temp_dir, capture_output=True, check=True)
        subprocess.run([self.git_bin, "commit", "-m", "Initial commit"], cwd=self.temp_dir, capture_output=True, check=True)

        self.sample_finding = {
            "id": "finding-test-001",
            "file": "crypto_service.py",
            "line": 4,
            "original_snippet": "return hashlib.md5(data.encode()).hexdigest()",
            "suggested_fix": "return hashlib.sha256(data.encode()).hexdigest()",
            "algorithm": "MD5",
            "key_size": None,
            "risk_score": 85,
            "risk_bucket": "High",
            "recommendation": "Migrate to SHA-256",
            "recommendation_standard": "NIST FIPS 180-4",
            "artifact_type": "source_code",
        }

    def tearDown(self):
        """Cleanup temporary repo."""
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_parse_github_repo_info(self):
        """Test URL parsing for HTTPS and SSH URLs."""
        owner, repo = parse_github_repo_info("https://github.com/spring-projects/spring-security.git")
        self.assertEqual(owner, "spring-projects")
        self.assertEqual(repo, "spring-security")

        owner, repo = parse_github_repo_info("git@github.com:keycloak/keycloak")
        self.assertEqual(owner, "keycloak")
        self.assertEqual(repo, "keycloak")

    def test_patch_validator(self):
        """Test syntax validation on valid and invalid Python files."""
        res = validate_patched_file(self.py_file)
        self.assertTrue(res["valid"])

        # Create broken python file
        broken_file = os.path.join(self.temp_dir, "broken.py")
        with open(broken_file, "w", encoding="utf-8") as f:
            f.write("def invalid_syntax(:\n")

        res_broken = validate_patched_file(broken_file)
        self.assertFalse(res_broken["valid"])
        self.assertIn("syntax", res_broken["error"].lower())

    def test_apply_finding_patches_and_git(self):
        """Test line-exact patching, branch creation, and git commit creation."""
        branch_name = generate_branch_name([self.sample_finding])
        self.assertTrue(branch_name.startswith("ecdat/pqc-fix-"))

        results, committed = apply_finding_patches(self.temp_dir, [self.sample_finding], branch_name)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], "fixed")
        self.assertIn("crypto_service.py", committed)

        # Read mutated file and verify replacement
        with open(self.py_file, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("hashlib.sha256", content)
        self.assertNotIn("hashlib.md5", content)

    def test_generate_pr_content(self):
        """Test PR title and Markdown body generation."""
        pr = generate_pr_content([self.sample_finding])
        self.assertIn("MD5", pr["title"])
        self.assertIn("NIST Post-Quantum Standards", pr["body"])
        self.assertIn("Mosca Risk Reduction Metrics", pr["body"])
        self.assertIn("`crypto_service.py`", pr["body"])

    def test_create_github_pull_request_mock(self):
        """Test mock PR creation."""
        pr = create_github_pull_request(
            repo_dir=self.temp_dir,
            github_url="https://github.com/test-org/test-repo",
            branch_name="ecdat/pqc-fix-test",
            title="Test PR",
            body="Test Body",
        )
        self.assertTrue(pr["mock"])
        self.assertIn("https://github.com/test-org/test-repo/pull/", pr["pr_url"])


if __name__ == "__main__":
    unittest.main()

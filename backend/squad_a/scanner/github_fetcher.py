"""
PERSON 1 owns this file. WOW-FACTOR feature.
Clones a public GitHub repo into a temp dir, enforces safety caps,
hands off to python_scanner + java_scanner.

Squad B's backend calls this indirectly via pipeline.run_pipeline_from_github()
for the live-URL demo feature — don't expose this directly to Squad B.
"""

import os
import re
import shutil
import subprocess
import tempfile
from contextlib import contextmanager

from squad_a.config import MAX_REPO_FILE_COUNT, MAX_REPO_SIZE_MB, CLONE_DEPTH


@contextmanager
def clone_and_get_path(url: str):
    """
    Context manager: clones url into a temp dir, yields the path,
    cleans up automatically on exit.
    """
    url = url.strip()
    # Basic URL validation
    if not (url.startswith("http://") or url.startswith("https://") or url.startswith("git@")):
        raise ValueError(f"Invalid repository URL format: '{url}'")

    temp_dir = tempfile.mkdtemp(prefix="ecdat_repo_")
    try:
        # Clone shallowly
        cmd = ["git", "clone", "--depth", str(CLONE_DEPTH), url, temp_dir]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=60)
        
        if result.returncode != 0:
            raise RuntimeError(f"Git clone failed: {result.stderr.strip() or result.stdout.strip()}")

        # Enforce safety limits
        total_files = 0
        total_size_bytes = 0
        for root, _, files in os.walk(temp_dir):
            total_files += len(files)
            for f in files:
                try:
                    fp = os.path.join(root, f)
                    if not os.path.islink(fp):
                        total_size_bytes += os.path.getsize(fp)
                except Exception:
                    pass

        size_mb = total_size_bytes / (1024 * 1024)
        if total_files > MAX_REPO_FILE_COUNT:
            raise ValueError(f"Repository exceeds file limit ({total_files} > {MAX_REPO_FILE_COUNT})")
        if size_mb > MAX_REPO_SIZE_MB:
            raise ValueError(f"Repository exceeds size limit ({size_mb:.1f}MB > {MAX_REPO_SIZE_MB}MB)")

        yield temp_dir
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        with clone_and_get_path(sys.argv[1]) as path:
            print(f"Cloned successfully to {path}")


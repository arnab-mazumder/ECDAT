"""
PERSON 2 owns this file.
File-type detection helpers for certificate/key artifact scanning.
"""

import os
from pathlib import Path

from squad_a.config import IGNORE_SCAN_DIRS

CERT_EXTENSIONS = {".pem", ".key", ".crt", ".cer", ".jks", ".p12"}
IGNORE_DIRS = IGNORE_SCAN_DIRS


def find_cert_files(target_path: str) -> list[str]:
    """
    Walks target_path recursively, returns list of file paths matching
    CERT_EXTENSIONS.
    """
    target_dir = Path(target_path).resolve()
    if not target_dir.exists():
        return []

    cert_files = []
    if target_dir.is_file():
        if target_dir.suffix.lower() in CERT_EXTENSIONS:
            cert_files.append(str(target_dir))
    else:
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                ext = Path(f).suffix.lower()
                if ext in CERT_EXTENSIONS:
                    cert_files.append(str(Path(root) / f))

    return cert_files


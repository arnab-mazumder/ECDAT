"""
Config / infrastructure file scanner.
Detects weak crypto settings in:
  - .env, .env.*, *.properties (key=value pairs)
  - *.yaml, *.yml (YAML config)
  - *.toml (TOML config)
  - Dockerfile, docker-compose.yml
  - *.conf, *.cfg, *.ini, *.xml (generic config)

Uses config_pattern from signatures.py plus a set of
infrastructure-specific patterns for common DevOps config keys.
"""

import os
import re
from pathlib import Path
from squad_a.config import IGNORE_SCAN_DIRS
from squad_a.scanner.signatures import SIGNATURES
from squad_a.schema import create_finding

IGNORE_DIRS = IGNORE_SCAN_DIRS

# Filenames (exact match, case-insensitive)
CONFIG_FILENAMES = {
    "dockerfile", "docker-compose.yml", "docker-compose.yaml",
    ".env", ".env.local", ".env.production", ".env.development",
    "nginx.conf", "apache2.conf", "httpd.conf", "sshd_config",
}

# Extensions
CONFIG_EXTENSIONS = {
    ".env", ".properties", ".yaml", ".yml", ".toml",
    ".conf", ".cfg", ".ini", ".xml",
}

# Infrastructure-specific patterns (key=value style, not caught by SIGNATURES)
INFRA_PATTERNS = [
    {
        "pattern": r"(?i)SSL_PROTOCOL\s*[=:]\s*['\"]?(?:SSLv3|TLSv1(?:\.1)?)['\"]?",
        "algorithm": "TLS 1.0/1.1",
        "id": "SSLv3_TLS10_11",
    },
    {
        "pattern": r"(?i)(?:RSA_KEY_SIZE|KEY_LENGTH|KEY_SIZE)\s*[=:]\s*['\"]?(?:512|1024)['\"]?",
        "algorithm": "RSA",
        "id": "RSA",
    },
    {
        "pattern": r"(?i)(?:HASH_ALGO|HASH_ALGORITHM|DIGEST)\s*[=:]\s*['\"]?(?:md5|sha1)['\"]?",
        "algorithm": "MD5",
        "id": "MD5",
    },
    {
        "pattern": r"(?i)(?:CIPHER|CIPHER_SUITE|ENCRYPTION_ALGO)\s*[=:]\s*['\"]?(?:DES|3DES|RC4|DESede)['\"]?",
        "algorithm": "DES",
        "id": "DES",
    },
    # Dockerfile: old OpenSSL versions
    {
        "pattern": r"(?:FROM|apt-get install|apk add).*openssl[- ]?1\.[01]\.",
        "algorithm": "TLS 1.0/1.1",
        "id": "OLD_OPENSSL",
    },
    # SSH config weak MACs/ciphers
    {
        "pattern": r"MACs\s+.*(?:hmac-md5|hmac-sha1)\b|Ciphers\s+.*(?:3des-cbc|arcfour|blowfish)",
        "algorithm": "MD5",
        "id": "SSH_WEAK_MAC",
    },
]


def _is_config_file(filepath: Path) -> bool:
    name_lower = filepath.name.lower()
    if name_lower in CONFIG_FILENAMES:
        return True
    if filepath.suffix.lower() in CONFIG_EXTENSIONS:
        return True
    # .env.* variants
    if name_lower.startswith(".env"):
        return True
    return False


def scan_config(target_path: str) -> list[dict]:
    """
    Walks target_path recursively, finds config/infrastructure files,
    detects weak crypto settings via regex, returns findings matching schema.
    """
    findings = []
    target_dir = Path(target_path).resolve()

    if not target_dir.exists():
        return findings

    config_files = []
    if target_dir.is_file() and _is_config_file(target_dir):
        config_files.append(target_dir)
    else:
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                fp = Path(root) / f
                if _is_config_file(fp):
                    config_files.append(fp)

    seen_findings: set = set()

    for cfg_file in config_files:
        rel_path = str(
            cfg_file.relative_to(target_dir)
            if cfg_file.is_relative_to(target_dir)
            else cfg_file
        ).replace("\\", "/")

        try:
            with open(cfg_file, "r", encoding="utf-8", errors="ignore") as fh:
                lines = fh.readlines()
        except Exception:
            continue

        for idx, raw_line in enumerate(lines, start=1):
            line_str = raw_line.strip()
            if not line_str or line_str.startswith("#") or line_str.startswith(";"):
                continue

            # Check signatures config_pattern
            for sig in SIGNATURES:
                pattern = sig.get("config_pattern")
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
                        artifact_type="config",
                        language="config",
                        detected_pattern=sig["id"],
                        original_code=line_str,
                    ))

            # Check infrastructure-specific patterns
            for infra in INFRA_PATTERNS:
                if re.search(infra["pattern"], line_str):
                    dedup = (rel_path, idx, infra["algorithm"])
                    if dedup in seen_findings:
                        continue
                    seen_findings.add(dedup)
                    findings.append(create_finding(
                        algorithm=infra["algorithm"],
                        file=rel_path,
                        line=idx,
                        artifact_type="config",
                        language="config",
                        detected_pattern=infra["id"],
                        original_code=line_str,
                    ))

    return findings


if __name__ == "__main__":
    import sys, json
    print(json.dumps(scan_config(sys.argv[1] if len(sys.argv) > 1 else "."), indent=2))

"""
PERSON 2 owns this file.
Core Mosca's algorithm risk scoring: risk_gap = (X + Y) - Z
"""

from squad_a.risk_engine.lookup_tables import (
    DATA_LIFETIME, MIGRATION_TIME, QUANTUM_THREAT_HORIZON_YEARS
)


def _determine_data_lifetime(file_path: str, artifact_type: str, algorithm: str = "", snippet: str = "") -> float:
    """Determine X (data retention/lifetime) using path, algorithm, and snippet heuristics."""
    path_lower = file_path.lower()
    algo_upper = algorithm.upper()
    snippet_lower = snippet.lower()
    
    if artifact_type == "certificate" or "cert" in path_lower or "tls" in path_lower or "ssl" in path_lower or ".crt" in path_lower or ".pem" in path_lower:
        return DATA_LIFETIME["tls_cert"]  # 2.0 years

    if any(k in path_lower or k in snippet_lower for k in ("auth", "token", "session", "login", "jwt", "cookie", "oauth")):
        return DATA_LIFETIME["auth_token"]  # 1.0 year
    
    if any(k in path_lower or k in snippet_lower for k in ("pii", "user", "payment", "bank", "account", "financial", "db", "customer", "credit", "ssn")):
        return DATA_LIFETIME["pii_data"]  # 10.0 years

    if any(k in path_lower or k in snippet_lower for k in ("archived", "vault", "permanent", "record", "gov", "backup", "master")):
        return DATA_LIFETIME["long_term_record"]  # 15.0 years

    if "MD5" in algo_upper or "SHA1" in algo_upper or "DES" in algo_upper:
        return 3.0
    if "RSA" in algo_upper or "DSA" in algo_upper:
        return 7.0
    if "ECDSA" in algo_upper or "ECDH" in algo_upper or "ECC" in algo_upper:
        return 5.0

    return DATA_LIFETIME["default"]  # 5.0 years


def _determine_migration_time(file_path: str, artifact_type: str, algorithm: str = "") -> float:
    """Determine Y (migration time in years) based on artifact type and path complexity."""
    if artifact_type == "certificate":
        return MIGRATION_TIME.get("certificate", 1.0)
    elif artifact_type == "embedded" or "firmware" in file_path.lower():
        return MIGRATION_TIME.get("embedded", 2.0)
    elif "core" in file_path.lower() or "legacy" in file_path.lower():
        return 1.5
    else:
        return MIGRATION_TIME.get("source_code", 0.5)


def score_findings(findings: list[dict]) -> list[dict]:
    """
    Takes raw findings, attaches risk_score, risk_bucket, risk_gap_years,
    data_lifetime (X), migration_time (Y), quantum_horizon (Z) to each finding.
    """
    for finding in findings:
        file_path = finding.get("file", "")
        artifact_type = finding.get("artifact_type", "source_code")
        algorithm = finding.get("algorithm", "").upper()
        key_size = finding.get("key_size")
        try:
            key_size = int(key_size) if key_size is not None else None
        except (TypeError, ValueError):
            key_size = None
        snippet = finding.get("original_snippet") or finding.get("original_code") or ""

        # 1. Determine X (Data Lifetime) and Y (Migration Time)
        X = _determine_data_lifetime(file_path, artifact_type, algorithm, snippet)
        Y = _determine_migration_time(file_path, artifact_type, algorithm)
        Z = QUANTUM_THREAT_HORIZON_YEARS

        # 2. Mosca Risk Gap: (X + Y) - Z
        risk_gap = round((X + Y) - Z, 2)
        finding["risk_gap_years"] = risk_gap

        # 3. Base Score Calculation
        if risk_gap > 0:
            quantum_score = 60 + min(40, risk_gap * 8)
        else:
            quantum_score = max(20, 50 + risk_gap * 5)

        # 4. Classical Vulnerability Boost
        classical_boost = 0
        classical_floor = 0
        shor_vulnerable = any(
            family in algorithm
            for family in (
                "RSA", "ECDSA", "ECDH", "ECC", "X25519", "X448",
                "ED25519", "ED448", "DH", "DIFFIE-HELLMAN", "DIFFIEHELLMAN",
            )
        )

        if shor_vulnerable:
            # These public-key families rely on factoring or discrete-log
            # assumptions that Shor's algorithm breaks.
            classical_floor = 80
            if "RSA" in algorithm and key_size and key_size < 1024:
                classical_floor = 100
        elif "MD5" in algorithm:
            # MD5 is practically collision-broken regardless of context.
            classical_floor = 80
        elif any(b in algorithm for b in ("MD5", "DES", "RC4", "SSLV3", "MD2", "MD4", "NULL", "BLOWFISH", "CAST5", "IDEA", "RC2")):
            classical_boost = 30
        elif any(b in algorithm for b in ("SHA1", "3DES", "RIPEMD", "PBE")):
            classical_boost = 20
        elif algorithm == "RSA" and key_size and key_size < 2048:
            classical_boost = 25
        elif algorithm == "ECDSA" and key_size and key_size < 256:
            classical_boost = 25

        total_score = min(100, max(classical_floor, round(quantum_score + classical_boost)))
        finding["risk_score"] = int(total_score)

        # 5. Risk Bucket Assignment
        if total_score >= 80:
            finding["risk_bucket"] = "Critical"
        elif total_score >= 60:
            finding["risk_bucket"] = "High"
        elif total_score >= 40:
            finding["risk_bucket"] = "Medium"
        else:
            finding["risk_bucket"] = "Low"

        # Explicit fields for API & UI consumers
        finding["data_lifetime"] = X
        finding["migration_time"] = Y
        finding["quantum_horizon"] = Z
        finding["required_lifetime"] = round(X + Y, 1)
        finding["_X"] = X
        finding["_Y"] = Y
        finding["_Z"] = Z

    return findings


if __name__ == "__main__":
    test_finding = [{"algorithm": "RSA", "key_size": 1024, "artifact_type": "source_code", "file": "test_auth.py"}]
    print(score_findings(test_finding))


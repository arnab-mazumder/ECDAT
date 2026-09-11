"""
PERSON 2 owns this file.
Core Mosca's algorithm risk scoring: risk_gap = (X + Y) - Z
"""

from squad_a.risk_engine.lookup_tables import (
    DATA_LIFETIME, MIGRATION_TIME, QUANTUM_THREAT_HORIZON_YEARS
)


def _determine_data_lifetime(file_path: str, artifact_type: str) -> float:
    """Determine X (data retention/lifetime) using path heuristics."""
    path_lower = file_path.lower()
    
    if artifact_type == "certificate":
        return DATA_LIFETIME["tls_cert"]

    if any(k in path_lower for k in ("auth", "token", "session", "login")):
        return DATA_LIFETIME["auth_token"]
    
    if any(k in path_lower for k in ("pii", "user", "payment", "bank", "account", "financial", "db", "customer")):
        return DATA_LIFETIME["pii_data"]

    if any(k in path_lower for k in ("archived", "vault", "permanent", "record", "gov")):
        return DATA_LIFETIME["long_term_record"]

    return DATA_LIFETIME["default"]


def score_findings(findings: list[dict]) -> list[dict]:
    """
    Takes raw findings, attaches risk_score, risk_bucket, risk_gap_years
    to each, returns the updated list.
    """
    for finding in findings:
        file_path = finding.get("file", "")
        artifact_type = finding.get("artifact_type", "source_code")
        algorithm = finding.get("algorithm", "").upper()
        key_size = finding.get("key_size")

        # 1. Determine X (Data Lifetime) and Y (Migration Time)
        X = _determine_data_lifetime(file_path, artifact_type)
        Y = MIGRATION_TIME.get(artifact_type, MIGRATION_TIME["source_code"])
        Z = QUANTUM_THREAT_HORIZON_YEARS

        # 2. Mosca Risk Gap: (X + Y) - Z
        risk_gap = round((X + Y) - Z, 2)
        finding["risk_gap_years"] = risk_gap

        # 3. Base Score Calculation
        # If risk_gap > 0, system is already vulnerable today ("harvest now, decrypt later")
        if risk_gap > 0:
            quantum_score = 60 + min(40, risk_gap * 8)
        else:
            # Still quantum vulnerable in the future
            quantum_score = max(20, 50 + risk_gap * 5)

        # 4. Classical Vulnerability Boost
        classical_boost = 0
        if any(b in algorithm for b in ("MD5", "DES", "RC4", "SSLV3", "MD2", "MD4", "NULL", "BLOWFISH", "CAST5", "IDEA", "RC2")):
            classical_boost = 30  # Broken classically or 64-bit key size
        elif any(b in algorithm for b in ("SHA1", "3DES", "RIPEMD", "PBE")):
            classical_boost = 20
        elif algorithm == "RSA" and key_size and key_size < 2048:
            classical_boost = 25
        elif algorithm == "ECDSA" and key_size and key_size < 256:
            classical_boost = 25

        total_score = min(100, round(quantum_score + classical_boost))
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

        # Save metadata for rationale generator
        finding["_X"] = X
        finding["_Y"] = Y
        finding["_Z"] = Z

    return findings


if __name__ == "__main__":
    test_finding = [{"algorithm": "RSA", "key_size": 1024, "artifact_type": "source_code", "file": "test_auth.py"}]
    print(score_findings(test_finding))


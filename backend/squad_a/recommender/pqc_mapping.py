"""
PERSON 3 owns this file.
Static classical -> PQC algorithm mapping, sourced from NIST FIPS 203/204/205.
"""

PQC_MAPPING = {
    "RSA": {
        "replacement": "ML-KEM-768 (Kyber) for Key Exchange / ML-DSA-65 (Dilithium) for Signatures",
        "standard": "NIST FIPS 203 / FIPS 204",
    },
    "ECDSA": {
        "replacement": "ML-DSA-65 (Dilithium) or SLH-DSA-SHA2-128f (SPHINCS+) for High Assurance",
        "standard": "NIST FIPS 204 / FIPS 205",
    },
    "STATIC DH": {
        "replacement": "Hybrid ECDH + ML-KEM-768",
        "standard": "NIST Transitional PQC Guidance",
    },
    "MD5": {
        "replacement": "SHA-256 or SHA-3",
        "standard": "NIST FIPS 180-4 / FIPS 202 (Classical Replacement)",
    },
    "SHA1": {
        "replacement": "SHA-256 or SHA-3",
        "standard": "NIST FIPS 180-4 / FIPS 202 (Classical Replacement)",
    },
    "DES": {
        "replacement": "AES-256-GCM",
        "standard": "NIST FIPS 197 / SP 800-38D (Classical Replacement)",
    },
    "3DES": {
        "replacement": "AES-256-GCM",
        "standard": "NIST FIPS 197 / SP 800-38D (Classical Replacement)",
    },
    "RC4": {
        "replacement": "AES-256-GCM or ChaCha20-Poly1305",
        "standard": "NIST FIPS 197 / RFC 8439 (Classical Replacement)",
    },
    "TLS 1.0/1.1": {
        "replacement": "TLS 1.3 with X25519 + ML-KEM-768 Hybrid Key Exchange",
        "standard": "IETF PQC TLS Guidance",
    },
}


def add_recommendations(findings: list[dict]) -> list[dict]:
    """
    Attaches recommendation + recommendation_standard to each finding.
    Falls back to generic "manual review recommended" if no mapping found.
    """
    for f in findings:
        algo = f.get("algorithm", "").upper()
        mapping = PQC_MAPPING.get(algo)
        
        if not mapping:
            # Check substring matches
            for key, val in PQC_MAPPING.items():
                if key in algo:
                    mapping = val
                    break

        if mapping:
            f["recommendation"] = mapping["replacement"]
            f["recommendation_standard"] = mapping["standard"]
        else:
            f["recommendation"] = "Manual cryptographic architecture review recommended"
            f["recommendation_standard"] = "NIST PQC Migration Framework"

    return findings


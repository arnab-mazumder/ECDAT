"""
Static classical -> PQC algorithm mapping, sourced from NIST FIPS 203/204/205 & SP 800-131A.
"""

PQC_MAPPING = {
    # ── Hashing ─────────────────────────────────────────────────────────────
    "MD5": {
        "replacement": "SHA-256 or SHA-3",
        "standard": "NIST FIPS 180-4 / FIPS 202 (Classical Replacement)",
    },
    "SHA1": {
        "replacement": "SHA-256 or SHA-3",
        "standard": "NIST FIPS 180-4 / FIPS 202 (Classical Replacement)",
    },
    "MD2/MD4": {
        "replacement": "SHA-256, SHA-3, or SHA-512/256",
        "standard": "NIST FIPS 180-4 / FIPS 202 (Classical Replacement)",
    },
    "RIPEMD-160": {
        "replacement": "SHA-256, SHA-3, or SHA-512/256",
        "standard": "NIST FIPS 180-4 / FIPS 202 (Classical Replacement)",
    },
    # ── Symmetric Ciphers ───────────────────────────────────────────────────
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
    "BLOWFISH": {
        "replacement": "AES-256-GCM or ChaCha20-Poly1305",
        "standard": "NIST FIPS 197 / RFC 8439 (Classical Replacement)",
    },
    "CAST5": {
        "replacement": "AES-256-GCM or ChaCha20-Poly1305",
        "standard": "NIST FIPS 197 / RFC 8439 (Classical Replacement)",
    },
    "IDEA": {
        "replacement": "AES-256-GCM or ChaCha20-Poly1305",
        "standard": "NIST FIPS 197 / RFC 8439 (Classical Replacement)",
    },
    "RC2": {
        "replacement": "AES-256-GCM or ChaCha20-Poly1305",
        "standard": "NIST FIPS 197 / RFC 8439 (Classical Replacement)",
    },
    "AES-ECB": {
        "replacement": "AES-256-GCM with unique nonces",
        "standard": "NIST FIPS 197 / SP 800-38D",
    },
    "NULL CIPHER": {
        "replacement": "AES-256-GCM or ChaCha20-Poly1305",
        "standard": "NIST FIPS 197 / SP 800-38D",
    },
    "WEAK PBE": {
        "replacement": "Argon2id or PBKDF2-HMAC-SHA-256 with modern parameter policy",
        "standard": "NIST SP 800-132 / FIPS 180-4 / SP 800-38D",
    },
    # ── Asymmetric Encryption & Signatures ────────────────────────────────────
    "RSA": {
        "replacement": "ML-KEM-768 (Kyber) for Key Exchange / ML-DSA-65 (Dilithium) for Signatures",
        "standard": "NIST FIPS 203 / FIPS 204",
    },
    "ECDSA": {
        "replacement": "ML-DSA-65 (Dilithium) or SLH-DSA-SHA2-128f (SPHINCS+) for High Assurance",
        "standard": "NIST FIPS 204 / FIPS 205",
    },
    "DSA": {
        "replacement": "ML-DSA-65 (Dilithium) or SLH-DSA-SHA2-128f (SPHINCS+)",
        "standard": "NIST FIPS 204 / FIPS 205",
    },
    "ELGAMAL": {
        "replacement": "ML-KEM-768 for key establishment or ML-DSA-65 for signatures",
        "standard": "NIST FIPS 203 / FIPS 204",
    },
    "ED25519/ED448": {
        "replacement": "ML-DSA-65 or SLH-DSA-SHA2-128f",
        "standard": "NIST FIPS 204 / FIPS 205",
    },
    "ECDH/X25519": {
        "replacement": "Hybrid X25519 + ML-KEM-768, then ML-KEM-768",
        "standard": "NIST FIPS 203 / NIST PQC migration guidance",
    },
    "WEAK SIGNATURE": {
        "replacement": "SHA-256/SHA-3 with ML-DSA-65 for quantum-resistant signatures",
        "standard": "NIST FIPS 180-4 / FIPS 202 / FIPS 204",
    },
    # ── Key Exchange & Protocols ─────────────────────────────────────────────
    "STATIC DH": {
        "replacement": "Hybrid ECDH + ML-KEM-768",
        "standard": "NIST Transitional PQC Guidance",
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
                if key in algo or algo in key:
                    mapping = val
                    break

        if mapping:
            f["recommendation"] = mapping["replacement"]
            f["recommendation_standard"] = mapping["standard"]
        else:
            f["recommendation"] = "Manual cryptographic architecture review recommended"
            f["recommendation_standard"] = "NIST PQC Migration Framework"

    return findings

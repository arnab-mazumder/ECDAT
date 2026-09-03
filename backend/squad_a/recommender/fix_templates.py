"""
PERSON 3 owns this file. WOW-FACTOR feature.
Actual before/after code fix snippets for the top 3-4 most common demo findings.
Squad B renders these as a red/green diff in the UI — coordinate field
names with them via schema.py, don't rename without telling them.
"""

FIX_TEMPLATES = {
    "MD5_PYTHON": {
        "pattern": r"hashlib\.md5\(",
        "fix": lambda code: code.replace("hashlib.md5(", "hashlib.sha256(") + "  # Upgraded to SHA-256 (NIST FIPS 180-4)",
    },
    "SHA1_PYTHON": {
        "pattern": r"hashlib\.sha1\(",
        "fix": lambda code: code.replace("hashlib.sha1(", "hashlib.sha256(") + "  # Upgraded to SHA-256 (NIST FIPS 180-4)",
    },
    "RSA_PYTHON": {
        "pattern": r"RSA\.generate\(",
        "fix": lambda code: "# Replace RSA key generation with Post-Quantum ML-KEM\n# from oqs import KeyEncapsulation\n# kem = KeyEncapsulation('Kyber768')  # ML-KEM-768 (NIST FIPS 203)",
    },
    "DES_PYTHON": {
        "pattern": r"Crypto\.Cipher\.DES",
        "fix": lambda code: code.replace("Crypto.Cipher.DES", "Crypto.Cipher.AES") + "  # Upgraded to AES-256-GCM (NIST FIPS 197)",
    },
    "MD5_JAVA": {
        "pattern": r'MessageDigest\.getInstance\(\s*["\']MD5["\']\s*\)',
        "fix": lambda code: 'MessageDigest.getInstance("SHA-256"); // Upgraded to SHA-256 (NIST FIPS 180-4)',
    },
    "SHA1_JAVA": {
        "pattern": r'MessageDigest\.getInstance\(\s*["\']SHA-?1["\']\s*\)',
        "fix": lambda code: 'MessageDigest.getInstance("SHA-256"); // Upgraded to SHA-256 (NIST FIPS 180-4)',
    },
    "DES_JAVA": {
        "pattern": r'Cipher\.getInstance\(\s*["\']DES(?:/[^"\']*)?["\']\s*\)',
        "fix": lambda code: 'Cipher.getInstance("AES/GCM/NoPadding"); // Upgraded to AES-256-GCM (NIST FIPS 197)',
    },
    "RSA_JAVA": {
        "pattern": r'KeyPairGenerator\.getInstance\(\s*["\']RSA["\']\s*\)',
        "fix": lambda code: '// Replace classical RSA with Post-Quantum ML-DSA / Dilithium\nKeyPairGenerator kpg = KeyPairGenerator.getInstance("Dilithium", "BouncyCastlePQC"); // NIST FIPS 204',
    },
    "SSL_PYTHON": {
        "pattern": r"ssl\.PROTOCOL_TLSv1",
        "fix": lambda code: "ssl.PROTOCOL_TLS_CLIENT  # Upgraded to TLS 1.3 with PQC hybrid support",
    },
    "SSL_JAVA": {
        "pattern": r'SSLContext\.getInstance\(\s*["\']TLSv1["\']\s*\)',
        "fix": lambda code: 'SSLContext.getInstance("TLSv1.3"); // Upgraded to TLS 1.3 with PQC hybrid support',
    },
}


def add_fix_diffs(findings: list[dict]) -> list[dict]:
    """
    Attaches original_code (already captured by scanner) and suggested_fix
    (from FIX_TEMPLATES) to each finding. Falls back to fix_confidence:
    "manual_review" with no suggested_fix if no template matches.
    """
    import re
    
    for f in findings:
        orig = f.get("original_code", "").strip()
        lang = f.get("language", "").upper()
        algo = f.get("algorithm", "").upper()
        
        matched_fix = None
        for key, template in FIX_TEMPLATES.items():
            if re.search(template["pattern"], orig, re.IGNORECASE):
                matched_fix = template["fix"](orig)
                break

        if not matched_fix:
            # Fallback based on algorithm
            if "MD5" in algo or "SHA1" in algo:
                matched_fix = f"// Replace with SHA-256:\n{orig.replace('MD5', 'SHA-256').replace('md5', 'sha256')}"
            elif "DES" in algo:
                matched_fix = f"// Replace with AES-256:\n{orig.replace('DES', 'AES').replace('des', 'aes')}"
            elif "RSA" in algo:
                matched_fix = f"// Migrate to PQC ML-KEM-768 / ML-DSA-65 (NIST FIPS 203/204):\n# {orig}"

        if matched_fix and matched_fix != orig:
            f["suggested_fix"] = matched_fix
            f["fix_confidence"] = "template-based"
        else:
            f["suggested_fix"] = f"# Manual migration required for {algo}:\n# {orig}"
            f["fix_confidence"] = "manual_review"

    return findings


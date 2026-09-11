"""
Before/after code fix snippets for all detected cryptographic signatures.
Squad B / Next.js UI renders these as a red/green diff in the code workspace.
"""

import re

FIX_TEMPLATES = {
    # ── Hashing ─────────────────────────────────────────────────────────────
    "MD5_PYTHON": {
        "pattern": r"hashlib\.md5\(|Crypto\.Hash\.MD5",
        "fix": lambda code: code.replace("hashlib.md5(", "hashlib.sha256(").replace("Crypto.Hash.MD5", "Crypto.Hash.SHA256") + "  # Upgraded to SHA-256 (NIST FIPS 180-4)",
    },
    "SHA1_PYTHON": {
        "pattern": r"hashlib\.sha1\(|Crypto\.Hash\.SHA1",
        "fix": lambda code: code.replace("hashlib.sha1(", "hashlib.sha256(").replace("Crypto.Hash.SHA1", "Crypto.Hash.SHA256") + "  # Upgraded to SHA-256 (NIST FIPS 180-4)",
    },
    "MD2_MD4_PYTHON": {
        "pattern": r"hashlib\.(?:md2|md4)\(|Crypto\.Hash\.(?:MD2|MD4)",
        "fix": lambda code: "# Replace legacy MD2/MD4 with SHA-256 (NIST FIPS 180-4)\nimport hashlib\nhashlib.sha256(data)",
    },
    "RIPEMD160_PYTHON": {
        "pattern": r"Crypto\.Hash\.RIPEMD160|hashes\.RIPEMD160",
        "fix": lambda code: code.replace("RIPEMD160", "SHA256") + "  # Upgraded to SHA-256 (NIST FIPS 180-4)",
    },
    "MD5_JAVA": {
        "pattern": r'MessageDigest\.getInstance\(\s*["\']MD5["\']\s*\)',
        "fix": lambda code: 'MessageDigest.getInstance("SHA-256"); // Upgraded to SHA-256 (NIST FIPS 180-4)',
    },
    "SHA1_JAVA": {
        "pattern": r'MessageDigest\.getInstance\(\s*["\']SHA-?1["\']\s*\)',
        "fix": lambda code: 'MessageDigest.getInstance("SHA-256"); // Upgraded to SHA-256 (NIST FIPS 180-4)',
    },
    "MD2_MD4_JAVA": {
        "pattern": r'MessageDigest\.getInstance\(\s*["\']MD[24]["\']\s*\)',
        "fix": lambda code: 'MessageDigest.getInstance("SHA-256"); // Upgraded to SHA-256 (NIST FIPS 180-4)',
    },
    "RIPEMD160_JAVA": {
        "pattern": r'MessageDigest\.getInstance\(\s*["\']RIPEMD(?:-?160)?["\']\s*\)',
        "fix": lambda code: 'MessageDigest.getInstance("SHA-256"); // Upgraded to SHA-256 (NIST FIPS 180-4)',
    },
    # ── Symmetric Ciphers ───────────────────────────────────────────────────
    "DES_PYTHON": {
        "pattern": r"Crypto\.Cipher\.DES\b|DES\.new\(",
        "fix": lambda code: code.replace("Crypto.Cipher.DES", "Crypto.Cipher.AES").replace("DES.new(", "AES.new(") + "  # Upgraded to AES-256-GCM (NIST FIPS 197)",
    },
    "3DES_PYTHON": {
        "pattern": r"Crypto\.Cipher\.DES3|DES3\.new\(|algorithms\.TripleDES\(",
        "fix": lambda code: code.replace("DES3", "AES").replace("TripleDES", "AES") + "  # Upgraded to AES-256-GCM (NIST FIPS 197)",
    },
    "RC4_PYTHON": {
        "pattern": r"Crypto\.Cipher\.ARC4|ARC4\.new\(",
        "fix": lambda code: code.replace("ARC4", "AES") + "  # Upgraded to AES-256-GCM (NIST FIPS 197)",
    },
    "BLOWFISH_PYTHON": {
        "pattern": r"Crypto\.Cipher\.Blowfish|Blowfish\.new\(",
        "fix": lambda code: code.replace("Blowfish", "AES") + "  # Upgraded to AES-256-GCM (NIST FIPS 197)",
    },
    "CAST5_PYTHON": {
        "pattern": r"Crypto\.Cipher\.CAST|CAST\.new\(",
        "fix": lambda code: code.replace("CAST", "AES") + "  # Upgraded to AES-256-GCM (NIST FIPS 197)",
    },
    "IDEA_PYTHON": {
        "pattern": r"Crypto\.Cipher\.IDEA|IDEA\.new\(",
        "fix": lambda code: code.replace("IDEA", "AES") + "  # Upgraded to AES-256-GCM (NIST FIPS 197)",
    },
    "RC2_PYTHON": {
        "pattern": r"Crypto\.Cipher\.ARC2|ARC2\.new\(",
        "fix": lambda code: code.replace("ARC2", "AES") + "  # Upgraded to AES-256-GCM (NIST FIPS 197)",
    },
    "AES_ECB_PYTHON": {
        "pattern": r"AES\.MODE_ECB|modes\.ECB\(",
        "fix": lambda code: code.replace("AES.MODE_ECB", "AES.MODE_GCM").replace("modes.ECB(", "modes.GCM(") + "  # Upgraded to AES-256-GCM authenticated mode (NIST SP 800-38D)",
    },
    "DES_JAVA": {
        "pattern": r'Cipher\.getInstance\(\s*["\']DES(?:/[^"\']*)?["\']\s*\)',
        "fix": lambda code: 'Cipher.getInstance("AES/GCM/NoPadding"); // Upgraded to AES-256-GCM (NIST FIPS 197)',
    },
    "3DES_JAVA": {
        "pattern": r'Cipher\.getInstance\(\s*["\'](?:DESede|TripleDES)(?:/[^"\']*)?["\']\s*\)',
        "fix": lambda code: 'Cipher.getInstance("AES/GCM/NoPadding"); // Upgraded to AES-256-GCM (NIST FIPS 197)',
    },
    "RC4_JAVA": {
        "pattern": r'Cipher\.getInstance\(\s*["\'](?:RC4|ARCFOUR)(?:/[^"\']*)?["\']\s*\)',
        "fix": lambda code: 'Cipher.getInstance("AES/GCM/NoPadding"); // Upgraded to AES-256-GCM (NIST FIPS 197)',
    },
    "BLOWFISH_JAVA": {
        "pattern": r'Cipher\.getInstance\(\s*["\']Blowfish(?:/[^"\']*)?["\']\s*\)',
        "fix": lambda code: 'Cipher.getInstance("AES/GCM/NoPadding"); // Upgraded to AES-256-GCM (NIST FIPS 197)',
    },
    "CAST5_JAVA": {
        "pattern": r'Cipher\.getInstance\(\s*["\']CAST5(?:/[^"\']*)?["\']\s*\)',
        "fix": lambda code: 'Cipher.getInstance("AES/GCM/NoPadding"); // Upgraded to AES-256-GCM (NIST FIPS 197)',
    },
    "IDEA_JAVA": {
        "pattern": r'Cipher\.getInstance\(\s*["\']IDEA(?:/[^"\']*)?["\']\s*\)',
        "fix": lambda code: 'Cipher.getInstance("AES/GCM/NoPadding"); // Upgraded to AES-256-GCM (NIST FIPS 197)',
    },
    "RC2_JAVA": {
        "pattern": r'Cipher\.getInstance\(\s*["\']RC2(?:/[^"\']*)?["\']\s*\)',
        "fix": lambda code: 'Cipher.getInstance("AES/GCM/NoPadding"); // Upgraded to AES-256-GCM (NIST FIPS 197)',
    },
    "AES_ECB_JAVA": {
        "pattern": r'Cipher\.getInstance\(\s*["\']AES/ECB(?:/[^"\']*)?["\']\s*\)',
        "fix": lambda code: 'Cipher.getInstance("AES/GCM/NoPadding"); // Replace ECB with authenticated encryption',
    },
    "WEAK_PBE_JAVA": {
        "pattern": r'Cipher\.getInstance\(\s*["\']PBEWith(?:MD5|SHA1)(?:And(?:DES|DESede|3DES))?["\']\s*\)|SecretKeyFactory\.getInstance\(\s*["\']PBKDF2WithHmacSHA1["\']\s*\)',
        "fix": lambda code: 'SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256"); // Replace legacy PBE with PBKDF2-HMAC-SHA-256',
    },
    # ── Asymmetric & Key Exchange ─────────────────────────────────────────────
    "RSA_PYTHON": {
        "pattern": r"RSA\.generate\(|rsa\.generate_private_key\(",
        "fix": lambda code: "# Replace RSA key generation with Post-Quantum ML-KEM / ML-DSA\n# from oqs import KeyEncapsulation\n# kem = KeyEncapsulation('Kyber768')  # ML-KEM-768 (NIST FIPS 203)",
    },
    "DSA_PYTHON": {
        "pattern": r"DSA\.generate\(|dsa\.generate_private_key\(",
        "fix": lambda code: "# Replace DSA signatures with Post-Quantum ML-DSA-65 (NIST FIPS 204)",
    },
    "ECDH_X25519_PYTHON": {
        "pattern": r"(?:x25519|x448)\.(?:X25519PrivateKey|X448PrivateKey)|ec\.ECDH\(",
        "fix": lambda code: "# Add ML-KEM-768 to classical exchange for hybrid post-quantum key establishment\n" + code,
    },
    "RSA_JAVA": {
        "pattern": r'KeyPairGenerator\.getInstance\(\s*["\']RSA["\']\s*\)',
        "fix": lambda code: '// Replace classical RSA with Post-Quantum ML-DSA / Dilithium\nKeyPairGenerator kpg = KeyPairGenerator.getInstance("Dilithium", "BouncyCastlePQC"); // NIST FIPS 204',
    },
    "DSA_JAVA": {
        "pattern": r'KeyPairGenerator\.getInstance\(\s*["\']DSA["\']\s*\)',
        "fix": lambda code: 'KeyPairGenerator.getInstance("ML-DSA", "BouncyCastlePQC"); // NIST FIPS 204',
    },
    "WEAK_SIGNATURE_JAVA": {
        "pattern": r'Signature\.getInstance\(\s*["\'](?:MD5withRSA|SHA1withRSA|SHA1withDSA|NONEwithRSA)["\']\s*\)',
        "fix": lambda code: 'Signature.getInstance("SHA256withRSA"); // Upgrade digest; use ML-DSA-65 for post-quantum signatures',
    },
    "PQC_KEY_EXCHANGE_JAVA": {
        "pattern": r'KeyAgreement\.getInstance\(\s*["\'](?:ECDH|X25519|X448)["\']\s*\)',
        "fix": lambda code: '// Add ML-KEM-768 to classical key exchange for hybrid migration (NIST FIPS 203)',
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
    Attaches original_code (captured from actual source line) and suggested_fix
    to each finding dynamically based on matching templates.
    """
    for f in findings:
        orig = f.get("original_code", "").strip()
        algo = f.get("algorithm", "").upper()

        matched_fix = None
        for key, template in FIX_TEMPLATES.items():
            if re.search(template["pattern"], orig, re.IGNORECASE):
                matched_fix = template["fix"](orig)
                break

        if not matched_fix:
            # Dynamic fallback based on algorithm name
            if any(h in algo for h in ["MD5", "SHA1", "MD2", "MD4", "RIPEMD"]):
                matched_fix = f"// Upgrade hash algorithm to SHA-256 (NIST FIPS 180-4):\n{orig.replace('MD5', 'SHA-256').replace('md5', 'sha256').replace('SHA1', 'SHA-256').replace('sha1', 'sha256')}"
            elif any(c in algo for c in ["DES", "3DES", "RC4", "BLOWFISH", "CAST", "IDEA", "RC2", "ECB"]):
                matched_fix = f"// Upgrade cipher to authenticated AES-256-GCM (NIST FIPS 197):\n{orig.replace('DES', 'AES').replace('des', 'aes').replace('RC4', 'AES').replace('ECB', 'GCM')}"
            elif any(a in algo for a in ["RSA", "DSA", "ECDSA", "ELGAMAL", "ED25519"]):
                matched_fix = f"// Migrate public-key cryptography to NIST PQC (ML-KEM-768 / ML-DSA-65):\n# {orig}"
            elif any(k in algo for k in ["DH", "ECDH", "X25519"]):
                matched_fix = f"// Upgrade key exchange to hybrid ML-KEM-768 (NIST FIPS 203):\n# {orig}"

        if matched_fix and matched_fix != orig:
            f["suggested_fix"] = matched_fix
            f["fix_confidence"] = "template-based"
        else:
            f["suggested_fix"] = f"# Post-Quantum PQC Migration required for {algo}:\n# {orig}"
            f["fix_confidence"] = "manual_review"

    return findings

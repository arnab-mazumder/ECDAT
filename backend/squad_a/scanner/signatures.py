"""
PERSON 1 owns this file.
Single source of truth for what counts as "weak crypto."
Sourced from NIST SP 800-131A and FIPS standards.
"""

SIGNATURES = [
    # Hashing
    {
        "id": "MD5",
        "algorithm": "MD5",
        "category": "hashing",
        "python_pattern": r"hashlib\.md5\(|Crypto\.Hash\.MD5|MD5\.new\(",
        "java_pattern": r'MessageDigest\.getInstance\(\s*["\']MD5["\']\s*\)',
        "description": "MD5 hash algorithm is collision-vulnerable and deprecated.",
    },
    {
        "id": "SHA1",
        "algorithm": "SHA1",
        "category": "hashing",
        "python_pattern": r"hashlib\.sha1\(|Crypto\.Hash\.SHA1|SHA1\.new\(",
        "java_pattern": r'MessageDigest\.getInstance\(\s*["\']SHA-?1["\']\s*\)',
        "description": "SHA-1 is vulnerable to collision attacks and deprecated by NIST.",
    },
    # Symmetric Ciphers
    {
        "id": "DES",
        "algorithm": "DES",
        "category": "symmetric",
        "python_pattern": r"Crypto\.Cipher\.DES|DES\.new\(",
        "java_pattern": r'Cipher\.getInstance\(\s*["\']DES(?:/[^"\']*)?["\']\s*\)',
        "description": "DES features a 56-bit key size and is vulnerable to brute-force attacks.",
    },
    {
        "id": "3DES",
        "algorithm": "3DES",
        "category": "symmetric",
        "python_pattern": r"Crypto\.Cipher\.DES3|DES3\.new\(",
        "java_pattern": r'Cipher\.getInstance\(\s*["\'](?:DESede|TripleDES)(?:/[^"\']*)?["\']\s*\)',
        "description": "Triple DES (3DES) is vulnerable to Sweet32 attack and deprecated by NIST.",
    },
    {
        "id": "RC4",
        "algorithm": "RC4",
        "category": "symmetric",
        "python_pattern": r"Crypto\.Cipher\.ARC4|ARC4\.new\(",
        "java_pattern": r'Cipher\.getInstance\(\s*["\']RC4(?:/[^"\']*)?["\']\s*\)',
        "description": "RC4 stream cipher suffers from bias in output byte stream.",
    },
    # Asymmetric Encryption & Signatures
    {
        "id": "RSA",
        "algorithm": "RSA",
        "category": "asymmetric",
        "python_pattern": r"RSA\.generate\(|rsa\.newkeys\(",
        "java_pattern": r'KeyPairGenerator\.getInstance\(\s*["\']RSA["\']\s*\)',
        "description": "RSA algorithm vulnerable to Shor's algorithm on quantum computers.",
    },
    {
        "id": "ECDSA",
        "algorithm": "ECDSA",
        "category": "asymmetric",
        "python_pattern": r"ECC\.generate\(|ec\.generate_private_key\(|secp192r1|secp160r1|prime192v1",
        "java_pattern": r'KeyPairGenerator\.getInstance\(\s*["\']EC(?:DSA)?["\']\s*\)|secp192r1|secp160r1|prime192v1',
        "description": "ECDSA curves vulnerable to Shor's algorithm on quantum computers.",
    },
    # TLS Protocols
    {
        "id": "SSLv3_TLS10_11",
        "algorithm": "TLS 1.0/1.1",
        "category": "protocol",
        "python_pattern": r"ssl\.PROTOCOL_SSLv23|ssl\.PROTOCOL_SSLv3|ssl\.PROTOCOL_TLSv1|ssl\.PROTOCOL_TLSv1_1",
        "java_pattern": r'SSLContext\.getInstance\(\s*["\'](?:SSL|SSLv3|TLSv1|TLSv1\.1)["\']\s*\)',
        "description": "Deprecated TLS/SSL protocol versions vulnerable to POODLE, BEAST attacks.",
    },
    # Key Exchange
    {
        "id": "STATIC_DH",
        "algorithm": "Static DH",
        "category": "key_exchange",
        "python_pattern": r"DH\.generate\(|DiffieHellman\(",
        "java_pattern": r'KeyPairGenerator\.getInstance\(\s*["\']DH["\']\s*\)|["\']DiffieHellman["\']',
        "description": "Static Diffie-Hellman lacks perfect forward secrecy and quantum resistance.",
    },
]


export const initialFileTree = [
  {
    id: "banking-system",
    name: "banking-system",
    type: "folder",
    expanded: true,
    children: [
      {
        id: "src",
        name: "src",
        type: "folder",
        expanded: true,
        children: [
          {
            id: "auth",
            name: "auth",
            type: "folder",
            expanded: true,
            children: [
              {
                id: "token_signer.py",
                name: "token_signer.py",
                type: "file",
                path: "src/auth/token_signer.py",
                language: "python",
                hasIssue: true,
                issueLine: 9,
                findingId: "finding-003",
              },
            ],
          },
          {
            id: "crypto",
            name: "crypto",
            type: "folder",
            expanded: true,
            children: [
              {
                id: "crypto_utils.py",
                name: "crypto_utils.py",
                type: "file",
                path: "src/crypto/crypto_utils.py",
                language: "python",
                hasIssue: true,
                issueLine: 42,
                findingId: "finding-001",
              },
              {
                id: "key_manager.py",
                name: "key_manager.py",
                type: "file",
                path: "src/crypto/key_manager.py",
                language: "python",
                hasIssue: true,
                issueLine: 17,
                findingId: "finding-002",
              },
            ],
          },
        ],
      },
      {
        id: "tests",
        name: "tests",
        type: "folder",
        expanded: false,
        children: [
          {
            id: "test_crypto.py",
            name: "test_crypto.py",
            type: "file",
            path: "tests/test_crypto.py",
            language: "python",
          },
        ],
      },
      {
        id: "requirements.txt",
        name: "requirements.txt",
        type: "file",
        path: "requirements.txt",
        language: "plaintext",
      },
    ],
  },
];

export const findingsList = [
  {
    id: "finding-001",
    title: "Weak Key Length",
    severity: "CRITICAL",
    riskScore: 94,
    algorithm: "RSA-1024",
    fileId: "crypto_utils.py",
    filePath: "src/crypto/crypto_utils.py",
    line: 42,
    fileLocation: "crypto_utils.py:42",
    vulnerableCode: "key = RSA.generate(1024)",
    suggestedCode: "key = ml_kem.generate_keypair(parameter_set=768)",
    mosca: {
      dataLifetime: 10,
      migrationTime: 2,
      requiredLifetime: 12,
      quantumHorizon: 10,
      verdict: "Breached (12y > 10y)",
      equation: "Equation: Data Lifetime (10y) + Migration (2y) > Horizon (10y)",
      explanation:
        "RSA-1024 is considered cryptographically broken for long-term security. The required security lifetime (12 years total) exceeds the safe horizon for 1024-bit RSA against standard factorization attacks.",
    },
    remediation: {
      recommendation:
        "Upgrade to a quantum-resistant algorithm (ML-KEM-768 / Kyber) per organizational policy.",
      standardBadge: "NIST FIPS 203",
      rationale: "ML-KEM-768 provides NIST Level 3 quantum-resistant key establishment.",
      diff: {
        removed: "key = RSA.generate(1024)",
        added: "key = ml_kem.generate_keypair(parameter_set=768)",
      },
    },
  },
  {
    id: "finding-002",
    title: "Deprecated Encryption Algorithm",
    severity: "CRITICAL",
    riskScore: 91,
    algorithm: "DES-56",
    fileId: "key_manager.py",
    filePath: "src/crypto/key_manager.py",
    line: 17,
    fileLocation: "key_manager.py:17",
    vulnerableCode: "cipher = DES.new(secret_key, DES.MODE_ECB)",
    suggestedCode: "cipher = AES.new(secret_key, AES.MODE_GCM)",
    mosca: {
      dataLifetime: 8,
      migrationTime: 3,
      requiredLifetime: 11,
      quantumHorizon: 5,
      verdict: "Breached (11y > 5y)",
      equation: "Equation: Data Lifetime (8y) + Migration (3y) > Horizon (5y)",
      explanation:
        "DES uses a 56-bit key length vulnerable to brute force and linear cryptanalysis. Modern security standards mandate AES-256-GCM.",
    },
    remediation: {
      recommendation:
        "Replace legacy DES encryption with AES-256 in Galois/Counter Mode (GCM).",
      standardBadge: "NIST SP 800-38D",
      rationale: "AES-256-GCM ensures confidentiality and authenticated integrity.",
      diff: {
        removed: "cipher = DES.new(secret_key, DES.MODE_ECB)",
        added: "cipher = AES.new(secret_key, AES.MODE_GCM)",
      },
    },
  },
  {
    id: "finding-003",
    title: "Weak Token Hash Algorithm",
    severity: "HIGH",
    riskScore: 76,
    algorithm: "SHA-1",
    fileId: "token_signer.py",
    filePath: "src/auth/token_signer.py",
    line: 9,
    fileLocation: "token_signer.py:9",
    vulnerableCode: 'return jwt.encode(payload, self.secret_key, algorithm="HS1")',
    suggestedCode: 'return jwt.encode(payload, self.secret_key, algorithm="HS256")',
    mosca: {
      dataLifetime: 5,
      migrationTime: 1,
      requiredLifetime: 6,
      quantumHorizon: 5,
      verdict: "Breached (6y > 5y)",
      equation: "Equation: Data Lifetime (5y) + Migration (1y) > Horizon (5y)",
      explanation:
        "SHA-1 signature collision resistance is computationally compromised. SHA-256 or SHA-384 must be used for JWT tokens.",
    },
    remediation: {
      recommendation:
        "Upgrade JWT token algorithm from HS1/SHA-1 to HS256 (HMAC with SHA-256).",
      standardBadge: "RFC 7519",
      rationale: "HS256 provides secure collision-resistant signing for JSON Web Tokens.",
      diff: {
        removed: 'return jwt.encode(payload, self.secret_key, algorithm="HS1")',
        added: 'return jwt.encode(payload, self.secret_key, algorithm="HS256")',
      },
    },
  },
];

export const fileContents = {
  "crypto_utils.py": {
    path: "src/crypto/crypto_utils.py",
    language: "Python",
    encoding: "UTF-8",
    content: `import logging
import os
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP

logger = logging.getLogger(__name__)

class SecurityException(Exception):
    pass

class CryptoUtils:
    """Utility class providing cryptographic operations for banking system."""

    def __init__(self, key_size=2048):
        self.default_key_size = key_size
        self._initialize_ciphers()

    def _initialize_ciphers(self):
        logger.info("Initializing security modules")

    def encrypt_payload(self, data: bytes, public_key) -> bytes:
        cipher = PKCS1_OAEP.new(public_key)
        return cipher.encrypt(data)

    def decrypt_payload(self, encrypted_data: bytes, private_key) -> bytes:
        cipher = PKCS1_OAEP.new(private_key)
        return cipher.decrypt(encrypted_data)

    def export_public_key(self, key_pair):
        return key_pair.publickey().export_key()

    def validate_key_length(self, key):
        if key.size_in_bits() < 2048:
            logger.warning("Key length is below current security standards")
            return False
        return True

    def generate_session_key(self):
        """Generates a temporary session key for encryption."""
        # legacy support for older client versions
        try:
            key = RSA.generate(1024)
            return key.export_key()
        except Exception as e:
            logger.error(f"Failed to generate key: {e}")
            raise SecurityException("Key generation failed")

    def sign_transaction(self, tx_data: dict, private_key):
        # Transaction signing logic placeholder
        pass`,
    findingId: "finding-001",
    issueLine: 42,
  },
  "key_manager.py": {
    path: "src/crypto/key_manager.py",
    language: "Python",
    encoding: "UTF-8",
    content: `import os
import base64
from typing import Optional
from Crypto.Cipher import DES

class KeyManager:
    """Manages encryption keys lifecycle and rotation policy."""

    def __init__(self, key_store_path: str):
        self.key_store_path = key_store_path
        self._keys_cache = {}

    def load_active_key(self, key_id: str) -> Optional[bytes]:
        if key_id in self._keys_cache:
            return self._keys_cache[key_id]
        return None

    def initialize_cipher(self, secret_key: bytes):
        cipher = DES.new(secret_key, DES.MODE_ECB)
        return cipher

    def rotate_keys(self):
        """Rotate expired keys according to schedule."""
        print("Rotating keys...")`,
    findingId: "finding-002",
    issueLine: 17,
  },
  "token_signer.py": {
    path: "src/auth/token_signer.py",
    language: "Python",
    encoding: "UTF-8",
    content: `import jwt
import datetime

class TokenSigner:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key

    def create_token(self, payload: dict) -> str:
        payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        return jwt.encode(payload, self.secret_key, algorithm="HS1")`,
    findingId: "finding-003",
    issueLine: 9,
  },
  "test_crypto.py": {
    path: "tests/test_crypto.py",
    language: "Python",
    encoding: "UTF-8",
    content: `import unittest
from src.crypto.crypto_utils import CryptoUtils

class TestCryptoUtils(unittest.TestCase):
    def setUp(self):
        self.utils = CryptoUtils()

    def test_session_key(self):
        key = self.utils.generate_session_key()
        self.assertIsNotNone(key)`,
    findingId: null,
    issueLine: null,
  },
  "requirements.txt": {
    path: "requirements.txt",
    language: "plaintext",
    encoding: "UTF-8",
    content: `pycryptodome==3.19.0
pyjwt==2.8.0
requests==2.31.0
pytest==7.4.3`,
    findingId: null,
    issueLine: null,
  },
};

"""
PERSON 2 owns this file.
Parses certificate/key files, extracts crypto properties, flags weak ones.
"""

from pathlib import Path
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa, ec, dsa

from squad_a.artifacts.artifact_utils import find_cert_files
from squad_a.config import RSA_MIN_SAFE_KEYSIZE, ECDSA_MIN_SAFE_KEYSIZE
from squad_a.schema import create_finding


def scan_certs(target_path: str) -> list[dict]:
    """
    Finds and parses cert/key files, returns findings matching schema.py
    with artifact_type: "certificate".
    """
    findings = []
    cert_files = find_cert_files(target_path)
    target_dir = Path(target_path).resolve()

    for cert_file in cert_files:
        filepath = Path(cert_file)
        rel_path = str(filepath.relative_to(target_dir) if filepath.is_relative_to(target_dir) else filepath)

        try:
            with open(filepath, "rb") as f:
                content = f.read()

            if not content.strip():
                continue

            # Try parsing as PEM X.509 Certificate
            cert = None
            try:
                cert = x509.load_pem_x509_certificate(content, default_backend())
            except Exception:
                try:
                    cert = x509.load_der_x509_certificate(content, default_backend())
                except Exception:
                    pass

            if cert:
                pub_key = cert.public_key()
                key_size = getattr(pub_key, "key_size", None)
                
                algo_name = "Unknown"
                if isinstance(pub_key, rsa.RSAPublicKey):
                    algo_name = "RSA"
                elif isinstance(pub_key, ec.EllipticCurvePublicKey):
                    algo_name = "ECDSA"
                elif isinstance(pub_key, dsa.DSAPublicKey):
                    algo_name = "DSA"

                # Check signature hash algorithm
                sig_hash_name = ""
                try:
                    if hasattr(cert, "signature_hash_algorithm") and cert.signature_hash_algorithm:
                        sig_hash_name = cert.signature_hash_algorithm.name.lower()
                except Exception:
                    pass

                is_weak = False
                detected_reasons = []

                if algo_name == "RSA" and key_size and key_size < RSA_MIN_SAFE_KEYSIZE:
                    is_weak = True
                    detected_reasons.append(f"RSA key size {key_size}-bit < {RSA_MIN_SAFE_KEYSIZE}-bit")

                if algo_name == "ECDSA" and key_size and key_size < ECDSA_MIN_SAFE_KEYSIZE:
                    is_weak = True
                    detected_reasons.append(f"ECDSA key size {key_size}-bit < {ECDSA_MIN_SAFE_KEYSIZE}-bit")

                if sig_hash_name in ("md5", "sha1"):
                    is_weak = True
                    detected_reasons.append(f"Weak signature hash algorithm: {sig_hash_name.upper()}")

                # Flag quantum vulnerability (RSA/ECDSA certs) even if size is 2048/4096
                if algo_name in ("RSA", "ECDSA", "DSA"):
                    is_weak = True
                    detected_reasons.append(f"Public-key algorithm {algo_name} vulnerable to quantum attack")

                if is_weak:
                    finding = create_finding(
                        algorithm=algo_name,
                        file=rel_path,
                        line=1,
                        artifact_type="certificate",
                        language="n/a",
                        detected_pattern=", ".join(detected_reasons),
                        original_code=f"Certificate [Subject: {cert.subject.rfc4514_string()}]",
                        key_size=key_size,
                    )
                    findings.append(finding)
        except Exception:
            continue

    return findings


if __name__ == "__main__":
    import sys
    print(scan_certs(sys.argv[1] if len(sys.argv) > 1 else "."))


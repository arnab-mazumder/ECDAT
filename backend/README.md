# ECDAT — Backend Detection & Logic Engine

ECDAT is an enterprise-grade, deterministic analysis tool designed to solve the quantum cryptographic migration problem. It scans source code repositories across multiple programming languages, certificate stores, key files, and infrastructure configuration files to build a **Cryptography Bill of Materials (CBOM)**, applies a quantitative risk model based on **Mosca's Theorem**, and provides actionable Post-Quantum Cryptography (PQC) recommendations based on **NIST FIPS 203/204/205**.

---

## 🏗️ Supported Language & Artifact Scanners

The backend features dedicated scanner engines located in `squad_a/scanner/` and `squad_a/artifacts/`:

1. **Python (`python_scanner.py`)**: AST (Abstract Syntax Tree) parsing + regex line fallback for `hashlib`, `PyCryptodome`, `ssl`, `cryptography`, `rsa`.
2. **Java (`java_scanner.py`)**: Pattern matching for `MessageDigest`, `Cipher`, `KeyPairGenerator`, `SSLContext`, BouncyCastle, `.initialize(keySize)`.
3. **JavaScript / TypeScript (`js_scanner.py`)**: Node.js `crypto` module, `crypto-js` library usages across `.js`, `.jsx`, `.ts`, `.tsx`.
4. **Go (`go_scanner.py`)**: Standard library `crypto/md5`, `crypto/sha1`, `crypto/des`, `crypto/rc4`, `crypto/rsa`, `crypto/tls`.
5. **C / C++ (`c_scanner.py`)**: OpenSSL legacy API calls (`MD5_Init`, `DES_*`, `RSA_generate_key`, `EVP_des_*`).
6. **Config & Infrastructure (`config_scanner.py`)**: Secret and crypto configuration scanning in `.env`, `.yaml`, `.toml`, `Dockerfile`, Nginx, Apache, and SSH configuration files.
7. **Certificate & Key Parser (`squad_a/artifacts/cert_parser.py`)**: Full X.509 PEM, CRT, DER, and JKS certificate parsing for public key algorithm, key size, and signature hash algorithm.

---

## 🚀 How to Run Backend CLI Commands

The CLI bridge script `run_bridge.py` allows direct invocation of the Python analysis engine:

### 1. Ingest & Scan a Local Workspace / Directory
```bash
python run_bridge.py scan --path /path/to/target/repository
```

### 2. Scan a ZIP File Upload
```bash
python run_bridge.py scan_zip --path /path/to/target.zip
```

### 3. Generate CycloneDX 1.6 CBOM JSON
```bash
python run_bridge.py cbom --path /path/to/target/repository
```

### 4. Recalculate Quantum Readiness Score
```bash
python run_bridge.py recalculate --findings-json '[...]'
```

---

## 🧪 Running Integration Tests

Run the full integration test suite covering python, java, certificate parser, and score recalculation:

```bash
PYTHONPATH=. python3 tests/test_pipeline.py
```

Output:
```
All ECDAT Squad A tests passed successfully!
```

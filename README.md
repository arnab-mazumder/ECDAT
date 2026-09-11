# ECDAT — Enterprise Cryptographic Discovery & Analysis Tool

**Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)** helps security teams discover weak and quantum-vulnerable cryptographic usage across source code repositories, certificates, key files, and infrastructure configurations.

ECDAT automatically catalogues cryptographic artefacts, scores every finding using **Mosca's Algorithm** (\(X + Y > Z\)), maps each algorithm to its official NIST Post-Quantum Cryptography (PQC) replacement, and produces an aggregate **Quantum Readiness Score** alongside a standardized **CycloneDX Cryptography Bill of Materials (CBOM)**.

---

## 🌟 Key Capabilities & Supported Languages

- 🛡️ **Multi-Language Cryptographic Scanners**:
  - **Python**: `hashlib`, `PyCryptodome`, `ssl`, `cryptography`
  - **Java**: JCA/JCE primitives, BouncyCastle, `SSLContext`
  - **JavaScript / TypeScript**: Node.js `crypto` module, `crypto-js`
  - **Go**: `crypto/md5`, `crypto/sha1`, `crypto/des`, `crypto/rc4`, `crypto/rsa`, `crypto/tls`
  - **C / C++**: OpenSSL legacy APIs (`MD5_Init`, `DES_*`, `RSA_generate_key`, `EVP_des_*`)
  - **Config & Infrastructure**: `.env`, `.yaml`, `.toml`, `Dockerfile`, Nginx, Apache, SSH configuration files
- 📜 **Certificate & Key Artefact Analysis**: Parsers for PEM, CRT, DER, and JKS certificates, weak RSA keys (< 2048-bit), and expired or weak signature algorithms (SHA-1/MD5 with RSA).
- 🧮 **Mosca's Quantum Risk Scoring**: Quantitative risk model calculating data shelf-life (\(X\)) and migration timeline (\(Y\)) against estimated quantum threat horizon (\(Z\)).
- ⚡ **Interactive Code Workspace**: In-browser IDE tree and side-by-side fix generator providing NIST FIPS 203/204/205 replacement code.
- 📑 **CycloneDX CBOM & Report Generation**: One-click export of Cryptography Bill of Materials in standard CycloneDX 1.6 JSON format.

---

## 🏗️ Project Architecture

```
ECDAT--FRONTEND-AND-BACKEND/
├── frontend/                  # Next.js 16 App Router UI & API Bridge
│   ├── src/
│   │   ├── app/               # Next.js Pages & REST API routes (/api/scan, /api/cbom, etc.)
│   │   ├── components/        # Reusable React components & UI primitives
│   │   └── lib/               # backendRunner bridge helper (Local Python process or HTTP fetch)
│   └── package.json
│
└── backend/                   # Pure Python Analysis Engine & REST API
    ├── run_bridge.py          # JSON CLI bridge called by Next.js API routes
    ├── server.py              # FastAPI REST API server (for standalone deployment)
    ├── requirements.txt       # Python dependencies (cryptography, fastapi, uvicorn, etc.)
    ├── squad_a/
    │   ├── scanner/           # Language scanners (Python, Java, JS/TS, Go, C/C++, Config)
    │   ├── artifacts/         # Certificate & key parser (PEM, CRT, JKS)
    │   ├── risk_engine/       # Mosca's Algorithm scorer & Readiness engine
    │   ├── recommender/       # NIST PQC mapping & automated code fix templates
    │   ├── pipeline.py        # Master scanning & analysis orchestrator
    │   └── config.py          # Constants, limits & weak key thresholds
    └── tests/                 # End-to-end integration tests & sample vulnerable repos
```

---

## 🚀 Prerequisites

- **Node.js**: `≥ 18.x` (Recommended: Node 20 LTS or Node 22)
- **npm**: `≥ 9.x`
- **Python**: `≥ 3.10`
- **Git**: (Optional, for scanning remote GitHub repositories)

---

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/arnab-mazumder/ECDAT--FRONTEND-AND-BACKEND.git
cd ECDAT--FRONTEND-AND-BACKEND
```

### 2. Set Up Backend Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 3. Set Up Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 💻 How to Run (Local Development)

### 1-Command Standard Startup (Next.js Integrated Mode)

Start the Next.js development server:

```bash
cd frontend
npm run dev
```

Open your browser and navigate to:
**`http://localhost:3000`**

You **do not** need to start any separate backend server process locally. The Next.js API routes invoke the Python analysis engine (`backend/run_bridge.py`) automatically whenever you scan a repo or ZIP archive in the UI.

---

### Standalone FastAPI Backend Mode (with Live Terminal Logs)

If you prefer to run the Python backend engine as an independent REST API server with real-time logging for every HTTP call:

1. Create `frontend/.env.local`:
   ```ini
   BACKEND_URL=http://localhost:8000
   ```

2. Start both servers:
   ```bash
   # Terminal 1 — Start FastAPI Server (Port 8000)
   cd backend && python3 server.py

   # Terminal 2 — Start Frontend Server (Port 3000)
   cd frontend && npm run dev
   ```

- **Interactive Swagger Documentation**: `http://localhost:8000/docs`

---

## 🚀 Production Deployment

For complete instructions on deploying ECDAT to cloud providers (**Vercel, Netlify, Render, Railway, AWS EC2, DigitalOcean**) without Docker, refer to:

👉 **[DEPLOYMENT.md](file:///home/naegleria/Desktop/ECDAT--FRONTEND-AND-BACKEND/DEPLOYMENT.md)**

---

## ⚙️ Direct CLI Usage (Optional)

If you wish to run scans directly from the terminal without opening the browser:

```bash
# Scan a local directory:
python3 backend/run_bridge.py scan --path ./backend/tests/test_repos/repo1_vulnerable_python

# Scan a ZIP archive:
python3 backend/run_bridge.py scan_zip --path /path/to/repository.zip

# Generate CycloneDX CBOM JSON:
python3 backend/run_bridge.py cbom --path ./backend/tests/test_repos/repo1_vulnerable_python
```

---

## 🧪 Running Integration Tests

To run the backend integration test suite:

```bash
PYTHONPATH=backend python3 backend/tests/test_pipeline.py
```

Expected output:
```
All ECDAT Squad A tests passed successfully!
```

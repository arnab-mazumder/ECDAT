# ECDAT — Enterprise Cryptographic Discovery & Analysis Tool

ECDAT helps security teams discover weak and quantum-vulnerable cryptographic usage across source code, certificates, and build artifacts. It scores every finding using **Mosca's Algorithm**, maps each one to a NIST PQC replacement, and provides an aggregate **Quantum Readiness Score** — giving organisations a clear picture of their migration risk before the quantum threat window closes.

---

## Repository Layout

```
ECDAT--FRONTEND-AND-BACKEND/
├── frontend/          # Next.js 16 web dashboard (React, App Router)
└── backend/           # Python analysis engine (scanner → risk scoring → recommender)
```

---

## frontend/

The `frontend/` package is a **Next.js 16** application with React 19. It provides the full user-facing dashboard including:

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/dashboard` | Quantum Readiness Score gauge, risk distribution, priority findings |
| New Scan | `/scan` | Upload a ZIP or provide a GitHub URL to trigger a scan |
| Findings | `/findings` | Filterable table of every detected cryptographic issue |
| Code Workspace | `/workspace` | Browse vulnerable files and view suggested fixes side-by-side |
| Validation | `/validation` | Certificate and key-file audit results |
| Reports | `/reports` | Export-ready CBOM and PDF reports |

### Quickstart

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

> Requires Node.js ≥ 18 and npm ≥ 9.

The frontend talks to the backend via Next.js API routes under `src/app/api/`. When the backend is not running it falls back to mock data automatically, so the UI is fully functional standalone.

---

## backend/

The `backend/` package is a pure-Python analysis engine with no external service dependencies. It is structured as a single importable package (`squad_a`) and a bridge script (`run_bridge.py`) that the Next.js API routes call via child process.

```
backend/
├── run_bridge.py          # Entry point called by the frontend API routes
├── squad_a/
│   ├── scanner/           # AST-based Python scanner + regex Java scanner + GitHub fetcher
│   ├── artifacts/         # Certificate & key-file parser (PEM, CRT, JKS)
│   ├── risk_engine/       # Mosca's Algorithm scorer + Quantum Readiness Score
│   ├── recommender/       # PQC mapping table, rationale generator, fix-diff templates
│   ├── pipeline.py        # Orchestrates scanner → artifacts → risk_engine → recommender
│   ├── schema.py          # Shared Pydantic/dataclass output schema
│   └── config.py          # Thresholds and constants
├── research/              # Competitor analysis, stakeholder scenarios, impact numbers
└── tests/                 # Integration tests and sample vulnerable repos
```

### Quickstart

```bash
cd backend
pip install -r requirements.txt   # if a requirements file is present
python run_bridge.py --help
```

> Requires Python ≥ 3.10.

---

## Running Both Services Together

```bash
# Terminal 1 — backend (optional, frontend falls back to mock data without it)
cd backend && python run_bridge.py

# Terminal 2 — frontend
cd frontend && npm run dev
```

Then open http://localhost:3000.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Vanilla CSS |
| Icons | lucide-react |
| Backend | Python 3.10+, cryptography, GitPython |
| Risk model | Mosca's Algorithm (X + Y vs Z) |
| PQC standards | NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) |

---

## Key Concepts

**Mosca's Algorithm** — A finding is quantum-urgent when `(data lifetime) + (migration time) > (years to a cryptographically-relevant quantum computer)`. ECDAT uses this formula to produce a per-finding risk score and normalises them into a single 0–100 Quantum Readiness Score.

**CBOM** — Cryptography Bill of Materials. ECDAT exports a CBOM in CycloneDX JSON format listing every cryptographic asset discovered, its risk score, and its recommended PQC replacement.

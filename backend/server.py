"""
FastAPI REST API Server for ECDAT Backend Analysis Engine.
Enables deployment as a standalone HTTP microservice (e.g., Render, Railway, AWS, DigitalOcean).

Run locally:
    python server.py
    or: uvicorn server:app --reload --port 8000
"""

import os
import time
import tempfile
import shutil
import zipfile
import logging
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from squad_a.pipeline import run_pipeline, run_pipeline_from_github, recalculate_readiness
from squad_a.cbom_exporter import export_to_cyclonedx_json
from run_bridge import build_file_tree_and_contents

# ── Logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ecdat")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ECDAT Backend API Engine",
    description="Enterprise Cryptographic Discovery & Analysis Tool — REST API Endpoint Server",
    version="1.0.0",
)

# Configure production CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request logging middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000

    status = response.status_code
    # Colour-code by HTTP status
    if status < 300:
        status_str = f"\033[32m{status}\033[0m"   # green
    elif status < 400:
        status_str = f"\033[33m{status}\033[0m"   # yellow
    else:
        status_str = f"\033[31m{status}\033[0m"   # red

    logger.info(
        "%s  %-30s  →  %s  (%.0f ms)",
        request.method,
        request.url.path,
        status_str,
        elapsed_ms,
    )
    return response


# ── Pydantic models ───────────────────────────────────────────────────────────
class ScanPathRequest(BaseModel):
    path: str


class GitHubScanRequest(BaseModel):
    url: str


class RecalculateRequest(BaseModel):
    findings: List[Dict[str, Any]]


class CbomRequest(BaseModel):
    findings: Optional[List[Dict[str, Any]]] = None
    path: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
@app.get("/")
def health_check():
    """Health check endpoint for cloud load balancers and deployment monitoring."""
    return {
        "status": "healthy",
        "service": "ECDAT Cryptographic Discovery API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.post("/api/scan/path")
def scan_path(req: ScanPathRequest):
    """Scan a local directory path on the server."""
    logger.info("scan/path  →  %s", req.path)
    if not os.path.exists(req.path):
        raise HTTPException(status_code=404, detail=f"Path not found: {req.path}")

    try:
        scan_res = run_pipeline(req.path)
        tree, files = build_file_tree_and_contents(req.path, scan_res["findings"])
        logger.info(
            "scan/path complete  →  %d finding(s), score=%s",
            len(scan_res["findings"]),
            scan_res["readiness_score"],
        )
        return {
            "success": True,
            "findings": scan_res["findings"],
            "readiness_score": scan_res["readiness_score"],
            "file_tree": tree,
            "file_contents": files,
        }
    except Exception as e:
        logger.error("scan/path error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scan/github")
def scan_github(req: GitHubScanRequest):
    """Shallow clone and scan a public GitHub repository."""
    logger.info("scan/github  →  %s", req.url)
    try:
        from run_bridge import handle_scan_github
        result = handle_scan_github(req.url)
        logger.info(
            "scan/github complete  →  %d finding(s), score=%s",
            len(result.get("findings", [])),
            result.get("readiness_score"),
        )
        return {"success": True, **result}
    except Exception as e:
        logger.error("scan/github error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scan/upload")
async def scan_upload(file: UploadFile = File(...)):
    """Upload a ZIP archive and scan its contents."""
    logger.info("scan/upload  →  %s", file.filename)
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip archive files are supported")

    tmp_dir = tempfile.mkdtemp(prefix="ecdat_upload_")
    zip_path = os.path.join(tmp_dir, file.filename)
    extract_dir = os.path.join(tmp_dir, "extracted")

    try:
        with open(zip_path, "wb") as f:
            content = await file.read()
            f.write(content)

        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(extract_dir)

        scan_res = run_pipeline(extract_dir)
        tree, files = build_file_tree_and_contents(extract_dir, scan_res["findings"])
        logger.info(
            "scan/upload complete  →  %d finding(s), score=%s",
            len(scan_res["findings"]),
            scan_res["readiness_score"],
        )
        return {
            "success": True,
            "target": file.filename,
            "findings": scan_res["findings"],
            "readiness_score": scan_res["readiness_score"],
            "file_tree": tree,
            "file_contents": files,
        }
    except Exception as e:
        logger.error("scan/upload error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@app.post("/api/recalculate")
def recalculate(req: RecalculateRequest):
    """Recalculate Quantum Readiness Score when finding resolution states change."""
    logger.info("recalculate  →  %d finding(s)", len(req.findings))
    new_score = recalculate_readiness(req.findings)
    return {"success": True, "readiness_score": new_score}


@app.post("/api/cbom")
def generate_cbom(req: CbomRequest):
    """Export CycloneDX 1.6 Cryptography Bill of Materials (CBOM) JSON."""
    logger.info("cbom  →  findings=%s, path=%s", len(req.findings) if req.findings else 0, req.path)
    try:
        import json as py_json
        if req.findings is not None:
            cbom_str = export_to_cyclonedx_json({"findings": req.findings, "readiness_score": 0})
            return py_json.loads(cbom_str)
        elif req.path and os.path.exists(req.path):
            scan_res = run_pipeline(req.path)
            cbom_str = export_to_cyclonedx_json(scan_res)
            return py_json.loads(cbom_str)
        else:
            cbom_str = export_to_cyclonedx_json({"findings": [], "readiness_score": 100})
            return py_json.loads(cbom_str)
    except Exception as e:
        logger.error("cbom error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    logger.info("=" * 60)
    logger.info("  ECDAT Backend API  —  http://%s:%d", host, port)
    logger.info("  Docs               →  http://%s:%d/docs", host, port)
    logger.info("=" * 60)

    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=False,
        access_log=True,
        log_level="info",
    )

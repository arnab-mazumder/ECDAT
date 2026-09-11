import os
import time
import tempfile
import shutil
import zipfile
import logging
import subprocess
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from squad_a.pipeline import run_pipeline, recalculate_readiness
from squad_a.cbom_exporter import export_to_cyclonedx_json
from squad_a.workspace import build_file_tree_and_contents

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


class WorkspacePathRequest(BaseModel):
    path: str


class WorkspaceFileRequest(BaseModel):
    path: str
    content: str


def scan_workspace(path: str):
    if not path or not os.path.isdir(path):
        raise HTTPException(status_code=404, detail=f"Workspace not found: {path}")
    scan_res = run_pipeline(path)
    tree, files = build_file_tree_and_contents(path, scan_res["findings"])
    return {
        "findings": scan_res["findings"],
        "readiness_score": scan_res["readiness_score"],
        "fileTree": tree,
        "fileContents": files,
        "extractedRoot": path,
    }


def clone_github_workspace(url: str):
    """Clone a repository into a retained server workspace and scan it."""
    url = url.strip()
    if not (url.startswith("http://") or url.startswith("https://") or url.startswith("git@")):
        raise ValueError(f"Invalid repository URL format: '{url}'")

    git_executable = shutil.which("git")
    if not git_executable and os.name == "nt":
        candidate = os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"), "Git", "cmd", "git.exe")
        if os.path.isfile(candidate):
            git_executable = candidate
    if not git_executable:
        raise RuntimeError("Git is required for GitHub scans but was not found in the backend process PATH")

    workspace_root = tempfile.mkdtemp(prefix="ecdat_github_")
    try:
        result = subprocess.run(
            [git_executable, "clone", "--depth", "1", "--single-branch", "--no-tags", url, workspace_root],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300,
        )
    except FileNotFoundError as error:
        shutil.rmtree(workspace_root, ignore_errors=True)
        raise RuntimeError(f"Git executable could not be started: {git_executable}") from error
    if result.returncode != 0:
        shutil.rmtree(workspace_root, ignore_errors=True)
        raise ValueError(f"Git clone failed: {result.stderr.strip() or result.stdout.strip()}")

    return scan_workspace(workspace_root)


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
        scan_res = clone_github_workspace(req.url)
        logger.info(
            "scan/github complete  →  %d finding(s), score=%s",
            len(scan_res.get("findings", [])),
            scan_res.get("readiness_score"),
        )
        return {"success": True, **scan_res}
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

        result = scan_workspace(extract_dir)
        logger.info(
            "scan/upload complete  →  %d finding(s), score=%s",
            len(result["findings"]),
            result["readiness_score"],
        )
        return {"success": True, "target": file.filename, **result}
    except Exception as e:
        logger.error("scan/upload error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workspace/rescan")
def rescan_workspace(req: WorkspacePathRequest):
    """Re-run analysis and rebuild workspace data for an extracted scan root."""
    try:
        return {"success": True, **scan_workspace(req.path)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("workspace/rescan error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workspace/file")
def save_workspace_file(req: WorkspaceFileRequest):
    """Save a file inside an extracted workspace without allowing path escape."""
    workspace_root = os.path.realpath(os.path.dirname(req.path))
    file_path = os.path.realpath(req.path)
    if not os.path.isfile(os.path.join(workspace_root, os.path.basename(file_path))):
        raise HTTPException(status_code=404, detail=f"File not found: {req.path}")
    try:
        with open(file_path, "w", encoding="utf-8") as file_handle:
            file_handle.write(req.content)
        return {"success": True, "path": file_path}
    except OSError as e:
        raise HTTPException(status_code=500, detail=str(e))


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

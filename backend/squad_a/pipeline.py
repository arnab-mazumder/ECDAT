"""
SHARED FILE — Person 2 owns merging this.
Orchestrates: scanner -> artifacts -> risk_engine -> recommender

THIS FILE IS SQUAD A'S ENTIRE CONTRACT WITH SQUAD B.
Squad B's backend imports run_pipeline() and run_pipeline_from_github()
directly as Python functions — do not rename them without telling Squad B.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed

from squad_a.scanner.python_scanner import scan_python
from squad_a.scanner.java_scanner import scan_java
from squad_a.scanner.js_scanner import scan_js
from squad_a.scanner.go_scanner import scan_go
from squad_a.scanner.c_scanner import scan_c
from squad_a.scanner.config_scanner import scan_config
from squad_a.scanner.github_fetcher import clone_and_get_path
from squad_a.artifacts.cert_parser import scan_certs
from squad_a.risk_engine.mosca_scorer import score_findings
from squad_a.risk_engine.readiness_score import compute_readiness
from squad_a.recommender.pqc_mapping import add_recommendations
from squad_a.recommender.rationale_gen import add_rationale
from squad_a.recommender.fix_templates import add_fix_diffs


def run_pipeline(target_path: str) -> dict:
    """
    Full pipeline: takes a local folder path, returns
    {"findings": [...], "readiness_score": int}
    Called directly by Squad B's backend — no CLI wrapper needed.
    """
    # 1. Execute all scanners in parallel (they walk the filesystem independently)
    scanners = {
        "python": scan_python,
        "java":   scan_java,
        "js":     scan_js,
        "go":     scan_go,
        "c":      scan_c,
        "config": scan_config,
        "certs":  scan_certs,
    }

    results = {}
    with ThreadPoolExecutor(max_workers=len(scanners)) as executor:
        future_to_name = {
            executor.submit(fn, target_path): name
            for name, fn in scanners.items()
        }
        for future in as_completed(future_to_name):
            name = future_to_name[future]
            try:
                results[name] = future.result()
            except Exception as exc:  # noqa: BLE001
                results[name] = []  # one failing scanner never blocks the rest

    raw_findings = (
        results.get("python", []) +
        results.get("java",   []) +
        results.get("js",     []) +
        results.get("go",     []) +
        results.get("c",      []) +
        results.get("config", []) +
        results.get("certs",  [])
    )

    # 2. Risk scoring (Mosca's Algorithm)
    scored_findings = score_findings(raw_findings)

    # 3. Recommendations & PQC mappings
    recommended_findings = add_recommendations(scored_findings)

    # 4. Audit Rationale Generation
    annotated_findings = add_rationale(recommended_findings)

    # 5. Code Fix Diffs
    final_findings = add_fix_diffs(annotated_findings)

    # 6. Aggregate Quantum Readiness Score
    readiness = compute_readiness(final_findings)

    return {
        "findings": final_findings,
        "readiness_score": readiness,
    }


def run_pipeline_from_github(url: str) -> dict:
    """
    Wraps run_pipeline() with a live GitHub clone step.
    Called directly by Squad B's backend for the live-URL wow-factor demo.
    """
    with clone_and_get_path(url) as temp_path:
        return run_pipeline(temp_path)


def recalculate_readiness(findings: list[dict]) -> int:
    """
    Called live by Squad B every time a judge toggles "simulate fix applied"
    in the demo. Must be FAST — no full pipeline re-run, just re-aggregation.
    """
    return compute_readiness(findings)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        result = run_pipeline(sys.argv[1])
        print(f"Scanned {sys.argv[1]}: found {len(result['findings'])} issues. Readiness Score: {result['readiness_score']}/100")
        for idx, f in enumerate(result['findings'], start=1):
            print(f"\n[{idx}] {f['algorithm']} in {f['file']}:{f['line']} | Risk Score: {f['risk_score']} ({f['risk_bucket']})")
            print(f"    Fix: {f['suggested_fix'].splitlines()[0]}")


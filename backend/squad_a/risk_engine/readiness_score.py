"""
PERSON 2 owns this file. WOW-FACTOR feature.
Aggregate 0-100 Quantum Readiness Score across all findings.

CRITICAL: Squad B's backend calls compute_readiness() live, every time a
judge toggles "simulate fix applied" in the demo UI. This must return in
milliseconds, not seconds — never re-run the full scan pipeline for this.
"""


def compute_readiness(findings: list[dict]) -> int:
    """
    Takes findings list (each with risk_score already attached, some
    possibly marked "resolved": True), returns single 0-100 score.
    Resolved findings are excluded from the calculation.
    """
    active = [f for f in findings if not f.get("resolved", False)]
    if not active:
        return 100

    total_risk = sum(f.get("risk_score", 0) for f in active)
    avg_risk = total_risk / len(active)
    
    # Volume penalization factor (smooth logarithmic scaling for codebase size)
    volume_factor = min(20, len(active) * 2)
    
    raw_score = 100 - (avg_risk * 0.8 + volume_factor)
    return max(0, min(100, round(raw_score)))


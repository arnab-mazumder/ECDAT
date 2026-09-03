"""
PERSON 3 owns this file.
Template-based rationale sentence generation, referencing risk_engine's numbers.
"""


def generate_rationale(finding: dict) -> str:
    """
    Produces a readable, audit-ready rationale sentence like:
    "RSA detected in auth.py (line 42). Given estimated 10.0-year data retention and 0.5-year
    migration timeframe, total exposure window (10.5 yrs) exceeds the 10.0-year quantum threat horizon.
    Recommended: ML-KEM-768 / ML-DSA-65 (NIST FIPS 203 / FIPS 204)."
    """
    algorithm = finding.get("algorithm", "Cryptographic artifact")
    file_path = finding.get("file", "unknown file")
    line = finding.get("line", 1)
    
    key_size = finding.get("key_size")
    key_str = f" ({key_size}-bit)" if key_size else ""
    
    X = finding.get("_X", 5.0)
    Y = finding.get("_Y", 0.5)
    Z = finding.get("_Z", 10.0)
    risk_gap = finding.get("risk_gap_years", round((X + Y) - Z, 2))
    
    rec = finding.get("recommendation", "PQC migration")
    std = finding.get("recommendation_standard", "NIST PQC Standards")

    if risk_gap > 0:
        horizon_assessment = f"exceeds the estimated {Z}-year quantum threat horizon by {risk_gap} years, rendering data vulnerable to 'harvest now, decrypt later' attacks today."
    else:
        horizon_assessment = f"is within the {Z}-year quantum threat horizon, but requires proactive migration to meet compliance standards."

    return (
        f"{algorithm}{key_str} detected in `{file_path}` at line {line}. "
        f"Assumed data lifetime of {X} years and migration window of {Y} years yields an exposure period of {X + Y} years, which {horizon_assessment} "
        f"Recommended replacement: {rec} ({std})."
    )


def add_rationale(findings: list[dict]) -> list[dict]:
    for f in findings:
        f["rationale"] = generate_rationale(f)
        # Clean up temporary internal calculation fields
        f.pop("_X", None)
        f.pop("_Y", None)
        f.pop("_Z", None)
    return findings


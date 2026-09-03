"""
SHARED FILE — agreed on by all 3 people before writing detection logic.
Every module's output must conform to this shape.
Squad B's backend will consume this exact shape via run_pipeline() —
do not change field names without telling Squad B.
"""

from dataclasses import dataclass, asdict
import uuid

@dataclass
class CryptoFinding:
    id: str
    algorithm: str
    key_size: int | None
    file: str
    line: int
    artifact_type: str  # "source_code" or "certificate"
    language: str  # "python", "java", "n/a"
    detected_pattern: str
    original_code: str
    
    # Risk Engine fields
    risk_score: int = 0
    risk_bucket: str = "Low"
    risk_gap_years: float = 0.0
    
    # Recommendation fields
    recommendation: str = ""
    recommendation_standard: str = ""
    rationale: str = ""
    suggested_fix: str = ""
    fix_confidence: str = "manual_review"  # "template-based" or "manual_review"
    
    # Resolution toggle (for Squad B UI simulation)
    resolved: bool = False

    def to_dict(self) -> dict:
        return asdict(self)


def create_finding(
    algorithm: str,
    file: str,
    line: int,
    artifact_type: str,
    language: str,
    detected_pattern: str,
    original_code: str,
    key_size: int | None = None,
    finding_id: str | None = None,
) -> dict:
    """Helper function to return a validated finding dict matching Squad B's contract."""
    finding = CryptoFinding(
        id=finding_id or str(uuid.uuid4()),
        algorithm=algorithm,
        key_size=key_size,
        file=file,
        line=line,
        artifact_type=artifact_type,
        language=language,
        detected_pattern=detected_pattern,
        original_code=original_code,
    )
    return finding.to_dict()


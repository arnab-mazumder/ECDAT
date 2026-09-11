"""
SHARED — integration test running the full pipeline end-to-end.
"""

from pathlib import Path
from squad_a.pipeline import run_pipeline, recalculate_readiness
from squad_a.artifacts.cert_parser import scan_certs
from squad_a.risk_engine.mosca_scorer import score_findings
from squad_a.risk_engine.readiness_score import compute_readiness

BASE_DIR = Path(__file__).parent


def test_pipeline_vulnerable_python_repo():
    result = run_pipeline(str(BASE_DIR / "test_repos/repo1_vulnerable_python"))
    assert "findings" in result
    assert "readiness_score" in result
    
    findings = result["findings"]
    assert len(findings) >= 3  # MD5, RSA 1024, DES, TLS 1.0
    
    algorithms = [f["algorithm"] for f in findings]
    assert "MD5" in algorithms
    assert "RSA" in algorithms
    assert "DES" in algorithms

    # Verify schema fields present
    for f in findings:
        assert "risk_score" in f
        assert "risk_bucket" in f
        assert "recommendation" in f
        assert "rationale" in f
        assert "suggested_fix" in f


def test_pipeline_vulnerable_java_repo():
    result = run_pipeline(str(BASE_DIR / "test_repos/repo2_vulnerable_java"))
    findings = result["findings"]
    assert len(findings) >= 3  # MD5, DES, RSA 1024, TLS 1.0

    algorithms = [f["algorithm"] for f in findings]
    assert "MD5" in algorithms
    assert "DES" in algorithms
    assert "RSA" in algorithms


def test_pipeline_clean_repo():
    result = run_pipeline(str(BASE_DIR / "test_repos/repo3_clean"))
    findings = result["findings"]
    # Clean repo uses SHA-256, AES, RSA 4096 (which should not trigger weak RSA)
    assert len(findings) == 0
    assert result["readiness_score"] == 100


def test_weak_rsa_is_critical():
    findings = score_findings([
        {"algorithm": "RSA", "key_size": 1024, "artifact_type": "source_code", "file": "auth/token.py"},
        {"algorithm": "RSA", "key_size": 2048, "artifact_type": "source_code", "file": "auth/token.py"},
    ])

    assert findings[0]["risk_score"] == 80
    assert findings[0]["risk_bucket"] == "Critical"
    assert findings[1]["risk_score"] == 80
    assert findings[1]["risk_bucket"] == "Critical"


def test_shor_vulnerable_public_key_families_are_critical():
    algorithms = ("ECDSA", "ECDH/X25519", "Ed25519/Ed448", "DH", "Diffie-Hellman")
    findings = score_findings([
        {"algorithm": algorithm, "artifact_type": "source_code", "file": "crypto/key.py"}
        for algorithm in algorithms
    ])

    assert all(finding["risk_score"] >= 80 for finding in findings)
    assert all(finding["risk_bucket"] == "Critical" for finding in findings)


def test_md5_is_critical():
    finding = score_findings([{"algorithm": "MD5", "file": "hashing.py"}])[0]

    assert finding["risk_score"] >= 80
    assert finding["risk_bucket"] == "Critical"


def test_readiness_is_average_of_active_risk_scores():
    findings = [
        {"risk_score": 48}, {"risk_score": 48}, {"risk_score": 48}, {"risk_score": 48},
        {"risk_score": 58}, {"risk_score": 58},
        {"risk_score": 80}, {"risk_score": 80},
    ]

    assert compute_readiness(findings) == 59
    assert compute_readiness(findings + [{"risk_score": 100, "resolved": True}]) == 59


def test_cert_parser():
    weak_findings = scan_certs(str(BASE_DIR / "sample_certs"))
    assert len(weak_findings) >= 1
    
    cert_finding = weak_findings[0]
    assert cert_finding["artifact_type"] == "certificate"
    assert cert_finding["algorithm"] in ("RSA", "ECDSA")


def test_readiness_recalculation_toggle():
    result = run_pipeline(str(BASE_DIR / "test_repos/repo1_vulnerable_python"))
    findings = result["findings"]
    
    initial_score = recalculate_readiness(findings)
    assert initial_score < 100

    # Simulate resolving all findings
    for f in findings:
        f["resolved"] = True

    resolved_score = recalculate_readiness(findings)
    assert resolved_score == 100


if __name__ == "__main__":
    test_pipeline_vulnerable_python_repo()
    test_pipeline_vulnerable_java_repo()
    test_pipeline_clean_repo()
    test_cert_parser()
    test_readiness_recalculation_toggle()
    print("All ECDAT Squad A tests passed successfully!")



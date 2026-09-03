"""
CI/CD Runner Script for ECDAT.
Executes repository cryptographic scanning in automated CI/CD pipelines (GitHub Actions, GitLab CI).
Fails build (exit code 1) if high-risk or critical findings exist, or if readiness score falls below threshold.
"""

import sys
import argparse
from squad_a.pipeline import run_pipeline
from squad_a.cbom_exporter import export_to_cyclonedx_file


def main():
    parser = argparse.ArgumentParser(description="ECDAT Cryptographic Discovery CI/CD Runner")
    parser.add_argument("target_path", nargs="?", default=".", help="Path to repository to scan")
    parser.add_argument("--min-readiness", type=int, default=70, help="Minimum acceptable Quantum Readiness Score (default: 70)")
    parser.add_argument("--fail-on-critical", action="store_true", default=True, help="Fail build if Critical findings are detected")
    parser.add_argument("--output-cbom", type=str, default="", help="Optional output path for CycloneDX 1.6 CBOM JSON file")
    
    args = parser.parse_args()

    print("================================================================")
    print(" 🛡️  ECDAT — Enterprise Cryptographic Discovery CI/CD Scanner")
    print("================================================================")
    print(f"Scanning target: {args.target_path}")

    result = run_pipeline(args.target_path)
    findings = result.get("findings", [])
    readiness_score = result.get("readiness_score", 100)

    print(f"\n📊 Scan Complete: {len(findings)} cryptographic artifact(s) identified.")
    print(f"📈 Aggregate Quantum Readiness Score: {readiness_score} / 100\n")

    critical_count = 0
    high_count = 0

    for idx, f in enumerate(findings, start=1):
        bucket = f.get("risk_bucket", "Low")
        score = f.get("risk_score", 0)
        if bucket == "Critical":
            critical_count += 1
        elif bucket == "High":
            high_count += 1

        print(f" [{idx}] [{bucket.upper()}] {f['algorithm']} in {f['file']}:{f['line']}")
        print(f"     Risk Score: {score}/100 | Mosca Gap: {f['risk_gap_years']} yrs")
        print(f"     Recommendation: {f['recommendation']} ({f['recommendation_standard']})")
        print(f"     Fix: {f['suggested_fix'].splitlines()[0]}\n")

    if args.output_cbom:
        cbom_path = export_to_cyclonedx_file(result, args.output_cbom)
        print(f"📄 Exported CycloneDX 1.6 CBOM to: {cbom_path}")

    # Check failure conditions for CI/CD pipeline
    should_fail = False
    fail_reasons = []

    if readiness_score < args.min_readiness:
        should_fail = True
        fail_reasons.append(f"Quantum Readiness Score ({readiness_score}) is below minimum threshold ({args.min_readiness}).")

    if args.fail_on_critical and (critical_count > 0 or high_count > 0):
        should_fail = True
        fail_reasons.append(f"Detected {critical_count} Critical and {high_count} High risk findings in codebase.")

    if should_fail:
        print("❌ CI/CD Pipeline Check Failed:")
        for reason in fail_reasons:
            print(f"   - {reason}")
        sys.exit(1)
    else:
        print("✅ CI/CD Pipeline Check Passed: All cryptographic checks within threshold limits.")
        sys.exit(0)


if __name__ == "__main__":
    main()

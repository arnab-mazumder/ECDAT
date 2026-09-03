"""
OWASP CycloneDX 1.6 CBOM (Cryptographic Bill of Materials) Exporter.
Exports ECDAT scan findings into the official CycloneDX 1.6 JSON format.
"""

import json
from datetime import datetime, timezone


def export_to_cyclonedx_json(pipeline_result: dict, indent: int = 2) -> str:
    """
    Converts pipeline_result dict {"findings": [...], "readiness_score": int}
    into an official OWASP CycloneDX 1.6 CBOM JSON string.
    """
    findings = pipeline_result.get("findings", [])
    readiness_score = pipeline_result.get("readiness_score", 100)

    bom = {
        "$schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "version": 1,
        "metadata": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tools": {
                "components": [
                    {
                        "type": "application",
                        "publisher": "ECDAT Squad A",
                        "name": "Enterprise Cryptographic Discovery & Analysis Tool",
                        "version": "1.0.0",
                    }
                ]
            },
            "properties": [
                {
                    "name": "ecdat:quantum_readiness_score",
                    "value": str(readiness_score),
                }
            ],
        },
        "components": [],
    }

    for idx, finding in enumerate(findings, start=1):
        algo = finding.get("algorithm", "UNKNOWN")
        key_size = finding.get("key_size")
        artifact_type = finding.get("artifact_type", "source_code")
        file_path = finding.get("file", "unknown")
        line = finding.get("line", 1)
        risk_bucket = finding.get("risk_bucket", "Low")
        risk_score = finding.get("risk_score", 0)
        recommendation = finding.get("recommendation", "")
        std = finding.get("recommendation_standard", "")

        # Categorize primitive type
        primitive = "other"
        if algo in ("MD5", "SHA1"):
            primitive = "hash"
        elif algo in ("DES", "3DES", "RC4"):
            primitive = "symmetric-cipher"
        elif algo in ("RSA", "ECDSA", "DSA"):
            primitive = "public-key"
        elif "TLS" in algo or "SSL" in algo:
            primitive = "protocol"
        elif "DH" in algo:
            primitive = "key-exchange"

        component = {
            "type": "cryptographic-asset",
            "bom-ref": f"crypto-asset-{idx}-{finding.get('id', 'uuid')}",
            "name": f"{algo}{f' ({key_size}-bit)' if key_size else ''}",
            "cryptoProperties": {
                "assetType": "algorithm",
                "algorithmProperties": {
                    "primitive": primitive,
                    "parameterSet": f"{key_size}-bit" if key_size else "default",
                    "executionEnvironment": "software-user-space",
                    "cryptoFunctions": ["keygen", "encrypt", "sign"] if primitive == "public-key" else ["hash"],
                },
                "oid": "",
            },
            "evidence": {
                "occurrences": [
                    {
                        "location": file_path,
                        "line": line,
                        "offset": 0,
                        "symbol": finding.get("detected_pattern", ""),
                    }
                ]
            },
            "properties": [
                {"name": "ecdat:risk_score", "value": str(risk_score)},
                {"name": "ecdat:risk_bucket", "value": risk_bucket},
                {"name": "ecdat:recommendation", "value": recommendation},
                {"name": "ecdat:recommendation_standard", "value": std},
                {"name": "ecdat:suggested_fix", "value": finding.get("suggested_fix", "")},
            ],
        }
        bom["components"].append(component)

    return json.dumps(bom, indent=indent)


def export_to_cyclonedx_file(pipeline_result: dict, output_path: str):
    """Writes the CycloneDX 1.6 CBOM JSON output to a file."""
    json_str = export_to_cyclonedx_json(pipeline_result)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(json_str)
    return output_path


if __name__ == "__main__":
    import sys
    from squad_a.pipeline import run_pipeline

    if len(sys.argv) > 1:
        res = run_pipeline(sys.argv[1])
        print(export_to_cyclonedx_json(res))

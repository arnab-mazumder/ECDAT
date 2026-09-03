# Competitor Analysis & ECDAT Differentiation

---

## 1. IBM Quantum Safe Explorer
- **What it does:** Scans enterprise source code repositories and binaries to build cryptographic inventories integrated into IBM's Quantum Safe Transformation suite.
- **Key limitation:** High enterprise licensing cost, locked into IBM's cloud ecosystem, heavy infrastructure requirements, and lack of localized/air-gapped deployment for mid-market orgs.
- **Gap ECDAT fills:** ECDAT provides a lightweight, zero-dependency, open-schema local engine with transparent Mosca risk scoring formula and instant developer-focused code fix diffs.

## 2. SandboxAQ Security Suite
- **What it does:** Enterprise cryptography management platform focusing on network traffic discovery, TLS certificate monitoring, and automated PQC agility control.
- **Key limitation:** Proprietary closed-source SaaS model requiring agent deployment across client infrastructure; expensive for non-Fortune 500 enterprises.
- **Gap ECDAT fills:** ECDAT is completely deterministic, rule-based, and compliance-auditable without sending sensitive code repositories to external SaaS endpoints.

## 3. OWASP CycloneDX CBOM (Cryptographic Bill of Materials)
- **What it does:** Defines an open standard JSON/XML specification format for representing cryptographic assets and dependencies in software bill of materials.
- **Key limitation:** CycloneDX defines the *data specification format* only; it does not ship an active detection scanner, Mosca algorithm risk calculator, or remediation engine out of the box.
- **Gap ECDAT fills:** ECDAT implements the end-to-end operational pipeline: active scanning -> CBOM asset extraction -> quantitative Mosca risk gap scoring -> automated PQC code fix generation.


# Stakeholder Pain-Point Scenarios

---

## Scenario 1: Tier-1 Commercial Bank Facing RBI Cybersecurity Audit
A major Indian commercial bank undergoing a mandatory Reserve Bank of India (RBI) cybersecurity framework audit is required to produce a complete inventory of public-key cryptography across its legacy core banking systems. The security team lacks automated discovery tooling and faces manual repository audits across hundreds of microservices. **Cost of Inaction:** Non-compliance risks regulatory fines, severe audit penalties, and vulnerability to "harvest now, decrypt later" adversary interception targeting wire transactions and customer financial records.

## Scenario 2: State-Level Land Records Government Agency (DoLR Scale)
A state-level government department storing 15+ year retention land ownership titles and digital identity signatures relies on legacy TLS 1.0 web servers and 1024-bit RSA certificates deployed years ago without lifecycle tracking. **Cost of Inaction:** Data captured today by adversaries will be decrypted once quantum computing matures within 10 years, compromising legal land deeds, citizen PII, and sovereign data trust without any retrospective remediation path.

## Scenario 3: Mid-Size SaaS Provider Preparing for Enterprise Vendor Audits
A fast-growing B2B SaaS company managing 40+ microservices has no visibility into which legacy services still utilize static Diffie-Hellman key exchange or MD5 hashing in internal service-to-service auth tokens. During enterprise SOC2 / ISO27001 audit evaluations, enterprise clients demand Post-Quantum Cryptography (PQC) readiness roadmaps. **Cost of Inaction:** Lost enterprise deal flow, failed vendor risk assessments, and costly emergency refactoring cycles under strict audit deadlines.


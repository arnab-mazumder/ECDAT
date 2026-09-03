# Squad A — Detailed 3-Person Breakdown with Shared Codebase Structure

---

## Shared Codebase Structure (lock this in Day 1 — everyone commits to this exact layout)

```
ecdat/
├── squad_a/
│   ├── __init__.py
│   ├── scanner/
│   │   ├── __init__.py
│   │   ├── python_scanner.py        # Person 1 — AST-based Python detection
│   │   ├── java_scanner.py          # Person 1 — regex-based Java detection
│   │   ├── signatures.py            # Person 1 — shared signature/pattern definitions (both use this)
│   │   └── github_fetcher.py        # Person 1 — clone + temp dir management
│   │
│   ├── artifacts/
│   │   ├── __init__.py
│   │   ├── cert_parser.py           # Person 2 — cert/key file parsing
│   │   └── artifact_utils.py        # Person 2 — file-type detection helpers (.pem/.key/.crt/.jks)
│   │
│   ├── risk_engine/
│   │   ├── __init__.py
│   │   ├── mosca_scorer.py          # Person 2 — core Mosca's algorithm scoring
│   │   ├── readiness_score.py       # Person 2 — aggregate Quantum Readiness Score (wow-factor)
│   │   └── lookup_tables.py         # Person 2 — X (data lifetime), Y (migration time), Z (threat horizon)
│   │
│   ├── recommender/
│   │   ├── __init__.py
│   │   ├── pqc_mapping.py           # Person 3 — classical→PQC algorithm mapping table
│   │   ├── rationale_gen.py         # Person 3 — rationale sentence templates
│   │   └── fix_templates.py         # Person 3 — code fix diff generation (wow-factor)
│   │
│   ├── pipeline.py                  # SHARED — orchestrates scanner → artifacts → risk_engine → recommender
│   ├── schema.py                    # SHARED — the agreed JSON schema as a Python dataclass/pydantic model
│   └── config.py                    # SHARED — constants, thresholds, file caps
│
├── research/                        # Person 3 — not code, markdown docs
│   ├── stakeholder_scenarios.md
│   ├── competitor_analysis.md
│   └── impact_numbers.md
│
├── tests/
│   ├── test_repos/                  # the 3 locked demo repos (as git submodules or local copies) + 1 fallback repo
│   ├── sample_certs/                # self-generated weak/strong certs
│   └── test_pipeline.py             # SHARED — integration test running full pipeline end-to-end
│
└── README.md
```

**Non-negotiable rule:** `schema.py` is written together, on Day 1, before anyone writes detection logic. Every module's output must conform to it. If someone needs a new field, they add it to `schema.py` first and message the other two — nobody silently changes the shape of their output.

**`pipeline.py` is shared but has one owner for merging** (suggest Person 2, since risk scoring sits in the middle of the flow) — everyone else's modules are simple function imports into it:

```python
# pipeline.py — illustrative shape, not final code
from scanner.python_scanner import scan_python
from scanner.java_scanner import scan_java
from artifacts.cert_parser import scan_certs
from risk_engine.mosca_scorer import score_findings
from risk_engine.readiness_score import compute_readiness
from recommender.pqc_mapping import add_recommendations
from recommender.fix_templates import add_fix_diffs

def run_pipeline(target_path):
    findings = scan_python(target_path) + scan_java(target_path) + scan_certs(target_path)
    findings = score_findings(findings)
    findings = add_recommendations(findings)
    findings = add_fix_diffs(findings)
    readiness = compute_readiness(findings)
    return {"findings": findings, "readiness_score": readiness}
```

---

## PERSON 1 — Source Code Scanner + GitHub Live Scanning

**Owns:** `scanner/` folder entirely, plus `tests/test_repos/`

### What you're actually building
A function that takes a folder path, walks every file in it, and returns a list of raw findings — every place a weak or deprecated cryptographic API is used, with exact file and line number. Plus, a second function that takes a GitHub URL, clones it, and feeds it into the same scanner.

### Detailed Checklist

**Setup (Day 1)**
- [ ] Create `scanner/signatures.py` — this is your single source of truth for what counts as "weak crypto." Structure it as a list of dicts:
  ```python
  SIGNATURES = [
      {"algorithm": "MD5", "language": "python", "pattern": r"hashlib\.md5\(", "category": "hashing"},
      {"algorithm": "DES", "language": "python", "pattern": r"Crypto\.Cipher\.DES", "category": "symmetric"},
      {"algorithm": "RSA", "language": "python", "pattern": r"RSA\.generate\((\d+)", "category": "asymmetric", "weak_if": "keysize < 2048"},
      # ... minimum 6 patterns before you move on
  ]
  ```
- [ ] Confirm `schema.py` fields with Person 2 and Person 3 before writing any detection code — your output must match exactly
- [ ] Set up `tests/test_repos/` — clone your 3 locked demo repos locally now, don't wait

**Python Scanner (`scanner/python_scanner.py`)**
- [ ] Write a file-walker that recursively finds all `.py` files in a target directory, skipping `.git/`, `venv/`, `node_modules/`, etc.
- [ ] For each file, parse it with Python's `ast` module (`ast.parse(open(file).read())`)
- [ ] Walk the AST tree (`ast.walk(tree)`) looking for `Call` nodes and `Import` nodes matching your signature list
- [ ] For each match, capture: exact line number (`node.lineno`), the matched algorithm name, and — critically for the wow-factor fix-diff feature — **the actual source line text** (use `linecache.getline(file, lineno)` to grab it)
- [ ] Extract key size where relevant (e.g. parse the argument to `RSA.generate(1024)` — walk the `Call.args` to pull the literal value)
- [ ] Return findings as a list of dicts matching `schema.py`
- [ ] **Test:** write one deliberately-vulnerable test `.py` file yourself with 5-6 known issues, confirm your scanner catches every single one before touching a real repo
- [ ] Run against your 3 locked demo repos, manually eyeball the first 10 findings from each — confirm they're real, not false positives

**Java Scanner (`scanner/java_scanner.py`)**
- [ ] Same file-walker pattern but for `.java` files
- [ ] Since you're not building a full Java AST parser, use regex line-by-line matching against your signature patterns (`MessageDigest\.getInstance\("MD5"\)`, `Cipher\.getInstance\("DES"\)`, `KeyPairGenerator\.getInstance\("RSA"\)` combined with nearby `.initialize(1024...)` calls)
- [ ] Capture file, line number, matched text — same output shape as the Python scanner
- [ ] Test against a hand-written vulnerable `.java` file first, then your real demo repos

**GitHub Live Scanning (`scanner/github_fetcher.py`) — Wow Factor**
- [ ] Install and use `GitPython`: `git.Repo.clone_from(url, temp_dir, depth=1)` — use `depth=1` (shallow clone) so it's fast enough for a live demo
- [ ] Wrap in a `tempfile.TemporaryDirectory()` context manager so cleanup is automatic
- [ ] Add a hard cap: if the cloned repo exceeds a file count or size threshold (pick something reasonable, e.g. 2,000 files or 200MB), abort with a clean error message rather than letting the scan hang
- [ ] Add basic URL validation — reject anything that isn't a plausible GitHub URL before attempting a clone
- [ ] Once cloned, call your existing `scan_python()` + Java scanner against the temp directory — **no new scanning logic needed here, this is purely an input-handling wrapper**
- [ ] Test with: (a) your 3 known demo repo URLs, (b) a deliberately oversized/irrelevant repo to confirm the cap works, (c) a broken/private URL to confirm graceful failure
- [ ] Lock in your "safe fallback repo" — pick one now, have its URL memorized for the live demo in case a judge suggests something that breaks

**Integration & Handoff**
- [ ] Confirm your output JSON validates against `schema.py` — use a real JSON schema validator, not eyeballing
- [ ] Hand working scanner functions to Person 2 (they'll be calling your output into the risk engine) by **Aug 27**
- [ ] Be available Aug 28-29 for the joint checkpoint — bring your laptop, be ready to debug live if Person 2/3's modules reveal an issue in your output format

**Hardening (Sept 2)**
- [ ] Test on: empty folder (should return empty findings list, not crash), a folder with zero crypto usage (clean success, not an error), a very large repo (respects your file-count cap, doesn't hang)
- [ ] Freeze your signature list and detection logic — bug fixes only after this point

---

## PERSON 2 — Certificate Parser + Risk Scoring Engine

**Owns:** `artifacts/` and `risk_engine/` folders entirely, plus co-owns `pipeline.py`

### What you're actually building
Two things: (1) a parser that finds and reads certificate/key files to extract their crypto properties, and (2) the scoring math that turns every raw finding (from Person 1 and your own cert parser) into a ranked risk score — plus the single aggregate "Quantum Readiness Score" for the wow-factor gauge.

### Detailed Checklist

**Setup (Day 1)**
- [ ] Confirm `schema.py` fields with Person 1 and Person 3 — your scoring functions consume their output, so agree on field names before writing code
- [ ] Generate test certificates using `openssl` locally:
  ```bash
  # weak — for testing detection
  openssl req -x509 -newkey rsa:1024 -sha1 -keyout weak.key -out weak.crt -days 365 -nodes -subj "/CN=test"
  # strong — for testing the negative case (should NOT be flagged)
  openssl req -x509 -newkey rsa:4096 -sha256 -keyout strong.key -out strong.crt -days 365 -nodes -subj "/CN=test"
  ```
  Save both into `tests/sample_certs/`
- [ ] Install `cryptography` package (`pip install cryptography`)

**Certificate Parser (`artifacts/cert_parser.py`)**
- [ ] Write `artifact_utils.py` first — a simple file-walker that finds all `.pem`, `.key`, `.crt`, `.cer`, `.jks`, `.p12` files in a target directory
- [ ] For each `.pem`/`.crt` file, load it with `x509.load_pem_x509_certificate()`
- [ ] Extract: public key algorithm + key size (`cert.public_key().key_size`), signature hash algorithm (`cert.signature_hash_algorithm.name` — flag `sha1`), expiry date (`cert.not_valid_after`)
- [ ] Flag as weak if: key size below threshold (RSA <2048, ECDSA <256-bit curve) OR signature algorithm is SHA1 or older
- [ ] Handle `.jks`/`.p12` as a stretch — if time is tight, it's acceptable to skip these and note it as a known limitation; PEM/CRT coverage is the priority
- [ ] Return findings matching `schema.py` with `artifact_type: "certificate"`
- [ ] **Test:** run against your weak.crt and strong.crt — confirm the weak one is flagged and the strong one is NOT (this negative-case test matters as much as the positive one)

**Mosca's Algorithm Scorer (`risk_engine/mosca_scorer.py`)**
- [ ] First, build `risk_engine/lookup_tables.py` with your X/Y/Z values as plain, editable constants:
  ```python
  # X: assumed data lifetime in years, by context heuristic
  DATA_LIFETIME = {
      "auth_token": 1, "session_key": 1,
      "tls_cert": 2,
      "pii_data": 10, "financial_data": 10, "default": 5
  }
  # Y: assumed migration time in years, by artifact type
  MIGRATION_TIME = {
      "source_code": 0.5, "certificate": 1.0, "embedded": 2.0
  }
  # Z: quantum threat horizon — pick ONE defensible value, cite source in comments
  QUANTUM_THREAT_HORIZON_YEARS = 10  # Source: Global Risk Institute Quantum Threat Timeline Report
  ```
- [ ] Write the core scoring function: `risk_gap = (X + Y) - Z`. Positive gap = quantum-vulnerable now
- [ ] Use simple filename/path heuristics to bump X where obvious (e.g. path contains "auth", "payment", "user_data" → treat as higher-sensitivity), otherwise use `default`
- [ ] Combine with classical severity — if the algorithm is already broken classically (MD5, DES), boost the score independent of the quantum gap
- [ ] Normalize everything to a 0-100 `risk_score` and bucket into `Critical/High/Medium/Low`
- [ ] **Test:** write 5 hand-crafted example findings where you've calculated the expected score by hand first — confirm your function produces the same number before trusting it on real data

**Quantum Readiness Score (`risk_engine/readiness_score.py`) — Wow Factor**
- [ ] Write a function that takes the full findings list (with scores already attached) and produces ONE aggregate number:
  ```python
  def compute_readiness(findings):
      if not findings:
          return 100  # clean repo = perfect score
      weighted_sum = sum(f["risk_score"] for f in findings)
      raw = 100 - (weighted_sum / len(findings))
      # normalize slightly by volume so a huge repo with many small issues
      # isn't unfairly punished vs. a tiny repo with one huge issue
      return max(0, min(100, round(raw)))
  ```
  (Tune the actual formula together with Person 3 once you're both looking at real demo-repo output — the above is a starting point, not gospel)
- [ ] **Critical for the wow-factor "what-if" toggle:** make this function accept a findings list where some are marked `"resolved": true`, and simply exclude resolved findings from the calculation. This is what Squad B calls every time a judge clicks the toggle checkbox
- [ ] Make sure this function is fast (milliseconds, not seconds) — it needs to feel instant when Squad B calls it live during the demo, not require a full pipeline re-run

**Integration & Handoff**
- [ ] Merge everyone's modules into `pipeline.py` (you're the owner of this file) — wire Person 1's scanners + your cert parser → your scorer → Person 3's recommender
- [ ] Run the full pipeline against all 3 test repos, confirm output end-to-end
- [ ] Hand off working `pipeline.py` + `compute_readiness()` function to Squad B by **Aug 28-29**
- [ ] Document your X/Y/Z values and sources clearly in `lookup_tables.py` comments — you will be asked to defend this in Q&A

**Hardening (Sept 2)**
- [ ] Test edge cases: zero findings (readiness = 100, no crash), a repo with only certificates and no source code findings, a repo with only source findings and no certs
- [ ] Freeze scoring logic — bug fixes only after this point

---

## PERSON 3 — Recommendation Engine + Fix Templates + Research

**Owns:** `recommender/` folder entirely, plus `research/` folder

### What you're actually building
The layer that turns "here's a problem" into "here's exactly what to do about it" — both as a written recommendation and, for the wow-factor, an actual code fix diff. Plus, separately, the research writeups that Squad B turns into pitch slides — this is just as important as your code and has a hard deadline.

### Detailed Checklist

**Setup (Day 1)**
- [ ] Confirm `schema.py` fields with Person 1 and Person 2 — your module adds fields on top of their output, so you're last in the pipeline and need to know the shape you're receiving
- [ ] Read NIST FIPS 203 (ML-KEM/Kyber), FIPS 204 (ML-DSA/Dilithium), FIPS 205 (SLH-DSA/SPHINCS+) summaries — you don't need to read the full specs, just understand which classical algorithm maps to which PQC replacement and why

**PQC Mapping Table (`recommender/pqc_mapping.py`)**
- [ ] Build the static lookup table, minimum 6 entries:
  ```python
  PQC_MAPPING = {
      "RSA_encryption": {"replacement": "ML-KEM-768 (Kyber)", "standard": "FIPS 203"},
      "RSA_signature": {"replacement": "ML-DSA (Dilithium)", "standard": "FIPS 204"},
      "ECDSA": {"replacement": "ML-DSA (Dilithium) or SLH-DSA for high-assurance", "standard": "FIPS 204 / FIPS 205"},
      "static_DH": {"replacement": "Hybrid ECDH + ML-KEM", "standard": "Transitional guidance"},
      "MD5": {"replacement": "SHA-256 or SHA-3", "standard": "Classical fix, not quantum-specific"},
      "DES": {"replacement": "AES-256", "standard": "Classical fix, not quantum-specific"},
  }
  ```
- [ ] Write the function that takes a finding (with its `algorithm` field) and attaches the matching recommendation + standard to it
- [ ] Handle the "no mapping found" case gracefully — fall back to a generic "manual review recommended" rather than crashing or leaving the field blank

**Rationale Generator (`recommender/rationale_gen.py`)**
- [ ] Write a template-based sentence generator — doesn't need to be fancy, just needs to reference the specific numbers already computed by Person 2:
  ```python
  def generate_rationale(finding):
      return (f"{finding['algorithm']} detected in {finding['file']}. "
              f"Given estimated {finding['data_lifetime']}-year data retention and "
              f"{finding['migration_time']}-year migration window, this "
              f"{'exceeds' if finding['risk_gap_years'] > 0 else 'is within'} "
              f"the safe quantum threat horizon. Recommended: {finding['recommendation']}.")
  ```
- [ ] Test that this produces readable, grammatically correct sentences across a range of real findings — read them out loud, fix anything awkward

**Fix Templates (`recommender/fix_templates.py`) — Wow Factor**
- [ ] For your **3-4 most common findings across the demo repos specifically** (check with Person 1 on what actually gets detected most in your 3 locked repos — prioritize those, don't try to cover every possible signature), write an actual code replacement snippet:
  ```python
  FIX_TEMPLATES = {
      "RSA_1024_python": {
          "original_pattern": "RSA.generate(1024)",
          "suggested_fix": "oqs.KeyEncapsulation('Kyber768')  # ML-KEM-768, FIPS 203",
      },
      # ... 2-3 more for your most common demo findings
  }
  ```
- [ ] Write the function that attaches `original_code` (pulled from Person 1's captured source line) and `suggested_fix` (from your template) to each finding
- [ ] For findings without a specific fix template, fall back to `fix_confidence: "manual_review"` with no suggested_fix — be honest about coverage rather than faking a fix for everything
- [ ] **Test:** confirm the diff actually makes sense side-by-side for your top 3-4 demo findings — this is your single highest-visibility feature, sanity check it looks genuinely good, not just technically present

**Research Deliverables (`research/` folder — due Aug 27, hand directly to Squad B)**

- [ ] **`stakeholder_scenarios.md`** — write 3 concrete pain-point scenarios, 3-4 sentences each:
  1. A bank's security team facing an RBI cybersecurity framework audit with no crypto inventory
  2. A government agency storing 10+ year retention data with legacy TLS certs never reviewed since deployment
  3. A mid-size SaaS company with 40+ microservices, no idea which still use RSA-1024 for internal auth
  
  Each should include a rough "cost of inaction" framing — specificity wins points here, generic "security matters" framing does not

- [ ] **`competitor_analysis.md`** — research and document 3 existing tools:
  1. IBM Quantum Safe Explorer — what it does, key limitation (enterprise-only, licensing cost)
  2. SandboxAQ Security Suite — what it does, key limitation
  3. OWASP CycloneDX CBOM module — what it does, key limitation (defines format, doesn't ship risk scoring)
  
  For each: 2-3 sentences on capability, 1-2 sentences on the specific gap ECDAT fills that they don't

- [ ] **`impact_numbers.md`** — gather 3-4 real, citable numbers:
  1. Rough estimate of Indian enterprises under RBI/SEBI cybersecurity framework mandates (find a source, cite it)
  2. India's National Quantum Mission — ₹6,003 crore, launched 2023 (cite the government announcement)
  3. Any specific CERT-In advisory on crypto-agility if you can find one
  4. One sentence on your scale roadmap (2 languages today → CI/CD-integrated continuous scanning)

- [ ] Hand all three files to Squad B by **Aug 27** — this is a hard deadline, they need this to start drafting Slides 1, 2, and 5 before Aug 28

**Integration & Handoff**
- [ ] Your module is last in the pipeline — wait for Person 2's `pipeline.py` to be ready before wiring in, but build and test your functions standalone against mock/hand-crafted findings in the meantime so you're not blocked
- [ ] Confirm your added schema fields (`recommendation`, `rationale`, `original_code`, `suggested_fix`, `fix_confidence`) are all present and correctly formatted once wired into the real pipeline
- [ ] Be available Aug 28-29 for the joint checkpoint

**Hardening (Sept 2)**
- [ ] Test that findings with no matching fix template still degrade gracefully in the UI (Squad B needs to know what an "unhandled" finding looks like)
- [ ] Freeze recommendation/fix logic — bug fixes only after this point

---

## Shared Checkpoints (all 3 people, mandatory attendance)

- **Aug 27** — Person 3's research deliverables go to Squad B (hard deadline)
- **Aug 28-29** — full pipeline integration checkpoint: run scanner → cert parser → scorer → recommender → fix templates end-to-end on all 3 test repos together, in the same room, fix mismatches live
- **Sept 1** — joint session with Squad B, full end-to-end system test including the live demo flow
- **Sept 2** — freeze all logic across all three people's modules, edge-case testing only

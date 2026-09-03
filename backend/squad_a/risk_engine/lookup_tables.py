"""
PERSON 2 owns this file.
X/Y/Z values for Mosca's algorithm. Keep these editable and documented —
you will be asked to defend these numbers in Q&A.
"""

# X: assumed data lifetime in years, by context heuristic
DATA_LIFETIME = {
    "auth_token": 1.0,
    "session_key": 1.0,
    "tls_cert": 2.0,
    "pii_data": 10.0,
    "financial_data": 10.0,
    "long_term_record": 15.0,
    "default": 5.0,
}

# Y: assumed migration time in years, by artifact type
MIGRATION_TIME = {
    "source_code": 0.5,
    "certificate": 1.0,
    "embedded": 2.0,
}

# Z: quantum threat horizon — estimated years until a cryptographically relevant quantum computer exists.
# Source: Global Risk Institute (GRI) Quantum Threat Timeline Report & NIST PQC Migration Guidelines
QUANTUM_THREAT_HORIZON_YEARS = 10.0


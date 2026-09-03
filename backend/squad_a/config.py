"""
SHARED FILE — constants, thresholds, caps used across modules.
"""

# GitHub live-scan safety limits
MAX_REPO_FILE_COUNT = 2000
MAX_REPO_SIZE_MB = 200
CLONE_DEPTH = 1  # shallow clone for speed

# Weak-key thresholds
RSA_MIN_SAFE_KEYSIZE = 2048
ECDSA_MIN_SAFE_KEYSIZE = 256

# Fallback demo repo for live GitHub scanning if a judge-suggested URL fails
SAFE_FALLBACK_REPO_URL = "https://github.com/pyca/cryptography"


"""
SHARED FILE — constants, thresholds, caps, and ignore rules used across scanner modules.
"""

# GitHub live-scan safety limits
MAX_REPO_FILE_COUNT = 10000   # scannable files
MAX_REPO_SIZE_MB = 500         # total repo size after clone
CLONE_DEPTH = 1                # shallow clone for speed

# Weak-key thresholds (NIST SP 800-131A)
RSA_MIN_SAFE_KEYSIZE = 2048
ECDSA_MIN_SAFE_KEYSIZE = 256

# Fallback demo repo for live GitHub scanning
SAFE_FALLBACK_REPO_URL = "https://github.com/pyca/cryptography"

# Directories out of scope for crypto scanning (media, assets, CI workflows, build outputs)
IGNORE_SCAN_DIRS = {
    # Version control, CI/CD & internal metadata
    ".git", ".github", ".gitlab", ".svn", ".hg", ".gemini", "brain", ".agents",
    # Dependencies & virtual environments
    "node_modules", "venv", ".venv", "env", ".env", "vendor", "site-packages",
    # Build & distribution outputs
    "target", "build", "dist", "out", "bin", "obj", ".next", ".nuxt", "__pycache__", ".pytest_cache",
    # Non-code assets, media, icons & documentation
    "assets", "static", "images", "img", "media", "docs", "documentation", "site-content", "fixtures", "testdata", "icon", "icons", "font", "fonts",
    # Tooling & IDE metadata
    ".idea", ".vscode", ".settings", ".gradle", "gradle", "wrapper"
}

# Extensions that count toward the scannable-file cap
SCANNABLE_EXTENSIONS = {
    ".py", ".java", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
    ".go", ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".hxx",
    ".kt", ".kts", ".rb", ".php", ".rs",
    ".env", ".properties", ".yaml", ".yml", ".toml",
    ".conf", ".cfg", ".ini", ".xml",
    ".crt", ".pem", ".cer", ".csr", ".p12", ".jks",
    ".dockerfile",
}

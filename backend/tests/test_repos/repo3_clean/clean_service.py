import hashlib
from Crypto.PublicKey import RSA

def safe_hash(data):
    # Strong SHA-256
    return hashlib.sha256(data.encode()).hexdigest()

def generate_strong_key():
    # Strong 4096-bit RSA key
    return RSA.generate(4096)

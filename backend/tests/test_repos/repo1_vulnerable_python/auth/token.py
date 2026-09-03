import hashlib
import ssl
from Crypto.PublicKey import RSA

def hash_token(data):
    # Weak MD5 hashing
    return hashlib.md5(data.encode()).hexdigest()

def generate_user_key():
    # Weak 1024-bit RSA key
    return RSA.generate(1024)

def setup_tls():
    # Weak TLS 1.0 protocol
    context = ssl.SSLContext(ssl.PROTOCOL_TLSv1)
    return context

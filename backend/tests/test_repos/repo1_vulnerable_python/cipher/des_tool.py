from Crypto.Cipher import DES

def encrypt_legacy(data, key):
    # Weak DES cipher
    cipher = DES.new(key, DES.MODE_ECB)
    return cipher.encrypt(data)

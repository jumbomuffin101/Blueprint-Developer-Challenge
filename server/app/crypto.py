import base64
from typing import Tuple
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey, RSAPrivateKey

OAEP_PAD = padding.OAEP(
    mgf=padding.MGF1(algorithm=hashes.SHA256()),
    algorithm=hashes.SHA256(),
    label=None,
)

def _load_public_key(pem_text: str) -> RSAPublicKey:
    try:
        key = serialization.load_pem_public_key(pem_text.encode("utf-8"))
        if not isinstance(key, RSAPublicKey):
            raise ValueError("Provided key is not an RSA public key.")
        return key
    except Exception as e:
        raise ValueError("Invalid public key. Provide a PEM-formatted RSA public key.") from e

def _load_private_key(pem_text: str) -> RSAPrivateKey:
    try:
        key = serialization.load_pem_private_key(pem_text.encode("utf-8"), password=None)
        if not isinstance(key, RSAPrivateKey):
            raise ValueError("Provided key is not an RSA private key.")
        return key
    except Exception as e:
        raise ValueError("Invalid private key. Provide a PEM-formatted RSA private key.") from e

def encrypt_with_public_key(public_pem: str, data: str) -> str:
    pub = _load_public_key(public_pem)
    try:
        ciphertext = pub.encrypt(data.encode("utf-8"), OAEP_PAD)
    except ValueError as e:
        # Common cause: payload too large for key size.
        raise ValueError("Encryption failed. Your payload may be too large for this RSA key.") from e
    return base64.b64encode(ciphertext).decode("utf-8")

def decrypt_with_private_key(private_pem: str, b64_ciphertext: str) -> str:
    prv = _load_private_key(private_pem)
    try:
        ciphertext = base64.b64decode(b64_ciphertext, validate=True)
    except Exception as e:
        raise ValueError("Ciphertext is not valid base64.") from e
    try:
        plaintext = prv.decrypt(ciphertext, OAEP_PAD)
    except Exception as e:
        raise ValueError("Decryption failed. Check that the key matches and the ciphertext is valid.") from e
    return plaintext.decode("utf-8")

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

priv_pem = key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,          # => -----BEGIN PRIVATE KEY-----
    encryption_algorithm=serialization.NoEncryption(),
)
pub_pem = key.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,  # => -----BEGIN PUBLIC KEY-----
)

open("demo_private.pem", "wb").write(priv_pem)
open("demo_public.pem", "wb").write(pub_pem)

print("Public key:\n", pub_pem.decode(), sep="")
print("Private key:\n", priv_pem.decode(), sep="")

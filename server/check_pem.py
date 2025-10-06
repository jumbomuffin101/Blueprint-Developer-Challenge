from cryptography.hazmat.primitives import serialization
from pathlib import Path

pem = Path("demo_public.pem").read_bytes()
try:
    serialization.load_pem_public_key(pem)
    print("PEM OK ✅")
except Exception as e:
    print("PEM INVALID ❌:", e)

from pydantic import BaseModel, Field

class EncryptRequest(BaseModel):
    key: str = Field(min_length=1)
    data: str = Field(min_length=1)

class DecryptRequest(BaseModel):
    key: str = Field(min_length=1)  # private key PEM
    data: str = Field(min_length=1)  # base64 ciphertext

class DataResponse(BaseModel):
    data: str

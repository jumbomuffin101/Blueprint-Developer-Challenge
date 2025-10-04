from fastapi import FastAPI

app = FastAPI(
    title="Blueprint Crypto API",
    version="0.0.1",
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.get("/health")
def health():
    return {"status": "ok"}

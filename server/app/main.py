from fastapi import FastAPI, HTTPException, Request, status, Depends, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.schemas import EncryptRequest, DecryptRequest, DataResponse
from app.logs_schemas import LogItem, LogsResponse
from app.crypto import encrypt_with_public_key, decrypt_with_private_key
from app.database import init_models, get_session, Log

app = FastAPI(
    title="Blueprint Crypto API",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def _startup():
    await init_models()

@app.get("/health")
def health():
    return {"status": "ok"}

async def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

async def _log_event(request: Request, data_text: str, session: AsyncSession) -> None:
    ip = await _client_ip(request)
    if len(data_text) > 2048:
        data_text = data_text[:2048] + "…[truncated]"
    session.add(Log(ip=ip, data=data_text))
    await session.commit()

@app.post("/api/v1/encrypt", response_model=DataResponse)
async def encrypt(req: EncryptRequest, request: Request, session: AsyncSession = Depends(get_session)):
    if not req.key.strip():
        raise HTTPException(status_code=400, detail="Public key is required.")
    if not req.data.strip():
        raise HTTPException(status_code=400, detail="Payload is required.")
    try:
        result = encrypt_with_public_key(req.key, req.data)
    except ValueError as e:
        await _log_event(request, f"encrypt error: {str(e)}", session)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    await _log_event(request, "encrypt ok", session)
    return {"data": result}

@app.post("/api/v1/decrypt", response_model=DataResponse)
async def decrypt(req: DecryptRequest, request: Request, session: AsyncSession = Depends(get_session)):
    if not req.key.strip():
        raise HTTPException(status_code=400, detail="Private key is required.")
    if not req.data.strip():
        raise HTTPException(status_code=400, detail="Ciphertext is required.")
    try:
        result = decrypt_with_private_key(req.key, req.data)
    except ValueError as e:
        await _log_event(request, f"decrypt error: {str(e)}", session)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    await _log_event(request, "decrypt ok", session)
    return {"data": result}

@app.get("/api/v1/logs", response_model=LogsResponse)
async def list_logs(
    size: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Log).order_by(Log.timestamp.desc()).offset(offset).limit(size)
    rows = (await session.execute(stmt)).scalars().all()
    items = [LogItem(id=r.id, timestamp=r.timestamp, ip=r.ip, data=r.data) for r in rows]
    return LogsResponse(items=items)

@app.delete("/api/v1/logs", status_code=204)
async def clear_logs(session: AsyncSession = Depends(get_session)):
    await session.execute(delete(Log))
    await session.commit()
    return Response(status_code=204)


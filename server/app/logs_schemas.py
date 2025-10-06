from pydantic import BaseModel

class LogItem(BaseModel):
    id: str
    timestamp: int
    ip: str
    data: str

class LogsResponse(BaseModel):
    items: list[LogItem]

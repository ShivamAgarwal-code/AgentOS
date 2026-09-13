from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    uptime: int

    class Config:
        from_attributes = True

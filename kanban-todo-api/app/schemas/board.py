from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List

class BoardBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Tên board không được để trống')
        if len(v.strip()) > 100:
            raise ValueError('Tên board không được quá 100 ký tự')
        return v.strip()

class BoardCreate(BoardBase):
    pass

class BoardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

    @validator('name')
    def name_validator(cls, v):
        if v is not None and (not v or len(v.strip()) == 0):
            raise ValueError('Tên board không được để trống')
        return v.strip() if v else v

class BoardResponse(BoardBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    tasks_count: Optional[int] = 0

    class Config:
        orm_mode = True

class BoardWithTasks(BoardResponse):
    tasks: List['TaskResponse'] = []


# Try to resolve forward references (TaskResponse is defined in app.schemas.task)
try:
    # Importing here avoids circular import at module import time
    from app.schemas.task import TaskResponse  # noqa: F401
    # Rebuild model to let Pydantic resolve the forward ref
    BoardWithTasks.model_rebuild()
except Exception:
    # If rebuild fails during import time, FastAPI/Pydantic will attempt resolution later.
    pass


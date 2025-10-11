from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional
from enum import Enum

class StatusEnum(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"

class PriorityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: PriorityEnum = PriorityEnum.medium
    status: StatusEnum = StatusEnum.todo

    @validator('title')
    def title_must_not_be_empty(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Tiêu đề task không được để trống')
        if len(v.strip()) > 200:
            raise ValueError('Tiêu đề task không được quá 200 ký tự')
        return v.strip()

class TaskCreate(TaskBase):
    board_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = None

    @validator('title')
    def title_validator(cls, v):
        if v is not None and (not v or len(v.strip()) == 0):
            raise ValueError('Tiêu đề task không được để trống')
        return v.strip() if v else v

class TaskMove(BaseModel):
    status: StatusEnum
    position: Optional[int] = None

class TaskAssign(BaseModel):
    assigned_to: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    board_id: int
    position: int
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

